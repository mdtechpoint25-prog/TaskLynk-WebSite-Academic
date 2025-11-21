import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ratings, users, jobs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/v2/ratings - Get ratings for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get all ratings for this user
    const userRatings = await db.select().from(ratings)
      .where(eq(ratings.ratedUserId, parseInt(userId)))
      .orderBy(ratings.createdAt);

    // Calculate average rating
    const avgRating = userRatings.length > 0
      ? userRatings.reduce((sum, r) => sum + (r.score || 0), 0) / userRatings.length
      : 0;

    return NextResponse.json({ 
      ratings: userRatings,
      averageRating: parseFloat(avgRating.toFixed(2)),
      totalRatings: userRatings.length
    });
  } catch (error: any) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch ratings' }, { status: 500 });
  }
}

// POST /api/v2/ratings - Submit a rating
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, raterUserId, ratedUserId, score, comment } = body;

    if (!jobId || !raterUserId || !ratedUserId || !score) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate rating value (1-5)
    if (score < 1 || score > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Verify order exists and is completed
    const [job] = await db.select().from(jobs).where(eq(jobs.id, parseInt(jobId)));

    if (!job) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (job.status !== 'paid' && job.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Can only rate after order is completed and paid' 
      }, { status: 400 });
    }

    // Check if rating already exists for this order and rater
    const existingRating = await db.select().from(ratings)
      .where(
        and(
          eq(ratings.jobId, parseInt(jobId)),
          eq(ratings.ratedByUserId, parseInt(raterUserId))
        )
      );

    if (existingRating.length > 0) {
      return NextResponse.json({ error: 'You have already rated this order' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Create rating
    const [newRating] = await db.insert(ratings).values({
      jobId: parseInt(jobId),
      ratedByUserId: parseInt(raterUserId),
      ratedUserId: parseInt(ratedUserId),
      score: parseInt(score),
      comment: comment || null,
      createdAt: now,
    }).returning();

    // Update user's average rating
    const allRatings = await db.select().from(ratings)
      .where(eq(ratings.ratedUserId, parseInt(ratedUserId)));

    const avgRating = allRatings.reduce((sum, r) => sum + (r.score || 0), 0) / allRatings.length;

    await db.update(users)
      .set({
        rating: parseFloat(avgRating.toFixed(2)),
        ratingAverage: parseFloat(avgRating.toFixed(2)),
        ratingCount: allRatings.length,
      })
      .where(eq(users.id, parseInt(ratedUserId)));

    return NextResponse.json({ 
      rating: newRating,
      message: 'Rating submitted successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting rating:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit rating' }, { status: 500 });
  }
}