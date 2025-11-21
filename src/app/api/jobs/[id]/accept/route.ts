import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs, notifications, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/jobs/[id]/accept - Manager/Admin accepts pending order
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
    const { managerId, adminId } = body;

    // Require either managerId or adminId
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

    // Verify job is in pending status
    if (job.status !== 'pending') {
      return NextResponse.json(
        {
          error: `Cannot accept order in status: ${job.status}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update job to accepted
    const updatedJob = await db
      .update(jobs)
      .set({
        status: 'accepted',
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId))
      .returning();

    // Log status change
    try {
      await db.insert(jobStatusLogs).values({
        jobId,
        oldStatus: 'pending',
        newStatus: 'accepted',
        changedBy: parseInt(changedBy),
        note: 'Order accepted by manager/admin',
        createdAt: now,
      });
    } catch (logErr) {
      console.error('Failed to log acceptance:', logErr);
    }

    // Notify client
    try {
      await db.insert(notifications).values({
        userId: job.clientId,
        jobId,
        type: 'order_accepted',
        title: 'Order Accepted',
        message: `Your order ${job.displayId || `#${jobId}`} has been accepted and is being processed.`,
        read: false,
        createdAt: now,
      });
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr);
    }

    return NextResponse.json(
      {
        job: updatedJob[0],
        message: 'Order accepted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Accept error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
