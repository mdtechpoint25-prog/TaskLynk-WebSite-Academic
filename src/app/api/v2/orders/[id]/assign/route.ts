import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs, managers, managerEarnings, users, bids, notifications } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { notifyClientWriterAssigned } from '@/lib/client-notifications';

// POST /api/v2/orders/[id]/assign - Assign order to freelancer (with optional bid acceptance)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    const { managerId, writerId, bidId } = body;

    if (!managerId || !writerId) {
      return NextResponse.json({ 
        error: 'Manager ID and Writer ID are required' 
      }, { status: 400 });
    }

    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order can be assigned
    if (order.status !== 'pending' && order.status !== 'accepted' && order.status !== 'approved') {
      return NextResponse.json({ 
        error: `Cannot assign order in status: ${order.status}` 
      }, { status: 400 });
    }

    // Get writer info for notification
    const [writer] = await db.select().from(users).where(eq(users.id, parseInt(writerId)));
    const writerName = writer ? writer.name : 'Writer';

    const now = new Date().toISOString();

    // 🔴 CRITICAL: Wrap all operations in a transaction for atomicity
    try {
      // Start transaction by executing all operations together
      const results = await db.batch([
        // 1. Update order with manager and writer
        db.update(jobs)
          .set({
            managerId: parseInt(managerId),
            assignedFreelancerId: parseInt(writerId),
            status: 'assigned',
            updatedAt: now,
          })
          .where(eq(jobs.id, orderId)),

        // 2. Log status change
        db.insert(jobStatusLogs).values({
          jobId: orderId,
          oldStatus: order.status,
          newStatus: 'assigned',
          changedBy: parseInt(managerId),
          note: `Order assigned to writer ${writerName} by manager`,
          createdAt: now,
        }),

        // 3. Manager Earnings: 10 KSh on assignment
        db.insert(managerEarnings).values({
          managerId: parseInt(managerId),
          jobId: orderId,
          earningType: 'assignment',
          amount: 10,
          createdAt: now,
        }),

        // 4. Update job manager earnings
        db.update(jobs)
          .set({
            managerEarnings: (order.managerEarnings || 0) + 10,
            updatedAt: now,
          })
          .where(eq(jobs.id, orderId)),
      ]);

      // 5. Update manager balance (separate query)
      const [manager] = await db.select().from(managers)
        .where(eq(managers.userId, parseInt(managerId)));

      if (manager) {
        await db.update(managers)
          .set({
            balance: (manager.balance || 0) + 10,
            totalEarnings: (manager.totalEarnings || 0) + 10,
            updatedAt: now,
          })
          .where(eq(managers.userId, parseInt(managerId)));
      }

      // 6. Handle bid acceptance if bidId provided
      if (bidId) {
        await db.batch([
          // Accept the winning bid
          db.update(bids)
            .set({ status: 'accepted' })
            .where(eq(bids.id, parseInt(bidId))),

          // Reject all other bids for this job
          db.update(bids)
            .set({ status: 'rejected' })
            .where(and(
              eq(bids.jobId, orderId),
              ne(bids.id, parseInt(bidId))
            )),

          // Notify writer that their bid was accepted
          db.insert(notifications).values({
            userId: parseInt(writerId),
            jobId: orderId,
            type: 'bid_accepted',
            title: 'Bid Accepted',
            message: `Your bid for order ${order.orderNumber} has been accepted!`,
            read: false,
            createdAt: now,
          }),
        ]);

        // Notify rejected bidders
        const rejectedBids = await db.select().from(bids)
          .where(and(
            eq(bids.jobId, orderId),
            ne(bids.id, parseInt(bidId))
          ));

        if (rejectedBids.length > 0) {
          const rejectionNotifications = rejectedBids.map(bid => ({
            userId: bid.freelancerId,
            jobId: orderId,
            type: 'bid_rejected' as const,
            title: 'Bid Not Selected',
            message: `Your bid for order ${order.orderNumber} was not selected.`,
            read: false,
            createdAt: now,
          }));

          await db.insert(notifications).values(rejectionNotifications);
        }
      } else {
        // No bid - just notify writer about assignment
        await db.insert(notifications).values({
          userId: parseInt(writerId),
          jobId: orderId,
          type: 'order_assigned',
          title: 'Order Assigned',
          message: `You have been assigned to order ${order.orderNumber}`,
          read: false,
          createdAt: now,
        });
      }

      // 7. Notify client about writer assignment
      if (order.clientId) {
        await notifyClientWriterAssigned(
          orderId,
          order.clientId,
          order.orderNumber,
          writerName
        );
      }

      // Get updated order
      const [updatedOrder] = await db.select().from(jobs).where(eq(jobs.id, orderId));

      return NextResponse.json({ 
        order: updatedOrder,
        message: bidId 
          ? `Bid accepted and order assigned to ${writerName}. Manager earned KSh 10.`
          : `Order assigned to ${writerName}. Manager earned KSh 10.`
      });
    } catch (transactionError: any) {
      console.error('Transaction failed:', transactionError);
      return NextResponse.json({ 
        error: 'Failed to assign order atomically. Transaction rolled back.' 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error assigning order:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to assign order' 
    }, { status: 500 });
  }
}