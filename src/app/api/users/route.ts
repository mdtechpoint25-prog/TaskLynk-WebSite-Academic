import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@libsql/client'
// Fallback to Drizzle when libsql/Turso isn't available
import { db } from '@/db'
import { users as usersTable } from '@/db/schema'
import { and, eq, inArray, or } from 'drizzle-orm'

const ROLE_NAMES: Record<number, string> = {
  1: 'admin',
  2: 'client',
  3: 'manager',  // ✅ FIXED: role_id 3 is manager
  4: 'freelancer',   // ✅ FIXED: role_id 4 is freelancer
  5: 'editor',   // ✅ NEW: role_id 5 is editor (TIER 1 fix)
  6: 'account_owner', // Legacy fallback
}

function normalizeStatus(raw: unknown): 'approved' | 'active' | 'pending' | 'rejected' | 'suspended' | 'blacklisted' {
  const s = String(raw || '').trim().toLowerCase()
  if (['approved', 'active'].includes(s)) return s as 'approved' | 'active'
  if (['pending', 'awaiting_approval', 'awaiting-approval', 'unverified', 'new', 'inactive', 'not_approved'].includes(s)) return 'pending'
  if (s === 'rejected') return 'rejected'
  if (s === 'suspended') return 'suspended'
  if (s === 'blacklisted') return 'blacklisted'
  return 'pending'
}

export async function GET(request: NextRequest) {
  const runLibsql = async () => {
    const { searchParams } = new URL(request.url)

    const roleParam = searchParams.get('role')
    const approvedParam = searchParams.get('approved')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
    const offset = parseInt(searchParams.get('offset') ?? '0')

    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    })

    // Discover existing columns to be resilient across legacy schemas
    const colsRes = await client.execute({ sql: 'PRAGMA table_info(users)' })
    const columns = colsRes.rows.map((r: any) => String(r.name ?? r.column_name ?? '').toLowerCase())
    const has = (c: string) => columns.includes(c)

    const hasRoleId = has('role_id')
    const hasRoleText = has('role')
    const hasStatus = has('status')
    const hasApproved = has('approved')
    const hasPhone = has('phone')
    const hasRating = has('rating')

    // Build WHERE clauses safely depending on available columns
    const where: string[] = []
    const args: any[] = []

    if (roleParam) {
      const allowed = new Set(['admin', 'client', 'freelancer', 'manager', 'editor', 'account_owner'])
      const roles = roleParam
        .split(',')
        .map((r) => r.trim().toLowerCase())
        .filter((r) => allowed.has(r))

      if (roles.length > 0) {
        if (hasRoleId) {
          const roleIds = roles
            .map((r) => Object.entries(ROLE_NAMES).find(([id, name]) => name === r)?.[0])
            .filter(Boolean)
            .map((id) => Number(id))
          if (roleIds.length > 0) {
            const placeholders = roleIds.map(() => '?').join(',')
            where.push(`role_id IN (${placeholders})`)
            args.push(...roleIds)
          }
        } else if (hasRoleText) {
          const placeholders = roles.map(() => '?').join(',')
          where.push(`LOWER(role) IN (${placeholders})`)
          args.push(...roles)
        }
      }
    }

    if (approvedParam !== null) {
      const approved = approvedParam === 'true'
      if (hasStatus) {
        if (approved) where.push(`LOWER(COALESCE(status, '')) IN ('approved','active')`)
        else where.push(`LOWER(COALESCE(status, '')) NOT IN ('approved','active')`)
      } else if (hasApproved) {
        // Treat non-zero/true as approved
        if (approved) where.push(`COALESCE(approved, 0) <> 0`)
        else where.push(`COALESCE(approved, 0) = 0`)
      }
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : ''

    // Select only columns that exist
    const selectCols = ['id', 'email', 'name']
    if (hasRoleId) selectCols.push('role_id')
    if (hasRoleText) selectCols.push('role')
    if (hasRating) selectCols.push('rating')
    if (hasPhone) selectCols.push('phone')
    if (hasStatus) selectCols.push('status')
    else if (hasApproved) selectCols.push('approved')

    const rowsRes = await client.execute({
      sql: `
        SELECT ${selectCols.join(', ')}
        FROM users
        ${whereSQL}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `,
      args: [...args, limit, offset],
    })

    const data = rowsRes.rows.map((row: any) => {
      const roleName = hasRoleId
        ? ROLE_NAMES[Number(row.role_id)] ?? 'client'
        : hasRoleText
          ? String(row.role ?? 'client').toLowerCase()
          : 'client'

      const statusRaw = hasStatus ? row.status : (hasApproved ? (row.approved ? 'active' : 'pending') : 'pending')
      const status = normalizeStatus(statusRaw)
      const isApproved = status === 'approved' || status === 'active'

      return {
        id: row.id,
        displayId: `U-${row.id}`,
        email: row.email,
        name: row.name,
        role: roleName,
        approved: isApproved,
        balance: 0,
        rating: Number((hasRating ? row.rating : 0) ?? 0),
        phone: hasPhone ? (row.phone ?? null) : null,
        status: isApproved ? 'active' : status,
        createdAt: null,
        updatedAt: null,
      }
    })

    return NextResponse.json(data, { status: 200 })
  }

  const runDrizzleFallback = async () => {
    const { searchParams } = new URL(request.url)
    const roleParam = searchParams.get('role')
    const approvedParam = searchParams.get('approved')
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
    const offset = parseInt(searchParams.get('offset') ?? '0')

    const conditions: any[] = []

    if (roleParam) {
      const roles = roleParam
        .split(',')
        .map((r) => r.trim().toLowerCase())
        .filter((r) => ['admin', 'client', 'freelancer', 'manager', 'account_owner'].includes(r))

      if (roles.length > 0) {
        // Special handling: if asking for account_owner in some pages, include clients too when needed
        const includeClientsWithAccountOwners = roles.length === 1 && roles[0] === 'account_owner'
        if (includeClientsWithAccountOwners) {
          conditions.push(or(eq(usersTable.role, 'account_owner'), eq(usersTable.role, 'client')))
        } else {
          conditions.push(inArray(usersTable.role, roles as any))
        }
      }
    }

    if (approvedParam !== null) {
      const approved = approvedParam === 'true'
      conditions.push(eq(usersTable.approved, approved))
    }

    const rows = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        role: usersTable.role,
        phone: usersTable.phone,
        status: usersTable.status,
        approved: usersTable.approved,
        rating: usersTable.rating,
      })
      .from(usersTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)

    const data = rows.map((row) => {
      const statusNorm = normalizeStatus(row.status)
      const isApproved = row.approved || statusNorm === 'approved' || statusNorm === 'active'
      return {
        id: row.id,
        displayId: `U-${row.id}`,
        email: row.email,
        name: row.name,
        role: String(row.role || 'client'),
        approved: Boolean(isApproved),
        balance: 0,
        rating: Number(row.rating ?? 0),
        phone: row.phone ?? null,
        status: isApproved ? 'active' : statusNorm,
        createdAt: null,
        updatedAt: null,
      }
    })

    return NextResponse.json(data, { status: 200 })
  }

  try {
    if (!process.env.TURSO_CONNECTION_URL || !process.env.TURSO_AUTH_TOKEN) {
      // Use fallback when Turso isn't configured
      return await runDrizzleFallback()
    }
    return await runLibsql()
  } catch (error) {
    // If libsql path fails for any reason, try Drizzle fallback before erroring
    try {
      return await runDrizzleFallback()
    } catch (e) {
      console.error('GET /api/users error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}