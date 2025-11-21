import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateStatusTransition, getTransitionError } from '@/lib/job-status-transitions';

// DEPRECATED: This endpoint is replaced by /accept for admin/manager actions
// Only kept for backward compatibility
// Use /api/jobs/[id]/accept for admin/manager to accept pending orders
// Use /api/jobs/[id]/approve-by-client for client to approve delivered work

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid job ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const jobId = parseInt(id);
    const body = await request.json();
    const { approved } = body;

    if (approved === undefined || typeof approved !== 'boolean') {
      return NextResponse.json(
        { 
          error: 'Approved field is required and must be a boolean',
          code: 'INVALID_APPROVED_FIELD'
        },
        { status: 400 }
      );
    }

    const existingJob = await db.select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (existingJob.length === 0) {
      return NextResponse.json(
        { 
          error: 'Job not found',
          code: 'JOB_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const currentJob = existingJob[0];

    // IMPORTANT: This endpoint should NOT move orders to "approved" status
    // "approved" status is ONLY for client approval of delivered work
    // For admin/manager acceptance, use /api/jobs/[id]/accept instead
    
    let newStatus = currentJob.status;
    if (approved) {
      // If current status is pending, move to accepted (not approved)
      if (currentJob.status === 'pending') {
        newStatus = 'accepted';
      }
    } else {
      // If not approved, cancel the order
      newStatus = 'cancelled';
    }

    // 🔄 FIX #22: Validate status transition
    if (newStatus !== currentJob.status) {
      if (!validateStatusTransition(currentJob.status, newStatus)) {
        return NextResponse.json(
          { 
            error: getTransitionError(currentJob.status, newStatus),
            code: 'INVALID_STATUS_TRANSITION'
          },
          { status: 400 }
        );
      }
    }

    const updatedJob = await db.update(jobs)
      .set({
        adminApproved: approved ? 1 : 0,
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
      .where(eq(jobs.id, jobId))
      .returning();

    return NextResponse.json(updatedJob[0], { status: 200 });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}