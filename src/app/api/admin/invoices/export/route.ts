import { NextRequest } from 'next/server'
import { db } from '@/db'
import { invoices, users, jobs } from '@/db/schema'
import { and, desc, eq, inArray, or } from 'drizzle-orm'

// Use dynamic import to avoid bundling issues
async function getWorkbook() {
  const ExcelJS = await import('exceljs')
  return new ExcelJS.Workbook()
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const groupBy = (searchParams.get('groupBy') || 'client') as 'client' | 'manager' | 'freelancer'
    const statusFilter = searchParams.get('status') // optional: pending, paid, cancelled

    // Fetch all invoices with job, client, freelancer context
    const invoiceRows = await db.select().from(invoices).orderBy(desc(invoices.createdAt))

    if (invoiceRows.length === 0) {
      const wb = await getWorkbook()
      wb.addWorksheet('Empty')
      const buf = await wb.xlsx.writeBuffer()
      return new Response(buf, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=admin-invoices-${groupBy}-${new Date().toISOString().slice(0,10)}.xlsx`,
          'Cache-Control': 'no-store',
        },
      })
    }

    // Collect IDs for joins
    const jobIds = [...new Set(invoiceRows.map((inv) => inv.jobId))]
    const clientIds = [...new Set(invoiceRows.map((inv) => inv.clientId))]
    const freelancerIds = [...new Set(invoiceRows.map((inv) => inv.freelancerId).filter(Boolean) as number[])]

    const jobMap = new Map(
      (
        jobIds.length > 0
          ? await db
              .select({ id: jobs.id, displayId: jobs.displayId, orderId: jobs.orderId, title: jobs.title, workType: jobs.workType })
              .from(jobs)
              .where(inArray(jobs.id, jobIds))
          : []
      ).map((j) => [j.id, j])
    )

    const clientMap = new Map(
      (
        clientIds.length > 0
          ? await db
              .select({ id: users.id, name: users.name, displayId: users.displayId, assignedManagerId: users.assignedManagerId })
              .from(users)
              .where(inArray(users.id, clientIds))
          : []
      ).map((u) => [u.id, u])
    )

    const freelancerMap = new Map(
      (
        freelancerIds.length > 0
          ? await db
              .select({ id: users.id, name: users.name, displayId: users.displayId, assignedManagerId: users.assignedManagerId })
              .from(users)
              .where(inArray(users.id, freelancerIds))
          : []
      ).map((u) => [u.id, u])
    )

    // Map manager id -> manager details (from users table)
    const managerIds = new Set<number>()
    clientMap.forEach((c) => { if (c.assignedManagerId) managerIds.add(c.assignedManagerId) })
    freelancerMap.forEach((f) => { if (f.assignedManagerId) managerIds.add(f.assignedManagerId) })
    const managerArr = managerIds.size
      ? await db
          .select({ id: users.id, name: users.name, displayId: users.displayId, role: users.role })
          .from(users)
          .where(inArray(users.id, Array.from(managerIds)))
      : []
    const managerMap = new Map(managerArr.map((m) => [m.id, m]))

    // Filter by status if provided
    const filteredInvoices = invoiceRows.filter((inv) => (statusFilter ? inv.status === statusFilter : true))

    type Row = {
      invoiceNumber: string
      amount: number
      freelancerAmount: number
      adminCommission: number
      status: string
      isPaid: boolean
      createdAt: string
      job?: { id: number; displayId: string | null; orderId: string | null; title: string | null; workType: string | null } | null
      client?: { id: number; name: string | null; displayId: string | null } | null
      freelancer?: { id: number; name: string | null; displayId: string | null } | null
      manager?: { id: number; name: string | null; displayId: string | null } | null
    }

    const rows: Row[] = filteredInvoices.map((inv) => {
      const j = jobMap.get(inv.jobId) || null
      const c = clientMap.get(inv.clientId) || null
      const f = inv.freelancerId ? freelancerMap.get(inv.freelancerId) || null : null
      const managerId = c?.assignedManagerId || f?.assignedManagerId || null
      const m = managerId ? managerMap.get(managerId) || null : null
      return {
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        freelancerAmount: inv.freelancerAmount,
        adminCommission: inv.adminCommission,
        status: inv.status,
        isPaid: !!inv.isPaid,
        createdAt: inv.createdAt,
        job: j ? { id: j.id, displayId: j.displayId, orderId: j.orderId, title: j.title, workType: j.workType } : null,
        client: c ? { id: c.id, name: c.name, displayId: c.displayId } : null,
        freelancer: f ? { id: f.id, name: f.name, displayId: f.displayId } : null,
        manager: m ? { id: m.id, name: m.name, displayId: m.displayId } : null,
      }
    })

    // Grouping
    const groups = new Map<string, Row[]>()
    const labelFor = (r: Row) => {
      if (groupBy === 'client') return r.client?.name || `Client #${r.client?.id || 'N/A'}`
      if (groupBy === 'freelancer') return r.freelancer?.name || `Freelancer #${r.freelancer?.id || 'N/A'}`
      return r.manager?.name || `Manager #${r.manager?.id || 'Unassigned'}`
    }

    rows.forEach((r) => {
      const key = labelFor(r)
      const list = groups.get(key) || []
      list.push(r)
      groups.set(key, list)
    })

    const wb = await getWorkbook()

    // Summary sheet across groups
    const summaryWs = wb.addWorksheet('SUMMARY')
    summaryWs.columns = [
      { header: 'Group', key: 'group', width: 32 },
      { header: 'Invoices', key: 'count', width: 12 },
      { header: 'Total Amount', key: 'amount', width: 18 },
      { header: 'Freelancer Amount', key: 'fa', width: 20 },
      { header: 'Admin Commission', key: 'ac', width: 18 },
      { header: 'Paid Count', key: 'paid', width: 12 },
    ]

    // Create a sheet per group with totals
    for (const [groupName, list] of groups) {
      const ws = wb.addWorksheet(groupName.substring(0, 31))
      ws.columns = [
        { header: 'Invoice #', key: 'invoiceNumber', width: 18 },
        { header: 'Job', key: 'job', width: 32 },
        { header: 'Work Type', key: 'workType', width: 16 },
        { header: 'Client', key: 'client', width: 24 },
        { header: 'Freelancer', key: 'freelancer', width: 24 },
        { header: 'Amount', key: 'amount', width: 14 },
        { header: 'Freelancer Amount', key: 'fa', width: 18 },
        { header: 'Admin Commission', key: 'ac', width: 18 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Paid', key: 'paid', width: 8 },
        { header: 'Created At', key: 'createdAt', width: 22 },
      ]

      let totalAmount = 0
      let totalFA = 0
      let totalAC = 0
      let paidCount = 0

      list.forEach((r) => {
        totalAmount += Number(r.amount || 0)
        totalFA += Number(r.freelancerAmount || 0)
        totalAC += Number(r.adminCommission || 0)
        if (r.isPaid) paidCount += 1

        ws.addRow({
          invoiceNumber: r.invoiceNumber,
          job: `${r.job?.displayId || ''} ${r.job?.title ? `- ${r.job?.title}` : ''}`.trim(),
          workType: r.job?.workType || '',
          client: r.client?.name || '',
          freelancer: r.freelancer?.name || '',
          amount: r.amount,
          fa: r.freelancerAmount,
          ac: r.adminCommission,
          status: r.status,
          paid: r.isPaid ? 'Yes' : 'No',
          createdAt: r.createdAt,
        })
      })

      // Summary row at bottom
      ws.addRow({})
      ws.addRow({ job: 'Totals', amount: totalAmount, fa: totalFA, ac: totalAC, status: `Paid: ${paidCount}` })

      // Add to global summary sheet
      summaryWs.addRow({ group: groupName, count: list.length, amount: totalAmount, fa: totalFA, ac: totalAC, paid: paidCount })
    }

    const buf = await wb.xlsx.writeBuffer()
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=admin-invoices-${groupBy}-${new Date().toISOString().slice(0,10)}.xlsx`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Admin invoices export error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
