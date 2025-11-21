import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get table schema
    const result = await db.all(sql`PRAGMA table_info(users)`);
    return NextResponse.json({ schema: result });
  } catch (error) {
    console.error('Schema check error:', error);
    return NextResponse.json({ error: 'Error checking schema' }, { status: 500 });
  }
}
