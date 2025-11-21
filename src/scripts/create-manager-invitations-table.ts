import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function createManagerInvitationsTable() {
  try {
    console.log('Creating manager_invitations table...');
    
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS manager_invitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        token TEXT NOT NULL UNIQUE,
        created_by INTEGER REFERENCES users(id),
        created_at TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        used_at TEXT,
        expires_at TEXT
      )
    `);
    
    console.log('✅ manager_invitations table created successfully!');
  } catch (error) {
    console.error('❌ Error creating manager_invitations table:', error);
  }
}

createManagerInvitationsTable();
