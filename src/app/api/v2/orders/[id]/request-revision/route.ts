import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/v2/orders/[id]/request-revision - Client requests revision
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    const { clientId, revisionNotes } = body;

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
      return NextResponse.json({ error: 'Not authorized to request revision for this order' }, { status: 403 });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return NextResponse.json({ 
        error: `Cannot request revision for order in status: ${order.status}` 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Update order to revision status
    await db.update(jobs)
      .set({
        status: 'revisions',
        revisionRequested: true,
        revisionNotes: revisionNotes || 'Client requested revisions',
        updatedAt: now,
      })
      .where(eq(jobs.id, orderId));

    // Log to history
    await db.insert(jobStatusLogs).values({
      jobId: orderId,
      oldStatus: order.status,
      newStatus: 'revisions',
      changedBy: parseInt(clientId),
      note: `Client requested revisions: ${revisionNotes || 'No specific notes'}`,
      createdAt: now,
    });

    // Get updated order
    const [updatedOrder] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    return NextResponse.json({ 
      order: updatedOrder,
      message: 'Revision requested successfully. Order sent back to writer.'
    });
  } catch (error: any) {
    console.error('Error requesting revision:', error);
    return NextResponse.json({ error: error.message || 'Failed to request revision' }, { status: 500 });
  }
}
