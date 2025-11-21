import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { managerInvitations, users, managers } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Helper: generate a unique manager displayId with retries
async function generateUniqueManagerDisplayId(): Promise<string> {
  // Try up to 10 times to avoid rare collisions
  for (let i = 0; i < 10; i++) {
    const suffix = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    const displayId = `MNG${suffix}`;
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.displayId, displayId));
    if (!existing) return displayId;
  }
  // Last resort: timestamp-based id
  const ts = Date.now().toString().slice(-6);
  return `MNG${ts}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password, fullName, phoneNumber } = body;

    console.log('Manager registration attempt with token:', token);

    if (!token || !password || !fullName) {
      return NextResponse.json({ 
        error: 'Token, password, and full name are required' 
      }, { status: 400 });
    }

    // Verify invitation
    const [invitation] = await db
      .select()
      .from(managerInvitations)
      .where(eq(managerInvitations.token, token));

    console.log('Invitation found:', invitation ? 'Yes' : 'No');

    if (!invitation) {
      return NextResponse.json({ 
        error: 'Invalid or expired invitation link' 
      }, { status: 404 });
    }

    // ✅ CRITICAL FIX: Check if already used
    if (invitation.used) {
      return NextResponse.json({ 
        error: 'This invitation link has already been used' 
      }, { status: 400 });
    }

    // ✅ CRITICAL FIX: Check if expired
    if (invitation.expiresAt) {
      const now = new Date();
      const expiryDate = new Date(invitation.expiresAt);
      
      if (now > expiryDate) {
        // Mark as expired in database
        await db
          .update(managerInvitations)
          .set({ status: 'expired' })
          .where(eq(managerInvitations.id, invitation.id));
        
        return NextResponse.json({ 
          error: 'This invitation link has expired',
          expiresAt: invitation.expiresAt
        }, { status: 400 });
      }
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, invitation.email));

    if (existingUser) {
      return NextResponse.json({ 
        error: 'A user account already exists with this email' 
      }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const now = new Date().toISOString();
    const displayId = await generateUniqueManagerDisplayId();
    const phoneValue = (phoneNumber ?? '').toString() || '';

    console.log('Creating manager with displayId:', displayId);

    let newUser:
      | { id: number; email: string; name: string; role: string; displayId: string }
      | undefined;

    try {
      // Create user with manager role
      await db.run(sql`
        INSERT INTO users (
          display_id, email, password, name, role, phone,
          approved, email_verified, status,
          balance, earned, total_earnings,
          rating, rating_average, rating_count,
          badge_list, presence_status,
          total_earned, total_spent, completed_jobs, completed_orders, login_count,
          client_tier, client_priority, created_at, updated_at
        ) VALUES (
          ${displayId}, ${invitation.email}, ${hashedPassword}, ${fullName},
          'manager', ${phoneValue},
          1, 1, 'approved',
          0, 0, 0,
          0, 0, 0,
          '[]', 'offline',
          0, 0, 0, 0, 0,
          'basic', 'regular', ${now}, ${now}
        )
      `);

      console.log('Raw SQL insert successful');

      // Fetch the created user
      const [fetched] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          displayId: users.displayId,
        })
        .from(users)
        .where(eq(users.email, invitation.email));

      if (fetched) {
        newUser = fetched as any;
        console.log('Manager fetched after insert:', newUser);
      }
    } catch (insertError: any) {
      console.error('Raw SQL insert failed:', insertError);
      return NextResponse.json({
        error: 'Account creation failed: ' + (insertError.message || 'Unknown database error'),
        details: insertError.message || 'Failed to create user record'
      }, { status: 500 });
    }

    if (!newUser) {
      return NextResponse.json({
        error: 'Account creation failed: User record not found after insert',
      }, { status: 500 });
    }

    console.log('Manager created successfully:', newUser?.id);

    // Create manager profile with correct schema columns
    try {
      const [existingProfile] = await db
        .select({ id: managers.id })
        .from(managers)
        .where(eq(managers.userId, newUser.id));
      
      if (!existingProfile) {
        // Create manager profile using actual schema columns (userId, phone, balance, totalEarnings, status)
        await db.insert(managers).values({
          userId: newUser.id,
          phone: phoneValue || null,
          balance: 0,
          totalEarnings: 0,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        });
        console.log('Manager profile created');
      }
    } catch (mgrErr) {
      console.error('Failed to create manager profile:', mgrErr);
      // Do not fail the entire request if profile creation fails
    }

    // Mark invitation as used
    await db
      .update(managerInvitations)
      .set({
        used: true,
        usedAt: now,
        status: 'used',
      })
      .where(eq(managerInvitations.id, invitation.id));

    console.log('Invitation marked as used');

    return NextResponse.json({
      success: true,
      message: 'Manager account created successfully! You can now log in.',
      user: newUser,
    });
  } catch (error) {
    console.error('Error registering manager:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Failed to register manager',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}