import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, payments } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const managerId = request.nextUrl.searchParams.get('managerId');

    if (!managerId) {
      return NextResponse.json(
        { error: 'Missing managerId' },
        { status: 400 }
      );
    }

    const managerJobs = await db
      .select({ id: jobs.id, clientTotal: jobs.clientTotal })
      .from(jobs)
      .where(eq(jobs.managerId, parseInt(managerId)));

    const jobIds = managerJobs.map((j) => j.id);

    let totalRevenue = 0;
    let writerPayouts = 0;
    let completedOrders = 0;

    if (jobIds.length > 0) {
      const jobPayments = await db
        .select()
        .from(payments)
        .where(
          payments.jobId.inArray(jobIds)
        );

      for (const payment of jobPayments) {
        const amount = parseFloat(payment.amount as string);
        if (payment.paymentType === 'client_payment') {
          totalRevenue += amount;
        } else if (payment.paymentType === 'writer_payout') {
          writerPayouts += amount;
        }

        if (payment.paymentStatus === 'completed' || payment.paymentStatus === 'paid') {
          completedOrders += 1;
        }
      }
    }

    const totalCommission = totalRevenue - writerPayouts;

    const monthlyData = [
      { month: 'Jan', revenue: totalRevenue * 0.3, commissions: totalCommission * 0.3 },
      { month: 'Feb', revenue: totalRevenue * 0.4, commissions: totalCommission * 0.4 },
      { month: 'Mar', revenue: totalRevenue, commissions: totalCommission },
    ];

    return NextResponse.json({
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalCommission: parseFloat(totalCommission.toFixed(2)),
      writerPayouts: parseFloat(writerPayouts.toFixed(2)),
      completedOrders,
      monthlyData,
    });
  } catch (error) {
    console.error('Failed to fetch revenue data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}
