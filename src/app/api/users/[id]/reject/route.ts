import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
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
    
    // Check if user exists via drizzle
    const [userRow] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userRow) {
      return NextResponse.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, { status: 404 });
    }

    // Update user status to 'rejected'
    const now = new Date().toISOString();
    await db.update(users).set({ status: 'rejected', updatedAt: now }).where(eq(users.id, userId));

    console.log(`[Reject] User ${userId} rejected successfully`);

    // 📝 AUDIT: Log rejection action
    await logAdminActionWithRequest(
      request,
      adminUser.id,
      AdminActions.REJECT_USER,
      userId,
      AuditTargetTypes.USER,
      {
        userEmail: userRow.email,
        userName: userRow.name,
        userRole: userRow.role,
        rejectionReason: trimmedReason || 'No reason provided',
      }
    );

    // Create notification for user (best-effort)
    try {
      const message = trimmedReason 
        ? `Your account application has been rejected. Reason: ${trimmedReason}`
        : 'Your account application has been rejected. Please contact support for more information.';

      await db.insert(notifications).values({
        userId: userId,
        jobId: null,
        type: 'account_rejected',
        title: 'Account Rejected',
        message,
        read: false,
        createdAt: now,
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    // Send email notification (best-effort)
    try {
      await sendEmail({
        to: String(userRow.email),
        subject: 'TaskLynk Account Application Update',
        html: getAccountRejectedEmailHTML(String(userRow.name), String(userRow.role)),
      });
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }

    // Return updated user data
    const [updatedUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      status: updatedUser.status,
      phone: updatedUser.phone
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