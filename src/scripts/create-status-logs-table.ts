import { db } from '../db';
import { sql } from 'drizzle-orm';

async function createStatusLogsTable() {
  try {
    console.log('Creating job_status_logs table...');
    
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS job_status_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL REFERENCES jobs(id),
        old_status TEXT,
        new_status TEXT NOT NULL,
        changed_by INTEGER REFERENCES users(id),
        note TEXT,
        created_at TEXT NOT NULL
      )
    `);
    
    console.log('✅ job_status_logs table created successfully!');
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  }
}

createStatusLogsTable()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
