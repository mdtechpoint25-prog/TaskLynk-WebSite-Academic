import { NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { calculateWriterEarnings } from '@/lib/payment-calculations';

// Recalculate all freelancers' balances based on completed and payment-confirmed jobs
// New CPP model: writer earnings = pages*CPP(200|230) + slides*100
export async function POST() {
  try {
    // Get all freelancers
    const freelancers = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'freelancer'));

    let updated = 0;
    const details: { freelancerId: number; newBalance: number; jobCount: number; totalClientAmount: number }[] = [];

    for (const f of freelancers) {
      // Fetch qualifying jobs for each freelancer
      const rows = await db
        .select()
        .from(jobs)
        .where(and(
          eq(jobs.assignedFreelancerId, f.id),
          eq(jobs.status, 'completed'),
          eq(jobs.paymentConfirmed, true)
        ));

      // Sum writer earnings using CPP model
      let sumWriter = 0;
      let count = 0;
      let sumClient = 0;
      for (const row of rows as any[]) {
        const writerAmt = calculateWriterEarnings(row.pages ?? 0, row.slides ?? 0, row.workType ?? '');
        sumWriter += writerAmt;
        sumClient += Number(row.amount || 0);
        count += 1;
      }

      // Update user's balance to match computed balance
      await db.update(users)
        .set({ balance: sumWriter, updatedAt: new Date().toISOString() })
        .where(eq(users.id, f.id));

      updated++;
      details.push({ freelancerId: f.id, newBalance: sumWriter, jobCount: count, totalClientAmount: sumClient });
    }

    return NextResponse.json({
      updated,
      details
    });
  } catch (error) {
    console.error('Recalculate balances cron error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function GET() {
  // Allow GET for manual trigger/monitoring in dev
  return POST();
}