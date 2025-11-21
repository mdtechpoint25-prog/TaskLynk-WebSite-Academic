import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs, editorAssignments } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * GET /api/editor/dashboard
 * Retrieves dashboard data for editor
 * Shows assigned orders waiting for review and previously reviewed orders
 * TIER 1 FIX: Editor role implementation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const editorId = searchParams.get('editorId');

    // Validate editor ID
    if (!editorId) {
      return NextResponse.json(
        { error: 'Editor ID is required' },
        { status: 400 }
      );
    }

    const editorIdInt = parseInt(editorId);
    if (isNaN(editorIdInt)) {
      return NextResponse.json(
        { error: 'Editor ID must be a valid integer' },
        { status: 400 }
      );
    }

    // Verify editor exists and has editor role
    const editor = await db.select()
      .from(users)
      .where(eq(users.id, editorIdInt))
      .limit(1);

    if (editor.length === 0 || editor[0].role !== 'editor') {
      return NextResponse.json(
        { error: 'Not authorized: Editor access required' },
        { status: 403 }
      );
    }

    // Get pending editor assignments (orders waiting for review)
    const pendingReviews = await db.select({
      assignment: editorAssignments,
      job: jobs,
      client: users,
    })
      .from(editorAssignments)
      .innerJoin(jobs, eq(editorAssignments.jobId, jobs.id))
      .innerJoin(users, eq(jobs.clientId, users.id))
      .where(
        and(
          eq(editorAssignments.editorId, editorIdInt),
          eq(editorAssignments.approvalStatus, 'pending')
        )
      );

    // Get in-review assignments
    const inReview = await db.select({
      assignment: editorAssignments,
      job: jobs,
      client: users,
    })
      .from(editorAssignments)
      .innerJoin(jobs, eq(editorAssignments.jobId, jobs.id))
      .innerJoin(users, eq(jobs.clientId, users.id))
      .where(
        and(
          eq(editorAssignments.editorId, editorIdInt),
          eq(editorAssignments.approvalStatus, 'reviewing')
        )
      );

    // Get completed reviews
    const completed = await db.select({
      assignment: editorAssignments,
      job: jobs,
      client: users,
    })
      .from(editorAssignments)
      .innerJoin(jobs, eq(editorAssignments.jobId, jobs.id))
      .innerJoin(users, eq(jobs.clientId, users.id))
      .where(
        and(
          eq(editorAssignments.editorId, editorIdInt),
          inArray(editorAssignments.approvalStatus, ['approved', 'rejected'])
        )
      );

    // Calculate stats
    const stats = {
      pending: pendingReviews.length,
      inReview: inReview.length,
      completed: completed.length,
      totalReviewed: (completed as any[]).length,
      approvalRate: completed.length > 0 
        ? ((completed as any[]).filter(c => c.assignment.approvalStatus === 'approved').length / completed.length * 100).toFixed(1)
        : 0,
    };

    return NextResponse.json({
      editor: {
        id: editor[0].id,
        name: editor[0].name,
        email: editor[0].email,
        displayId: editor[0].displayId,
      },
      stats,
      pendingReviews,
      inReview,
      completed,
    });

  } catch (error) {
    console.error('Editor dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch editor dashboard' },
      { status: 500 }
    );
  }
}
