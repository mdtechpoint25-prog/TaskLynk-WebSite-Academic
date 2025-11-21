import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/v2/orders/[id]/deliver - Manager delivers order to client
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    const { managerId } = body;

    if (!managerId) {
      return NextResponse.json({ error: 'Manager ID is required' }, { status: 400 });
    }

    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if manager is assigned to this order
    if (order.managerId !== parseInt(managerId)) {
      return NextResponse.json({ error: 'Manager not assigned to this order' }, { status: 403 });
    }

    // Check if order is in correct status (editing or submitted)
    if (order.status !== 'editing' && order.status !== 'submitted') {
      return NextResponse.json({ 
        error: `Cannot deliver order in status: ${order.status}` 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Update order to delivered status
    await db.update(jobs)
      .set({
        status: 'delivered',
        updatedAt: now,
      })
      .where(eq(jobs.id, orderId));

    // Log to history
    await db.insert(jobStatusLogs).values({
      jobId: orderId,
      oldStatus: order.status,
      newStatus: 'delivered',
      changedBy: parseInt(managerId),
      note: 'Manager delivered order to client for review',
      createdAt: now,
    });

    // Get updated order
    const [updatedOrder] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    return NextResponse.json({ 
      order: updatedOrder,
      message: 'Order delivered successfully. Awaiting client approval.'
    });
  } catch (error: any) {
    console.error('Error delivering order:', error);
    return NextResponse.json({ error: error.message || 'Failed to deliver order' }, { status: 500 });
  }
}
