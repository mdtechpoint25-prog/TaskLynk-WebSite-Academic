import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { sendEmailToAdmins, getNewUserRegistrationAdminHTML } from '@/lib/email';

// Map role names to role_id - MUST MATCH login/route.ts ROLE_NAMES
const ROLE_MAP: Record<string, number> = {
  'admin': 1,
  'client': 2,
  'manager': 3,
  'freelancer': 4,
  'account_owner': 5
};

// Generate display ID based on role
function generateDisplayId(role: string, id: number): string {
  const prefix = role === 'admin' ? 'ADM' 
    : role === 'client' || role === 'account_owner' ? 'CLI'
    : role === 'freelancer' ? 'WRT'
    : role === 'manager' ? 'MGR'
    : 'USR';
  return `${prefix}${String(id).padStart(5, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // Validation
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json({ error: 'Email is required', code: 'MISSING_EMAIL' }, { status: 400 });
    }

    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json({ error: 'Verification code is required', code: 'MISSING_CODE' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    console.log('[Verify] Attempting verification for:', normalizedEmail);

    // Create direct database client
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Find pending registration
    const currentTimestamp = new Date().toISOString();
    const pendingResult = await client.execute({
      sql: `SELECT * FROM pending_registrations 
            WHERE email = ? AND verification_code = ? AND code_expires_at > ?`,
      args: [normalizedEmail, normalizedCode, currentTimestamp]
    });

    if (pendingResult.rows.length === 0) {
      console.log('[Verify] No matching pending registration found');
      return NextResponse.json({ error: 'Invalid or expired verification code', code: 'INVALID_CODE' }, { status: 400 });
    }

    const pending = pendingResult.rows[0];
    console.log('[Verify] Found pending registration for role:', pending.role);

    // Check if user already exists
    const existingUser = await client.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [normalizedEmail]
    });

    if (existingUser.rows.length > 0) {
      console.log('[Verify] User already exists, cleaning up');
      await client.execute({
        sql: 'DELETE FROM pending_registrations WHERE email = ?',
        args: [normalizedEmail]
      });
      return NextResponse.json({
        success: true,
        message: 'Email already verified. You can now sign in.'
      }, { status: 200 });
    }

    // Get role_id
    const role = String(pending.role);
    const roleId = ROLE_MAP[role] || 2; // Default to client (2)
    const isAdmin = role === 'admin';

    // 🔴 CRITICAL FIX: Admin accounts are auto-approved
    // Determine initial status and approval based on role
    // Admin accounts: status = 'active', approved = 1 (auto-approved, no manual approval needed)
    // Account Owners: status = 'active', approved = 1 (auto-approved)
    // Others: status = 'pending', approved = 0 (need manual approval)
    const initialStatus = (isAdmin || role === 'account_owner') ? 'active' : 'pending';
    const isApproved = (isAdmin || role === 'account_owner') ? 1 : 0;
    const now = new Date().toISOString();

    // Create user without display_id first to get the ID
    const insertResult = await client.execute({
      sql: `INSERT INTO users (
        email, password, name, phone, role, role_id, status, approved,
        balance, earned, total_earned, rating, rating_average, rating_count,
        total_spent, completed_jobs, login_count,
        account_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?, ?)`,
      args: [
        normalizedEmail,
        String(pending.password),
        String(pending.name),
        String(pending.phone || '+254700000000'),
        role,
        roleId,
        initialStatus,
        isApproved,
        pending.accountName || null,
        now,
        now
      ]
    });

    // Get the new user ID
    const newUserResult = await client.execute({
      sql: 'SELECT id FROM users WHERE email = ? ORDER BY id DESC LIMIT 1',
      args: [normalizedEmail]
    });

    if (newUserResult.rows.length === 0) {
      throw new Error('Failed to retrieve new user ID');
    }

    const newUserId = Number(newUserResult.rows[0].id);
    const displayId = generateDisplayId(role, newUserId);

    // Update with display_id
    await client.execute({
      sql: 'UPDATE users SET display_id = ? WHERE id = ?',
      args: [displayId, newUserId]
    });

    console.log('[Verify] User created successfully:', { 
      id: newUserId, 
      displayId, 
      status: initialStatus, 
      approved: isApproved,
      role 
    });

    // Delete pending registration
    await client.execute({
      sql: 'DELETE FROM pending_registrations WHERE email = ?',
      args: [normalizedEmail]
    });

    // Send notification to admins (don't wait for it)
    // Only send for non-admin, non-account_owner roles
    if (!isAdmin && role !== 'account_owner') {
      sendEmailToAdmins({
        subject: `New ${role} Registration - ${pending.name}`,
        html: getNewUserRegistrationAdminHTML(
          String(pending.name),
          normalizedEmail,
          role,
          String(pending.phone || 'Not provided')
        )
      }).catch(err => console.error('Failed to send admin notification:', err));
    }

    return NextResponse.json({ 
      success: true,
      message: initialStatus === 'active' 
        ? 'Email verified successfully! You can now log in.' 
        : 'Email verified! Your account is pending admin approval. You will be notified once approved.',
    }, { status: 200 });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}