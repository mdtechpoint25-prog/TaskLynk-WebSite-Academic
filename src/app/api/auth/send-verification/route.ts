import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pendingRegistrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail, getEmailVerificationHTML } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json({ 
        error: 'Email is required',
        code: 'MISSING_EMAIL' 
      }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find pending registration
    const pending = await db.select()
      .from(pendingRegistrations)
      .where(eq(pendingRegistrations.email, normalizedEmail))
      .limit(1);

    if (pending.length === 0) {
      return NextResponse.json({ 
        error: 'No pending registration found for this email',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    const registration = pending[0];

    // Check cooldown - 60 seconds between resends
    if (registration.lastCodeSent) {
      const lastSentTime = new Date(registration.lastCodeSent).getTime();
      const now = Date.now();
      const timeSinceLastSend = now - lastSentTime;
      const cooldownMs = 60 * 1000; // 60 seconds

      if (timeSinceLastSend < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastSend) / 1000);
        return NextResponse.json({ 
          error: `Please wait ${remainingSeconds} seconds before requesting another code`,
          code: 'RATE_LIMITED',
          remainingSeconds
        }, { status: 429 });
      }
    }

    // Generate new 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update expiration (15 minutes from now)
    const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    // Update pending registration with new code and timestamp
    await db.update(pendingRegistrations)
      .set({
        verificationCode,
        codeExpiresAt,
        lastCodeSent: now
      })
      .where(eq(pendingRegistrations.email, normalizedEmail));

    // Send verification email
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Verify Your Email - TaskLynk Academic',
        html: getEmailVerificationHTML(registration.name, verificationCode)
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json({ 
        error: 'Failed to send verification email',
        code: 'EMAIL_SEND_FAILED'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'New verification code sent to your email'
    }, { status: 200 });

  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}