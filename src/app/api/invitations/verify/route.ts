import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { managerInvitations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Token is required' 
      }, { status: 400 });
    }

    // Find invitation
    const [invitation] = await db
      .select()
      .from(managerInvitations)
      .where(eq(managerInvitations.token, token));

    if (!invitation) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid token' 
      }, { status: 404 });
    }

    // Check if already used
    if (invitation.used) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Token has already been used',
        email: invitation.email
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
          valid: false, 
          error: 'Token has expired',
          email: invitation.email,
          expiresAt: invitation.expiresAt
        }, { status: 400 });
      }
    }

    return NextResponse.json({ 
      valid: true, 
      email: invitation.email,
      expiresAt: invitation.expiresAt
    });
  } catch (error) {
    console.error('Error verifying invitation:', error);
    return NextResponse.json({ 
      valid: false,
      error: 'Failed to verify token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}