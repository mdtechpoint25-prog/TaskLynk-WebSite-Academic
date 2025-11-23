#!/usr/bin/env node

/**
 * TURSO COMPLETE TABLE CREATION SCRIPT
 * 
 * Creates all missing tables to ensure full database compliance
 */

import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// SQL statements for missing tables
const MISSING_TABLES = {
  system_settings: `
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT NOT NULL UNIQUE PRIMARY KEY,
      value TEXT NOT NULL,
      type TEXT NOT NULL,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `,
  
  editor_profiles: `
    CREATE TABLE IF NOT EXISTS editor_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      specialization TEXT,
      years_experience INTEGER,
      languages TEXT,
      qualifications TEXT,
      areas_of_expertise TEXT,
      average_edits_per_order INTEGER DEFAULT 0,
      orders_touched INTEGER DEFAULT 0,
      client_satisfaction_rate REAL DEFAULT 0,
      is_profile_complete INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  editor_assignments: `
    CREATE TABLE IF NOT EXISTS editor_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      editor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      assigned_at TEXT NOT NULL,
      review_started_at TEXT,
      approval_status TEXT NOT NULL DEFAULT 'pending',
      approval_reason TEXT,
      revisions_requested INTEGER NOT NULL DEFAULT 0,
      revision_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  payment_transactions: `
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      transaction_type TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      balance_before REAL NOT NULL,
      balance_after REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      reason TEXT,
      created_at TEXT NOT NULL
    )
  `
};

async function createTable(tableName, sql) {
  try {
    await client.execute(sql);
    console.log(`✅ Created table: ${tableName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating ${tableName}:`, error.message);
    return false;
  }
}

async function verifyTable(tableName) {
  try {
    const result = await client.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔄 TURSO TABLE CREATION - COMPLETING DATABASE\n');
  console.log('📊 Creating missing tables...\n');

  let created = 0;
  let failed = 0;

  for (const [tableName, sql] of Object.entries(MISSING_TABLES)) {
    const exists = await verifyTable(tableName);
    
    if (exists) {
      console.log(`✓ ${tableName} (already exists)`);
    } else {
      const success = await createTable(tableName, sql);
      if (success) {
        created++;
      } else {
        failed++;
      }
    }
  }

  console.log('\n' + '━'.repeat(60));
  console.log('\n📊 CREATION SUMMARY:\n');
  console.log(`   ✅ Created: ${created} tables`);
  console.log(`   ⏭️  Already existed: ${Object.keys(MISSING_TABLES).length - created - failed}`);
  if (failed > 0) {
    console.log(`   ❌ Failed: ${failed} tables`);
  }

  // Verify all required tables now exist
  console.log('\n✅ VERIFYING ALL TABLES:\n');
  
  const REQUIRED_TABLES = [
    'accounts', 'domains', 'system_settings', 'invitations', 'users',
    'user_stats', 'jobs', 'bids', 'payments', 'notifications',
    'job_messages', 'ratings', 'job_attachments', 'invoices', 'messages',
    'revisions', 'email_logs', 'job_files', 'order_files', 'email_verification_codes',
    'pending_registrations', 'password_reset_tokens', 'payment_requests', 'email_notifications',
    'manager_invitations', 'job_status_logs', 'order_history', 'writer_balances', 'managers',
    'client_manager', 'manager_earnings', 'user_categories', 'system_logs', 'badges',
    'user_badges', 'payout_requests', 'admin_audit_logs', 'writer_tiers', 'conversations',
    'freelancer_profiles', 'editor_profiles', 'editor_assignments', 'payment_transactions',
    'client_profiles'
  ];

  let allPresent = true;
  for (const table of REQUIRED_TABLES) {
    const exists = await verifyTable(table);
    if (exists) {
      console.log(`   ✓ ${table}`);
    } else {
      console.log(`   ✗ ${table} (MISSING)`);
      allPresent = false;
    }
  }

  console.log('\n' + '━'.repeat(60));
  
  if (allPresent) {
    console.log('\n✅ DATABASE COMPLETE!');
    console.log(`   All ${REQUIRED_TABLES.length} required tables are present in Turso`);
    console.log('   ✅ Turso now has full control of the database');
    console.log('   ✅ Ready for production deployment\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tables are still missing');
    console.log('   Run: bun run db:push\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
