import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobMessages, jobs, conversations } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

// GET /api/v2/messages - Get messages for an order or between users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const userId = searchParams.get('userId');
    const conversationId = searchParams.get('conversationId');

    if (!orderId && !userId && !conversationId) {
      return NextResponse.json({ error: 'Order ID, User ID, or Conversation ID required' }, { status: 400 });
    }

    let messagesList;

    if (conversationId) {
      // 🔒 FIX #25: Validate participant before fetching messages
      const [conversation] = await db.select().from(conversations)
        .where(eq(conversations.id, parseInt(conversationId)))
        .limit(1);

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // Validate requesting user is a participant
      const requestingUserId = searchParams.get('requestingUserId');
      if (requestingUserId) {
        const uid = parseInt(requestingUserId);
        if (uid !== conversation.participant1Id && uid !== conversation.participant2Id) {
          return NextResponse.json(
            { error: 'You are not a participant in this conversation' },
            { status: 403 }
          );
        }
      }

      // Get messages for this conversation
      messagesList = await db.select().from(jobMessages)
        .where(eq(jobMessages.jobId, conversation.jobId!))
        .orderBy(jobMessages.createdAt);
    } else if (orderId) {
      // Get all messages for an order
      messagesList = await db.select().from(jobMessages)
        .where(eq(jobMessages.jobId, parseInt(orderId)))
        .orderBy(jobMessages.createdAt);
    } else if (userId) {
      // Get all messages for a user (sent or received)
      messagesList = await db.select().from(jobMessages)
        .where(eq(jobMessages.senderId, parseInt(userId!)))
        .orderBy(jobMessages.createdAt);
    }

    // Filter only approved messages for non-admin users
    const role = searchParams.get('role');
    if (role !== 'admin') {
      messagesList = messagesList?.filter(msg => msg.adminApproved === true);
    }

    return NextResponse.json({ messages: messagesList });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/v2/messages - Send a message (pending approval)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, conversationId, senderId, message: messageText } = body;

    if ((!orderId && !conversationId) || !senderId || !messageText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let targetJobId: number;

    if (conversationId) {
      // 🔒 FIX #25: Validate sender is a participant
      const [conversation] = await db.select().from(conversations)
        .where(eq(conversations.id, parseInt(conversationId)))
        .limit(1);

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // Validate sender is a participant
      if (senderId !== conversation.participant1Id && senderId !== conversation.participant2Id) {
        return NextResponse.json(
          { error: 'You are not a participant in this conversation' },
          { status: 403 }
        );
      }

      targetJobId = conversation.jobId!;
    } else {
      targetJobId = parseInt(orderId);
      
      // Verify order exists
      const [order] = await db.select().from(jobs).where(eq(jobs.id, targetJobId)).limit(1);

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
    }

    // Create message (pending approval)
    const now = new Date().toISOString();
    const [newMessage] = await db.insert(jobMessages).values({
      jobId: targetJobId,
      senderId: parseInt(senderId),
      message: messageText,
      messageType: 'text',
      adminApproved: false,
      createdAt: now,
    }).returning();

    return NextResponse.json({ 
      message: newMessage,
      info: 'Message sent and pending admin approval'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 });
  }
}