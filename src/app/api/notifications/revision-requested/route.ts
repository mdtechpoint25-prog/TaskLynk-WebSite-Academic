import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const { writerId, jobId, jobTitle, reason } = await request.json();

    if (!writerId || !jobId || !jobTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const notification = await db
      .insert(notifications)
      .values({
        userId: writerId,
        type: 'revision_requested',
        title: 'Revision Requested',
        message: `Revision requested for: ${jobTitle}${reason ? `. Reason: ${reason}` : ''}`,
        relatedJobId: jobId,
        read: false,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({ notification: notification[0] }, { status: 201 });
  } catch (error) {
    console.error('Failed to create revision notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
