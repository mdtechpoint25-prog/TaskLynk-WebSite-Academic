import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 🗂️ FIX #18: Conversation Archiving Logic
 * Archive a conversation to hide it from the main inbox
 */

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const conversationId = parseInt(params.id);

    if (isNaN(conversationId)) {
      return NextResponse.json(
        { error: 'Valid conversation ID is required' },
        { status: 400 }
      );
    }

    // Get conversation
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Archive conversation
    const now = new Date().toISOString();
    const [updated] = await db
      .update(conversations)
      .set({
        isArchived: true,
        archivedAt: now,
        updatedAt: now,
      })
      .where(eq(conversations.id, conversationId))
      .returning();

    return NextResponse.json({
      message: 'Conversation archived successfully',
      conversation: updated,
    });
  } catch (error: any) {
    console.error('Error archiving conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to archive conversation' },
      { status: 500 }
    );
  }
}
