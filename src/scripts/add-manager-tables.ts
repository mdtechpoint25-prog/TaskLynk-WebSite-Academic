import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function addManagerTables() {
  try {
    console.log('Starting manager tables creation...');

    // Create managers table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS managers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        phone TEXT,
        balance REAL NOT NULL DEFAULT 0,
        total_earnings REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✓ managers table created');

    // Create client_manager table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS client_manager (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        manager_id INTEGER NOT NULL,
        assigned_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (client_id) REFERENCES users(id),
        FOREIGN KEY (manager_id) REFERENCES users(id)
      )
    `);
    console.log('✓ client_manager table created');

    // Create manager_earnings table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS manager_earnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        manager_id INTEGER NOT NULL,
        job_id INTEGER NOT NULL,
        earning_type TEXT NOT NULL,
        amount REAL NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (manager_id) REFERENCES users(id),
        FOREIGN KEY (job_id) REFERENCES jobs(id)
      )
    `);
    console.log('✓ manager_earnings table created');

    console.log('All manager tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating manager tables:', error);
    process.exit(1);
  }
}

addManagerTables();
