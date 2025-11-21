import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs, notifications, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/jobs/[id]/request-revision - Client requests revision on delivered work
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
    const { clientId, revisionNotes } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required', code: 'MISSING_CLIENT_ID' },
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

    // Verify this is the client's order
    if (job.clientId !== parseInt(clientId)) {
      return NextResponse.json(
        { error: 'Not authorized', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Verify job is in delivered status
    if (job.status !== 'delivered') {
      return NextResponse.json(
        {
          error: `Cannot request revision for order in status: ${job.status}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update job to revision
    const updatedJob = await db
      .update(jobs)
      .set({
        status: 'revision',
        revisionRequested: 1 as any,
        revisionNotes: revisionNotes || null,
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId))
      .returning();

    // Log status change
    try {
      await db.insert(jobStatusLogs).values({
        jobId,
        oldStatus: 'delivered',
        newStatus: 'revision',
        changedBy: parseInt(clientId),
        note: revisionNotes ? `Client requested revision: ${revisionNotes}` : 'Client requested revision',
        createdAt: now,
      });
    } catch (logErr) {
      console.error('Failed to log revision request:', logErr);
    }

    // Notify freelancer
    try {
      if (job.assignedFreelancerId) {
        await db.insert(notifications).values({
          userId: job.assignedFreelancerId,
          jobId,
          type: 'revision_requested',
          title: 'Revision Requested',
          message: `Client requested revisions for order ${job.displayId || `#${jobId}`}. ${revisionNotes ? `Notes: ${revisionNotes}` : ''}`,
          read: false,
          createdAt: now,
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify freelancer:', notifErr);
    }

    // Notify admins
    try {
      const admins = await db.select().from(users).where(eq(users.role, 'admin'));
      
      for (const admin of admins) {
        await db.insert(notifications).values({
          userId: admin.id,
          jobId,
          type: 'revision_requested',
          title: 'Revision Requested',
          message: `Client requested revisions for order ${job.displayId || `#${jobId}`}.`,
          read: false,
          createdAt: now,
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify admins:', notifErr);
    }

    return NextResponse.json(
      {
        job: updatedJob[0],
        message: 'Revision requested successfully. Freelancer has been notified.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Request revision error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
