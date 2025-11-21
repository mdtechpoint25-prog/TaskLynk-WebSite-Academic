import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ratings, users, jobs } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * GET /api/v2/users/[id]/rating
 * Calculate and return detailed user rating
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Fetch user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch all ratings for this user
    const userRatings = await db
      .select()
      .from(ratings)
      .where(eq(ratings.ratedUserId, userId));

    if (userRatings.length === 0) {
      return NextResponse.json({
        success: true,
        rating: 0,
        ratingCount: 0,
        breakdown: {},
        message: 'No ratings yet',
      });
    }

    // Calculate average rating
    const totalScore = userRatings.reduce((sum, r) => sum + (r.score || 0), 0);
    const averageRating = totalScore / userRatings.length;

    // Calculate rating breakdown by dimension
    const breakdown: Record<string, { average: number; count: number }> = {};
    
    userRatings.forEach((rating) => {
      try {
        const metadata = rating.metadata ? JSON.parse(rating.metadata) : {};
        const dimension = metadata.dimension || 'general';
        
        if (!breakdown[dimension]) {
          breakdown[dimension] = { average: 0, count: 0 };
        }
        
        breakdown[dimension].average += rating.score;
        breakdown[dimension].count += 1;
      } catch (e) {
        // Skip invalid metadata
      }
    });

    // Calculate averages for each dimension
    Object.keys(breakdown).forEach((dimension) => {
      breakdown[dimension].average = 
        breakdown[dimension].average / breakdown[dimension].count;
    });

    // For writers: Calculate weighted rating
    let weightedRating = averageRating;
    if (user.role === 'freelancer') {
      const qualityRatings = userRatings.filter(r => {
        try {
          const meta = r.metadata ? JSON.parse(r.metadata) : {};
          return meta.dimension === 'quality';
        } catch (e) {
          return false;
        }
      });

      const timelinessRatings = userRatings.filter(r => {
        try {
          const meta = r.metadata ? JSON.parse(r.metadata) : {};
          return meta.dimension === 'deadline';
        } catch (e) {
          return false;
        }
      });

      if (qualityRatings.length > 0 || timelinessRatings.length > 0) {
        const qualityScore = qualityRatings.length > 0
          ? qualityRatings.reduce((sum, r) => sum + r.score, 0) / qualityRatings.length
          : averageRating;
        
        const timelinessScore = timelinessRatings.length > 0
          ? timelinessRatings.reduce((sum, r) => sum + r.score, 0) / timelinessRatings.length
          : averageRating;

        // Weighted formula: quality 50%, timeliness 20%, others 30%
        weightedRating = (
          qualityScore * 0.5 +
          timelinessScore * 0.2 +
          averageRating * 0.3
        );
      }
    }

    // Update user's rating in database
    await db
      .update(users)
      .set({
        ratingAverage: Math.round(weightedRating * 10) / 10,
        ratingCount: userRatings.length,
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      rating: Math.round(weightedRating * 10) / 10,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingCount: userRatings.length,
      breakdown,
      recentRatings: userRatings.slice(-5).reverse(),
    });
  } catch (error) {
    console.error('Error calculating rating:', error);
    return NextResponse.json(
      { error: 'Failed to calculate rating' },
      { status: 500 }
    );
  }
}
