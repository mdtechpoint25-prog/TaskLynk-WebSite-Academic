import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, freelancerCPPProgress } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateCPPProgress, getAllCPPLevels, getCPPLevelDetails } from '@/lib/cpp-calculation';

/**
 * GET /api/v2/freelancers/cpp
 * Get CPP level information and progress for a freelancer
 * Query params:
 *   - freelancerId: ID of the freelancer
 */
export async function GET(request: NextRequest) {
  try {
    const freelancerId = request.nextUrl.searchParams.get('freelancerId');

    if (!freelancerId) {
      return NextResponse.json(
        { error: 'freelancerId is required' },
        { status: 400 }
      );
    }

    const freelancerIdInt = parseInt(freelancerId);

    // Get freelancer data
    const freelancer = await db
      .select({
        id: users.id,
        name: users.name,
        completedJobs: users.completedJobs,
      })
      .from(users)
      .where(eq(users.id, freelancerIdInt))
      .limit(1);

    if (!freelancer || freelancer.length === 0) {
      return NextResponse.json(
        { error: 'Freelancer not found' },
        { status: 404 }
      );
    }

    // Check if CPP progress exists
    let cppProgress = await db
      .select()
      .from(freelancerCPPProgress)
      .where(eq(freelancerCPPProgress.freelancerId, freelancerIdInt))
      .limit(1);

    const completedOrders = freelancer[0].completedJobs || 0;
    const status = calculateCPPProgress(completedOrders, cppProgress.length > 0 ? cppProgress[0].isWorkTypeSpecialized : false);

    return NextResponse.json({
      success: true,
      freelancer: {
        id: freelancer[0].id,
        name: freelancer[0].name,
      },
      cppStatus: status,
      cppLevels: getAllCPPLevels(),
      currentLevelDetails: getCPPLevelDetails(status.currentLevel),
      nextLevelDetails: getCPPLevelDetails(status.currentLevel + 1),
    });
  } catch (error) {
    console.error('Error fetching CPP data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CPP data' },
      { status: 500 }
    );
  }
}
