import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payoutRequests, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    // Build query
    let query = db
      .select({
        id: payoutRequests.id,
        writerId: payoutRequests.writerId,
        amount: payoutRequests.amount,
        method: payoutRequests.method,
        accountDetails: payoutRequests.accountDetails,
        status: payoutRequests.status,
        requestedAt: payoutRequests.requestedAt,
        processedAt: payoutRequests.processedAt,
        processedBy: payoutRequests.processedBy,
        rejectionReason: payoutRequests.rejectionReason,
        transactionReference: payoutRequests.transactionReference,
        createdAt: payoutRequests.createdAt,
        updatedAt: payoutRequests.updatedAt,
        writerName: users.name,
        writerEmail: users.email,
        writerPhone: users.phone,
      })
      .from(payoutRequests)
      .leftJoin(users, eq(payoutRequests.writerId, users.id))
      .orderBy(desc(payoutRequests.requestedAt));

    // Filter by status if provided
    if (status) {
      query = query.where(eq(payoutRequests.status, status)) as any;
    }

    const requests = await query;

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching payout requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payout requests' },
      { status: 500 }
    );
  }
}
