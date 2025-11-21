import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { createClient } from '@libsql/client';
import { requireAdminRole } from '@/lib/admin-auth';

// Map role_id to role names for raw SQL rows
const ROLE_NAMES: Record<number, string> = {
  1: 'admin',
  2: 'client',
  3: 'freelancer',
  4: 'account_owner',
  5: 'manager',
};

function normalizeStatus(raw: unknown): 'approved' | 'active' | 'pending' | 'rejected' | 'suspended' | 'blacklisted' {
  const s = String(raw || '').trim().toLowerCase();
  if (['approved', 'active'].includes(s)) return s as 'approved' | 'active';
  if (['pending', 'awaiting_approval', 'awaiting-approval', 'unverified', 'new', 'inactive', 'not_approved'].includes(s)) return 'pending';
  if (s === 'rejected') return 'rejected';
  if (s === 'suspended') return 'suspended';
  if (s === 'blacklisted') return 'blacklisted';
  return 'pending';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    // Use direct SQL client to avoid schema drift issues
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    const res = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [userId],
    });

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const row: any = res.rows[0];
    const status = normalizeStatus(row.status);
    const approved = status === 'approved' || status === 'active';
    const role = row.role ?? ROLE_NAMES[Number(row.role_id)] ?? 'client';

    // Shape response consistently with frontend User type
    const payload = {
      id: row.id,
      email: row.email,
      name: row.name,
      role,
      approved,
      balance: Number(row.balance_available ?? row.balance ?? 0),
      rating: Number(row.rating ?? 0),
      phone: row.phone,
      status: approved ? 'active' : status,
      suspendedUntil: row.suspended_until ?? null,
      suspensionReason: row.suspension_reason ?? null,
      blacklistReason: row.blacklist_reason ?? null,
      rejectedAt: status === 'rejected' ? (row.rejected_at ?? row.updated_at ?? row.created_at ?? null) : null,
      rejectionReason: row.rejection_reason ?? null,
      totalEarned: Number(row.total_earned ?? row.earned ?? 0),
      totalSpent: Number(row.total_spent ?? 0),
      completedJobs: Number(row.completed_orders ?? row.completed_jobs ?? 0),
      completionRate: row.completion_rate ?? null,
      lastLoginAt: row.last_login_at ?? null,
      lastLoginIp: row.last_login_ip ?? null,
      lastLoginDevice: row.last_login_device ?? null,
      loginCount: Number(row.login_count ?? 0),
    };

    return NextResponse.json(payload, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔒 SECURITY: Require admin role
    const authCheck = await requireAdminRole(request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { id } = await params;

    // Validate ID is valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, phone, email } = body;

    // Build update object with only provided fields
    const updates: any = {};

    // Validate name if provided
    if (name !== undefined) {
      const trimmedName = typeof name === 'string' ? name.trim() : '';
      if (trimmedName === '') {
        return NextResponse.json(
          { 
            error: 'Name must be a non-empty string',
            code: 'INVALID_NAME' 
          },
          { status: 400 }
        );
      }
      updates.name = trimmedName;
    }

    // Validate phone if provided
    if (phone !== undefined) {
      const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';
      if (trimmedPhone === '') {
        return NextResponse.json(
          { 
            error: 'Phone must be a non-empty string',
            code: 'INVALID_PHONE' 
          },
          { status: 400 }
        );
      }
      updates.phone = trimmedPhone;
    }

    // Validate email if provided
    if (email !== undefined) {
      const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json(
          { 
            error: 'Invalid email format',
            code: 'INVALID_EMAIL' 
          },
          { status: 400 }
        );
      }

      // Check if email is different from current email
      if (trimmedEmail !== existingUser[0].email) {
        // Check if email is already used by another user
        const emailExists = await db.select()
          .from(users)
          .where(and(
            eq(users.email, trimmedEmail),
            ne(users.id, userId)
          ))
          .limit(1);

        if (emailExists.length > 0) {
          return NextResponse.json(
            { 
              error: 'Email is already in use by another user',
              code: 'EMAIL_IN_USE' 
            },
            { status: 400 }
          );
        }
      }

      updates.email = trimmedEmail;
    }

    // Add updatedAt timestamp
    updates.updatedAt = new Date().toISOString();

    // Update user in database
    const updatedUser = await db.update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser[0];

    return NextResponse.json(userWithoutPassword, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}