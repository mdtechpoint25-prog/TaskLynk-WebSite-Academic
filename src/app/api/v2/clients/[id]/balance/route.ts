import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, payments, jobs } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// GET /api/v2/clients/[id]/balance - Get client balance and transaction history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clientId = parseInt(id);

    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, clientId));

    if (!user) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (user.role !== 'client' && user.role !== 'account_owner') {
      return NextResponse.json({ error: 'User is not a client' }, { status: 400 });
    }

    // Get payment history
    const paymentHistory = await db.select({
      id: payments.id,
      jobId: payments.jobId,
      amount: payments.amount,
      status: payments.status,
      paymentMethod: payments.paymentMethod,
      transactionRef: payments.transactionRef,
      confirmedByAdmin: payments.confirmedByAdmin,
      confirmedAt: payments.confirmedAt,
      createdAt: payments.createdAt,
      orderNumber: jobs.orderNumber,
      orderTitle: jobs.title,
    })
    .from(payments)
    .leftJoin(jobs, eq(payments.jobId, jobs.id))
    .where(eq(payments.clientId, clientId))
    .orderBy(sql`${payments.createdAt} DESC`);

    // Calculate totals
    const totalPaid = paymentHistory
      .filter(p => p.status === 'confirmed' || p.confirmedByAdmin)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const pendingPayments = paymentHistory
      .filter(p => p.status === 'pending' && !p.confirmedByAdmin)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // Get order statistics
    const [orderStats] = await db.select({
      total: sql<number>`COUNT(*)`,
      pending: sql<number>`SUM(CASE WHEN ${jobs.status} = 'pending' THEN 1 ELSE 0 END)`,
      inProgress: sql<number>`SUM(CASE WHEN ${jobs.status} IN ('accepted', 'assigned', 'editing', 'in_progress') THEN 1 ELSE 0 END)`,
      delivered: sql<number>`SUM(CASE WHEN ${jobs.status} = 'delivered' THEN 1 ELSE 0 END)`,
      completed: sql<number>`SUM(CASE WHEN ${jobs.status} = 'completed' THEN 1 ELSE 0 END)`,
      cancelled: sql<number>`SUM(CASE WHEN ${jobs.status} = 'cancelled' THEN 1 ELSE 0 END)`,
    })
    .from(jobs)
    .where(eq(jobs.clientId, clientId));

    return NextResponse.json({
      success: true,
      balance: {
        current: user.balance || 0,
        totalPaid,
        pendingPayments,
      },
      orders: {
        total: Number(orderStats?.total || 0),
        pending: Number(orderStats?.pending || 0),
        inProgress: Number(orderStats?.inProgress || 0),
        delivered: Number(orderStats?.delivered || 0),
        completed: Number(orderStats?.completed || 0),
        cancelled: Number(orderStats?.cancelled || 0),
      },
      transactions: paymentHistory.map(payment => ({
        id: payment.id,
        orderId: payment.jobId,
        orderNumber: payment.orderNumber,
        orderTitle: payment.orderTitle,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        transactionRef: payment.transactionRef,
        confirmed: payment.confirmedByAdmin,
        confirmedAt: payment.confirmedAt,
        paidAt: payment.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching client balance:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch balance' 
    }, { status: 500 });
  }
}
