import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { managers } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/v2/managers/[id]/balance - Get manager's current balance and earnings breakdown
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const managerId = parseInt(id);

    // Get manager record
    const [manager] = await db.select().from(managers)
      .where(eq(managers.userId, managerId));

    if (!manager) {
      return NextResponse.json({ 
        error: 'Manager not found' 
      }, { status: 404 });
    }

    // Calculate earnings breakdown
    const balance = {
      currentBalance: manager.balance || 0,
      totalEarnings: manager.totalEarnings || 0,
      status: manager.status,
      breakdown: {
        available: manager.balance || 0,
        pending: 0, // Could be calculated from pending orders
        total: manager.totalEarnings || 0
      },
      updatedAt: manager.updatedAt
    };

    return NextResponse.json({ balance });
  } catch (error: any) {
    console.error('Error fetching manager balance:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch manager balance' 
    }, { status: 500 });
  }
}
