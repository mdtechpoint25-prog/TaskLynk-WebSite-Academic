import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payoutRequests, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/v2/users/[id]/payout-request - Writer requests payout
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const writerId = parseInt(id);
    const body = await request.json();
    const { amount, method, accountDetails } = body;

    if (!amount || !method || !accountDetails) {
      return NextResponse.json({ 
        error: 'Amount, method, and account details are required' 
      }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ 
        error: 'Amount must be a positive number' 
      }, { status: 400 });
    }

    if (!['mpesa', 'bank'].includes(method)) {
      return NextResponse.json({ 
        error: 'Method must be either "mpesa" or "bank"' 
      }, { status: 400 });
    }

    // 🔴 CRITICAL: Check if writer account is approved
    const [writer] = await db.select()
      .from(users)
      .where(eq(users.id, writerId))
      .limit(1);

    if (!writer) {
      return NextResponse.json({ 
        error: 'Writer not found' 
      }, { status: 404 });
    }

    if (writer.role !== 'freelancer') {
      return NextResponse.json({ 
        error: 'Only freelancers can request payouts' 
      }, { status: 403 });
    }

    if (!writer.approved) {
      return NextResponse.json({ 
        error: 'Your account must be approved before you can request payouts',
        code: 'ACCOUNT_NOT_APPROVED'
      }, { status: 403 });
    }

    // Check if writer has sufficient balance
    if (writer.balance < parsedAmount) {
      return NextResponse.json({ 
        error: `Insufficient balance. Available: KSh ${writer.balance.toFixed(2)}` 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Create payout request
    const [payoutRequest] = await db.insert(payoutRequests).values({
      writerId,
      amount: parsedAmount,
      method,
      accountDetails: JSON.stringify(accountDetails),
      status: 'pending',
      requestedAt: now,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json({ 
      payoutRequest,
      message: 'Payout request submitted successfully. Awaiting admin approval.'
    });
  } catch (error: any) {
    console.error('Error creating payout request:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create payout request' 
    }, { status: 500 });
  }
}