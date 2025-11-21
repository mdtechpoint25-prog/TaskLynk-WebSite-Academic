import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const approvedParam = searchParams.get('approved');

    // Validate role parameter
    if (!role) {
      return NextResponse.json(
        { 
          error: 'Role parameter is required',
          code: 'MISSING_ROLE_PARAMETER'
        },
        { status: 400 }
      );
    }

    // Validate role value - include account_owner and manager
    if (role !== 'freelancer' && role !== 'client' && role !== 'account_owner' && role !== 'manager') {
      return NextResponse.json(
        { 
          error: 'Role must be one of: "freelancer", "client", "account_owner", or "manager"',
          code: 'INVALID_ROLE_VALUE'
        },
        { status: 400 }
      );
    }

    // Parse approved parameter (default to true)
    const approved = approvedParam === 'false' ? false : true;

    // Build query with filters - if role is account_owner, also include clients
    let roleCondition;
    if (role === 'account_owner') {
      // Query both client and account_owner roles
      roleCondition = or(
        eq(users.role, 'account_owner'),
        eq(users.role, 'client')
      );
    } else {
      roleCondition = eq(users.role, role);
    }

    // NOTE: Do NOT depend on users.approved column (may be missing in some DBs)
    // When approved=true, filter by status being active/approved only. When false, return all statuses for that role.
    const whereCondition = approved
      ? and(
          roleCondition,
          or(eq(users.status, 'active'), eq(users.status, 'approved'))
        )
      : roleCondition;

    const results = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        displayId: users.displayId,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(whereCondition)
      .orderBy(users.name);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET users by role error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}