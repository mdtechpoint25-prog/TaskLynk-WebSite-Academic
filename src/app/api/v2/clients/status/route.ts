import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clientOnlineStatus } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/v2/clients/status
 * Update client online/offline status
 * Body:
 *   - clientId: ID of the client
 *   - isOnline: boolean indicating online status
 */
export async function POST(request: NextRequest) {
  try {
    const { clientId, isOnline } = await request.json();

    if (!clientId || isOnline === undefined) {
      return NextResponse.json(
        { error: 'clientId and isOnline are required' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Check if client status record exists
    const existing = await db
      .select()
      .from(clientOnlineStatus)
      .where(eq(clientOnlineStatus.clientId, parseInt(clientId)))
      .limit(1);

    let result;
    if (existing.length > 0) {
      // Update existing record
      result = await db
        .update(clientOnlineStatus)
        .set({
          isOnline: isOnline,
          lastSeenAt: now,
        })
        .where(eq(clientOnlineStatus.clientId, parseInt(clientId)))
        .returning();
    } else {
      // Insert new record
      result = await db
        .insert(clientOnlineStatus)
        .values({
          clientId: parseInt(clientId),
          isOnline: isOnline,
          lastSeenAt: now,
        })
        .returning();
    }

    return NextResponse.json({
      success: true,
      status: result[0] || { clientId, isOnline, lastSeenAt: now },
    });
  } catch (error) {
    console.error('Error updating client status:', error);
    return NextResponse.json(
      { error: 'Failed to update client status' },
      { status: 500 }
    );
  }
}
