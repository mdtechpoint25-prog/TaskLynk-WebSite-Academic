import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { freelancerCPPProgress, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/v2/freelancers/cpp/initialize
 * Initialize CPP progress for a newly approved freelancer
 * Body:
 *   - freelancerId: ID of the freelancer being approved
 *   - isWorkTypeSpecialized: Whether freelancer specializes in technical work
 */
export async function POST(request: NextRequest) {
  try {
    const { freelancerId, isWorkTypeSpecialized = false } = await request.json();

    if (!freelancerId) {
      return NextResponse.json(
        { error: 'freelancerId is required' },
        { status: 400 }
      );
    }

    const freelancerIdInt = parseInt(freelancerId);

    // Check if freelancer exists
    const freelancer = await db
      .select()
      .from(users)
      .where(eq(users.id, freelancerIdInt))
      .limit(1);

    if (!freelancer || freelancer.length === 0) {
      return NextResponse.json(
        { error: 'Freelancer not found' },
        { status: 404 }
      );
    }

    // Check if CPP progress already exists
    const existing = await db
      .select()
      .from(freelancerCPPProgress)
      .where(eq(freelancerCPPProgress.freelancerId, freelancerIdInt))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'CPP progress already initialized',
        cppProgress: existing[0],
      });
    }

    // Create new CPP progress record
    const now = new Date().toISOString();
    const result = await db
      .insert(freelancerCPPProgress)
      .values({
        freelancerId: freelancerIdInt,
        currentLevel: 1,
        totalCompletedOrders: 0,
        ordersInCurrentLevel: 0,
        progressPercentage: 0,
        nextLevelOrdersRequired: 3, // First milestone is 3 orders
        isWorkTypeSpecialized: isWorkTypeSpecialized,
        lastProgressUpdate: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'CPP progress initialized successfully',
      cppProgress: result[0],
    });
  } catch (error) {
    console.error('Error initializing CPP progress:', error);
    return NextResponse.json(
      { error: 'Failed to initialize CPP progress' },
      { status: 500 }
    );
  }
}
