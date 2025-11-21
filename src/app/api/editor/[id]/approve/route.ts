import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs, editorAssignments, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/editor/[id]/approve
 * Editor approves work for delivery
 * Moves order from 'editing' to 'delivered'
 * TIER 1 FIX: Editor approval workflow
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
    const { editorId, approvalNotes } = body;

    if (!editorId) {
      return NextResponse.json(
        { error: 'Editor ID is required' },
        { status: 400 }
      );
    }

    // Verify editor role
    const editor = await db.select()
      .from(users)
      .where(and(
        eq(users.id, parseInt(editorId)),
        eq(users.role, 'editor')
      ))
      .limit(1);

    if (editor.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized: Editor access required' },
        { status: 403 }
      );
    }

    // Get job and verify it's in editing stage
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

    if (job[0].status !== 'editing') {
      return NextResponse.json(
        { error: 'Job must be in editing stage for editor approval' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const oldStatus = job[0].status;

    // Update editor assignment to approved
    await db.update(editorAssignments)
      .set({
        approvalStatus: 'approved',
        approvalReason: approvalNotes || 'Work quality meets standards',
        updatedAt: now,
      })
      .where(
        and(
          eq(editorAssignments.jobId, jobId),
          eq(editorAssignments.editorId, parseInt(editorId))
        )
      );

    // Update job status to delivered
    await db.update(jobs)
      .set({
        status: 'delivered',
        editorApproved: true,
        editorApprovedAt: now,
        editorApprovalNotes: approvalNotes || 'Work approved by editor',
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId));

    // Create in-app notification for client
    try {
      await db.insert(notifications).values({
        userId: job[0].clientId as number,
        jobId: jobId,
        type: 'editor_approved',
        title: 'Work Quality Approved',
        message: `The editor has approved your order "${job[0].title}" - it's ready for your review!`,
        read: false,
        createdAt: now,
      });
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr);
    }

    // Send multi-channel notifications (Email, WhatsApp, Telegram)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/jobs/${jobId}/notify-status-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldStatus, newStatus: 'delivered' }),
      });
      if (!response.ok) {
        console.error('Failed to send notifications:', response.statusText);
      }
    } catch (notifyErr) {
      console.error('Failed to trigger multi-channel notifications:', notifyErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Work approved by editor',
      jobId,
      status: 'delivered',
      approvedAt: now,
    });

  } catch (error) {
    console.error('Editor approval error:', error);
    return NextResponse.json(
      { error: 'Failed to approve work' },
      { status: 500 }
    );
  }
}
