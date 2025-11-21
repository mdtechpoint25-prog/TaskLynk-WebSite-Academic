import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payoutRequests, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payoutId = parseInt(params.id);
    const body = await request.json();
    const { adminId, rejectionReason } = body;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    if (!rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get payout request
    const [payout] = await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.id, payoutId))
      .limit(1);

    if (!payout) {
      return NextResponse.json(
        { error: 'Payout request not found' },
        { status: 404 }
      );
    }

    if (payout.status !== 'pending') {
      return NextResponse.json(
        { error: `Payout request is already ${payout.status}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update payout request status
    const [updatedPayout] = await db
      .update(payoutRequests)
      .set({
        status: 'rejected',
        processedAt: now,
        processedBy: adminId,
        rejectionReason,
        updatedAt: now,
      })
      .where(eq(payoutRequests.id, payoutId))
      .returning();

    // Create notification for writer
    await db.insert(notifications).values({
      userId: payout.writerId,
      type: 'payout_rejected',
      title: 'Payout Request Rejected',
      message: `Your payout request for KSh ${payout.amount.toFixed(2)} has been rejected. Reason: ${rejectionReason}`,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      payoutRequest: updatedPayout,
      message: 'Payout request rejected',
    });
  } catch (error) {
    console.error('Error rejecting payout request:', error);
    return NextResponse.json(
      { error: 'Failed to reject payout request' },
      { status: 500 }
    );
  }
}
