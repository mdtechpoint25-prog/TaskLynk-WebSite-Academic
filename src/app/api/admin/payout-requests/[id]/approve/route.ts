import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';

// POST - Approve payout request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params;
    const body = await request.json();
    const { notes } = body;

    // Verify payout request exists and is pending
    // TODO: Query database for payout request with id

    // Update payout request status to 'approved'
    // TODO: Update database

    // Create audit log entry
    // TODO: Log admin action

    return NextResponse.json({
      success: true,
      message: 'Payout request approved',
      payoutId: id,
      approvedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error approving payout request:', error);
    return NextResponse.json(
      { error: 'Failed to approve payout request' },
      { status: 500 }
    );
  }
}