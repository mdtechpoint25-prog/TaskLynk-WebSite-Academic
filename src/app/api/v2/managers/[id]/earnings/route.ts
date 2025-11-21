import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { managerEarnings, jobs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/v2/managers/[id]/earnings - Get detailed earnings history by order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const managerId = parseInt(id);

    // Get all earnings records for this manager
    const earningsRecords = await db
      .select({
        id: managerEarnings.id,
        jobId: managerEarnings.jobId,
        earningType: managerEarnings.earningType,
        amount: managerEarnings.amount,
        createdAt: managerEarnings.createdAt,
        orderNumber: jobs.orderNumber,
        orderTitle: jobs.title,
        orderStatus: jobs.status,
      })
      .from(managerEarnings)
      .leftJoin(jobs, eq(managerEarnings.jobId, jobs.id))
      .where(eq(managerEarnings.managerId, managerId))
      .orderBy(desc(managerEarnings.createdAt));

    // Calculate totals by type
    const totals = {
      assignment: 0,
      submission: 0,
      completion: 0,
      total: 0
    };

    earningsRecords.forEach(record => {
      const amount = record.amount || 0;
      totals.total += amount;
      
      if (record.earningType === 'assignment') {
        totals.assignment += amount;
      } else if (record.earningType === 'submission') {
        totals.submission += amount;
      } else if (record.earningType === 'completion') {
        totals.completion += amount;
      }
    });

    return NextResponse.json({ 
      earnings: earningsRecords,
      totals,
      count: earningsRecords.length
    });
  } catch (error: any) {
    console.error('Error fetching manager earnings:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch manager earnings' 
    }, { status: 500 });
  }
}
