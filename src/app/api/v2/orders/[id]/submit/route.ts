import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs, managers, managerEarnings, jobAttachments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notifyClientWorkDelivered } from '@/lib/client-notifications';

// POST /api/v2/orders/[id]/submit - Freelancer submits completed work
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    const { freelancerId, note } = body;

    if (!freelancerId) {
      return NextResponse.json({ error: 'Freelancer ID is required' }, { status: 400 });
    }

    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check authorization
    if (order.assignedFreelancerId !== parseInt(freelancerId)) {
      return NextResponse.json({ 
        error: 'Not authorized to submit this order' 
      }, { status: 403 });
    }

    // Check if order can be submitted
    if (order.status !== 'assigned' && order.status !== 'in_progress' && order.status !== 'editing' && order.status !== 'revision') {
      return NextResponse.json({ 
        error: `Cannot submit order in status: ${order.status}` 
      }, { status: 400 });
    }

    // Ensure at least one attachment exists for this order (defensive FK null checks)
    const files = await db.select().from(jobAttachments).where(eq(jobAttachments.jobId, orderId));
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Must upload at least one file before submitting' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Wrap all related updates in a single transaction for consistency
    await db.transaction(async (tx) => {
      // Update order status -> delivered
      await tx.update(jobs)
        .set({
          status: 'delivered',
          updatedAt: now,
        })
        .where(eq(jobs.id, orderId));

      // Log status change
      await tx.insert(jobStatusLogs).values({
        jobId: orderId,
        oldStatus: order.status,
        newStatus: 'delivered',
        changedBy: parseInt(freelancerId),
        note: note || 'Freelancer submitted completed work',
        createdAt: now,
      });

      // Manager earnings on submission (if order has a manager)
      if (order.managerId) {
        const pages = order.pages || order.slides || 1;
        const submissionEarning = 10 + (5 * (pages - 1));

        // 1) Record earning
        await tx.insert(managerEarnings).values({
          managerId: order.managerId,
          jobId: orderId,
          earningType: 'submission',
          amount: submissionEarning,
          createdAt: now,
        });

        // 2) Update or create manager profile
        const [existingManager] = await tx.select().from(managers).where(eq(managers.userId, order.managerId));
        if (existingManager) {
          await tx.update(managers)
            .set({
              balance: (existingManager.balance || 0) + submissionEarning,
              totalEarnings: (existingManager.totalEarnings || 0) + submissionEarning,
              updatedAt: now,
            })
            .where(eq(managers.userId, order.managerId));
        } else {
          await tx.insert(managers).values({
            userId: order.managerId,
            phone: null,
            balance: submissionEarning,
            totalEarnings: submissionEarning,
            status: 'active',
            createdAt: now,
            updatedAt: now,
          });
        }

        // 3) Update job managerEarnings aggregate
        await tx.update(jobs)
          .set({
            managerEarnings: (order.managerEarnings || 0) + submissionEarning,
            updatedAt: now,
          })
          .where(eq(jobs.id, orderId));
      }
    });

    // ✅ Notify client about work delivery (outside transaction)
    if (order.clientId) {
      await notifyClientWorkDelivered(
        orderId,
        order.clientId,
        order.orderNumber
      );
    }

    // Get updated order
    const [updatedOrder] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    return NextResponse.json({ 
      order: updatedOrder,
      message: 'Work submitted successfully. Client will review and approve.'
    });
  } catch (error: any) {
    console.error('Error submitting order:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to submit order' 
    }, { status: 500 });
  }
}