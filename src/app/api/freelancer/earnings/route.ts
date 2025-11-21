import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments, jobs, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Get user's payments
    const userPayments = await db
      .select({
        id: payments.id,
        jobId: payments.jobId,
        amount: payments.amount,
        status: payments.paymentStatus,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(eq(payments.recipientId, parseInt(userId)));

    let totalEarned = 0;
    let pendingAmount = 0;
    let completedJobs = 0;

    const earnings = await Promise.all(
      userPayments.map(async (payment) => {
        const job = await db
          .select({ title: jobs.title })
          .from(jobs)
          .where(eq(jobs.id, payment.jobId))
          .limit(1);

        const amount = parseFloat(payment.amount as string);
        
        if (payment.status === 'completed' || payment.status === 'paid') {
          totalEarned += amount;
          completedJobs += 1;
        } else if (payment.status === 'pending') {
          pendingAmount += amount;
        }

        return {
          id: payment.id,
          jobId: payment.jobId,
          jobTitle: job[0]?.title || 'Unknown Job',
          amount,
          status: payment.status || 'pending',
          completedAt: payment.createdAt,
          createdAt: payment.createdAt,
        };
      })
    );

    return NextResponse.json({
      earnings: earnings.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      totalEarned: totalEarned.toFixed(2),
      pendingAmount: pendingAmount.toFixed(2),
      completedJobs,
    });
  } catch (error) {
    console.error('Failed to fetch earnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}
