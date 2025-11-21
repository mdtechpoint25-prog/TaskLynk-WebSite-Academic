import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, invoices, users, notifications } from '@/db/schema';
import { eq, gte, and } from 'drizzle-orm';
import { calculateWriterPayout, calculateWriterEarnings } from '@/lib/payment-calculations';

// ✅ USE LIVE SECRET KEY from environment variable
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_live_c58ac969eafe329686b5290e26cfe6dda77990d4';

// Simple in-memory rate limiter (best-effort; resets on restart)
const rl = (globalThis as any).__PAYSTACK_VERIFY_RL__ || new Map<string, { count: number; reset: number }>();
(globalThis as any).__PAYSTACK_VERIFY_RL__ = rl;
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

export async function POST(request: NextRequest) {
  try {
    // ✅ Rate limit per IP
    const ip = (request.headers.get('x-forwarded-for') || request.ip || 'unknown').split(',')[0].trim();
    if (!rateLimit(`paystack-verify:${ip}`)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // ✅ Authorization: require bearer token
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const requesterId = parseInt(token || '', 10);
    if (!Number.isFinite(requesterId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const [requester] = await db.select().from(users).where(eq(users.id, requesterId)).limit(1);
    if (!requester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      reference, 
      jobId, 
      clientId, 
      freelancerId, 
      totalAmount,
      phoneNumber
    } = body;

    // Validate required fields
    if (!reference || !jobId || !clientId || !totalAmount) {
      console.error('Missing required fields:', { reference: !!reference, jobId: !!jobId, clientId: !!clientId, totalAmount: !!totalAmount });
      return NextResponse.json(
        { error: 'Missing required fields: reference, jobId, clientId, totalAmount' },
        { status: 400 }
      );
    }

    // ✅ Authorization: requester must be the client or an admin
    const parsedJobId = parseInt(jobId);
    const parsedClientId = parseInt(clientId);
    if (requester.role !== 'admin' && requester.id !== parsedClientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ✅ Validate job exists and belongs to client
    const [job] = await db.select().from(jobs).where(eq(jobs.id, parsedJobId)).limit(1);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    if (job.clientId !== parsedClientId && requester.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: job does not belong to client' }, { status: 403 });
    }
    // ❌ Do not allow paying cancelled/completed jobs
    if (job.status === 'cancelled' || job.status === 'completed') {
      return NextResponse.json({ error: `Cannot pay for a ${job.status} job` }, { status: 400 });
    }

    if (!PAYSTACK_SECRET_KEY) {
      console.error('Paystack secret key not configured');
      return NextResponse.json(
        { error: 'Paystack configuration missing' },
        { status: 500 }
      );
    }

    console.log('Verifying Paystack payment:', { reference, jobId, clientId, totalAmount });

    // ✅ Idempotency: Check existing payment by reference
    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.paystackReference, reference))
      .limit(1);

    // If already confirmed, return success idempotently
    if (existingPayment && existingPayment.status === 'confirmed') {
      // Ensure job is marked paid
      if (job.status !== 'paid') {
        const nowIdem = new Date().toISOString();
        await db.update(jobs).set({ status: 'paid', paymentConfirmed: true, updatedAt: nowIdem }).where(eq(jobs.id, parsedJobId));
      }
      return NextResponse.json({
        status: 'success',
        message: 'Payment already confirmed (idempotent)'.trim(),
        data: { paymentId: existingPayment.id, reference }
      });
    }

    // Verify transaction with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error('Paystack API error:', errorText);
      return NextResponse.json(
        { status: 'failed', message: 'Paystack verification request failed', error: errorText },
        { status: 500 }
      );
    }

    const verifyData = await verifyResponse.json();
    console.log('Paystack verification response:', JSON.stringify(verifyData, null, 2));

    // Check if payment was successful
    if (!verifyData.status || verifyData.data.status !== 'success') {
      console.error('Payment not successful:', verifyData);
      return NextResponse.json({
        status: 'failed',
        message: 'Payment verification failed - transaction not successful',
        data: verifyData,
      });
    }

    // Get amount from Paystack response (convert from kobo to KES)
    const paidAmount = verifyData.data.amount / 100;
    const now = new Date().toISOString();

    console.log('Payment verified successfully:', {
      reference,
      paidAmount,
      expectedAmount: totalAmount,
      difference: Math.abs(paidAmount - totalAmount)
    });

    // Check if payment amount matches (allow small difference for rounding)
    if (Math.abs(paidAmount - totalAmount) > 1) {
      console.error('Payment amount mismatch:', { paidAmount, expectedAmount: totalAmount });
      return NextResponse.json({
        status: 'failed',
        message: `Payment amount mismatch. Expected: ${totalAmount}, Received: ${paidAmount}`,
      });
    }

    // ✅ If payment exists but not confirmed, validate transition then confirm
    if (existingPayment) {
      if (existingPayment.status !== 'pending') {
        return NextResponse.json({ error: `Invalid payment state transition from ${existingPayment.status} to confirmed` }, { status: 400 });
      }
      await db
        .update(payments)
        .set({
          status: 'confirmed',
          confirmedByAdmin: requester.role === 'admin',
          confirmedAt: now,
          updatedAt: now,
        })
        .where(eq(payments.id, existingPayment.id));

      await db
        .update(jobs)
        .set({
          status: 'paid',
          paymentConfirmed: true,
          updatedAt: now,
        })
        .where(eq(jobs.id, parsedJobId));

      // ✅ Notify client
      await db.insert(notifications).values({
        userId: parsedClientId,
        jobId: parsedJobId,
        type: 'payment_confirmed',
        title: 'Payment Confirmed',
        message: `Your payment of KES ${totalAmount} has been confirmed.`,
        createdAt: now,
        read: 0,
      });

      return NextResponse.json({
        status: 'success',
        message: 'Payment confirmed successfully',
        data: { paymentId: existingPayment.id, reference }
      });
    }

    // ✅ AUTO-APPROVE PAYMENT - Create payment record with confirmed status
    console.log('Creating auto-approved payment record...');
    
    const [payment] = await db.insert(payments).values({
      jobId: parsedJobId,
      clientId: parsedClientId,
      freelancerId: freelancerId ? parseInt(freelancerId) : null,
      amount: parseFloat(totalAmount.toString()),
      phoneNumber: phoneNumber || null,
      paystackReference: reference,
      mpesaCheckoutRequestId: reference, // Use same reference for consistency
      mpesaReceiptNumber: reference,
      paymentMethod: 'paystack',
      status: 'confirmed',
      confirmedByAdmin: requester.role === 'admin', // ✅ mark if admin confirmed
      confirmedAt: now,
      createdAt: now,
      updatedAt: now,
    }).returning();

    console.log('Payment record created:', payment);

    // ✅ Update job: mark as PAID and paymentConfirmed (do NOT complete)
    await db
      .update(jobs)
      .set({
        status: 'paid',
        paymentConfirmed: true,
        updatedAt: now,
      })
      .where(eq(jobs.id, parsedJobId));

    console.log('Job updated to PAID for job:', jobId);

    // ✅ Create PENDING invoice using CPP-based calculations
    try {
      // Fetch job details for CPP calculation
      const [jobDetails] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, parsedJobId))
        .limit(1);

      if (!jobDetails) {
        throw new Error('Job not found for invoice creation');
      }

      const parsedAmount = parseFloat(totalAmount.toString());
      
      // Calculate writer earnings using CPP model: pages * (200 or 230) + slides * 100
      const freelancerAmount = calculateWriterEarnings(
        jobDetails.pages || 0,
        jobDetails.slides || 0,
        jobDetails.workType
      );
      
      // Calculate admin commission: clientAmount - (writerPayout + managerEarnings)
      const managerEarnings = jobDetails.managerEarnings || 0;
      const adminCommission = Math.max(0, parsedAmount - (freelancerAmount + managerEarnings));

      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const todayInvoices = await db
        .select()
        .from(invoices)
        .where(gte(invoices.createdAt, startOfDay));
      const sequenceNum = (todayInvoices.length + 1).toString().padStart(5, '0');
      const invoiceNumber = `INV-${dateStr}-${sequenceNum}`;

      await db.insert(invoices).values({
        jobId: parsedJobId,
        clientId: parsedClientId,
        freelancerId: freelancerId ? parseInt(freelancerId) : null,
        invoiceNumber,
        amount: parsedAmount,
        freelancerAmount,
        adminCommission,
        description: `Payment for order ${jobId}`,
        status: 'pending',
        isPaid: false,
        paidAt: null,
        createdAt: now,
        updatedAt: now,
      });

      console.log('Pending invoice created for job:', jobId, {
        clientAmount: parsedAmount,
        freelancerAmount,
        managerEarnings,
        adminCommission
      });
    } catch (invErr) {
      console.error('Failed to create pending invoice:', invErr);
    }

    // ✅ Notify client (auto-approved path)
    await db.insert(notifications).values({
      userId: parsedClientId,
      jobId: parsedJobId,
      type: 'payment_confirmed',
      title: 'Payment Confirmed',
      message: `Your payment of KES ${totalAmount} has been confirmed.`,
      createdAt: now,
      read: 0,
    });

    // ❌ Remove premature freelancer balance crediting; handled when invoice is marked paid

    return NextResponse.json({
      status: 'success',
      message: 'Payment verified and auto-approved successfully. Order moved to PAID and invoice created (pending).',
      data: {
        paymentId: payment.id,
        reference: reference,
        amount: totalAmount,
        paidAmount: paidAmount,
        phoneNumber: phoneNumber,
        autoApproved: true,
        channel: verifyData.data.channel,
        paidAt: verifyData.data.paid_at,
      },
    });

  } catch (error: any) {
    console.error('Paystack verification error:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error.message || 'Failed to verify payment',
        stack: error.stack
      },
      { status: 500 }
    );
  }
}