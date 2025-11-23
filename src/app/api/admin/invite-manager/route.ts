import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { managerInvitations, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { sendEmail, ADMIN_EMAILS } from '@/lib/email';
import { requireAdminRole } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    // Require admin role using centralized helper
    const authCheck = await requireAdminRole(req);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const adminUser = authCheck.user;

    const body = await req.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Check if email already has an invitation
    const [existingInvitation] = await db
      .select()
      .from(managerInvitations)
      .where(eq(managerInvitations.email, email));

    if (existingInvitation && !existingInvitation.used) {
      return NextResponse.json({ 
        error: 'An invitation already exists for this email' 
      }, { status: 400 });
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 400 });
    }

    // Generate secure token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // Create invitation
    const [invitation] = await db.insert(managerInvitations).values({
      email,
      token: invitationToken,
      createdBy: adminUser.id,
      createdAt: new Date().toISOString(),
      used: false,
      expiresAt,
    }).returning();

    // Use tasklynk.co.ke domain for the invitation link
    const invitationLink = `https://tasklynk.co.ke/manager/register?token=${invitationToken}`;

    // Send email invitation
    const emailHTML = getManagerInvitationEmailHTML(email, invitationLink, String(adminUser.name ?? 'Admin'));
    const emailResult = await sendEmail({
      to: email,
      subject: 'Manager Invitation - TaskLynk Academic Platform',
      html: emailHTML,
    });

    console.log('Email send result:', emailResult);

    return NextResponse.json({
      success: true,
      token: invitationToken,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      invitationLink,
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error('Error creating manager invitation:', error);
    return NextResponse.json({ 
      error: 'Failed to create invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Email template for manager invitation
function getManagerInvitationEmailHTML(email: string, invitationLink: string, adminName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Manager Invitation - TaskLynk Academic</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                ${getEmailHeader()}
                
                <tr>
                  <td style="padding: 40px 30px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                      <div style="display: inline-block; width: 80px; height: 80px; background-color: #1D3557; border-radius: 50%; text-align: center; line-height: 80px;">
                        <span style="font-size: 40px; color: #ffffff;">👔</span>
                      </div>
                    </div>
                    
                    <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; text-align: center;">You're Invited to Join TaskLynk as a Manager</h2>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      Hello,
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      ${adminName} has invited you to join TaskLynk Academic as a <strong>Manager</strong>. As a manager, you'll have the ability to:
                    </p>
                    
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 18px;">Manager Privileges</h3>
                      <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 2;">
                        <li>Accept and approve client orders</li>
                        <li>Assign orders to writers under your management</li>
                        <li>Review and deliver completed work to clients</li>
                        <li>Manage revisions and client communications</li>
                        <li>Track writer performance and productivity</li>
                        <li>Access comprehensive analytics and reporting</li>
                      </ul>
                    </div>
                    
                    <div style="background-color: #dbeafe; border-left: 4px solid #1D3557; padding: 20px; margin: 20px 0;">
                      <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
                        <strong>🔐 Secure Registration:</strong> This invitation link is unique to <strong>${email}</strong> and can only be used once. It will expire in 7 days.
                      </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${invitationLink}" style="display: inline-block; background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                        Accept Invitation & Register
                      </a>
                    </div>
                    
                    <div style="background-color: #fef3c7; border-left: 4px solid #F2A541; padding: 20px; margin: 20px 0;">
                      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                        <strong>⏰ Important:</strong> If you don't recognize this invitation or didn't expect it, please contact TaskLynk support immediately.
                      </p>
                    </div>
                    
                    <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      If the button doesn't work, copy and paste this link into your browser:<br>
                      <a href="${invitationLink}" style="color: #1D3557; word-break: break-all; font-size: 12px;">${invitationLink}</a>
                    </p>
                    
                    <p style="margin: 30px 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      We look forward to having you on our team!<br><br>
                      Best regards,<br>
                      TaskLynk Academic Team<br>
                      <a href="mailto:admn@tasklynk.co.ke" style="color: #1D3557; text-decoration: none;">admn@tasklynk.co.ke</a> | +254701066845
                    </p>
                  </td>
                </tr>
                
                ${getEmailFooter()}
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function getEmailHeader(): string {
  return `
    <tr>
      <td style="background: linear-gradient(135deg, #1D3557 0%, #457B9D 100%); padding: 40px 30px; text-align: center;">
        <div style="margin-bottom: 15px;">
          <img src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/Revised-logo-1761824652421.png?width=800&height=800&resize=contain" alt="TaskLynk Logo" style="height: 50px; width: auto;" onerror="this.style.display='none'">
        </div>
        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">TaskLynk Academic</h1>
        <p style="margin: 10px 0 0; color: #F2A541; font-size: 16px;">Professional Academic Writing Platform</p>
      </td>
    </tr>
  `;
}

function getEmailFooter(): string {
  return `
    <tr>
      <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
          © 2025 TaskLynk Academic. All rights reserved.
        </p>
        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
          Nairobi, Kenya | admn@tasklynk.co.ke | +254701066845
        </p>
        <p style="margin: 10px 0 0; color: #9ca3af; font-size: 12px;">
          <a href="https://tasklynk.co.ke" style="color: #1D3557; text-decoration: none;">Visit Website</a>
        </p>
      </td>
    </tr>
  `;
}