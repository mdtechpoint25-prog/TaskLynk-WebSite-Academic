import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';
import { db } from '@/db';
import { adminAuditLogs, users } from '@/db/schema';
import { desc, and, eq, like, gte, lte, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const authCheck = await requireAdminRole(req);
  if (authCheck.error) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    
    // Filter parameters
    const action = searchParams.get('action');
    const adminId = searchParams.get('adminId');
    const targetType = searchParams.get('targetType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Build where conditions
    const conditions = [];
    
    if (action) {
      conditions.push(eq(adminAuditLogs.action, action));
    }
    
    if (adminId) {
      conditions.push(eq(adminAuditLogs.adminId, parseInt(adminId)));
    }
    
    if (targetType) {
      conditions.push(eq(adminAuditLogs.targetType, targetType));
    }
    
    if (startDate) {
      conditions.push(gte(adminAuditLogs.timestamp, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(adminAuditLogs.timestamp, endDate));
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(adminAuditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .execute();
    
    const totalCount = countResult[0]?.count || 0;

    // Get paginated logs with admin user info
    const logs = await db
      .select({
        id: adminAuditLogs.id,
        adminId: adminAuditLogs.adminId,
        adminName: users.name,
        adminEmail: users.email,
        action: adminAuditLogs.action,
        targetId: adminAuditLogs.targetId,
        targetType: adminAuditLogs.targetType,
        details: adminAuditLogs.details,
        ipAddress: adminAuditLogs.ipAddress,
        timestamp: adminAuditLogs.timestamp,
      })
      .from(adminAuditLogs)
      .leftJoin(users, eq(adminAuditLogs.adminId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(adminAuditLogs.timestamp))
      .limit(limit)
      .offset((page - 1) * limit)
      .execute();

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('[Admin Audit Logs API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', details: error.message },
      { status: 500 }
    );
  }
}
