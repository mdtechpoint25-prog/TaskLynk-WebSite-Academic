import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clientFreelancerHistory, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/v2/freelancers/previous
 * Get list of previous freelancers who have worked for a specific client with contact info
 * Query params:
 *   - clientId: ID of the client
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get('clientId');
    const limit = request.nextUrl.searchParams.get('limit') || '10';

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    const freelancers = await db
      .select({
        freelancerId: clientFreelancerHistory.freelancerId,
        freelancerName: users.name,
        freelancerEmail: users.email,
        freelancerPhone: users.phone,
        freelancerRating: users.rating,
        completedJobs: clientFreelancerHistory.completedJobsCount,
        avgRating: clientFreelancerHistory.avgRating,
        lastWorkedAt: clientFreelancerHistory.lastWorkedAt,
      })
      .from(clientFreelancerHistory)
      .innerJoin(users, eq(clientFreelancerHistory.freelancerId, users.id))
      .where(eq(clientFreelancerHistory.clientId, parseInt(clientId)))
      .orderBy((t) => t.lastWorkedAt)
      .limit(parseInt(limit));

    return NextResponse.json({
      success: true,
      freelancers,
      total: freelancers.length,
    });
  } catch (error) {
    console.error('Error fetching previous freelancers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch previous freelancers' },
      { status: 500 }
    );
  }
}
