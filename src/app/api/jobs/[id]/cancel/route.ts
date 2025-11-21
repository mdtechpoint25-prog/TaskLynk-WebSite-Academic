import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logAdminAction, AdminActions, AuditTargetTypes } from '@/lib/admin-audit';

// POST /api/jobs/[id]/cancel - Admin cancels order
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
    const { adminId, reason } = body;

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
    const oldStatus = job.status;

    // Cannot cancel if already completed or paid
    if (oldStatus === 'completed' || oldStatus === 'paid') {
      return NextResponse.json(
        { error: `Cannot cancel order in status: ${oldStatus}`, code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update job to cancelled
    const updatedJob = await db
      .update(jobs)
      .set({
        status: 'cancelled',
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId))
      .returning();

    // Log status change
    try {
      await db.insert(jobStatusLogs).values({
        jobId,
        oldStatus: oldStatus as string,
        newStatus: 'cancelled',
        changedBy: parseInt(adminId),
        note: reason ? `Order cancelled: ${reason}` : 'Order cancelled by admin',
        createdAt: now,
      });
    } catch (logErr) {
      console.error('Failed to log cancellation:', logErr);
    }

    // 📝 AUDIT: Log job cancellation
    await logAdminAction(
      parseInt(adminId),
      AdminActions.CANCEL_JOB,
      jobId,
      AuditTargetTypes.JOB,
      {
        jobId,
        orderNumber: job.orderNumber,
        previousStatus: oldStatus,
        reason: reason || 'No reason provided',
        clientId: job.clientId,
        freelancerId: job.assignedFreelancerId,
        amount: job.amount,
      }
    );

    // Notify all involved parties
    const userIdsToNotify: number[] = [job.clientId];
    if (job.assignedFreelancerId) {
      userIdsToNotify.push(job.assignedFreelancerId);
    }

    try {
      for (const userId of userIdsToNotify) {
        await db.insert(notifications).values({
          userId,
          jobId,
          type: 'order_cancelled',
          title: 'Order Cancelled',
          message: `Order ${job.displayId || `#${jobId}`} has been cancelled. ${reason || ''}`,
          read: false,
          createdAt: now,
        });
      }
    } catch (notifErr) {
      console.error('Failed to create notifications:', notifErr);
    }

    return NextResponse.json(
      {
        job: updatedJob[0],
        message: 'Order cancelled successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cancel error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}