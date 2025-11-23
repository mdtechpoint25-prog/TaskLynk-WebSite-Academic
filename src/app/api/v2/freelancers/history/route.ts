import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clientFreelancerHistory, jobs, ratings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/v2/freelancers/history
 * Update or create client-freelancer work history when a job is completed
 * Body:
 *   - jobId: ID of the completed job
 */
export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      );
    }

    // Get the job details
    const job = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job || job.length === 0) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const jobData = job[0];
    if (!jobData.assignedFreelancerId || !jobData.clientId) {
      return NextResponse.json(
        { error: 'Job must have assigned freelancer and client' },
        { status: 400 }
      );
    }

    // Get the rating for this job if it exists
    const jobRating = await db
      .select()
      .from(ratings)
      .where(
        and(
          eq(ratings.jobId, jobId),
          eq(ratings.ratedUserId, jobData.assignedFreelancerId)
        )
      )
      .limit(1);

    const avgRating = jobRating.length > 0 ? jobRating[0].score : null;

    // Check if this client-freelancer relationship already exists
    const existingHistory = await db
      .select()
      .from(clientFreelancerHistory)
      .where(
        and(
          eq(clientFreelancerHistory.clientId, jobData.clientId),
          eq(clientFreelancerHistory.freelancerId, jobData.assignedFreelancerId)
        )
      );

    const now = new Date().toISOString();

    if (existingHistory.length > 0) {
      // Update existing record
      await db
        .update(clientFreelancerHistory)
        .set({
          completedJobsCount: existingHistory[0].completedJobsCount + 1,
          lastWorkedAt: now,
          avgRating: avgRating || existingHistory[0].avgRating,
          updatedAt: now,
        })
        .where(
          and(
            eq(clientFreelancerHistory.clientId, jobData.clientId),
            eq(clientFreelancerHistory.freelancerId, jobData.assignedFreelancerId)
          )
        );
    } else {
      // Create new record
      await db.insert(clientFreelancerHistory).values({
        clientId: jobData.clientId,
        freelancerId: jobData.assignedFreelancerId,
        completedJobsCount: 1,
        lastWorkedAt: now,
        avgRating: avgRating || null,
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Freelancer history updated',
    });
  } catch (error) {
    console.error('Error updating freelancer history:', error);
    return NextResponse.json(
      { error: 'Failed to update freelancer history' },
      { status: 500 }
    );
  }
}
