import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bids, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/v2/bids/freelancers
 * Get list of freelancers who have bid on a specific job with contact information
 * Query params:
 *   - jobId: ID of the job
 */
export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      );
    }

    const bidders = await db
      .select({
        bidId: bids.id,
        freelancerId: users.id,
        freelancerName: users.name,
        freelancerEmail: users.email,
        freelancerPhone: users.phone,
        freelancerRating: users.rating,
        bidAmount: bids.bidAmount,
        bidMessage: bids.message,
        bidStatus: bids.status,
        bidCreatedAt: bids.createdAt,
      })
      .from(bids)
      .innerJoin(users, eq(bids.freelancerId, users.id))
      .where(eq(bids.jobId, parseInt(jobId)))
      .orderBy((t) => t.bidCreatedAt);

    return NextResponse.json({
      success: true,
      bidders,
      total: bidders.length,
    });
  } catch (error) {
    console.error('Error fetching job bidders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job bidders' },
      { status: 500 }
    );
  }
}
