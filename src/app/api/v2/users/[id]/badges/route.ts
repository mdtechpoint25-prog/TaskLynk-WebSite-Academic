import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userBadges, badges, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/v2/users/[id]/badges
 * Get all badges for a user
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

    // Fetch user badges with badge details
    const userBadgesList = await db
      .select({
        id: userBadges.id,
        badgeId: userBadges.badgeId,
        badgeName: userBadges.badgeName,
        badgeIcon: userBadges.badgeIcon,
        description: userBadges.description,
        awardedAt: userBadges.awardedAt,
        awardedBy: userBadges.awardedBy,
        reason: userBadges.reason,
        // Badge details
        color: badges.color,
        category: badges.category,
      })
      .from(userBadges)
      .leftJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId));

    return NextResponse.json({
      success: true,
      badges: userBadgesList,
      count: userBadgesList.length,
    });
  } catch (error) {
    console.error('Error fetching user badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user badges' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/users/[id]/badges
 * Assign a badge to a user (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    const body = await request.json();
    const { badgeId, reason, adminId } = body;

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    if (!badgeId) {
      return NextResponse.json(
        { error: 'Badge ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
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

    // Check if badge exists
    const [badge] = await db
      .select()
      .from(badges)
      .where(eq(badges.id, badgeId));

    if (!badge) {
      return NextResponse.json(
        { error: 'Badge not found' },
        { status: 404 }
      );
    }

    // Check if user already has this badge
    const [existingBadge] = await db
      .select()
      .from(userBadges)
      .where(
        and(
          eq(userBadges.userId, userId),
          eq(userBadges.badgeId, badgeId)
        )
      );

    if (existingBadge) {
      return NextResponse.json(
        { error: 'User already has this badge' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    // Assign badge to user
    const [newUserBadge] = await db.insert(userBadges).values({
      userId,
      badgeId,
      badgeName: badge.name,
      badgeIcon: badge.icon || '🏆',
      description: badge.description || null,
      awardedAt: now,
      awardedBy: adminId || null,
      reason: reason || null,
      createdAt: now,
    }).returning();

    return NextResponse.json({
      success: true,
      badge: newUserBadge,
      message: 'Badge assigned successfully',
    });
  } catch (error) {
    console.error('Error assigning badge:', error);
    return NextResponse.json(
      { error: 'Failed to assign badge' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v2/users/[id]/badges/[badgeId]
 * Remove a badge from a user (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const badgeId = searchParams.get('badgeId');

    if (isNaN(userId) || !badgeId) {
      return NextResponse.json(
        { error: 'Invalid user ID or badge ID' },
        { status: 400 }
      );
    }

    // Delete the badge assignment
    await db
      .delete(userBadges)
      .where(
        and(
          eq(userBadges.userId, userId),
          eq(userBadges.badgeId, parseInt(badgeId))
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Badge removed successfully',
    });
  } catch (error) {
    console.error('Error removing badge:', error);
    return NextResponse.json(
      { error: 'Failed to remove badge' },
      { status: 500 }
    );
  }
}
