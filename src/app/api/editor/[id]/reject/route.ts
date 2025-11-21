import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs, editorAssignments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/editor/[id]/reject
 * Editor rejects work and sends it back for revision
 * Moves order from 'editing' back to 'in_progress' for writer to revise
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
    const { editorId, rejectionReason, requiredRevisions } = body;

    if (!editorId || !rejectionReason) {
      return NextResponse.json(
        { error: 'Editor ID and rejection reason are required' },
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
        { error: 'Job must be in editing stage for editor review' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update editor assignment to rejected
    await db.update(editorAssignments)
      .set({
        approvalStatus: 'rejected',
        approvalReason: rejectionReason,
        revisionsRequested: true,
        revisionNotes: requiredRevisions || rejectionReason,
        updatedAt: now,
      })
      .where(
        and(
          eq(editorAssignments.jobId, jobId),
          eq(editorAssignments.editorId, parseInt(editorId))
        )
      );

    // Update job status back to in_progress for writer to revise
    await db.update(jobs)
      .set({
        status: 'in_progress',
        revisionRequested: true,
        revisionNotes: `Editor revision request: ${rejectionReason}${requiredRevisions ? '\n' + requiredRevisions : ''}`,
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId));

    return NextResponse.json({
      success: true,
      message: 'Work rejected by editor - returned to writer for revision',
      jobId,
      status: 'in_progress',
      reason: rejectionReason,
      rejectedAt: now,
    });

  } catch (error) {
    console.error('Editor rejection error:', error);
    return NextResponse.json(
      { error: 'Failed to reject work' },
      { status: 500 }
    );
  }
}
