import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bids, jobs, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { broadcastNotification } from '@/lib/notifications-bus';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bidId = parseInt(params.id);

    // Get the bid first
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

    // Use jobId from the bid, not from request (security fix)
    const jobId = bid[0].jobId;

    // Get the job
    const job = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job[0]) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Accept this bid
    await db
      .update(bids)
      .set({ status: 'accepted', updatedAt: new Date().toISOString() })
      .where(eq(bids.id, bidId));

    // Reject other pending bids for this job
    await db
      .update(bids)
      .set({ status: 'rejected', updatedAt: new Date().toISOString() })
      .where(and(
        eq(bids.jobId, jobId),
        eq(bids.status, 'pending')
      ));

    // Assign freelancer to job and update status
    await db
      .update(jobs)
      .set({ 
        assignedFreelancerId: bid[0].freelancerId,
        status: 'assigned',
        updatedAt: new Date().toISOString()
      })
      .where(eq(jobs.id, jobId));

    // Create notification for freelancer
    const notification = {
      userId: bid[0].freelancerId,
      jobId: jobId,
      type: 'order_assigned',
      title: 'Bid Accepted!',
      message: `Your bid of $${bid[0].amount} for "${job[0].title}" has been accepted. You can start working on this order.`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    
    await db.insert(notifications).values(notification);

    // Broadcast real-time notification via centralized bus
    broadcastNotification(bid[0].freelancerId, notification);

    return NextResponse.json({ success: true, message: 'Bid accepted and freelancer assigned' });
  } catch (error) {
    console.error('Failed to accept bid:', error);
    return NextResponse.json(
      { error: 'Failed to accept bid' },
      { status: 500 }
    );
  }
}
