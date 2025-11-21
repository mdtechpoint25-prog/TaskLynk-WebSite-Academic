import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import bcrypt from 'bcrypt';

// Map role_id to role names (based on roles table: 1=admin, 2=client, 3=manager, 4=writer)
const ROLE_NAMES: Record<number, string> = {
  1: 'admin',
  2: 'client',
  3: 'manager',
  4: 'freelancer', // Changed from 'writer' to 'freelancer' for consistency
  // Legacy/fallback mappings for old data
  5: 'account_owner'
};

// Normalize various status variants coming from DB/migrations
function normalizeStatus(raw: unknown): 'approved' | 'active' | 'pending' | 'rejected' | 'suspended' | 'blacklisted' {
  const s = String(raw || '').trim().toLowerCase();
  if (['approved', 'active'].includes(s)) return s as 'approved' | 'active';
  if (['pending', 'awaiting_approval', 'awaiting-approval', 'unverified', 'new', 'inactive', 'not_approved'].includes(s)) return 'pending';
  if (s === 'rejected') return 'rejected';
  if (s === 'suspended') return 'suspended';
  if (s === 'blacklisted') return 'blacklisted';
  // Default to pending for unknown/empty
  return 'pending';
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    console.log('[Login] Attempting login for:', email);

    // Create direct database client
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Find user by email
    const userResult = await client.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email.trim().toLowerCase()]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user: any = userResult.rows[0];
    const userStatus = normalizeStatus(user.status);
    console.log('[Login] User found:', { id: user.id, email: user.email, role_id: user.role_id, role: user.role, status: userStatus });

    // Hard blocks
    if (userStatus === 'rejected') {
      return NextResponse.json({ 
        error: 'Your account has been rejected. Please contact support for more information.',
        code: 'ACCOUNT_REJECTED'
      }, { status: 403 });
    }

    if (userStatus === 'blacklisted') {
      return NextResponse.json({ 
        error: 'Your account has been blacklisted. Please contact support.',
        code: 'ACCOUNT_BLACKLISTED'
      }, { status: 403 });
    }

    if (userStatus === 'suspended') {
      return NextResponse.json({ 
        error: 'Your account is currently suspended. Please contact support.',
        code: 'ACCOUNT_SUSPENDED'
      }, { status: 403 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, String(user.password));
    
    if (!isPasswordValid) {
      console.log('[Login] Password verification FAILED');
      return NextResponse.json({ 
        error: 'Invalid email or password'
      }, { status: 401 });
    }

    console.log('[Login] Password verification SUCCESSFUL');

    // Update login tracking (only columns that exist in schema)
    const now = new Date().toISOString();
    await client.execute({
      sql: 'UPDATE users SET last_login_at = ?, login_count = login_count + 1 WHERE id = ?',
      args: [now, user.id]
    });

    // Convert role to role name using role_id if present, otherwise fallback to text role
    let roleName: string | undefined;
    if (user.role_id != null) {
      roleName = ROLE_NAMES[Number(user.role_id)];
    }
    if (!roleName && user.role) {
      roleName = String(user.role).toLowerCase();
    }
    const finalRole = roleName || 'client';
    
    // Determine if user is approved
    const isApproved = userStatus === 'approved' || userStatus === 'active' || Boolean(user.approved);

    // Calculate session expiry based on rememberMe
    const sessionExpiry = rememberMe 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Return user data with role name and session info
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: finalRole,
      approved: isApproved,
      balance: Number(user.balance || 0),
      rating: Number(user.rating || 0),
      phone: user.phone,
      status: isApproved ? 'active' : userStatus,
      suspendedUntil: user.suspended_until ?? null,
      suspensionReason: user.suspension_reason ?? null,
      blacklistReason: user.blacklist_reason ?? null,
      rejectedAt: userStatus === 'rejected' ? (user.created_at || new Date().toISOString()) : null,
      rejectionReason: user.rejection_reason ?? null,
      totalEarned: Number(user.total_earned || user.earned || 0),
      totalSpent: Number(user.total_spent || 0),
      completedJobs: Number(user.completed_jobs || 0),
      completionRate: user.completion_rate ?? null,
      lastLoginAt: user.last_login_at ?? null,
      lastLoginIp: user.last_login_ip ?? null,
      lastLoginDevice: user.last_login_device ?? null,
      loginCount: Number(user.login_count ?? 0) + 1,
      sessionExpiry: sessionExpiry.toISOString(),
      rememberMe: rememberMe || false,
    });
  } catch (error: any) {
    console.error('[Login] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}