import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { managerOnlineStatus, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/v2/managers/active
 * Get list of online managers with contact information
 */
export async function GET(request: NextRequest) {
  try {
    const onlineManagers = await db
      .select({
        managerId: users.id,
        managerName: users.name,
        managerEmail: users.email,
        managerPhone: users.phone,
        lastSeenAt: managerOnlineStatus.lastSeenAt,
      })
      .from(managerOnlineStatus)
      .innerJoin(users, eq(managerOnlineStatus.managerId, users.id))
      .where(eq(managerOnlineStatus.isOnline, true));

    return NextResponse.json({
      success: true,
      managers: onlineManagers,
      total: onlineManagers.length,
    });
  } catch (error) {
    console.error('Error fetching active managers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active managers' },
      { status: 500 }
    );
  }
}
