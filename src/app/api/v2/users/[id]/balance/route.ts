import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, writerBalances } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/v2/users/[id]/balance - Get user balance information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);

    // Get user with balance info
    const [user] = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      balance: users.balance,
      earned: users.earned,
      totalEarnings: users.totalEarnings,
      totalEarned: users.totalEarned,
      totalSpent: users.totalSpent,
      completedJobs: users.completedJobs,
      completedOrders: users.completedOrders,
      rating: users.rating,
      ratingAverage: users.ratingAverage,
      ratingCount: users.ratingCount,
    }).from(users).where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get writer-specific balance if user is a freelancer
    let writerBalance = null;
    if (user.role === 'freelancer') {
      const [balance] = await db.select().from(writerBalances)
        .where(eq(writerBalances.writerId, userId));
      writerBalance = balance || null;
    }

    return NextResponse.json({ 
      user,
      writerBalance,
      balance: {
        available: user.balance || 0,
        earned: user.earned || 0,
        totalEarnings: user.totalEarnings || 0,
        totalEarned: user.totalEarned || 0,
        totalSpent: user.totalSpent || 0,
      }
    });
  } catch (error: any) {
    console.error('Error fetching balance:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch balance' }, { status: 500 });
  }
}