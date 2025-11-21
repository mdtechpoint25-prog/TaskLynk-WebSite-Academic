import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs, notifications, users, managerEarnings, payments } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { logAdminAction, AdminActions, AuditTargetTypes } from '@/lib/admin-audit';

// POST /api/jobs/[id]/confirm-payment - Admin confirms payment and distributes earnings
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid job ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const jobId = parseInt(id);
    const body = await request.json();
    const { adminId, transactionId, paymentMethod, phoneNumber } = body;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required', code: 'MISSING_ADMIN_ID' },
        { status: 400 }
      );
    }

    // Check if job exists
    const existingJob = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (existingJob.length === 0) {
      return NextResponse.json(
        { error: 'Job not found', code: 'JOB_NOT_FOUND' },
        { status: 404 }
      );
    }

    const job = existingJob[0];

    // Verify job is in approved status
    if (job.status !== 'approved') {
      return NextResponse.json(
        {
          error: `Cannot confirm payment for order in status: ${job.status}. Order must be approved first.`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Check if already paid
    if (job.paymentConfirmed) {
      return NextResponse.json(
        { error: 'Payment already confirmed for this order', code: 'ALREADY_PAID' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Calculate earnings distribution
    const writerAmount = job.freelancerEarnings || 0;
    
    // Get manager earnings (assign + submit)
    const managerEarningsRecords = await db
      .select()
      .from(managerEarnings)
      .where(eq(managerEarnings.jobId, jobId));
    
    const managerTotal = managerEarningsRecords.reduce((sum, record) => sum + record.amount, 0);

    // Update job to paid
    const updatedJob = await db
      .update(jobs)
      .set({
        status: 'paid',
        paymentConfirmed: 1 as any,
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId))
      .returning();

    // Credit writer earnings
    if (job.assignedFreelancerId && writerAmount > 0) {
      try {
        await db
          .update(users)
          .set({
            balance: sql`COALESCE(${users.balance}, 0) + ${writerAmount}`,
            totalEarned: sql`COALESCE(${users.totalEarned}, 0) + ${writerAmount}`,
          })
          .where(eq(users.id, job.assignedFreelancerId));

        // Notify freelancer
        await db.insert(notifications).values({
          userId: job.assignedFreelancerId,
          jobId,
          type: 'payment_received',
          title: 'Payment Received',
          message: `You earned KSh ${writerAmount.toFixed(2)} for order ${job.displayId || `#${jobId}`}.`,
          read: false,
          createdAt: now,
        });
      } catch (writerErr) {
        console.error('Failed to credit writer earnings:', writerErr);
      }
    }

    // Create/update payment record
    try {
      // Check if payment record exists
      const existingPayment = await db
        .select()
        .from(payments)
        .where(eq(payments.jobId, jobId))
        .limit(1);

      if (existingPayment.length > 0) {
        // Update existing payment
        await db
          .update(payments)
          .set({
            status: 'completed',
            confirmedByAdmin: 1 as any,
            confirmedAt: now,
            mpesaCode: transactionId || null,
            paymentMethod: paymentMethod || 'mpesa',
            phoneNumber: phoneNumber || null,
            updatedAt: now,
          })
          .where(eq(payments.jobId, jobId));
      } else {
        // Create new payment record
        await db.insert(payments).values({
          jobId,
          clientId: job.clientId,
          freelancerId: job.assignedFreelancerId || null,
          amount: job.amount,
          paymentMethod: paymentMethod || 'mpesa',
          status: 'completed',
          mpesaCode: transactionId || null,
          phoneNumber: phoneNumber || null,
          confirmedByAdmin: 1 as any,
          confirmedAt: now,
          createdAt: now,
          updatedAt: now,
        });
      }
    } catch (paymentErr) {
      console.error('Failed to create/update payment record:', paymentErr);
    }

    // Log payment confirmation
    try {
      await db.insert(jobStatusLogs).values({
        jobId,
        oldStatus: 'approved',
        newStatus: 'paid',
        changedBy: parseInt(adminId),
        note: `Payment confirmed. Writer: KSh ${writerAmount}, Manager: KSh ${managerTotal}`,
        createdAt: now,
      });
    } catch (logErr) {
      console.error('Failed to log payment:', logErr);
    }

    // 📝 AUDIT: Log payment confirmation
    await logAdminAction(
      parseInt(adminId),
      AdminActions.CONFIRM_PAYMENT,
      jobId,
      AuditTargetTypes.PAYMENT,
      {
        jobId,
        orderNumber: job.orderNumber,
        amount: job.amount,
        writerAmount,
        managerAmount: managerTotal,
        transactionId: transactionId || 'N/A',
        paymentMethod: paymentMethod || 'mpesa',
        clientId: job.clientId,
        freelancerId: job.assignedFreelancerId,
      }
    );

    // Now move to completed
    const completedJob = await db
      .update(jobs)
      .set({
        status: 'completed',
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId))
      .returning();

    // Log completion
    try {
      await db.insert(jobStatusLogs).values({
        jobId,
        oldStatus: 'paid',
        newStatus: 'completed',
        changedBy: parseInt(adminId),
        note: 'Order completed after payment confirmation',
        createdAt: now,
      });
    } catch (logErr) {
      console.error('Failed to log completion:', logErr);
    }

    // Notify client
    try {
      await db.insert(notifications).values({
        userId: job.clientId,
        jobId,
        type: 'order_completed',
        title: 'Order Completed',
        message: `Your order ${job.displayId || `#${jobId}`} has been completed. Thank you!`,
        read: false,
        createdAt: now,
      });
    } catch (notifErr) {
      console.error('Failed to notify client:', notifErr);
    }

    return NextResponse.json(
      {
        job: completedJob[0],
        distribution: {
          writer: writerAmount,
          manager: managerTotal,
          total: job.amount,
        },
        message: 'Payment confirmed and order completed successfully.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Confirm payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}