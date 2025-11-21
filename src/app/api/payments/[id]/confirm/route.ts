import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, users, notifications, invoices, jobStatusLogs, jobAttachments, paymentTransactions } from '@/db/schema';
import { eq, gte, sql } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import { calculateWriterEarnings, managerAssignFee, managerSubmitFee } from '@/lib/payment-calculations';
import { requireAdminRole } from '@/lib/admin-auth';
import { logAdminActionWithRequest, AdminActions, AuditTargetTypes } from '@/lib/admin-audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔒 SECURITY: Require admin role
    const authCheck = await requireAdminRole(request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const adminUser = authCheck.user!;
    const id = params.id;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid payment ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const paymentId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { confirmed } = body;

    // Validate confirmed field
    if (typeof confirmed !== 'boolean') {
      return NextResponse.json(
        { 
          error: 'Confirmed field is required and must be a boolean',
          code: 'INVALID_CONFIRMED_FIELD' 
        },
        { status: 400 }
      );
    }

    // Check if payment exists
    const existingPayment = await db.select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (existingPayment.length === 0) {
      return NextResponse.json(
        { 
          error: 'Payment not found',
          code: 'PAYMENT_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const payment = existingPayment[0];
    const currentTimestamp = new Date().toISOString();

    if (confirmed) {
      // ADMIN CONFIRMED PAYMENT → Move order to COMPLETED and create UNPAID invoice
      
      // Update payment to confirmed
      const updatedPayment = await db.update(payments)
        .set({
          status: 'confirmed',
          confirmedByAdmin: true,
          confirmedAt: currentTimestamp,
          updatedAt: currentTimestamp
        })
        .where(eq(payments.id, paymentId))
        .returning();

      // Get job details
      const job = await db.select()
        .from(jobs)
        .where(eq(jobs.id, payment.jobId))
        .limit(1);

      if (job.length === 0) {
        return NextResponse.json(
          { 
            error: 'Associated job not found',
            code: 'JOB_NOT_FOUND' 
          },
          { status: 404 }
        );
      }

      const jobData = job[0] as any;

      // Calculate amounts for invoice - CPP model (pages + slides)
      const writerAmount = calculateWriterEarnings(jobData.pages, jobData.slides, jobData.workType);
      const assignFee = jobData.assignedFreelancerId ? managerAssignFee() : 0;
      const submitFee = managerSubmitFee(jobData.pages);
      const managerTotal = assignFee + submitFee;
      const adminCommission = Math.max(0, Number(payment.amount) - (writerAmount + managerTotal));

      // 📝 AUDIT: Log payment confirmation
      await logAdminActionWithRequest(
        request,
        adminUser.id,
        AdminActions.CONFIRM_PAYMENT,
        paymentId,
        AuditTargetTypes.PAYMENT,
        {
          jobId: payment.jobId,
          clientId: payment.clientId,
          amount: payment.amount,
          writerAmount,
          managerTotal,
          adminCommission,
          paymentMethod: payment.paymentMethod,
          mpesaCode: payment.mpesaCode,
        }
      );

      // Persist rollups on job and set to completed
      try {
        await db.update(jobs)
          .set({
            status: 'completed',
            paymentConfirmed: true,
            updatedAt: currentTimestamp,
            // @ts-ignore drizzle runtime may ignore unknown cols if missing
            freelancerEarnings: writerAmount,
            // @ts-ignore
            managerEarnings: managerTotal,
            // @ts-ignore
            adminProfit: adminCommission,
            // @ts-ignore
            paidOrderConfirmedAt: currentTimestamp
          } as any)
          .where(eq(jobs.id, payment.jobId));
      } catch {
        // Columns might not exist on older schemas; ignore silently
      }

      // CREDIT BALANCES: writer and manager
      try {
        // Credit freelancer
        if (jobData.assignedFreelancerId) {
          await db.update(users)
            .set({
              balance: sql`${users.balance} + ${writerAmount}`,
              totalEarned: sql`${users.totalEarned} + ${writerAmount}`,
            })
            .where(eq(users.id, jobData.assignedFreelancerId as number));
        }

        // Determine manager to credit: prefer writer's manager, else client's manager
        let managerIdToCredit: number | null = null;
        if (jobData.assignedFreelancerId) {
          const writer = await db.select().from(users).where(eq(users.id, jobData.assignedFreelancerId as number)).limit(1);
          managerIdToCredit = writer[0]?.assignedManagerId ?? null;
        }
        if (!managerIdToCredit) {
          const clientRow = await db.select().from(users).where(eq(users.id, jobData.clientId as number)).limit(1);
          managerIdToCredit = clientRow[0]?.assignedManagerId ?? null;
        }
        if (managerIdToCredit && managerTotal > 0) {
          await db.update(users)
            .set({
              balance: sql`${users.balance} + ${managerTotal}`,
              totalEarned: sql`${users.totalEarned} + ${managerTotal}`,
            })
            .where(eq(users.id, managerIdToCredit));
          // Notify manager on payout
          await db.insert(notifications).values({
            userId: managerIdToCredit,
            jobId: payment.jobId,
            type: 'manager_payout',
            title: 'Manager Earnings Credited',
            message: `You earned KSh ${managerTotal} for order ${jobData.displayId || `#${jobData.id}`}.`,
            read: 0,
            createdAt: currentTimestamp
          });
        }
      } catch (balErr) {
        console.error('Balance credit error:', balErr);
      }

      // Create UNPAID invoice to be processed later
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const todayInvoices = await db.select().from(invoices)
        .where(gte(invoices.createdAt, startOfDay));
      const sequenceNum = (todayInvoices.length + 1).toString().padStart(5, '0');
      const invoiceNumber = `INV-${dateStr}-${sequenceNum}`;

      await db.insert(invoices).values({
        jobId: payment.jobId,
        clientId: payment.clientId,
        freelancerId: jobData.assignedFreelancerId || null,
        invoiceNumber,
        amount: payment.amount,
        freelancerAmount: writerAmount,
        adminCommission: adminCommission,
        description: `Payment for order ${jobData.displayId || jobData.id} - ${jobData.title}`,
        status: 'pending',
        isPaid: false,
        paidAt: null,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      });

      // Record financials snapshot for this order
      try {
        await db.run(sql`INSERT INTO order_financials (job_id, client_amount, writer_amount, manager_amount, platform_fee)
                         VALUES (${payment.jobId}, ${Number(payment.amount)}, ${writerAmount}, ${managerTotal}, ${adminCommission})`);
      } catch (e) {
        // Table might not exist until setup endpoint is run; ignore silently
        console.error('order_financials insert error (non-fatal):', e);
      }

      // AUDIT LOG: mark order completed
      try {
        await db.insert(jobStatusLogs).values({
          jobId: payment.jobId,
          oldStatus: jobData.status,
          newStatus: 'completed',
          changedBy: payment.clientId, // actor context best-effort
          note: 'Payment confirmed by admin; order completed',
          createdAt: currentTimestamp
        });
      } catch (logErr) {
        console.error('Failed to write job status log:', logErr);
      }

      // SCHEDULE FILE DELETION after 7 days
      try {
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        await db.update(jobAttachments)
          .set({ scheduledDeletionAt: oneWeekFromNow.toISOString() })
          .where(eq(jobAttachments.jobId, payment.jobId));
      } catch (schedErr) {
        console.error('Failed to schedule file deletion:', schedErr);
      }

      // Notify freelancer (credited)
      if (jobData.assignedFreelancerId) {
        await db.insert(notifications).values({
          userId: jobData.assignedFreelancerId,
          jobId: payment.jobId,
          type: 'order_completed',
          title: 'Order Completed - Earnings Credited',
          message: `Order ${jobData.displayId || `#${jobData.id}`} is completed. You were credited KSh ${writerAmount}.`,
          read: 0,
          createdAt: currentTimestamp
        });
      }

      // Notify client
      const client = await db.select()
        .from(users)
        .where(eq(users.id, payment.clientId))
        .limit(1);

      if (client.length > 0) {
        await db.insert(notifications).values({
          userId: payment.clientId,
          jobId: payment.jobId,
          type: 'payment_confirmed',
          title: 'Payment Confirmed - Order Completed',
          message: `Your payment for order ${jobData.displayId || `#${jobData.id}`} is confirmed. The order is now completed.`,
          read: 0,
          createdAt: currentTimestamp
        });

        // Optional email update to client
        try {
          await sendEmail({
            to: client[0].email,
            subject: `[Order ${jobData.displayId || `#${jobData.id}`}] Payment Confirmed` ,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1D3557;">Payment Confirmed</h2>
                <p>Hello ${client[0].name},</p>
                <p>Your payment of <strong>KES ${payment.amount.toFixed(2)}</strong> has been confirmed.</p>
                <p>Your order <strong>#${jobData.displayId || jobData.id} - ${jobData.title}</strong> is now <strong>COMPLETED</strong>.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/client/jobs/${jobData.id}" style="display: inline-block; background-color: #1D3557; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Order</a>
              </div>
            `,
          });
        } catch (emailError) {
          console.error('Failed to send email to client:', emailError);
        }
      }

      return NextResponse.json({
        payment: updatedPayment[0],
        breakdown: { writerAmount, managerTotal, adminCommission },
        message: 'Payment confirmed. Order completed. Invoice created and pending confirmation.'
      }, { status: 200 });

    } else {
      // PAYMENT REJECTED/FAILED
      
      // Update payment to failed
      const updatedPayment = await db.update(payments)
        .set({
          status: 'failed',
          confirmedByAdmin: false,
          updatedAt: currentTimestamp
        })
        .where(eq(payments.id, paymentId))
        .returning();

      // Get client details
      const client = await db.select()
        .from(users)
        .where(eq(users.id, payment.clientId))
        .limit(1);

      if (client.length > 0) {
        // Create notification for client
        await db.insert(notifications).values({
          userId: payment.clientId,
          jobId: payment.jobId,
          type: 'payment_failed',
          title: 'Payment Verification Failed',
          message: 'Payment verification failed. Please try again with the correct M-Pesa code or use M-Pesa Direct Pay.',
          read: 0,
          createdAt: currentTimestamp
        });

        // Send email to client
        try {
          await sendEmail({
            to: client[0].email,
            subject: `[Order #${payment.jobId}] Payment Verification Failed`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1D3557;">Payment Verification Failed</h2>
                <p>Hello ${client[0].name},</p>
                <p>Unfortunately, we could not verify your payment of <strong>KES ${payment.amount.toFixed(2)}</strong>.</p>
                <p>Please try again:</p>
                <ul>
                  <li>Double-check your M-Pesa code and resubmit</li>
                  <li>Or use M-Pesa Direct Pay for instant verification</li>
                </ul>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/client/jobs/${payment.jobId}" style="display: inline-block; background-color: #1D3557; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Retry Payment</a>
              </div>
            `,
          });
        } catch (emailError) {
          console.error('Failed to send email to client:', emailError);
        }
      }

      return NextResponse.json({
        payment: updatedPayment[0],
        message: 'Payment marked as failed'
      }, { status: 200 });
    }

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}