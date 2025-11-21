import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bids, jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bidId = parseInt(params.id);
    const { jobId } = await request.json();

    const bid = await db
      .select()
      .from(bids)
      .where(eq(bids.id, bidId))
      .limit(1);

    if (!bid[0]) {
      return NextResponse.json(
        { error: 'Bid not found' },
        { status: 404 }
      );
    }

    await db
      .update(bids)
      .set({ status: 'accepted' })
      .where(eq(bids.id, bidId));

    await db
      .update(jobs)
      .set({ assignedFreelancerId: bid[0].freelancerId })
      .where(eq(jobs.id, jobId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to accept bid:', error);
    return NextResponse.json(
      { error: 'Failed to accept bid' },
      { status: 500 }
    );
  }
}
