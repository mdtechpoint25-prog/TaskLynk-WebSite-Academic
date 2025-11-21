import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications, users } from '@/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const since = searchParams.get('since');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: 'userId must be a number' },
        { status: 400 }
      );
    }

    // Build query conditions
    const conditions = [eq(notifications.userId, userIdNum)];

    // Add timestamp filter if provided
    if (since) {
      conditions.push(gte(notifications.createdAt, since));
    }

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(100);

    return NextResponse.json(userNotifications, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Create a new notification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, message, relatedId, relatedType } = body;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title, message' },
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

    // Insert notification
    await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      read: false,
      relatedId: relatedId || null,
      relatedType: relatedType || null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Notification created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read or delete
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationIds, action, userId } = body;

    if (action === 'mark_all_read') {
      if (!userId) {
        return NextResponse.json(
          { error: 'userId required for mark_all_read' },
          { status: 400 }
        );
      }

      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId));

      return NextResponse.json(
        { success: true, message: 'All notifications marked as read' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('PATCH /api/notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Delete notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!notificationId && !userId) {
      return NextResponse.json(
        { error: 'Provide either id or userId' },
        { status: 400 }
      );
    }

    if (notificationId) {
      // Delete specific notification
      await db
        .delete(notifications)
        .where(eq(notifications.id, parseInt(notificationId)));

      return NextResponse.json(
        { success: true, message: 'Notification deleted' },
        { status: 200 }
      );
    }

    if (userId) {
      // Delete all notifications for user
      await db
        .delete(notifications)
        .where(eq(notifications.userId, parseInt(userId)));

      return NextResponse.json(
        { success: true, message: 'All notifications deleted' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('DELETE /api/notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}