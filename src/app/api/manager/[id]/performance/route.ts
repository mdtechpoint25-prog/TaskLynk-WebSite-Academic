import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs, ratings } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * GET /api/manager/[id]/performance
 * Retrieves manager performance metrics
 * TIER 3 FIX #12: No manager performance metrics
 * 
 * Metrics include:
 * - Orders managed (total, completed, in progress)
 * - Client satisfaction rating
 * - Average time to completion
 * - Writer quality metrics
 * - Revenue managed
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const managerId = parseInt(params.id);
    if (isNaN(managerId)) {
      return NextResponse.json(
        { error: 'Invalid manager ID' },
        { status: 400 }
      );
    }

    // Verify manager exists
    const manager = await db.select()
      .from(users)
      .where(and(
        eq(users.id, managerId),
        eq(users.role, 'manager')
      ))
      .limit(1);

    if (manager.length === 0) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

    // Get all clients assigned to this manager
    const assignedClients = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.assignedManagerId, managerId));

    const clientIds = assignedClients.map(c => c.id);

    if (clientIds.length === 0) {
      return NextResponse.json({
        manager: {
          id: manager[0].id,
          name: manager[0].name,
          email: manager[0].email,
        },
        metrics: {
          clientsManaged: 0,
          writersManaged: 0,
          ordersManaged: 0,
          ordersCompleted: 0,
          ordersInProgress: 0,
          ordersPending: 0,
          completionRate: 0,
          averageRating: 0,
          totalRevenueManaged: 0,
          totalEarnings: 0,
          averageTimeToCompletion: 0,
          onTimeDeliveryRate: 0,
          revisionRequestRate: 0,
          writerSatisfactionRating: 0,
          clientSatisfactionRating: 0,
        },
      });
    }

    // Get all orders for clients managed by this manager
    const managedOrders = await db.select()
      .from(jobs)
      .where(inArray(jobs.clientId, clientIds));

    // Calculate metrics
    const totalOrders = managedOrders.length;
    const completedOrders = managedOrders.filter(j => j.status === 'completed').length;
    const inProgressOrders = managedOrders.filter(j => 
      ['assigned', 'in_progress', 'editing', 'delivered'].includes(j.status)
    ).length;
    const pendingOrders = managedOrders.filter(j => 
      ['pending', 'accepted'].includes(j.status)
    ).length;

    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders * 100) : 0;

    // Calculate revenue metrics
    const totalRevenue = managedOrders.reduce((sum, j) => sum + (j.amount || 0), 0);
    const managerEarningsTotal = managedOrders.reduce((sum, j) => sum + (j.managerEarnings || 0), 0);

    // Get manager ratings (for manager-specific feedback)
    const managerRatings = await db.select()
      .from(ratings)
      .where(eq(ratings.ratedUserId, managerId));

    const averageManagerRating = managerRatings.length > 0
      ? managerRatings.reduce((sum, r) => sum + r.score, 0) / managerRatings.length
      : 0;

    // Get writer count assigned through this manager
    const managedWriters = await db.select({ id: users.id, distinctField: users.id })
      .from(users)
      .where(eq(users.assignedManagerId, managerId));

    const writerCount = new Set(managedWriters.map(w => w.id)).size;

    // Calculate revision request rate
    const revisionsRequested = managedOrders.filter(j => j.revisionRequested).length;
    const revisionRate = totalOrders > 0 ? (revisionsRequested / totalOrders * 100) : 0;

    // Calculate on-time delivery rate (orders completed before deadline)
    const onTimeOrders = managedOrders.filter(j => {
      if (j.status !== 'completed') return false;
      return j.actualDeadline <= j.deadline;
    }).length;
    const onTimeRate = completedOrders > 0 ? (onTimeOrders / completedOrders * 100) : 0;

    // Calculate average time to completion (days)
    const completedOrdersWithDates = managedOrders.filter(j => 
      j.status === 'completed' && j.createdAt && j.updatedAt
    );
    let averageTimeToCompletion = 0;
    if (completedOrdersWithDates.length > 0) {
      const totalTime = completedOrdersWithDates.reduce((sum, j) => {
        const created = new Date(j.createdAt).getTime();
        const updated = new Date(j.updatedAt).getTime();
        return sum + ((updated - created) / (1000 * 60 * 60 * 24)); // Convert to days
      }, 0);
      averageTimeToCompletion = totalTime / completedOrdersWithDates.length;
    }

    // Get writer quality ratings (average rating of writers managed)
    const writerIds = new Set<number>();
    managedOrders.forEach(j => {
      if (j.assignedFreelancerId) writerIds.add(j.assignedFreelancerId);
    });

    const writerRatings = await db.select()
      .from(ratings)
      .where(inArray(ratings.ratedUserId, Array.from(writerIds)));

    const averageWriterRating = writerRatings.length > 0
      ? writerRatings.reduce((sum, r) => sum + r.score, 0) / writerRatings.length
      : 0;

    return NextResponse.json({
      manager: {
        id: manager[0].id,
        name: manager[0].name,
        email: manager[0].email,
        displayId: manager[0].displayId,
        balance: manager[0].balance,
        totalEarned: manager[0].totalEarned,
      },
      metrics: {
        clientsManaged: assignedClients.length,
        writersManaged: writerCount,
        ordersManaged: totalOrders,
        ordersCompleted: completedOrders,
        ordersInProgress: inProgressOrders,
        ordersPending: pendingOrders,
        completionRate: parseFloat(completionRate.toFixed(2)),
        averageRating: parseFloat(averageManagerRating.toFixed(2)),
        totalRevenueManaged: parseFloat(totalRevenue.toFixed(2)),
        totalEarnings: parseFloat(managerEarningsTotal.toFixed(2)),
        averageTimeToCompletion: parseFloat(averageTimeToCompletion.toFixed(1)),
        onTimeDeliveryRate: parseFloat(onTimeRate.toFixed(2)),
        revisionRequestRate: parseFloat(revisionRate.toFixed(2)),
        writerSatisfactionRating: parseFloat(averageWriterRating.toFixed(2)),
        clientSatisfactionRating: parseFloat(averageManagerRating.toFixed(2)),
      },
      trends: {
        recentOrders: managedOrders.slice(-10).reverse(),
        topClients: assignedClients.slice(0, 5),
        topWriters: Array.from(writerIds).slice(0, 5),
      },
    });

  } catch (error) {
    console.error('Performance metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}
