import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contactMessages, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';

// GET: Fetch contact messages (for admin/manager only)
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('user_id');
    
    if (!userIdCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user role (admin or manager)
    const userId = parseInt(userIdCookie.value);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden - Admin or Manager access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const status = searchParams.get('status'); // 'pending', 'read', 'resolved'

    // Build query before executing (Drizzle fluent API)
    let query = db.select().from(contactMessages);

    if (status) {
      query = query.where(eq(contactMessages.status, status));
    }

    query = query.orderBy(desc(contactMessages.createdAt)).limit(limit).offset(offset);

    // Execute query only after building complete chain
    const results = await query;

    return NextResponse.json({ messages: results, count: results.length }, { status: 200 });
  } catch (error) {
    console.error('GET contact messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST: Create a new contact message (from chat widget)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderName, senderEmail, senderPhone, content, isGuest } = body;

    if (!senderName || typeof senderName !== 'string' || senderName.trim() === '') {
      return NextResponse.json(
        { error: 'Sender name is required' },
        { status: 400 }
      );
    }

    if (!senderEmail || typeof senderEmail !== 'string' || senderEmail.trim() === '') {
      return NextResponse.json(
        { error: 'Sender email is required' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const insertData = {
      senderName: senderName.trim(),
      senderEmail: senderEmail.trim(),
      senderPhone: senderPhone?.trim() || null,
      content: content.trim(),
      status: 'pending' as const,
      isGuest: isGuest ?? true,
      createdAt: new Date().toISOString(),
    };

    const [newMessage] = await db.insert(contactMessages).values(insertData).returning();

    return NextResponse.json({ 
      message: newMessage,
      success: true 
    }, { status: 201 });
  } catch (error) {
    console.error('POST contact message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH: Update contact message status (admin/manager only)
export async function PATCH(request: NextRequest) {
  try {
    // Authentication check
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('user_id');
    
    if (!userIdCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user role (admin or manager)
    const userId = parseInt(userIdCookie.value);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden - Admin or Manager access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid message ID is required' },
        { status: 400 }
      );
    }

    if (!status || !['pending', 'read', 'resolved'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (pending, read, resolved)' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
    };

    if (status === 'resolved') {
      updateData.resolvedBy = userId;
      updateData.resolvedAt = new Date().toISOString();
    }

    const [updated] = await db
      .update(contactMessages)
      .set(updateData)
      .where(eq(contactMessages.id, parseInt(id)))
      .returning();

    return NextResponse.json({ message: updated, success: true }, { status: 200 });
  } catch (error) {
    console.error('PATCH contact message error:', error);
    return NextResponse.json(
      { error: 'Failed to update message: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
