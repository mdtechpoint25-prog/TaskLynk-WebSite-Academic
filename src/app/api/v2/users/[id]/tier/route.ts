import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, writerTiers, userStats } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * 🎯 FIX #17: Freelancer Tier System Implementation
 * Calculates and returns the current tier for a freelancer based on performance metrics
 */

async function calculateFreelancerTier(user: any) {
  try {
    // Get all tiers ordered by requirements (ascending)
    const allTiers = await db
      .select()
      .from(writerTiers)
      .orderBy(desc(writerTiers.minRating), desc(writerTiers.minJobs));

    if (allTiers.length === 0) {
      return null;
    }

    // Get user stats
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, user.id))
      .limit(1);

    // Calculate success rate
    const totalJobs = stats?.totalJobsCompleted || 0;
    const cancelledJobs = stats?.totalJobsCancelled || 0;
    const successRate = totalJobs > 0 
      ? (totalJobs - cancelledJobs) / totalJobs 
      : 0;

    // Find the highest tier the user qualifies for
    let qualifiedTier = null;

    for (const tier of allTiers) {
      const meetsRating = (user.ratingAverage || 0) >= tier.minRating;
      const meetsJobs = (user.completedJobs || 0) >= tier.minJobs;
      const meetsSuccessRate = successRate >= tier.minSuccessRate;

      if (meetsRating && meetsJobs && meetsSuccessRate) {
        qualifiedTier = tier;
        break; // Found the highest tier they qualify for
      }
    }

    // If no tier qualifies, return the lowest tier
    if (!qualifiedTier && allTiers.length > 0) {
      qualifiedTier = allTiers[allTiers.length - 1];
    }

    return {
      ...qualifiedTier,
      currentStats: {
        rating: user.ratingAverage || 0,
        completedJobs: user.completedJobs || 0,
        successRate: parseFloat((successRate * 100).toFixed(2)),
      },
      benefits: qualifiedTier?.benefits ? JSON.parse(qualifiedTier.benefits) : null,
    };
  } catch (error) {
    console.error('Error calculating freelancer tier:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const userId = parseInt(params.id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Valid user ID is required' },
        { status: 400 }
      );
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only freelancers have tiers
    if (user.role !== 'freelancer') {
      return NextResponse.json(
        { error: 'User is not a freelancer' },
        { status: 400 }
      );
    }

    // Calculate tier
    const tier = await calculateFreelancerTier(user);

    if (!tier) {
      return NextResponse.json(
        { error: 'No tiers configured in the system' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tier });
  } catch (error: any) {
    console.error('Error fetching user tier:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user tier' },
      { status: 500 }
    );
  }
}
