import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bids, jobs, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing clientId' },
        { status: 400 }
      );
    }

    const clientJobs = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(eq(jobs.clientId, parseInt(clientId)));

    const jobIds = clientJobs.map((j) => j.id);

    if (jobIds.length === 0) {
      return NextResponse.json({ bids: [] });
    }

    const allBids = await db
      .select()
      .from(bids)
      .where(
        bids.jobId.inArray(jobIds)
      );

    const bidDetails = await Promise.all(
      allBids.map(async (bid) => {
        const freelancer = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, bid.freelancerId))
          .limit(1);

        const job = await db
          .select({ title: jobs.title })
          .from(jobs)
          .where(eq(jobs.id, bid.jobId))
          .limit(1);

        return {
          id: bid.id,
          jobId: bid.jobId,
          jobTitle: job[0]?.title || 'Unknown',
          freelancerId: bid.freelancerId,
          freelancerName: freelancer[0]?.name || 'Unknown',
          bidAmount: bid.bidAmount,
          message: bid.message || '',
          status: bid.status || 'pending',
          createdAt: bid.createdAt,
        };
      })
    );

    return NextResponse.json({ bids: bidDetails });
  } catch (error) {
    console.error('Failed to fetch bids:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
}
