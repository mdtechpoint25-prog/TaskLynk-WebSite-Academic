import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobStatusLogs, users, payments, writerBalances, managers, managerEarnings } from '@/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/v2/orders/[id]/payment - Confirm payment and distribute balances
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    const body = await request.json();
    const { adminId, transactionId, paymentMethod, phoneNumber } = body;

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }

    // Get order
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order is approved
    if (order.status !== 'approved') {
      return NextResponse.json({ 
        error: `Cannot process payment for order in status: ${order.status}. Order must be approved first.` 
      }, { status: 400 });
    }

    // Check if already paid
    if (order.paymentConfirmed) {
      return NextResponse.json({ error: 'Order already paid' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Calculate balances to distribute
    const writerAmount = order.freelancerEarnings || 0;
    const managerAmount = order.managerEarnings || 0;
    const platformFee = (order.amount || 0) - writerAmount - managerAmount;

    // 1. Update writer balance
    if (order.assignedFreelancerId) {
      const [writer] = await db.select().from(users).where(eq(users.id, order.assignedFreelancerId));
      
      if (writer) {
        await db.update(users)
          .set({
            balance: (writer.balance || 0) + writerAmount,
            earned: (writer.earned || 0) + writerAmount,
            totalEarnings: (writer.totalEarnings || 0) + writerAmount,
            totalEarned: (writer.totalEarned || 0) + writerAmount,
            completedJobs: (writer.completedJobs || 0) + 1,
            completedOrders: (writer.completedOrders || 0) + 1,
          })
          .where(eq(users.id, order.assignedFreelancerId));

        // Update writer_balances table
        const [writerBal] = await db.select().from(writerBalances)
          .where(eq(writerBalances.writerId, order.assignedFreelancerId));
        
        if (writerBal) {
          await db.update(writerBalances)
            .set({
              availableBalance: (writerBal.availableBalance || 0) + writerAmount,
              totalEarned: (writerBal.totalEarned || 0) + writerAmount,
              updatedAt: now,
            })
            .where(eq(writerBalances.writerId, order.assignedFreelancerId));
        } else {
          // Create writer balance record
          await db.insert(writerBalances).values({
            writerId: order.assignedFreelancerId,
            availableBalance: writerAmount,
            pendingBalance: 0,
            totalEarned: writerAmount,
            updatedAt: now,
          });
        }
      }
    }

    // 2. Update manager balance
    if (order.managerId) {
      const [manager] = await db.select().from(users).where(eq(users.id, order.managerId));
      
      if (manager) {
        await db.update(users)
          .set({
            balance: (manager.balance || 0) + managerAmount,
            earned: (manager.earned || 0) + managerAmount,
            totalEarnings: (manager.totalEarnings || 0) + managerAmount,
            totalEarned: (manager.totalEarned || 0) + managerAmount,
          })
          .where(eq(users.id, order.managerId));

        // Update manager profile
        const [mgrProfile] = await db.select().from(managers)
          .where(eq(managers.userId, order.managerId));
        
        if (mgrProfile) {
          await db.update(managers)
            .set({
              balance: (mgrProfile.balance || 0) + managerAmount,
              totalEarnings: (mgrProfile.totalEarnings || 0) + managerAmount,
              updatedAt: now,
            })
            .where(eq(managers.userId, order.managerId));
        }
      }
    }

    // 3. Update order status to paid
    await db.update(jobs)
      .set({
        status: 'paid',
        paymentConfirmed: true,
        paidOrderConfirmedAt: now,
        updatedAt: now,
      })
      .where(eq(jobs.id, orderId));

    // 4. Create/update payment record
    const [existingPayment] = await db.select().from(payments)
      .where(eq(payments.jobId, orderId));

    if (existingPayment) {
      await db.update(payments)
        .set({
          status: 'confirmed',
          confirmedByAdmin: true,
          confirmedAt: now,
          mpesaCode: transactionId || null,
          updatedAt: now,
        })
        .where(eq(payments.jobId, orderId));
    } else {
      await db.insert(payments).values({
        jobId: orderId,
        clientId: order.clientId,
        freelancerId: order.assignedFreelancerId || null,
        amount: order.amount || 0,
        paymentMethod: paymentMethod || 'mpesa',
        status: 'confirmed',
        mpesaCode: transactionId || null,
        phoneNumber: phoneNumber || null,
        confirmedByAdmin: true,
        confirmedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 5. Log to history
    await db.insert(jobStatusLogs).values({
      jobId: orderId,
      oldStatus: order.status,
      newStatus: 'paid',
      changedBy: parseInt(adminId),
      note: `Payment confirmed. Writer: KSh ${writerAmount}, Manager: KSh ${managerAmount}, Platform: KSh ${platformFee}`,
      createdAt: now,
    });

    // Get updated order
    const [updatedOrder] = await db.select().from(jobs).where(eq(jobs.id, orderId));

    return NextResponse.json({ 
      order: updatedOrder,
      message: 'Payment confirmed and balances distributed successfully.',
      distribution: {
        writer: writerAmount,
        manager: managerAmount,
        platform: platformFee,
        total: order.amount || 0,
      }
    });
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ error: error.message || 'Failed to process payment' }, { status: 500 });
  }
}