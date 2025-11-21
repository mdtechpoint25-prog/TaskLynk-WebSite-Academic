import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/v2/orders/[id]/accept - Manager claims/accepts an order from their assigned clients
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
      return NextResponse.json({ 
        error: 'Manager ID is required' 
      }, { status: 400 });
    }

    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order can be accepted
    if (order.status !== 'pending' && order.status !== 'approved') {
      return NextResponse.json({ 
        error: `Cannot accept order in status: ${order.status}` 
      }, { status: 400 });
    }

    // Check if manager is already assigned
    if (order.managerId && order.managerId !== parseInt(managerId)) {
      return NextResponse.json({ 
        error: 'Order is already accepted by another manager' 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Update order status to 'accepted' and assign manager
    await db.batch([
      db.update(jobs)
        .set({
          managerId: parseInt(managerId),
          status: 'accepted',
          updatedAt: now,
        })
        .where(eq(jobs.id, orderId)),

      // Log status change
      db.insert(jobStatusLogs).values({
        jobId: orderId,
        oldStatus: order.status,
        newStatus: 'accepted',
        changedBy: parseInt(managerId),
        note: 'Order accepted by manager',
        createdAt: now,
      }),

      // Notify client that manager accepted their order
      db.insert(notifications).values({
        userId: order.clientId,
        jobId: orderId,
        type: 'order_accepted',
        title: 'Order Accepted',
        message: `Your order ${order.orderNumber} has been accepted by a manager and will be assigned to a writer soon.`,
        read: false,
        createdAt: now,
      }),
    ]);

    // Get updated order
    const [updatedOrder] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    return NextResponse.json({ 
      order: updatedOrder,
      message: 'Order accepted successfully'
    });
  } catch (error: any) {
    console.error('Error accepting order:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to accept order' 
    }, { status: 500 });
  }
}
