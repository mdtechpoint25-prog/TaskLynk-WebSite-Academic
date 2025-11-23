import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { freelancerCPPLevels } from '@/db/schema';
import { CPP_LEVELS } from '@/lib/cpp-calculation';

/**
 * POST /api/v2/admin/cpp-levels/seed
 * Seed the freelancerCPPLevels table with initial tier definitions
 * Admin only endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Check if already seeded
    const existing = await db.select().from(freelancerCPPLevels).limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'CPP Levels already seeded',
        count: existing.length,
      });
    }

    // Insert all CPP levels
    const now = new Date().toISOString();
    const values = CPP_LEVELS.map((level) => ({
      level: level.level,
      levelName: level.levelName,
      description: level.description,
      completedOrdersRequired: level.completedOrdersRequired,
      cppNonTechnical: level.cppNonTechnical,
      cppTechnical: level.cppTechnical,
      orderCountInLevel: level.orderCountInLevel,
      progressBarColor: level.progressBarColor,
      createdAt: now,
    }));

    await db.insert(freelancerCPPLevels).values(values);

    return NextResponse.json({
      success: true,
      message: 'CPP Levels seeded successfully',
      count: values.length,
    });
  } catch (error) {
    console.error('Error seeding CPP levels:', error);
    return NextResponse.json(
      { error: 'Failed to seed CPP levels' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/admin/cpp-levels
 * Get all CPP level definitions
 */
export async function GET() {
  try {
    const levels = await db.select().from(freelancerCPPLevels);

    return NextResponse.json({
      success: true,
      levels,
      count: levels.length,
    });
  } catch (error) {
    console.error('Error fetching CPP levels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CPP levels' },
      { status: 500 }
    );
  }
}
