import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clientOnlineStatus, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/v2/clients/active
 * Get list of online clients with contact information
 */
export async function GET(request: NextRequest) {
  try {
    const onlineClients = await db
      .select({
        clientId: users.id,
        clientName: users.name,
        clientEmail: users.email,
        clientPhone: users.phone,
        lastSeenAt: clientOnlineStatus.lastSeenAt,
      })
      .from(clientOnlineStatus)
      .innerJoin(users, eq(clientOnlineStatus.clientId, users.id))
      .where(eq(clientOnlineStatus.isOnline, true));

    return NextResponse.json({
      success: true,
      clients: onlineClients,
      total: onlineClients.length,
    });
  } catch (error) {
    console.error('Error fetching active clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active clients' },
      { status: 500 }
    );
  }
}
