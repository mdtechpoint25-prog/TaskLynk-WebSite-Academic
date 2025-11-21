import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs } from '@/db/schema';
import { eq, inArray, or, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get('managerId');

    // Validate managerId parameter
    if (!managerId) {
      return NextResponse.json(
        { 
          error: 'Manager ID is required',
          code: 'MISSING_MANAGER_ID' 
        },
        { status: 400 }
      );
    }

    // Validate managerId is a valid integer
    const managerIdInt = parseInt(managerId);
    if (isNaN(managerIdInt)) {
      return NextResponse.json(
        { 
          error: 'Manager ID must be a valid integer',
          code: 'INVALID_MANAGER_ID' 
        },
        { status: 400 }
      );
    }

    // Query user by managerId and verify role === 'manager'
    const manager = await db.select()
      .from(users)
      .where(eq(users.id, managerIdInt))
      .limit(1);

    if (manager.length === 0) {
      return NextResponse.json(
        { 
          error: 'Manager not found',
          code: 'MANAGER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    if (manager[0].role !== 'manager') {
      return NextResponse.json(
        { 
          error: 'User is not a manager',
          code: 'FORBIDDEN_NOT_MANAGER' 
        },
        { status: 403 }
      );
    }

    // Get assigned clients (both client and account_owner roles)
    const assignedClients = await db.select()
      .from(users)
      .where(
        and(
          eq(users.assignedManagerId, managerIdInt),
          or(
            eq(users.role, 'client'),
            eq(users.role, 'account_owner')
          )
        )
      )
      .orderBy(desc(users.createdAt));

    const clientIds = assignedClients.map(client => client.id);

    // Get assigned writers
    const assignedWriters = await db.select()
      .from(users)
      .where(
        and(
          eq(users.assignedManagerId, managerIdInt),
          eq(users.role, 'freelancer')
        )
      )
      .orderBy(desc(users.createdAt));

    const writerIds = assignedWriters.map(writer => writer.id);

    // Initialize empty orders array and stats
    let assignedOrders: any[] = [];
    const stats = {
      totalClients: assignedClients.length,
      totalWriters: assignedWriters.length,
      totalOrders: 0,
      pendingOrders: 0,
      inProgressOrders: 0,
      deliveredOrders: 0,
      completedOrders: 0,
      revisionOrders: 0
    };

    // Only query orders if there are assigned clients or writers
    if (clientIds.length > 0 || writerIds.length > 0) {
      // Get orders where client_id IN (assigned client ids) OR assigned_freelancer_id IN (assigned writer ids)
      let ordersQuery;

      if (clientIds.length > 0 && writerIds.length > 0) {
        ordersQuery = await db.select()
          .from(jobs)
          .where(
            or(
              inArray(jobs.clientId, clientIds),
              inArray(jobs.assignedFreelancerId, writerIds)
            )
          )
          .orderBy(desc(jobs.createdAt));
      } else if (clientIds.length > 0) {
        ordersQuery = await db.select()
          .from(jobs)
          .where(inArray(jobs.clientId, clientIds))
          .orderBy(desc(jobs.createdAt));
      } else {
        ordersQuery = await db.select()
          .from(jobs)
          .where(inArray(jobs.assignedFreelancerId, writerIds))
          .orderBy(desc(jobs.createdAt));
      }

      assignedOrders = ordersQuery;

      // Calculate stats from orders
      stats.totalOrders = assignedOrders.length;
      
      assignedOrders.forEach(order => {
        if (order.status === 'pending') stats.pendingOrders++;
        if (order.status === 'in_progress') stats.inProgressOrders++;
        if (order.status === 'delivered') stats.deliveredOrders++;
        if (order.status === 'completed') stats.completedOrders++;
        if (order.status === 'revision' || order.revisionRequested) stats.revisionOrders++;
      });
    }

    // Remove password from manager object
    const { password, ...managerWithoutPassword } = manager[0];

    // Remove passwords from clients and writers
    const clientsWithoutPasswords = assignedClients.map(({ password, ...client }) => client);
    const writersWithoutPasswords = assignedWriters.map(({ password, ...writer }) => writer);

    return NextResponse.json({
      manager: managerWithoutPassword,
      stats,
      clients: clientsWithoutPasswords,
      writers: writersWithoutPasswords,
      orders: assignedOrders
    }, { status: 200 });

  } catch (error) {
    console.error('GET manager dashboard error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}