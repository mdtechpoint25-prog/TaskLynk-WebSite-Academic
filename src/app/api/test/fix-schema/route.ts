import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    const migrations = [
      // Add missing columns to users table
      `ALTER TABLE users ADD COLUMN display_id TEXT`,
      `ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN earned REAL NOT NULL DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN total_earnings REAL NOT NULL DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN profile_picture_url TEXT`,
      `ALTER TABLE users ADD COLUMN last_login_at TEXT`,
      `ALTER TABLE users ADD COLUMN last_login_ip TEXT`,
      `ALTER TABLE users ADD COLUMN last_login_device TEXT`,
      `ALTER TABLE users ADD COLUMN login_count INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN domain_id INTEGER`,
      `ALTER TABLE users ADD COLUMN account_id INTEGER`,
      `ALTER TABLE users ADD COLUMN account_name TEXT`,
      `ALTER TABLE users ADD COLUMN assigned_manager_id INTEGER`,
      `ALTER TABLE users ADD COLUMN freelancer_badge TEXT`,
      `ALTER TABLE users ADD COLUMN client_tier TEXT DEFAULT 'basic'`,
      `ALTER TABLE users ADD COLUMN client_priority TEXT NOT NULL DEFAULT 'regular'`,
    ];

    const results = [];
    for (const migration of migrations) {
      try {
        await db.run(sql.raw(migration));
        results.push({ success: true, query: migration });
      } catch (error: any) {
        // Ignore "duplicate column" errors
        if (error.message && error.message.includes('duplicate column')) {
          results.push({ skipped: true, query: migration, reason: 'Column already exists' });
        } else {
          results.push({ error: error.message, query: migration });
        }
      }
    }

    return NextResponse.json({ 
      message: 'Schema fix attempted',
      results 
    });
  } catch (error) {
    console.error('Schema fix error:', error);
    return NextResponse.json({ error: 'Error fixing schema', details: error }, { status: 500 });
  }
}