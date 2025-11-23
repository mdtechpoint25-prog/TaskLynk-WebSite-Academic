import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { freelancerOnlineStatus, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/v2/freelancers/active
 * Get count and list of currently active/online freelancers with contact info
 */
export async function GET(request: NextRequest) {
  try {
    // Get all online freelancers with their contact information
    const onlineFreelancers = await db
      .select({
        freelancerId: users.id,
        freelancerName: users.name,
        freelancerEmail: users.email,
        freelancerPhone: users.phone,
        freelancerRating: users.rating,
        currentJobsCount: freelancerOnlineStatus.currentJobsCount,
        isOnline: freelancerOnlineStatus.isOnline,
        lastSeenAt: freelancerOnlineStatus.lastSeenAt,
      })
      .from(freelancerOnlineStatus)
      .innerJoin(users, eq(freelancerOnlineStatus.freelancerId, users.id))
      .where(eq(freelancerOnlineStatus.isOnline, true));

    return NextResponse.json({
      success: true,
      activeCount: onlineFreelancers.length,
      freelancers: onlineFreelancers,
    });
  } catch (error) {
    console.error('Error fetching active freelancers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active freelancers' },
      { status: 500 }
    );
  }
}
