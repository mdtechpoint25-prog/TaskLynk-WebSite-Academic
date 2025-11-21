import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const managerId = parseInt(id);
    if (isNaN(managerId)) {
      return NextResponse.json(
        { error: 'Invalid manager ID' },
        { status: 400 }
      );
    }

    // Verify manager exists and is a manager
    const manager = await db.select()
      .from(users)
      .where(eq(users.id, managerId))
      .limit(1);

    if (manager.length === 0 || manager[0].role !== 'manager') {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { clientIds = [], writerIds = [] } = body;

    // Validate input
    if (!Array.isArray(clientIds) || !Array.isArray(writerIds)) {
      return NextResponse.json(
        { error: 'clientIds and writerIds must be arrays' },
        { status: 400 }
      );
    }

    // Remove all previous assignments for this manager
    await db.update(users)
      .set({ assignedManagerId: null, updatedAt: new Date().toISOString() })
      .where(eq(users.assignedManagerId, managerId));

    // Assign selected clients to this manager
    if (clientIds.length > 0) {
      await db.update(users)
        .set({ assignedManagerId: managerId, updatedAt: new Date().toISOString() })
        .where(inArray(users.id, clientIds));
    }

    // Assign selected writers to this manager
    if (writerIds.length > 0) {
      await db.update(users)
        .set({ assignedManagerId: managerId, updatedAt: new Date().toISOString() })
        .where(inArray(users.id, writerIds));
    }

    return NextResponse.json({
      success: true,
      assignedClients: clientIds.length,
      assignedWriters: writerIds.length
    }, { status: 200 });

  } catch (error) {
    console.error('Assign users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
