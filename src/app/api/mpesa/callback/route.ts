import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, users, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail, getPaymentConfirmedEmailHTML } from '@/lib/email';
import { notifyWhatsApp, notifyTelegram } from '@/lib/notifier';

// Add simple state transition guard
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'failed'],
  confirmed: ['confirmed'], // idempotent
  failed: ['failed'], // terminal
  cancelled: ['cancelled'], // terminal
};

export async function POST(request: NextRequest) {
  try {
    // ✅ Secure webhook: require shared secret
    const secret = request.headers.get('x-webhook-secret');
    const expected = process.env.MPESA_WEBHOOK_SECRET;
    if (!expected || secret !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('M-Pesa Callback received:', JSON.stringify(body, null, 2));

    const { Body } = body;
    const { stkCallback } = Body || {};

    if (!stkCallback) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = stkCallback;

    // Find payment by CheckoutRequestID
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.mpesaCheckoutRequestId, CheckoutRequestID))
      .limit(1);

    if (!payment) {
      console.error('Payment not found for CheckoutRequestID:', CheckoutRequestID);
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
    }

    const currentTimestamp = new Date().toISOString();

    // If already terminal/processed and same status, be idempotent
    if (ResultCode === 0) {
      // SUCCESSFUL PAYMENT — mark payment confirmed and order as PAID (no balance credit here)
      
      // Extract metadata
      const metadata = CallbackMetadata?.Item || [];
      const mpesaReceiptNumber = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = metadata.find((item: any) => item.Name === 'TransactionDate')?.Value;
      const phoneNumber = metadata.find((item: any) => item.Name === 'PhoneNumber')?.Value;

      // ✅ State validation
      if (!VALID_TRANSITIONS[payment.status]?.includes('confirmed')) {
        console.warn(`Invalid transition from ${payment.status} to confirmed for payment ${payment.id}`);
        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
      }

      // Update payment to confirmed with auto-approval
      await db
        .update(payments)
        .set({
          status: 'confirmed',
          confirmedByAdmin: 1,
          mpesaReceiptNumber: mpesaReceiptNumber?.toString(),
          mpesaTransactionDate: transactionDate?.toString(),
          confirmedAt: currentTimestamp,
          updatedAt: currentTimestamp
        })
        .where(eq(payments.id, payment.id));

      // Get job details
      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, payment.jobId))
        .limit(1);

      if (!job) {
        console.error('Job not found for payment:', payment.id);
        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
      }

      // If already confirmed previously, do not double-process
      if ((job as any).paymentConfirmed) {
        console.log('Payment already confirmed for job:', job.id);
        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
      }

      // Mark order PAID; balances/earnings will be handled by invoice confirmation flow
      await db
        .update(jobs)
        .set({
          status: 'paid',
          paymentConfirmed: 1,
          updatedAt: currentTimestamp
        })
        .where(eq(jobs.id, payment.jobId));

      // Notify freelancer (info only)
      if (job.assignedFreelancerId) {
        await db.insert(notifications).values({
          userId: job.assignedFreelancerId,
          jobId: payment.jobId,
          type: 'order_paid',
          title: 'Order Marked as Paid',
          message: `Order ${job.displayId || `#${job.id}`} has been marked as PAID. You will be credited after invoice confirmation.`,
          read: 0,
          createdAt: currentTimestamp
        });
      }

      // Send notification to client
      const [client] = await db
        .select()
        .from(users)
        .where(eq(users.id, payment.clientId))
        .limit(1);

      if (client) {
        // Create notification for client
        await db.insert(notifications).values({
          userId: payment.clientId,
          jobId: payment.jobId,
          type: 'payment_confirmed',
          title: 'Payment Successful!',
          message: `Your payment was successful! Order ${job.displayId || `#${job.id}`} is now PAID. We are finalizing your invoice.`,
          read: 0,
          createdAt: currentTimestamp
        });

        // Send email to client
        try {
          await sendEmail({
            to: client.email,
            subject: `[Order ${job.displayId || `#${job.id}`}] Payment Successful`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1D3557;">Payment Successful!</h2>
                <p>Hello ${client.name},</p>
                <p>Your M-Pesa payment of <strong>KES ${payment.amount.toFixed(2)}</strong> was successful!</p>
                <p><strong>M-Pesa Receipt Number:</strong> ${mpesaReceiptNumber}</p>
                <p>Your order <strong>#${job.displayId} - ${job.title}</strong> is now <strong>PAID</strong>. We will finalize the invoice shortly.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/client/orders/${job.id}" style="display: inline-block; background-color: #1D3557; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Order</a>
              </div>
            `,
          });
        } catch (emailError) {
          console.error('Failed to send email to client:', emailError);
        }

        // WhatsApp/Telegram notifications (best-effort)
        try {
          if (client.phone) {
            await notifyWhatsApp(String(client.phone), {
              title: 'Payment Successful',
              message: `We have received your payment of KES ${payment.amount.toFixed(2)} for order ${job.displayId || `#${job.id}`}. Receipt: ${mpesaReceiptNumber}`,
            });
          }
          await notifyTelegram(undefined, {
            title: 'Payment Confirmed',
            message: `Order ${job.displayId || `#${job.id}`} payment confirmed (KES ${payment.amount.toFixed(2)}).`,
          });
        } catch (channelErr) {
          console.error('Channel notify error (mpesa success):', channelErr);
        }
      }

      console.log('Payment confirmed automatically (PAID marked):', {
        paymentId: payment.id,
        jobId: payment.jobId,
        mpesaReceiptNumber,
        transactionDate,
        phoneNumber
      });

    } else {
      // PAYMENT FAILED
      
      // ✅ State validation
      if (!VALID_TRANSITIONS[payment.status]?.includes('failed')) {
        console.warn(`Invalid transition from ${payment.status} to failed for payment ${payment.id}`);
        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
      }
      
      // Update payment to failed
      await db
        .update(payments)
        .set({
          status: 'failed',
          mpesaResultDesc: ResultDesc,
          updatedAt: currentTimestamp
        })
        .where(eq(payments.id, payment.id));

      // Send notification to client about failure
      const [client] = await db
        .select()
        .from(users)
        .where(eq(users.id, payment.clientId))
        .limit(1);

      if (client) {
        // Create notification for client
        await db.insert(notifications).values({
          userId: payment.clientId,
          jobId: payment.jobId,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: `M-Pesa payment failed. Please try again or use manual code entry (Lipa Pochi La Biashara).`,
          read: 0,
          createdAt: currentTimestamp
        });

        // Send email to client
        try {
          await sendEmail({
            to: client.email,
            subject: `[Order ${job?.displayId || `#${payment.jobId}`}] M-Pesa Payment Failed`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #D32F2F;">Payment Failed</h2>
                <p>Hello ${client.name},</p>
                <p>Your M-Pesa Direct Pay attempt failed.</p>
                <p><strong>Reason:</strong> ${ResultDesc}</p>
                <p>Please try one of these options:</p>
                <ul>
                  <li>Try M-Pesa Direct Pay again</li>
                  <li>Use Lipa Pochi La Biashara and enter the code manually</li>
                </ul>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/client/orders/${payment.jobId}/payment" style="display: inline-block; background-color: #1D3557; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Retry Payment</a>
              </div>
            `,
          });
        } catch (emailError) {
          console.error('Failed to send email to client:', emailError);
        }

        // WhatsApp best-effort failure notice
        try {
          if (client.phone) {
            await notifyWhatsApp(String(client.phone), {
              title: 'Payment Failed',
              message: `Your M-Pesa payment for order ${job?.displayId || `#${payment.jobId}`} failed: ${ResultDesc}. Please retry.`,
            });
          }
        } catch (channelErr) {
          console.error('Channel notify error (mpesa fail):', channelErr);
        }
      }

      console.log('Payment failed:', {
        paymentId: payment.id,
        resultCode: ResultCode,
        resultDesc: ResultDesc
      });
    }

    // Always respond with success to M-Pesa
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });

  } catch (error) {
    console.error('M-Pesa callback error:', error);
    // Still return success to M-Pesa to prevent retries
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' });
  }
}