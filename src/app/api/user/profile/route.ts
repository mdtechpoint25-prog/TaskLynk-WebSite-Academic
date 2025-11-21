import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, ratings, userBadges } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface UserProfileData {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  bio?: string;
  rating?: number;
  badges?: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
  }>;
  balance?: number;
  totalEarned?: number;
  completedJobs?: number;
  statistics?: {
    totalOrders?: number;
    completedOrders?: number;
    avgResponseTime?: number;
    revisionRate?: number;
  };
}

/**
 * GET /api/user/profile
 * Fetch complete user profile with ratings, badges, balance, statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const parsedUserId = parseInt(userId);

    // Fetch user basic info
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parsedUserId));

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const profileData: UserProfileData = {
      id: user.id,
      name: user.name || 'Unknown User',
      email: user.email,
      role: user.role,
      avatar: user.avatar || null,
      bio: (user as any).bio || '',
    };

    // For writers and clients, fetch ratings
    if ((user.role === 'freelancer' || user.role === 'writer') || user.role === 'client') {
      const userRatings = await db
        .select()
        .from(ratings)
        .where(eq(ratings.userId, parsedUserId));

      if (userRatings.length > 0) {
        const avgRating =
          userRatings.reduce((sum, r) => sum + (r.score || 0), 0) /
          userRatings.length;
        profileData.rating = Math.round(avgRating * 10) / 10;
      } else {
        profileData.rating = 0;
      }
    }

    // Fetch badges
    const badges = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, parsedUserId));

    if (badges.length > 0) {
      profileData.badges = badges.map((b) => ({
        id: String(b.id),
        name: b.badgeName || 'Unknown',
        icon: b.badgeIcon || '🏆',
        description: b.description || '',
      }));
    }

    // Fetch balance for writers and clients
    if (user.role === 'freelancer' || user.role === 'writer' || user.role === 'client') {
      profileData.balance = user.balance || 0;
      profileData.totalEarned = (user as any).totalEarned || 0;
    }

    // Fetch statistics
    if (user.role === 'freelancer' || user.role === 'writer') {
      profileData.statistics = {
        completedOrders: (user as any).completedJobs || 0,
        totalOrders: (user as any).totalJobs || 0,
      };
    }

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 * Update user profile information
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, bio, timezone, avatar } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const parsedUserId = parseInt(userId);

    // Update user
    await db
      .update(users)
      .set({
        name: name || undefined,
        avatar: avatar || undefined,
        ...(bio && { bio }),
        ...(timezone && { timezone: timezone }),
      })
      .where(eq(users.id, parsedUserId));

    // Fetch updated user
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, parsedUserId));

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
