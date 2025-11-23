import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { managerOnlineStatus } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/v2/managers/status
 * Update manager online/offline status
 * Body:
 *   - managerId: ID of the manager
 *   - isOnline: boolean indicating online status
 */
export async function POST(request: NextRequest) {
  try {
    const { managerId, isOnline } = await request.json();

    if (!managerId || isOnline === undefined) {
      return NextResponse.json(
        { error: 'managerId and isOnline are required' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Check if manager status record exists
    const existing = await db
      .select()
      .from(managerOnlineStatus)
      .where(eq(managerOnlineStatus.managerId, parseInt(managerId)))
      .limit(1);

    let result;
    if (existing.length > 0) {
      // Update existing record
      result = await db
        .update(managerOnlineStatus)
        .set({
          isOnline: isOnline,
          lastSeenAt: now,
        })
        .where(eq(managerOnlineStatus.managerId, parseInt(managerId)))
        .returning();
    } else {
      // Insert new record
      result = await db
        .insert(managerOnlineStatus)
        .values({
          managerId: parseInt(managerId),
          isOnline: isOnline,
          lastSeenAt: now,
        })
        .returning();
    }

    return NextResponse.json({
      success: true,
      status: result[0] || { managerId, isOnline, lastSeenAt: now },
    });
  } catch (error) {
    console.error('Error updating manager status:', error);
    return NextResponse.json(
      { error: 'Failed to update manager status' },
      { status: 500 }
    );
  }
}
