import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/manager/[id]/approve-submission
 * Manager reviews freelancer submission before sending to editor
 * TIER 2 FIX #5: Manager Approval Gate
 * 
 * Workflow:
 * in_progress (freelancer working) → manager_review (manager reviews) 
 * → approved_for_editing (ready for editor) → editing → delivered
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = parseInt(params.id);
    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { managerId, approvalNotes, sendToEditor } = body;

    if (!managerId) {
      return NextResponse.json(
        { error: 'Manager ID is required' },
        { status: 400 }
      );
    }

    // Verify manager role
    const manager = await db.select()
      .from(users)
      .where(and(
        eq(users.id, parseInt(managerId)),
        eq(users.role, 'manager')
      ))
      .limit(1);

    if (manager.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized: Manager access required' },
        { status: 403 }
      );
    }

    // Get job
    const job = await db.select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (job.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify manager manages this job
    if (job[0].managerId !== parseInt(managerId)) {
      return NextResponse.json(
        { error: 'You do not manage this job' },
        { status: 403 }
      );
    }

    // Check job is in 'in_progress' (freelancer submitted work)
    if (job[0].status !== 'in_progress' && job[0].status !== 'submitted') {
      return NextResponse.json(
        { error: `Job must be in 'in_progress' or 'submitted' status, currently: ${job[0].status}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const oldStatus = job[0].status;
    const nextStatus = sendToEditor ? 'editing' : 'in_progress';

    // Update job with manager approval
    await db.update(jobs)
      .set({
        status: nextStatus,
        managerApproved: true,
        managerApprovedAt: now,
        managerApprovalNotes: approvalNotes || 'Approved by manager for quality check',
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId));

    // Create notification for freelancer
    try {
      if (job[0].assignedFreelancerId) {
        await db.insert(notifications).values({
          userId: job[0].assignedFreelancerId as number,
          jobId: jobId,
          type: 'manager_approved',
          title: 'Manager Approved Your Work',
          message: sendToEditor 
            ? `Manager approved your work on "${job[0].title}" - it's now in quality review`
            : `Manager has reviewed your work on "${job[0].title}" - returning to you for changes`,
          read: false,
          createdAt: now,
        });
      }
    } catch (notifErr) {
      console.error('Failed to create freelancer notification:', notifErr);
    }

    // If sending to editor, also assign an editor (can be updated later)
    if (sendToEditor && !job[0].assignedEditorId) {
      // TODO: Auto-assign editor based on specialization and workload
      // For now, status moves to 'editing' and admin assigns editor
    }

    // Send multi-channel notifications
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/${jobId}/notify-status-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldStatus, newStatus: nextStatus }),
      });
      if (!response.ok) {
        console.error('Failed to send multi-channel notifications:', response.statusText);
      }
    } catch (notifyErr) {
      console.error('Failed to trigger multi-channel notifications:', notifyErr);
    }

    return NextResponse.json({
      success: true,
      message: `Work approved by manager${sendToEditor ? ' and sent to editor' : ''}`,
      jobId,
      status: nextStatus,
      approvedAt: now,
      approvalNotes: approvalNotes || 'Approved by manager',
    });

  } catch (error) {
    console.error('Manager approval error:', error);
    return NextResponse.json(
      { error: 'Failed to approve submission' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manager/[id]/reject-submission
 * Manager rejects freelancer submission and sends it back for revision
 * TIER 2 FIX #5: Manager Approval Gate - Rejection path
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = parseInt(params.id);
    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { managerId, rejectionReason, requiredChanges } = body;

    if (!managerId || !rejectionReason) {
      return NextResponse.json(
        { error: 'Manager ID and rejection reason are required' },
        { status: 400 }
      );
    }

    // Verify manager role
    const manager = await db.select()
      .from(users)
      .where(and(
        eq(users.id, parseInt(managerId)),
        eq(users.role, 'manager')
      ))
      .limit(1);

    if (manager.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized: Manager access required' },
        { status: 403 }
      );
    }

    // Get job
    const job = await db.select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (job.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify manager manages this job
    if (job[0].managerId !== parseInt(managerId)) {
      return NextResponse.json(
        { error: 'You do not manage this job' },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    // Send back to in_progress with revision notes
    await db.update(jobs)
      .set({
        status: 'in_progress',
        revisionRequested: true,
        revisionNotes: `Manager review: ${rejectionReason}${requiredChanges ? '\n' + requiredChanges : ''}`,
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId));

    return NextResponse.json({
      success: true,
      message: 'Work rejected by manager - returned to freelancer for revision',
      jobId,
      status: 'in_progress',
      reason: rejectionReason,
      rejectedAt: now,
    });

  } catch (error) {
    console.error('Manager rejection error:', error);
    return NextResponse.json(
      { error: 'Failed to reject submission' },
      { status: 500 }
    );
  }
}
