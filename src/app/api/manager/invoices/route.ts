import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, users, jobs } from '@/db/schema';
import { and, desc, eq, inArray, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const managerId = searchParams.get('managerId');
    const statusFilter = searchParams.get('status');
    const formatParam = searchParams.get('format');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

    if (!managerId || isNaN(parseInt(managerId))) {
      return NextResponse.json({ error: 'Valid managerId is required', code: 'INVALID_MANAGER_ID' }, { status: 400 });
    }
    const managerIdInt = parseInt(managerId);

    if (isNaN(page) || page < 1) {
      return NextResponse.json({ error: 'Valid page number is required (minimum 1)', code: 'INVALID_PAGE' }, { status: 400 });
    }
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({ error: 'Valid limit is required (minimum 1, maximum 100)', code: 'INVALID_LIMIT' }, { status: 400 });
    }

    if (statusFilter) {
      const validStatuses = ['pending', 'paid', 'cancelled'];
      if (!validStatuses.includes(statusFilter)) {
        return NextResponse.json({ error: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`, code: 'INVALID_STATUS' }, { status: 400 });
      }
    }

    // Verify manager exists and role
    const [manager] = await db.select().from(users).where(eq(users.id, managerIdInt)).limit(1);
    if (!manager) {
      return NextResponse.json({ error: 'Manager not found', code: 'MANAGER_NOT_FOUND' }, { status: 404 });
    }
    if (manager.role !== 'manager') {
      return NextResponse.json({ error: 'User is not a manager', code: 'FORBIDDEN_NOT_MANAGER' }, { status: 403 });
    }

    // Collect assigned clients and writers
    const assignedClients = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.assignedManagerId, managerIdInt),
          or(eq(users.role, 'client'), eq(users.role, 'account_owner'))
        )
      );
    const clientIds = assignedClients.map((c) => c.id);

    const assignedWriters = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.assignedManagerId, managerIdInt), eq(users.role, 'freelancer')));
    const writerIds = assignedWriters.map((w) => w.id);

    if (clientIds.length === 0 && writerIds.length === 0) {
      // Nothing in scope
      if (formatParam === 'csv') {
        const header = [
          'Invoice Number','Job ID','Order ID','Job Title','Work Type','Amount','Freelancer Amount','Admin Commission','Status','Paid','Created At','Client','Freelancer'
        ];
        const csv = header.join(',') + '\n';
        return new NextResponse(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename=manager-invoices-${managerId}-${statusFilter ?? 'all'}-${new Date().toISOString().slice(0,10)}.csv`,
            'Cache-Control': 'no-store'
          }
        });
      }
      return NextResponse.json([]);
    }

    // Build where conditions
    const whereConds: any[] = [];
    if (clientIds.length > 0 && writerIds.length > 0) {
      whereConds.push(or(inArray(invoices.clientId, clientIds), inArray(invoices.freelancerId, writerIds)));
    } else if (clientIds.length > 0) {
      whereConds.push(inArray(invoices.clientId, clientIds));
    } else if (writerIds.length > 0) {
      whereConds.push(inArray(invoices.freelancerId, writerIds));
    }
    if (statusFilter) whereConds.push(eq(invoices.status, statusFilter));

    const offset = (page - 1) * limit;

    const invoiceRows = await db
      .select()
      .from(invoices)
      .where(whereConds.length > 0 ? and(...whereConds) : undefined)
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    // Collect IDs for joins
    const jobIds = [...new Set(invoiceRows.map((inv) => inv.jobId))];
    const clientIdsUsed = [...new Set(invoiceRows.map((inv) => inv.clientId))];
    const freelancerIdsUsed = [...new Set(invoiceRows.map((inv) => inv.freelancerId).filter((id) => id !== null))] as number[];

    const jobMap = new Map(
      (
        jobIds.length > 0
          ? await db
              .select({ id: jobs.id, displayId: jobs.displayId, orderId: jobs.orderId, title: jobs.title, workType: jobs.workType })
              .from(jobs)
              .where(inArray(jobs.id, jobIds))
          : []
      ).map((j) => [j.id, j])
    );

    const clientMap = new Map(
      (
        clientIdsUsed.length > 0
          ? await db
              .select({ id: users.id, displayId: users.displayId, name: users.name })
              .from(users)
              .where(inArray(users.id, clientIdsUsed))
          : []
      ).map((u) => [u.id, u])
    );

    const writerMap = new Map(
      (
        freelancerIdsUsed.length > 0
          ? await db
              .select({ id: users.id, displayId: users.displayId, name: users.name })
              .from(users)
              .where(inArray(users.id, freelancerIdsUsed))
          : []
      ).map((u) => [u.id, u])
    );

    const formatted = invoiceRows.map((inv) => {
      const job = jobMap.get(inv.jobId) || null;
      const client = clientMap.get(inv.clientId) || null;
      const freelancer = inv.freelancerId ? writerMap.get(inv.freelancerId) || null : null;
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        freelancerAmount: inv.freelancerAmount,
        adminCommission: inv.adminCommission,
        status: inv.status,
        isPaid: inv.isPaid,
        createdAt: inv.createdAt,
        job: job ? { id: job.id, displayId: job.displayId, orderId: job.orderId, title: job.title, workType: job.workType } : null,
        client: client ? { id: client.id, displayId: client.displayId, name: client.name } : null,
        freelancer: freelancer ? { id: freelancer.id, displayId: freelancer.displayId, name: freelancer.name } : null,
      };
    });

    if (formatParam === 'csv') {
      const header = [
        'Invoice Number','Job ID','Order ID','Job Title','Work Type','Amount','Freelancer Amount','Admin Commission','Status','Paid','Created At','Client','Freelancer'
      ];
      const esc = (val: string | number | boolean | null | undefined) => {
        if (val === null || val === undefined) return '';
        const s = String(val);
        const needsQuotes = /[",\n]/.test(s);
        const safe = s.replace(/"/g, '""');
        return needsQuotes ? `"${safe}"` : safe;
      };
      const rows = formatted.map((f) => [
        f.invoiceNumber ?? '',
        f.job?.id ?? '',
        f.job?.orderId ?? '',
        f.job?.title ?? '',
        f.job?.workType ?? '',
        f.amount ?? '',
        f.freelancerAmount ?? '',
        f.adminCommission ?? '',
        f.status ?? '',
        f.isPaid ? 'true' : 'false',
        f.createdAt ?? '',
        f.client?.name ?? '',
        f.freelancer?.name ?? ''
      ]);
      const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
      const filename = `manager-invoices-${managerId}-${statusFilter ?? 'all'}-${new Date().toISOString().slice(0,10)}.csv`;
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=${filename}`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('GET manager invoices error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
  }
}
