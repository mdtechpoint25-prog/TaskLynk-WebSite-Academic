import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/jobs/[id]/hold - Admin/Manager puts order on hold
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
    const { managerId, adminId, reason } = body;

    const changedBy = managerId || adminId;
    if (!changedBy) {
      return NextResponse.json(
        { error: 'Manager ID or Admin ID required', code: 'MISSING_USER_ID' },
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

    // Cannot hold if already completed or paid
    if (oldStatus === 'completed' || oldStatus === 'paid') {
      return NextResponse.json(
        { error: `Cannot put order on hold in status: ${oldStatus}`, code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update job to on_hold
    const updatedJob = await db
      .update(jobs)
      .set({
        status: 'on_hold',
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId))
      .returning();

    // Log status change
    try {
      await db.insert(jobStatusLogs).values({
        jobId,
        oldStatus: oldStatus as string,
        newStatus: 'on_hold',
        changedBy: parseInt(changedBy),
        note: reason ? `Order put on hold: ${reason}` : 'Order put on hold',
        createdAt: now,
      });
    } catch (logErr) {
      console.error('Failed to log hold:', logErr);
    }

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
          type: 'order_on_hold',
          title: 'Order On Hold',
          message: `Order ${job.displayId || `#${jobId}`} has been put on hold. ${reason || ''}`,
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
        message: 'Order put on hold successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Hold error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
