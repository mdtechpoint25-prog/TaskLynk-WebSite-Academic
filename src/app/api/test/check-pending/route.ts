import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pendingRegistrations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const pending = await db.select()
      .from(pendingRegistrations)
      .where(eq(pendingRegistrations.email, email.trim().toLowerCase()))
      .limit(1);

    return NextResponse.json({
      found: pending.length > 0,
      data: pending[0] || null
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ error: 'Error checking pending registrations' }, { status: 500 });
  }
}
