import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { badges } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/v2/badges
 * List all badges with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // 'writer' or 'client'
    const status = searchParams.get('status') || 'active';

    let query = db.select().from(badges);

    // Apply filters
    const allBadges = await query;
    
    let filteredBadges = allBadges.filter(b => b.status === status);
    
    if (category) {
      filteredBadges = filteredBadges.filter(b => b.category === category);
    }

    return NextResponse.json({
      success: true,
      badges: filteredBadges,
      count: filteredBadges.length,
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/badges
 * Create a new badge (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, icon, criteria, category, color, adminId } = body;

    // Validate required fields
    if (!name || !criteria || !category) {
      return NextResponse.json(
        { error: 'Name, criteria, and category are required' },
        { status: 400 }
      );
    }

    // Validate category
    if (!['writer', 'client'].includes(category)) {
      return NextResponse.json(
        { error: 'Category must be "writer" or "client"' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const [newBadge] = await db.insert(badges).values({
      name,
      description: description || null,
      icon: icon || '🏆',
      criteria: typeof criteria === 'string' ? criteria : JSON.stringify(criteria),
      category,
      color: color || '#FFC107',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({
      success: true,
      badge: newBadge,
      message: 'Badge created successfully',
    });
  } catch (error: any) {
    console.error('Error creating badge:', error);
    
    if (error.message?.includes('UNIQUE')) {
      return NextResponse.json(
        { error: 'Badge with this name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create badge' },
      { status: 500 }
    );
  }
}
