import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payoutRequests, notifications } from '@/db/schema';
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
    const { transactionReference } = body;

    if (!transactionReference) {
      return NextResponse.json(
        { error: 'Transaction reference is required' },
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

    if (payout.status !== 'approved') {
      return NextResponse.json(
        { error: `Payout must be approved before processing. Current status: ${payout.status}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update payout request status
    const [updatedPayout] = await db
      .update(payoutRequests)
      .set({
        status: 'processed',
        transactionReference,
        updatedAt: now,
      })
      .where(eq(payoutRequests.id, payoutId))
      .returning();

    // 📝 AUDIT: Log payout processing
    await logAdminActionWithRequest(
      request,
      adminUser.id,
      AdminActions.PROCESS_PAYOUT,
      payoutId,
      AuditTargetTypes.PAYOUT,
      {
        writerId: payout.writerId,
        amount: payout.amount,
        transactionReference,
        method: payout.method,
      }
    );

    // Create notification for writer
    await db.insert(notifications).values({
      userId: payout.writerId,
      type: 'payout_processed',
      title: 'Payment Sent',
      message: `Your payout of KSh ${payout.amount.toFixed(2)} has been processed. Transaction reference: ${transactionReference}`,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      payoutRequest: updatedPayout,
      message: 'Payout processed successfully',
    });
  } catch (error) {
    console.error('Error processing payout request:', error);
    return NextResponse.json(
      { error: 'Failed to process payout request' },
      { status: 500 }
    );
  }
}