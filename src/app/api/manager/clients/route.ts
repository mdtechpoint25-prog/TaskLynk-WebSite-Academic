import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get('managerId');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const accountOwnerParam = searchParams.get('accountOwner'); // 'true' | 'false' | null
    const statusParam = searchParams.get('status'); // e.g., 'on_hold'

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

    // Validate page parameter
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { 
          error: 'Page must be a positive integer',
          code: 'INVALID_PAGE' 
        },
        { status: 400 }
      );
    }

    // Validate limit parameter
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { 
          error: 'Limit must be a positive integer',
          code: 'INVALID_LIMIT' 
        },
        { status: 400 }
      );
    }

    // Verify the user exists and has manager role
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

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build role filter
    let roleFilter;
    if (accountOwnerParam === 'true') {
      roleFilter = eq(users.role, 'account_owner');
    } else if (accountOwnerParam === 'false') {
      roleFilter = eq(users.role, 'client');
    } else {
      roleFilter = or(eq(users.role, 'client'), eq(users.role, 'account_owner'));
    }

    // Optional status filter
    const whereClauses = [eq(users.assignedManagerId, managerIdInt), roleFilter] as const;
    const statusFilter = statusParam ? eq(users.status, statusParam) : null;

    // Query all clients assigned to this manager with filters
    const clients = await db.select({
      id: users.id,
      displayId: users.displayId,
      email: users.email,
      name: users.name,
      role: users.role,
      approved: users.approved,
      balance: users.balance,
      totalSpent: users.totalSpent,
      completedJobs: users.completedJobs,
      rating: users.rating,
      phone: users.phone,
      status: users.status,
      clientTier: users.clientTier,
      clientPriority: users.clientPriority,
      createdAt: users.createdAt
    })
      .from(users)
      .where(
        statusFilter
          ? and(...whereClauses, statusFilter)
          : and(...whereClauses)
      )
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(clients, { status: 200 });

  } catch (error) {
    console.error('GET manager clients error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}