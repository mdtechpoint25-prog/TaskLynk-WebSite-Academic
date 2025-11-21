import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { sendEmail, getAccountApprovedEmailHTML } from '@/lib/email';
import { requireAdminRole } from '@/lib/admin-auth';
import { logAdminActionWithRequest, AdminActions, AuditTargetTypes } from '@/lib/admin-audit';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔒 SECURITY: Require admin role
    const authCheck = await requireAdminRole(_request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const adminUser = authCheck.user!;
    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid user ID is required',
          code: 'INVALID_USER_ID'
        },
        { status: 400 }
      );
    }

    const userId = parseInt(id);

    // Create direct database client
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Check if user exists
    const existingUser = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [userId]
    });

    if (existingUser.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const user = existingUser.rows[0];

    // 🔴 CRITICAL FIX: Update both 'approved' field AND 'status' to 'active' once approved
    await client.execute({
      sql: 'UPDATE users SET approved = ?, status = ?, updated_at = ? WHERE id = ?',
      args: [1, 'active', new Date().toISOString(), userId]
    });

    console.log(`[Approve] User ${userId} approved successfully`);

    // 📝 AUDIT: Log admin action
    await logAdminActionWithRequest(
      _request,
      adminUser.id,
      AdminActions.APPROVE_USER,
      userId,
      AuditTargetTypes.USER,
      {
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
      }
    );

    // Create notification (best-effort)
    try {
      await client.execute({
        sql: `INSERT INTO notifications (user_id, type, title, message, read, created_at) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          userId,
          'account_approved',
          'Account Approved',
          `Congratulations! Your account has been approved. You can now start using TaskLynk.`,
          0,
          new Date().toISOString()
        ]
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    // Send email (best-effort)
    try {
      await sendEmail({
        to: String(user.email),
        subject: '🎉 Your TaskLynk Account Has Been Approved!',
        html: getAccountApprovedEmailHTML(String(user.name), String(user.role)),
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    // Return updated user data
    const updatedUser = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [userId]
    });

    const updatedUserData = updatedUser.rows[0];

    return NextResponse.json({
      id: updatedUserData.id,
      email: updatedUserData.email,
      name: updatedUserData.name,
      role: updatedUserData.role,
      approved: updatedUserData.approved,
      status: updatedUserData.status,
      phone: updatedUserData.phone
    }, { status: 200 });
  } catch (error) {
    console.error('POST error (approve):', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}