import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function POST() {
  try {
    console.log('Starting comprehensive database migration...');

    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    const results: string[] = [];
    const errors: string[] = [];

    // Helper function to add column
    const addColumn = async (table: string, name: string, definition: string) => {
      try {
        const query = `ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`;
        await client.execute(query);
        results.push(`✅ ${table}: Added ${name}`);
        console.log(`✅ ${table}: Added ${name}`);
      } catch (error: any) {
        if (error.message?.includes('duplicate column name')) {
          results.push(`ℹ️  ${table}: ${name} exists`);
        } else {
          errors.push(`❌ ${table}: ${name} - ${error.message}`);
        }
      }
    };

    // Helper to create table if not exists
    const createTableIfNotExists = async (tableName: string, schema: string) => {
      try {
        await client.execute(schema);
        results.push(`✅ Created table: ${tableName}`);
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          results.push(`ℹ️  Table exists: ${tableName}`);
        } else {
          errors.push(`❌ Failed to create ${tableName}: ${error.message}`);
        }
      }
    };

    // 1. ACCOUNTS TABLE
    await addColumn('accounts', 'id', 'INTEGER PRIMARY KEY AUTOINCREMENT');
    await addColumn('accounts', 'account_name', 'TEXT NOT NULL UNIQUE');
    await addColumn('accounts', 'contact_person', 'TEXT NOT NULL');
    await addColumn('accounts', 'contact_email', 'TEXT NOT NULL UNIQUE');
    await addColumn('accounts', 'created_at', 'TEXT NOT NULL DEFAULT (datetime("now"))');
    await addColumn('accounts', 'updated_at', 'TEXT NOT NULL DEFAULT (datetime("now"))');

    // 2. DOMAINS TABLE
    await addColumn('domains', 'id', 'INTEGER PRIMARY KEY AUTOINCREMENT');
    await addColumn('domains', 'name', 'TEXT NOT NULL UNIQUE');
    await addColumn('domains', 'description', 'TEXT');
    await addColumn('domains', 'status', 'TEXT NOT NULL DEFAULT "active"');
    await addColumn('domains', 'max_users', 'INTEGER');
    await addColumn('domains', 'created_at', 'TEXT NOT NULL DEFAULT (datetime("now"))');
    await addColumn('domains', 'updated_at', 'TEXT NOT NULL DEFAULT (datetime("now"))');

    // 3. USERS TABLE - Rating and presence columns
    await addColumn('users', 'rating_average', 'REAL DEFAULT 0');
    await addColumn('users', 'rating_count', 'INTEGER DEFAULT 0');
    await addColumn('users', 'badge_list', "TEXT NOT NULL DEFAULT '[]'");
    await addColumn('users', 'presence_status', "TEXT NOT NULL DEFAULT 'offline'");

    // 4. USER_STATS TABLE - Create if not exists
    await createTableIfNotExists('user_stats', `
      CREATE TABLE IF NOT EXISTS user_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_jobs_posted INTEGER NOT NULL DEFAULT 0,
        total_jobs_completed INTEGER NOT NULL DEFAULT 0,
        total_jobs_cancelled INTEGER NOT NULL DEFAULT 0,
        total_amount_earned REAL NOT NULL DEFAULT 0,
        total_amount_spent REAL NOT NULL DEFAULT 0,
        average_rating REAL,
        total_ratings INTEGER NOT NULL DEFAULT 0,
        on_time_delivery INTEGER NOT NULL DEFAULT 0,
        late_delivery INTEGER NOT NULL DEFAULT 0,
        revisions_requested INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime("now")),
        updated_at TEXT NOT NULL DEFAULT (datetime("now")),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // 5. JOBS TABLE - Additional columns
    await addColumn('jobs', 'account_order_number', 'TEXT');
    await addColumn('jobs', 'account_linked', 'INTEGER NOT NULL DEFAULT 0');
    await addColumn('jobs', 'manager_earnings', 'REAL NOT NULL DEFAULT 0');
    await addColumn('jobs', 'freelancer_earnings', 'REAL NOT NULL DEFAULT 0');
    await addColumn('jobs', 'admin_profit', 'REAL NOT NULL DEFAULT 0');
    // 5b. JOBS TABLE - Submission/report flags required by API
    await addColumn('jobs', 'requires_reports', 'INTEGER NOT NULL DEFAULT 1');
    await addColumn('jobs', 'final_submission_complete', 'INTEGER NOT NULL DEFAULT 0');
    await addColumn('jobs', 'revision_submission_complete', 'INTEGER NOT NULL DEFAULT 0');

    // 6. RATINGS TABLE - Metadata column
    await addColumn('ratings', 'metadata', 'TEXT');

    // 7. JOB_ATTACHMENTS TABLE - Category column
    await addColumn('job_attachments', 'attachment_category', 'TEXT');

    // 8. JOB_STATUS_LOGS TABLE - Create if not exists
    await createTableIfNotExists('job_status_logs', `
      CREATE TABLE IF NOT EXISTS job_status_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL,
        old_status TEXT,
        new_status TEXT NOT NULL,
        changed_by INTEGER,
        note TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime("now")),
        FOREIGN KEY (job_id) REFERENCES jobs(id),
        FOREIGN KEY (changed_by) REFERENCES users(id)
      )
    `);

    // 9. USER_CATEGORIES TABLE - Create if not exists
    await createTableIfNotExists('user_categories', `
      CREATE TABLE IF NOT EXISTS user_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        assigned_at TEXT NOT NULL,
        assigned_by INTEGER,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (assigned_by) REFERENCES users(id)
      )
    `);

    // 10. SYSTEM_LOGS TABLE - Create if not exists
    await createTableIfNotExists('system_logs', `
      CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        user_id INTEGER,
        action TEXT,
        context TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Test all tables
    const tests: Record<string, string> = {};
    const tablesToTest = [
      'accounts', 'domains', 'users', 'user_stats', 'jobs', 'bids', 
      'payments', 'notifications', 'job_messages', 'ratings', 
      'job_attachments', 'invoices', 'messages', 'revisions',
      'email_logs', 'job_files', 'email_verification_codes',
      'pending_registrations', 'password_reset_tokens', 'payment_requests',
      'email_notifications', 'manager_invitations', 'job_status_logs',
      'user_categories', 'system_logs'
    ];

    for (const table of tablesToTest) {
      try {
        const result = await client.execute(`SELECT * FROM ${table} LIMIT 1`);
        tests[table] = `✅ OK (${result.rows.length} row)`;
      } catch (e: any) {
        tests[table] = `❌ ${e.message}`;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Comprehensive database migration completed',
      results,
      errors,
      totalOperations: results.length + errors.length,
      tests
    }, { status: 200 });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Migration failed'
    }, { status: 500 });
  }
}