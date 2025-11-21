import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import bcrypt from 'bcrypt';
import { sendEmail, getPasswordChangeConfirmationHTML } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, currentPassword, newPassword } = body;

    // Validation
    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    if (!currentPassword) {
      return NextResponse.json({ 
        error: 'Current password is required',
        code: 'MISSING_CURRENT_PASSWORD' 
      }, { status: 400 });
    }

    if (!newPassword) {
      return NextResponse.json({ 
        error: 'New password is required',
        code: 'MISSING_NEW_PASSWORD' 
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'New password must be at least 6 characters',
        code: 'PASSWORD_TOO_SHORT' 
      }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ 
        error: 'New password must be different from current password',
        code: 'SAME_PASSWORD' 
      }, { status: 400 });
    }

    console.log('[Change Password] Request for user ID:', userId);

    // Create direct database client
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Find user
    const userResult = await client.execute({
      sql: 'SELECT * FROM users WHERE id = ?',
      args: [userId]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    const user: any = userResult.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, String(user.password));
    
    if (!isCurrentPasswordValid) {
      console.log('[Change Password] Current password verification FAILED');
      return NextResponse.json({ 
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD' 
      }, { status: 401 });
    }

    console.log('[Change Password] Current password verified, updating...');

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const now = new Date().toISOString();
    await client.execute({
      sql: 'UPDATE users SET password = ?, updated_at = ? WHERE id = ?',
      args: [hashedPassword, now, userId]
    });

    console.log('[Change Password] Password updated successfully');

    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Changed Successfully - TaskLynk',
        html: getPasswordChangeConfirmationHTML(user.name)
      });
      console.log('[Change Password] Confirmation email sent');
    } catch (emailError) {
      console.error('[Change Password] Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'Password changed successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('[Change Password] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
