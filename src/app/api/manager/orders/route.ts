import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs } from '@/db/schema';
import { eq, inArray, or, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const managerId = searchParams.get('managerId');
    const statusFilter = searchParams.get('status');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const formatParam = searchParams.get('format');

    // Validate managerId is provided and is valid integer
    if (!managerId || isNaN(parseInt(managerId))) {
      return NextResponse.json(
        { 
          error: 'Valid managerId is required',
          code: 'INVALID_MANAGER_ID' 
        },
        { status: 400 }
      );
    }

    const managerIdInt = parseInt(managerId);

    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { 
          error: 'Valid page number is required (minimum 1)',
          code: 'INVALID_PAGE' 
        },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { 
          error: 'Valid limit is required (minimum 1, maximum 100)',
          code: 'INVALID_LIMIT' 
        },
        { status: 400 }
      );
    }

    // Validate status filter if provided
    if (statusFilter) {
      const validStatuses = ['pending', 'accepted', 'approved', 'assigned', 'in_progress', 'editing', 'delivered', 'completed', 'cancelled', 'revision', 'on_hold', 'paid'];
      if (!validStatuses.includes(statusFilter)) {
        return NextResponse.json(
          { 
            error: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`,
            code: 'INVALID_STATUS' 
          },
          { status: 400 }
        );
      }
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

    // Get assigned client IDs (clients and account_owners)
    const assignedClients = await db.select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.assignedManagerId, managerIdInt),
          or(
            eq(users.role, 'client'),
            eq(users.role, 'account_owner')
          )
        )
      );

    const clientIds = assignedClients.map(client => client.id);

    // Get assigned writer IDs (freelancers)
    const assignedWriters = await db.select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.assignedManagerId, managerIdInt),
          eq(users.role, 'freelancer')
        )
      );

    const writerIds = assignedWriters.map(writer => writer.id);

    // If no assigned clients or writers, return empty array
    if (clientIds.length === 0 && writerIds.length === 0) {
      return NextResponse.json([]);
    }

    // Build the jobs query with conditions
    let whereConditions = [] as any[];

    // Add client or writer filter
    if (clientIds.length > 0 && writerIds.length > 0) {
      whereConditions.push(
        or(
          inArray(jobs.clientId, clientIds),
          inArray(jobs.assignedFreelancerId, writerIds)
        )
      );
    } else if (clientIds.length > 0) {
      whereConditions.push(inArray(jobs.clientId, clientIds));
    } else if (writerIds.length > 0) {
      whereConditions.push(inArray(jobs.assignedFreelancerId, writerIds));
    }

    // Add status filter if provided
    if (statusFilter) {
      whereConditions.push(eq(jobs.status, statusFilter));
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get jobs with combined where conditions
    const jobsQuery = await db.select()
      .from(jobs)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);

    // Get all unique client and writer IDs from the jobs
    const jobClientIds = [...new Set(jobsQuery.map(job => job.clientId))];
    const jobWriterIds = [...new Set(jobsQuery.map(job => job.assignedFreelancerId).filter(id => id !== null))];

    // Fetch client users
    const clientUsers = jobClientIds.length > 0
      ? await db.select({
          id: users.id,
          displayId: users.displayId,
          name: users.name
        })
        .from(users)
        .where(inArray(users.id, jobClientIds))
      : [];

    // Fetch writer users
    const writerUsers = jobWriterIds.length > 0
      ? await db.select({
          id: users.id,
          displayId: users.displayId,
          name: users.name
        })
        .from(users)
        .where(inArray(users.id, jobWriterIds))
      : [];

    // Create lookup maps
    const clientMap = new Map(clientUsers.map(c => [c.id, c]));
    const writerMap = new Map(writerUsers.map(w => [w.id, w]));

    // Format response with nested client and writer info
    const formattedJobs = jobsQuery.map(job => {
      const client = clientMap.get(job.clientId);
      const writer = job.assignedFreelancerId ? writerMap.get(job.assignedFreelancerId) : null;

      return {
        id: job.id,
        displayId: job.displayId,
        orderNumber: job.orderNumber,
        clientId: job.clientId,
        assignedFreelancerId: job.assignedFreelancerId,
        title: job.title,
        instructions: job.instructions,
        workType: job.workType,
        pages: job.pages,
        slides: job.slides,
        amount: job.amount,
        deadline: job.deadline,
        actualDeadline: job.actualDeadline,
        status: job.status,
        paymentConfirmed: job.paymentConfirmed,
        revisionRequested: job.revisionRequested,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        client: client ? {
          id: client.id,
          displayId: client.displayId,
          name: client.name
        } : null,
        writer: writer ? {
          id: writer.id,
          displayId: writer.displayId,
          name: writer.name
        } : null
      };
    });

    // CSV export support
    if (formatParam === 'csv') {
      const header = ['Order ID','Order Number','Title','Work Type','Amount','Status','Deadline','Client','Writer','Created At'];
      const rows = formattedJobs.map((j) => [
        j.displayId,
        j.orderNumber ?? '',
        (j.title ?? '').replace(/\n|\r/g, ' ').trim(),
        j.workType ?? '',
        String(j.amount ?? ''),
        j.status ?? '',
        j.actualDeadline ?? j.deadline ?? '',
        j.client?.name ?? '',
        j.writer?.name ?? '',
        j.createdAt ?? ''
      ]);
      const esc = (val: string) => {
        if (val == null) return '';
        const needsQuotes = /[",\n]/.test(val);
        const safe = String(val).replace(/"/g, '""');
        return needsQuotes ? `"${safe}"` : safe;
      };
      const csv = [header, ...rows].map(r => r.map(esc).join(',')).join('\n');
      const filename = `manager-orders-${managerId}-${statusFilter ?? 'all'}-${new Date().toISOString().slice(0,10)}.csv`;
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=${filename}`,
          'Cache-Control': 'no-store'
        }
      });
    }

    return NextResponse.json(formattedJobs, { status: 200 });

  } catch (error) {
    console.error('GET manager orders error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}