import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { sendEmail, getAccountRejectedEmailHTML } from '@/lib/email';
import { requireAdminRole } from '@/lib/admin-auth';
import { logAdminActionWithRequest, AdminActions, AuditTargetTypes } from '@/lib/admin-audit';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const adminUser = authCheck.user!;
    const { id } = params;

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

    // Parse request body
    const body = await request.json();
    const { reason } = body;

    // Validate reason is provided
    const trimmedReason = reason ? String(reason).trim() : '';
    
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
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const user = existingUser.rows[0];

    // Update user status to 'rejected'
    await client.execute({
      sql: 'UPDATE users SET status = ? WHERE id = ?',
      args: ['rejected', userId]
    });

    console.log(`[Reject] User ${userId} rejected successfully`);

    // 📝 AUDIT: Log rejection action
    await logAdminActionWithRequest(
      request,
      adminUser.id,
      AdminActions.REJECT_USER,
      userId,
      AuditTargetTypes.USER,
      {
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        rejectionReason: trimmedReason || 'No reason provided',
      }
    );

    // Create notification for user (best-effort)
    try {
      const message = trimmedReason 
        ? `Your account application has been rejected. Reason: ${trimmedReason}`
        : 'Your account application has been rejected. Please contact support for more information.';
      
      await client.execute({
        sql: `INSERT INTO notifications (user_id, type, title, message, read, created_at) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          userId,
          'account_rejected',
          'Account Rejected',
          message,
          0,
          new Date().toISOString()
        ]
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    // Send email notification (best-effort)
    try {
      await sendEmail({
        to: String(user.email),
        subject: 'TaskLynk Account Application Update',
        html: getAccountRejectedEmailHTML(String(user.name), String(user.role_id)),
      });
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
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
      role_id: updatedUserData.role_id,
      status: updatedUserData.status,
      phone: updatedUserData.phone
    }, { status: 200 });

  } catch (error) {
    console.error('POST /api/users/[id]/reject error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}