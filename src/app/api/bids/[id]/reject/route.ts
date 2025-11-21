import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bids } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bidId = parseInt(params.id);

    await db
      .update(bids)
      .set({ status: 'rejected' })
      .where(eq(bids.id, bidId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reject bid:', error);
    return NextResponse.json(
      { error: 'Failed to reject bid' },
      { status: 500 }
    );
  }
}
