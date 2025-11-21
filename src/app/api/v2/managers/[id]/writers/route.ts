import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users } from '@/db/schema';
import { eq, sql, and } from 'drizzle-orm';

// GET /api/v2/managers/[id]/writers - Get all writers the manager has worked with
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const managerId = parseInt(id);

    // Get all unique writers assigned by this manager with their stats
    const writersQuery = await db
      .select({
        writerId: jobs.assignedFreelancerId,
        writerName: users.name,
        writerEmail: users.email,
        writerRating: users.ratingAverage,
        writerStatus: users.status,
        totalOrders: sql<number>`COUNT(DISTINCT ${jobs.id})`,
        completedOrders: sql<number>`SUM(CASE WHEN ${jobs.status} = 'completed' THEN 1 ELSE 0 END)`,
        inProgressOrders: sql<number>`SUM(CASE WHEN ${jobs.status} = 'in_progress' THEN 1 ELSE 0 END)`,
        lastAssignedAt: sql<string>`MAX(${jobs.updatedAt})`,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.assignedFreelancerId, users.id))
      .where(and(
        eq(jobs.managerId, managerId),
        sql`${jobs.assignedFreelancerId} IS NOT NULL`
      ))
      .groupBy(jobs.assignedFreelancerId, users.name, users.email, users.ratingAverage, users.status);

    // Format results with performance metrics
    const writers = writersQuery.map(writer => ({
      id: writer.writerId,
      name: writer.writerName || 'Unknown Writer',
      email: writer.writerEmail,
      rating: writer.writerRating || 0,
      status: writer.writerStatus,
      performance: {
        totalOrders: Number(writer.totalOrders) || 0,
        completedOrders: Number(writer.completedOrders) || 0,
        inProgressOrders: Number(writer.inProgressOrders) || 0,
        completionRate: Number(writer.totalOrders) > 0 
          ? Math.round((Number(writer.completedOrders) / Number(writer.totalOrders)) * 100)
          : 0
      },
      lastAssignedAt: writer.lastAssignedAt
    }));

    return NextResponse.json({ 
      writers,
      count: writers.length
    });
  } catch (error: any) {
    console.error('Error fetching manager writers:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch manager writers' 
    }, { status: 500 });
  }
}
