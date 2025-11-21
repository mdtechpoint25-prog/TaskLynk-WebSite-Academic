import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/notifications/[id]
 * Fetch a single notification
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error(`GET /api/notifications/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/[id]
 * Update a single notification (mark as read, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { read } = body;

    if (read === undefined) {
      return NextResponse.json(
        { error: 'Missing required field: read' },
        { status: 400 }
      );
    }

    await db
      .update(notifications)
      .set({ read })
      .where(eq(notifications.id, id));

    return NextResponse.json(
      { success: true, message: 'Notification updated' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`PATCH /api/notifications/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a single notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    await db
      .delete(notifications)
      .where(eq(notifications.id, id));

    return NextResponse.json(
      { success: true, message: 'Notification deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`DELETE /api/notifications/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
