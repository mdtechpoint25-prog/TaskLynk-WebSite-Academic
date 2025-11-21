import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/v2/orders/[id]/approve - Client approves order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if client owns this order
    if (order.clientId !== parseInt(clientId)) {
      return NextResponse.json({ error: 'Not authorized to approve this order' }, { status: 403 });
    }

    // Check if order is submitted/delivered
    if (order.status !== 'submitted' && order.status !== 'delivered') {
      return NextResponse.json({ 
        error: `Cannot approve order in status: ${order.status}` 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Update order
    await db.update(jobs)
      .set({
        status: 'approved',
        clientApproved: true,
        approvedByClientAt: now,
        updatedAt: now,
      })
      .where(eq(jobs.id, orderId));

    // Log to history
    await db.insert(jobStatusLogs).values({
      jobId: orderId,
      oldStatus: order.status,
      newStatus: 'approved',
      changedBy: parseInt(clientId),
      note: 'Client approved the order',
      createdAt: now,
    });

    // Get updated order
    const [updatedOrder] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    return NextResponse.json({ 
      order: updatedOrder,
      message: 'Order approved successfully. Please proceed with payment.'
    });
  } catch (error: any) {
    console.error('Error approving order:', error);
    return NextResponse.json({ error: error.message || 'Failed to approve order' }, { status: 500 });
  }
}