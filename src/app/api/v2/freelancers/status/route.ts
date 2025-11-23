import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { freelancerOnlineStatus, jobs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/v2/freelancers/status
 * Update freelancer online status and active job count
 * Body:
 *   - freelancerId: ID of the freelancer
 *   - isOnline: boolean indicating if they're online
 */
export async function POST(request: NextRequest) {
  try {
    const { freelancerId, isOnline } = await request.json();

    if (!freelancerId) {
      return NextResponse.json(
        { error: 'freelancerId is required' },
        { status: 400 }
      );
    }

    // Count current active jobs for the freelancer
    const activeJobs = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.assignedFreelancerId, freelancerId),
          eq(jobs.status, 'in_progress')
        )
      );

    const now = new Date().toISOString();

    // Update or create online status record
    const existingStatus = await db
      .select()
      .from(freelancerOnlineStatus)
      .where(eq(freelancerOnlineStatus.freelancerId, freelancerId));

    if (existingStatus.length > 0) {
      await db
        .update(freelancerOnlineStatus)
        .set({
          isOnline,
          currentJobsCount: activeJobs.length,
          lastSeenAt: now,
          onlineStatusUpdatedAt: now,
        })
        .where(eq(freelancerOnlineStatus.freelancerId, freelancerId));
    } else {
      await db.insert(freelancerOnlineStatus).values({
        freelancerId,
        isOnline,
        currentJobsCount: activeJobs.length,
        lastSeenAt: now,
        onlineStatusUpdatedAt: now,
        createdAt: now,
      });
    }

    return NextResponse.json({
      success: true,
      message: isOnline ? 'Marked as online' : 'Marked as offline',
      activeJobsCount: activeJobs.length,
    });
  } catch (error) {
    console.error('Error updating freelancer status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
