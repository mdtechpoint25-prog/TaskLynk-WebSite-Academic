import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payoutRequests, writerBalances, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdminRole } from '@/lib/admin-auth';
import { logAdminActionWithRequest, AdminActions, AuditTargetTypes } from '@/lib/admin-audit';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔒 SECURITY: Require admin role
    const authCheck = await requireAdminRole(request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const adminUser = authCheck.user!;
    const payoutId = parseInt(params.id);
    const body = await request.json();
    const { adminId } = body;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
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

    // Check writer's balance again
    const [balance] = await db
      .select()
      .from(writerBalances)
      .where(eq(writerBalances.writerId, payout.writerId))
      .limit(1);

    if (!balance) {
      return NextResponse.json(
        { error: 'Writer balance not found' },
        { status: 404 }
      );
    }

    if (balance.availableBalance < payout.amount) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: KSh ${balance.availableBalance.toFixed(2)}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Deduct from available balance
    await db
      .update(writerBalances)
      .set({
        availableBalance: balance.availableBalance - payout.amount,
        updatedAt: now,
      })
      .where(eq(writerBalances.writerId, payout.writerId));

    // Update payout request status
    const [updatedPayout] = await db
      .update(payoutRequests)
      .set({
        status: 'approved',
        processedAt: now,
        processedBy: adminId,
        updatedAt: now,
      })
      .where(eq(payoutRequests.id, payoutId))
      .returning();

    // 📝 AUDIT: Log payout approval
    await logAdminActionWithRequest(
      request,
      adminUser.id,
      AdminActions.APPROVE_PAYOUT,
      payoutId,
      AuditTargetTypes.PAYOUT,
      {
        writerId: payout.writerId,
        amount: payout.amount,
        method: payout.method,
        previousBalance: balance.availableBalance,
        newBalance: balance.availableBalance - payout.amount,
      }
    );

    // Create notification for writer
    await db.insert(notifications).values({
      userId: payout.writerId,
      type: 'payout_approved',
      title: 'Payout Request Approved',
      message: `Your payout request for KSh ${payout.amount.toFixed(2)} has been approved. Payment will be processed shortly.`,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      payoutRequest: updatedPayout,
      message: 'Payout request approved successfully',
    });
  } catch (error) {
    console.error('Error approving payout request:', error);
    return NextResponse.json(
      { error: 'Failed to approve payout request' },
      { status: 500 }
    );
  }
}