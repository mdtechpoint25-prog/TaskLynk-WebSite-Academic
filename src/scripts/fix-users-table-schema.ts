import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function fixUsersTableSchema() {
  try {
    console.log('Fixing users table schema...\n');

    // Get current table schema
    const tableInfo = await db.all(sql`PRAGMA table_info(users)`);
    const existingColumns = tableInfo.map((col: any) => col.name);
    console.log('Existing columns:', existingColumns.join(', '), '\n');

    // Define columns that should exist based on schema.ts
    const requiredColumns = [
      { name: 'balance', type: 'REAL', default: '0' },
      { name: 'earned', type: 'REAL', default: '0' },
      { name: 'total_earnings', type: 'REAL', default: '0' },
      { name: 'rating', type: 'REAL', default: 'NULL' },
      { name: 'rating_average', type: 'REAL', default: '0' },
      { name: 'rating_count', type: 'INTEGER', default: '0' },
      { name: 'badge_list', type: 'TEXT', default: "'[]'" },
      { name: 'presence_status', type: 'TEXT', default: "'offline'" },
      { name: 'suspended_until', type: 'TEXT', default: 'NULL' },
      { name: 'suspension_reason', type: 'TEXT', default: 'NULL' },
      { name: 'blacklist_reason', type: 'TEXT', default: 'NULL' },
      { name: 'rejected_at', type: 'TEXT', default: 'NULL' },
      { name: 'rejection_reason', type: 'TEXT', default: 'NULL' },
      { name: 'total_earned', type: 'REAL', default: '0' },
      { name: 'total_spent', type: 'REAL', default: '0' },
      { name: 'completed_jobs', type: 'INTEGER', default: '0' },
      { name: 'completion_rate', type: 'REAL', default: 'NULL' },
      { name: 'profile_picture_url', type: 'TEXT', default: 'NULL' },
      { name: 'last_login_at', type: 'TEXT', default: 'NULL' },
      { name: 'last_login_ip', type: 'TEXT', default: 'NULL' },
      { name: 'last_login_device', type: 'TEXT', default: 'NULL' },
      { name: 'login_count', type: 'INTEGER', default: '0' },
      { name: 'domain_id', type: 'INTEGER', default: 'NULL' },
      { name: 'account_id', type: 'INTEGER', default: 'NULL' },
      { name: 'account_name', type: 'TEXT', default: 'NULL' },
      { name: 'assigned_manager_id', type: 'INTEGER', default: 'NULL' },
      { name: 'freelancer_badge', type: 'TEXT', default: 'NULL' },
      { name: 'client_tier', type: 'TEXT', default: "'basic'" },
      { name: 'client_priority', type: 'TEXT', default: "'regular'" },
    ];

    // Add missing columns
    let addedCount = 0;
    for (const col of requiredColumns) {
      if (!existingColumns.includes(col.name)) {
        console.log(`Adding column: ${col.name} (${col.type}, default: ${col.default})`);
        try {
          await db.run(sql.raw(
            `ALTER TABLE users ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default}`
          ));
          addedCount++;
          console.log(`✓ Added ${col.name}`);
        } catch (error) {
          console.error(`✗ Failed to add ${col.name}:`, error);
        }
      }
    }

    console.log(`\n✅ Schema fix complete! Added ${addedCount} columns.`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

fixUsersTableSchema();
