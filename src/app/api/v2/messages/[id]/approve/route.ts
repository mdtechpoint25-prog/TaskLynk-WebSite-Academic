import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobMessages } from '@/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/v2/messages/[id]/approve - Approve a message and mark as delivered
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messageId = parseInt(id);

    if (isNaN(messageId)) {
      return NextResponse.json({ error: 'Invalid message ID' }, { status: 400 });
    }

    // Get message
    const [message] = await db.select().from(jobMessages).where(eq(jobMessages.id, messageId));

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Update message to admin approved
    const now = new Date().toISOString();
    await db.update(jobMessages)
      .set({ 
        adminApproved: true,
      })
      .where(eq(jobMessages.id, messageId));

    const [updatedMessage] = await db.select().from(jobMessages).where(eq(jobMessages.id, messageId));

    return NextResponse.json({ 
      message: updatedMessage,
      info: 'Message approved and delivered to recipient'
    });
  } catch (error: any) {
    console.error('Error approving message:', error);
    return NextResponse.json({ error: error.message || 'Failed to approve message' }, { status: 500 });
  }
}