import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';

interface Params {
  id: string;
}

// POST - Reject payout request
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  // Check admin authentication
  const authCheck = await requireAdminRole(request);
  if (authCheck.error) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Verify payout request exists and is pending
    // TODO: Query database for payout request with id

    // Update payout request status to 'rejected'
    // TODO: Update database

    // Restore amount to freelancer balance
    // TODO: Update writer_balances table

    // Create audit log entry
    // TODO: Log admin action

    // Send notification to freelancer
    // TODO: Send email/notification with rejection reason

    return NextResponse.json({
      success: true,
      message: 'Payout request rejected',
      payoutId: id,
      rejectedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error rejecting payout request:', error);
    return NextResponse.json(
      { error: 'Failed to reject payout request' },
      { status: 500 }
    );
  }
}