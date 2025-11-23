import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

    // Check if user exists via drizzle
    const [userRow] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userRow) {
      return NextResponse.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, { status: 404 });
    }

    // Update approved flag and status
    const now = new Date().toISOString();
    await db.update(users).set({ approved: true, status: 'active', updatedAt: now }).where(eq(users.id, userId));

    console.log(`[Approve] User ${userId} approved successfully`);

    // 📝 AUDIT: Log admin action
    await logAdminActionWithRequest(
      _request,
      adminUser.id,
      AdminActions.APPROVE_USER,
      userId,
      AuditTargetTypes.USER,
      {
        userEmail: userRow.email,
        userName: userRow.name,
        userRole: userRow.role,
      }
    );

    // Create notification (best-effort)
    try {
      await db.insert(notifications).values({
        userId: userId,
        jobId: null,
        type: 'account_approved',
        title: 'Account Approved',
        message: `Congratulations! Your account has been approved. You can now start using TaskLynk.`,
        read: false,
        createdAt: now,
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    // Send email (best-effort)
    try {
      await sendEmail({
        to: String(userRow.email),
        subject: '🎉 Your TaskLynk Account Has Been Approved!',
        html: getAccountApprovedEmailHTML(String(userRow.name), String(userRow.role)),
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    // Return updated user data
    const [updatedUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      approved: updatedUser.approved,
      status: updatedUser.status,
      phone: updatedUser.phone
    }, { status: 200 });
  } catch (error) {
    console.error('POST error (approve):', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}