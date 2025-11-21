import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs, users, writerBalances } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notifyClientOrderCompleted } from '@/lib/client-notifications';

// POST /api/v2/orders/[id]/complete - Admin marks order as completed
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    const { adminId } = body;

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }

    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order can be completed
    if (order.status !== 'paid' && order.status !== 'approved') {
      return NextResponse.json({ 
        error: `Cannot complete order in status: ${order.status}. Order must be paid first.` 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Update order status
    await db.update(jobs)
      .set({
        status: 'completed',
        updatedAt: now,
      })
      .where(eq(jobs.id, orderId));

    // Log status change
    await db.insert(jobStatusLogs).values({
      jobId: orderId,
      oldStatus: order.status,
      newStatus: 'completed',
      changedBy: parseInt(adminId),
      note: 'Order completed by admin',
      createdAt: now,
    });

    // ✅ Credit freelancer earnings
    if (order.assignedFreelancerId && order.freelancerEarnings) {
      const writerId = order.assignedFreelancerId;
      const earnings = Number(order.freelancerEarnings);

      // Update user balance
      const [writer] = await db.select().from(users).where(eq(users.id, writerId));
      
      if (writer) {
        await db.update(users)
          .set({
            balance: (writer.balance || 0) + earnings,
            earned: (writer.earned || 0) + earnings,
          })
          .where(eq(users.id, writerId));

        // Update writer_balances table
        const [writerBalance] = await db.select().from(writerBalances)
          .where(eq(writerBalances.writerId, writerId));

        if (writerBalance) {
          await db.update(writerBalances)
            .set({
              availableBalance: (writerBalance.availableBalance || 0) + earnings,
              totalEarned: (writerBalance.totalEarned || 0) + earnings,
              updatedAt: now,
            })
            .where(eq(writerBalances.writerId, writerId));
        } else {
          // Create writer balance record if it doesn't exist
          await db.insert(writerBalances).values({
            writerId: writerId,
            availableBalance: earnings,
            pendingBalance: 0,
            totalEarned: earnings,
            updatedAt: now,
          });
        }
      }
    }

    // ✅ Notify client about completion
    if (order.clientId) {
      await notifyClientOrderCompleted(
        orderId,
        order.clientId,
        order.orderNumber
      );
    }

    // Get updated order
    const [updatedOrder] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    return NextResponse.json({ 
      order: updatedOrder,
      message: 'Order completed successfully. Freelancer earnings credited.'
    });
  } catch (error: any) {
    console.error('Error completing order:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to complete order' 
    }, { status: 500 });
  }
}