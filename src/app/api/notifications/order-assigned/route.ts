import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { freelancerId, jobId, jobTitle } = await request.json();

    if (!freelancerId || !jobId || !jobTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const notification = await db
      .insert(notifications)
      .values({
        userId: freelancerId,
        type: 'order_assigned',
        title: 'Order Assigned',
        message: `You have been assigned to: ${jobTitle}`,
        relatedJobId: jobId,
        read: false,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({ notification: notification[0] }, { status: 201 });
  } catch (error) {
    console.error('Failed to create order assignment notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
