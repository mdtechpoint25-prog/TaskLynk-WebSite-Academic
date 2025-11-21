import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { clientId, bidJobId, bidderId } = await request.json();

    if (!clientId || !bidJobId || !bidderId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const bidder = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, bidderId))
      .limit(1);

    const notification = await db
      .insert(notifications)
      .values({
        userId: clientId,
        type: 'bid_received',
        title: 'New Bid Received',
        message: `${bidder[0]?.name || 'A freelancer'} placed a bid on your job`,
        relatedJobId: bidJobId,
        relatedUserId: bidderId,
        read: false,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({ notification: notification[0] }, { status: 201 });
  } catch (error) {
    console.error('Failed to create bid notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
