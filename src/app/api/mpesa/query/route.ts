import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, users, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

// Helper to resolve env-specific URLs on demand
const resolveMpesaConfig = (env: 'sandbox' | 'production') => {
  const BASE_URL = env === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
  return {
    env,
    BASE_URL,
    OAUTH_URL: `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    QUERY_URL: `${BASE_URL}/mpesa/stkpushquery/v1/query`,
  } as const;
};

// Prefer MPESA_BUSINESS_SHORTCODE if set, otherwise fall back to MPESA_SHORTCODE, then new Paybill default 880100
const BUSINESS_SHORT_CODE = process.env.MPESA_BUSINESS_SHORTCODE || process.env.MPESA_SHORTCODE || '880100';
const PASSKEY = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
// Force sandbox when using known sandbox shortcode/passkey to avoid env mismatch
const FORCED_SANDBOX = BUSINESS_SHORT_CODE === '174379' || PASSKEY === 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

// Simple in-memory rate limiter (best-effort; resets on restart)
const rl = (globalThis as any).__MPESA_QUERY_RL__ || new Map<string, { count: number; reset: number }>();
(globalThis as any).__MPESA_QUERY_RL__ = rl;
function rateLimit(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const entry = rl.get(key);
  if (!entry || now > entry.reset) {
    rl.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count < limit) {
    entry.count += 1;
    return true;
  }
  return false;
}

function getBearerId(request: NextRequest): number | null {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return null;
  const id = parseInt(token, 10);
  return Number.isFinite(id) ? id : null;
}

// Payment state machine
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'failed'],
  confirmed: ['confirmed'], // idempotent only
  failed: ['failed'], // terminal
  cancelled: ['cancelled'], // terminal
};

export async function POST(request: NextRequest) {
  try {
    // Rate-limit per IP
    const ip = (request.headers.get('x-forwarded-for') || request.ip || 'unknown').split(',')[0].trim();
    if (!rateLimit(`mpesa-query:${ip}`)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Require auth: client or admin
    const requesterId = getBearerId(request);
    if (!requesterId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const [requester] = await db.select().from(users).where(eq(users.id, requesterId)).limit(1);
    if (!requester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { checkoutRequestId } = body;

    if (!checkoutRequestId) {
      return NextResponse.json(
        { error: 'Checkout request ID is required' },
        { status: 400 }
      );
    }

    // Find related payment to authorize access
    const [payment] = await db.select().from(payments).where(eq(payments.mpesaCheckoutRequestId, checkoutRequestId)).limit(1);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Authorization: requester must be the client on the payment or admin
    if (requester.role !== 'admin' && requester.id !== payment.clientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('Querying M-Pesa status for:', checkoutRequestId);

    // Get access token with environment auto-fallback (tolerate common misspelling of secret)
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET || (process.env as any).MPESA_CONSUMER_SECRETE;
    if (!consumerKey || !consumerSecret) {
      console.error('Missing MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET');
      return NextResponse.json(
        { error: 'M-Pesa credentials not configured', details: 'Missing MPESA_CONSUMER_KEY or MPESA_CONSUMER_SECRET' },
        { status: 500 }
      );
    }

    const preferredEnv: 'sandbox' | 'production' = FORCED_SANDBOX
      ? 'sandbox'
      : (process.env.MPESA_ENVIRONMENT === 'production' ? 'production' : 'sandbox');
    const altEnv: 'sandbox' | 'production' = preferredEnv === 'production' ? 'sandbox' : 'production';

    const fetchToken = async (env: 'sandbox' | 'production') => {
      const { OAUTH_URL } = resolveMpesaConfig(env);
      const authHeader = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
      const res = await fetch(OAUTH_URL, { method: 'GET', headers: { Authorization: `Basic ${authHeader}`, Accept: 'application/json' } });
      return res;
    };

    let usingEnv: 'sandbox' | 'production' = preferredEnv;
    let tokenResponse = await fetchToken(preferredEnv);

    if (!tokenResponse.ok) {
      if (!FORCED_SANDBOX && (tokenResponse.status === 401 || tokenResponse.status === 403)) {
        console.warn(`Token fetch failed on ${preferredEnv}. Trying ${altEnv}...`);
        const retry = await fetchToken(altEnv);
        if (retry.ok) {
          tokenResponse = retry;
          usingEnv = altEnv;
        }
      }
    }

    if (!tokenResponse.ok) {
      let errorData: any = null;
      try { errorData = await tokenResponse.json(); } catch {}
      console.error('Failed to get M-PESA access token:', errorData || tokenResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to authenticate with M-Pesa', details: errorData || tokenResponse.statusText },
        { status: 500 }
      );
    }

    const { access_token } = await tokenResponse.json();

    // Generate timestamp
    const timestamp = new Date().toISOString()
      .replace(/[-:TZ.]/g, '')
      .slice(0, 14);

    // Generate password
    const password = Buffer.from(`${BUSINESS_SHORT_CODE}${PASSKEY}${timestamp}`).toString('base64');

    // Query STK Push status
    const queryPayload = {
      BusinessShortCode: BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    console.log('Querying STK status:', { CheckoutRequestID: checkoutRequestId, environmentUsed: usingEnv });

    const { QUERY_URL } = resolveMpesaConfig(usingEnv);
    const queryResponse = await fetch(QUERY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryPayload)
    });

    const queryData = await queryResponse.json();
    console.log('Query response:', queryData);

    // Check for successful payment (ResultCode === '0' or '0' as string)
    const resultCode = String(queryData.ResultCode || '');

    const now = new Date().toISOString();

    if (resultCode === '0') {
      console.log('✅ Payment confirmed by M-Pesa (via query)');

      // Reload latest payment state
      const [latestPayment] = await db.select().from(payments).where(eq(payments.id, payment.id)).limit(1);
      if (latestPayment) {
        if (!VALID_TRANSITIONS[latestPayment.status]?.includes('confirmed')) {
          console.warn(`Invalid transition from ${latestPayment.status} to confirmed for payment ${latestPayment.id}`);
        } else {
          await db.update(payments)
            .set({
              status: 'confirmed',
              confirmedByAdmin: requester.role === 'admin',
              mpesaReceiptNumber: (queryData.CallbackMetadata?.Item || []).find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value || null,
              confirmedAt: now,
              updatedAt: now,
            })
            .where(eq(payments.id, latestPayment.id));

          // Also mark the related job as paid + paymentConfirmed (unlocks downloads)
          await db.update(jobs)
            .set({
              status: 'paid',
              paymentConfirmed: true,
              updatedAt: now,
            })
            .where(eq(jobs.id, latestPayment.jobId));

          // Optional: notify client
          await db.insert(notifications).values({
            userId: latestPayment.clientId,
            jobId: latestPayment.jobId,
            type: 'payment_confirmed',
            title: 'Payment Confirmed',
            message: 'Your payment has been confirmed.',
            createdAt: now,
            read: 0,
          });
        }
      }
    }

    // Helpful hint for common misconfigurations
    const hint = (queryData.errorMessage || queryData.ResponseDescription || '').toString().includes('Invalid Access Token')
      ? `Hint: Your MPESA_ENVIRONMENT might be set to ${preferredEnv} while your Consumer Key/Secret belong to ${altEnv}.`
      : (FORCED_SANDBOX ? 'Using sandbox test shortcode/passkey forces sandbox environment.' : undefined);

    return NextResponse.json({
      ...queryData,
      status: resultCode === '0' ? 'confirmed' : 'pending',
      environmentUsed: usingEnv,
      hint,
    });

  } catch (error: any) {
    console.error('M-Pesa query error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to query payment status',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}