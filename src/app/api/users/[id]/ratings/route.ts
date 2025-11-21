import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ratings, jobs, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface RatingData {
  raterId: number;
  userId: number;
  score: number;
  comment?: string;
  jobId?: number;
  category: 'quality' | 'timeliness' | 'communication' | 'fairness' | 'overall';
}

/**
 * GET /api/users/[id]/ratings
 * Fetch all ratings for a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Fetch all ratings for this user
    const userRatings = await db
      .select()
      .from(ratings)
      .where(eq(ratings.userId, userId));

    if (userRatings.length === 0) {
      return NextResponse.json({
        userId,
        ratings: [],
        averageRating: 0,
        ratingCount: 0,
      });
    }

    // Calculate statistics
    const totalScore = userRatings.reduce((sum, r) => sum + (r.score || 0), 0);
    const averageRating = (totalScore / userRatings.length).toFixed(1);

    // Group ratings by category
    const byCategory = userRatings.reduce((acc: any, r) => {
      const cat = r.category || 'overall';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(r);
      return acc;
    }, {});

    return NextResponse.json({
      userId,
      ratings: userRatings,
      ratingCount: userRatings.length,
      averageRating: parseFloat(String(averageRating)),
      byCategory,
      breakdown: {
        fiveStars: userRatings.filter((r) => r.score === 5).length,
        fourStars: userRatings.filter((r) => r.score === 4).length,
        threeStars: userRatings.filter((r) => r.score === 3).length,
        twoStars: userRatings.filter((r) => r.score === 2).length,
        oneStar: userRatings.filter((r) => r.score === 1).length,
      },
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/[id]/ratings
 * Submit a new rating for a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    const body = await request.json() as RatingData;

    const { raterId, score, comment, jobId, category } = body;

    if (!raterId || !score || score < 1 || score > 5) {
      return NextResponse.json(
        { error: 'Invalid rating data. Score must be 1-5' },
        { status: 400 }
      );
    }

    // Verify user exists
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

    // Verify rater exists
    const [rater] = await db
      .select()
      .from(users)
      .where(eq(users.id, raterId));

    if (!rater) {
      return NextResponse.json(
        { error: 'Rater not found' },
        { status: 404 }
      );
    }

    // Optional: verify job if provided
    if (jobId) {
      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, jobId));

      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
    }

    // Create rating
    const newRating = await db.insert(ratings).values({
      userId,
      raterId,
      score,
      comment: comment || null,
      jobId: jobId || null,
      category: (category || 'overall') as any,
      createdAt: new Date().toISOString(),
    });

    // Recalculate user's average rating
    const allRatings = await db
      .select()
      .from(ratings)
      .where(eq(ratings.userId, userId));

    const avgRating =
      allRatings.reduce((sum, r) => sum + (r.score || 0), 0) /
      allRatings.length;

    // Update user's rating
    await db
      .update(users)
      .set({
        rating: avgRating,
      })
      .where(eq(users.id, userId));

    return NextResponse.json(
      {
        success: true,
        rating: newRating,
        userNewRating: parseFloat(avgRating.toFixed(1)),
        message: 'Rating submitted successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}
