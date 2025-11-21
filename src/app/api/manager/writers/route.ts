import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const managerId = searchParams.get('managerId');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const statusParam = searchParams.get('status'); // optional: e.g. 'on_hold'

    // Validate managerId is provided
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

    // Verify the user exists and is a manager
    const managerCheck = await db.select({
      id: users.id,
      role: users.role,
    })
      .from(users)
      .where(eq(users.id, managerIdInt))
      .limit(1);

    if (managerCheck.length === 0) {
      return NextResponse.json(
        { 
          error: 'Manager not found',
          code: 'MANAGER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    if (managerCheck[0].role !== 'manager') {
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

    // Query all freelancers assigned to this manager (optional status filter)
    const baseWhere = and(
      eq(users.assignedManagerId, managerIdInt),
      eq(users.role, 'freelancer')
    );

    const whereClause = statusParam
      ? and(baseWhere, eq(users.status, statusParam))
      : baseWhere;

    const writers = await db.select({
      id: users.id,
      displayId: users.displayId,
      email: users.email,
      name: users.name,
      role: users.role,
      approved: users.approved,
      balance: users.balance,
      earned: users.earned,
      totalEarnings: users.totalEarnings,
      completedJobs: users.completedJobs,
      rating: users.rating,
      phone: users.phone,
      status: users.status,
      freelancerBadge: users.freelancerBadge,
      createdAt: users.createdAt,
    })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(writers, { status: 200 });
  } catch (error) {
    console.error('GET manager writers error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}