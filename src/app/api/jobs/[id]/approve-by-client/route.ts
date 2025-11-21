import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs, notifications, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/jobs/[id]/approve-by-client - Client approves delivered work
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
    const { clientId } = body;

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
          error: `Cannot approve order in status: ${job.status}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update job to approved
    const updatedJob = await db
      .update(jobs)
      .set({
        status: 'approved',
        clientApproved: 1 as any,
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId))
      .returning();

    // Log status change
    try {
      await db.insert(jobStatusLogs).values({
        jobId,
        oldStatus: 'delivered',
        newStatus: 'approved',
        changedBy: parseInt(clientId),
        note: 'Client approved the delivered work',
        createdAt: now,
      });
    } catch (logErr) {
      console.error('Failed to log approval:', logErr);
    }

    // Notify all admins
    try {
      const admins = await db.select().from(users).where(eq(users.role, 'admin'));
      
      for (const admin of admins) {
        await db.insert(notifications).values({
          userId: admin.id,
          jobId,
          type: 'order_approved',
          title: 'Client Approved Order',
          message: `Client approved order ${job.displayId || `#${jobId}`}. Ready for payment confirmation.`,
          read: false,
          createdAt: now,
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify admins:', notifErr);
    }

    // Notify freelancer
    try {
      if (job.assignedFreelancerId) {
        await db.insert(notifications).values({
          userId: job.assignedFreelancerId,
          jobId,
          type: 'order_approved',
          title: 'Order Approved',
          message: `Client approved your work for order ${job.displayId || `#${jobId}`}. Awaiting payment confirmation.`,
          read: false,
          createdAt: now,
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify freelancer:', notifErr);
    }

    return NextResponse.json(
      {
        job: updatedJob[0],
        message: 'Order approved successfully. Awaiting payment confirmation.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Approve error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
