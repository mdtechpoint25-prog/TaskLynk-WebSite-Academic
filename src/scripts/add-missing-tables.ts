import { db } from '@/db';

async function addMissingTablesAndFields() {
  console.log('🔄 Starting database migration for missing tables and fields...\n');

  try {
    // 1. Create invitations table
    console.log('📋 Creating invitations table...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS invitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending',
        used INTEGER NOT NULL DEFAULT 0,
        expires_at TEXT NOT NULL,
        created_by_admin_id INTEGER REFERENCES users(id),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ invitations table created\n');

    // 2. Create writer_balances table
    console.log('📋 Creating writer_balances table...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS writer_balances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        writer_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
        available_balance REAL NOT NULL DEFAULT 0,
        pending_balance REAL NOT NULL DEFAULT 0,
        total_earned REAL NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ writer_balances table created\n');

    // 3. Create order_history table
    console.log('📋 Creating order_history table...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS order_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL REFERENCES jobs(id),
        action TEXT NOT NULL,
        old_status TEXT,
        new_status TEXT,
        actor_id INTEGER REFERENCES users(id),
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ order_history table created\n');

    // 4. Add manager_id column to jobs table if not exists
    console.log('📋 Adding manager_id column to jobs table...');
    try {
      await db.run(`ALTER TABLE jobs ADD COLUMN manager_id INTEGER REFERENCES users(id)`);
      console.log('✅ manager_id column added to jobs table\n');
    } catch (error: any) {
      if (error.message?.includes('duplicate column')) {
        console.log('ℹ️  manager_id column already exists in jobs table\n');
      } else {
        throw error;
      }
    }

    // 5. Add role column to manager_invitations table if not exists
    console.log('📋 Adding role column to manager_invitations table...');
    try {
      await db.run(`ALTER TABLE manager_invitations ADD COLUMN role TEXT DEFAULT 'manager'`);
      console.log('✅ role column added to manager_invitations table\n');
    } catch (error: any) {
      if (error.message?.includes('duplicate column')) {
        console.log('ℹ️  role column already exists in manager_invitations table\n');
      } else {
        throw error;
      }
    }

    // 6. Add status column to manager_invitations table if not exists
    console.log('📋 Adding status column to manager_invitations table...');
    try {
      await db.run(`ALTER TABLE manager_invitations ADD COLUMN status TEXT DEFAULT 'pending'`);
      console.log('✅ status column added to manager_invitations table\n');
    } catch (error: any) {
      if (error.message?.includes('duplicate column')) {
        console.log('ℹ️  status column already exists in manager_invitations table\n');
      } else {
        throw error;
      }
    }

    // 7. Create indexes for better performance
    console.log('📋 Creating indexes...');
    
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_writer_balances_writer_id ON writer_balances(writer_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_order_history_job_id ON order_history(job_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_jobs_manager_id ON jobs(manager_id)`);
    
    console.log('✅ Indexes created\n');

    console.log('✅ ✅ ✅ Migration completed successfully! ✅ ✅ ✅\n');
    console.log('📊 Summary of changes:');
    console.log('  ✓ invitations table created');
    console.log('  ✓ writer_balances table created');
    console.log('  ✓ order_history table created');
    console.log('  ✓ jobs.manager_id field added');
    console.log('  ✓ manager_invitations.role field added');
    console.log('  ✓ manager_invitations.status field added');
    console.log('  ✓ Indexes created for performance\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
addMissingTablesAndFields()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
