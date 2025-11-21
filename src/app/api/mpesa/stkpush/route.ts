import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, amount, jobId, userId } = body;

    // Validate required fields
    if (!phoneNumber || !amount || !jobId || !userId) {
      return NextResponse.json({
        error: 'Missing required fields: phoneNumber, amount, jobId, userId'
      }, { status: 400 });
    }

    // ✅ NEW: Verify job exists and validate order status
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
    
    if (!job) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // ✅ NEW: Check authorization - user must be the client
    if (job.clientId !== parseInt(userId)) {
      return NextResponse.json({ 
        error: 'Not authorized to pay for this order' 
      }, { status: 403 });
    }

    // ✅ NEW: Check order is approved and ready for payment
    if (job.status !== 'approved' && job.status !== 'delivered') {
      return NextResponse.json({
        error: `Cannot pay for order in status: ${job.status}. Order must be approved first.`,
        currentStatus: job.status,
        requiredStatus: 'approved'
      }, { status: 400 });
    }

    // ✅ NEW: Verify amount matches order total (allow small floating point differences)
    const expectedAmount = Number(job.amount);
    const submittedAmount = Number(amount);
    
    if (Math.abs(expectedAmount - submittedAmount) > 0.01) {
      return NextResponse.json({
        error: `Payment amount mismatch. Expected KSh ${expectedAmount.toFixed(2)}, got KSh ${submittedAmount.toFixed(2)}`,
        expectedAmount: expectedAmount,
        submittedAmount: submittedAmount
      }, { status: 400 });
    }

    // Check if payment already exists for this job
    const existingPayment = await db.select()
      .from(payments)
      .where(eq(payments.jobId, jobId));

    if (existingPayment.length > 0) {
      const confirmedPayment = existingPayment.find(p => p.confirmedByAdmin);
      if (confirmedPayment) {
        return NextResponse.json({
          error: 'Payment already confirmed for this order',
          payment: confirmedPayment
        }, { status: 400 });
      }
    }

    // Get M-Pesa credentials
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const businessShortCode = process.env.MPESA_BUSINESS_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`;

    if (!consumerKey || !consumerSecret || !passkey) {
      return NextResponse.json({
        error: 'M-Pesa configuration incomplete'
      }, { status: 500 });
    }

    // Get access token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenResponse = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to get M-Pesa access token');
    }

    const { access_token } = await tokenResponse.json();

    // Format phone number (remove leading 0, add 254)
    let formattedPhone = phoneNumber.replace(/\s/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    }
    if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.slice(1);
    }

    // Generate timestamp and password
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14);
    const password = Buffer.from(
      `${businessShortCode}${passkey}${timestamp}`
    ).toString('base64');

    // Initiate STK Push
    const stkResponse = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: businessShortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.round(amount),
          PartyA: formattedPhone,
          PartyB: businessShortCode,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackUrl,
          AccountReference: `Order-${job.orderNumber}`,
          TransactionDesc: `Payment for order ${job.orderNumber}`,
        }),
      }
    );

    const stkData = await stkResponse.json();

    if (stkData.ResponseCode !== '0') {
      return NextResponse.json({
        error: stkData.ResponseDescription || 'STK Push failed',
        details: stkData
      }, { status: 400 });
    }

    // Create payment record
    const now = new Date().toISOString();
    const [payment] = await db.insert(payments).values({
      jobId: jobId,
      clientId: parseInt(userId),
      amount: amount,
      status: 'pending',
      paymentMethod: 'mpesa',
      transactionRef: stkData.CheckoutRequestID,
      confirmedByAdmin: false,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({
      success: true,
      message: 'STK Push sent successfully',
      checkoutRequestId: stkData.CheckoutRequestID,
      merchantRequestId: stkData.MerchantRequestID,
      payment: payment,
      orderNumber: job.orderNumber
    });
  } catch (error: any) {
    console.error('M-Pesa STK Push error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to initiate payment'
    }, { status: 500 });
  }
}