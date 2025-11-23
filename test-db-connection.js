#!/usr/bin/env node

/**
 * Quick Database Connection Test
 */

const fs = require('fs');
const path = require('path');

async function testConnection() {
  try {
    // Load env
    const envFile = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envFile)) {
      console.error('❌ .env file not found');
      process.exit(1);
    }

    const envContent = fs.readFileSync(envFile, 'utf-8');
    const envLines = envContent.split('\n');

    let TURSO_CONNECTION_URL = '';
    let TURSO_AUTH_TOKEN = '';

    for (const line of envLines) {
      if (line.startsWith('TURSO_CONNECTION_URL=')) {
        TURSO_CONNECTION_URL = line.replace('TURSO_CONNECTION_URL=', '').trim().replace(/^"/, '').replace(/"$/, '');
      }
      if (line.startsWith('TURSO_AUTH_TOKEN=')) {
        TURSO_AUTH_TOKEN = line.replace('TURSO_AUTH_TOKEN=', '').trim().replace(/^"/, '').replace(/"$/, '');
      }
    }

    if (!TURSO_CONNECTION_URL || !TURSO_AUTH_TOKEN) {
      console.error('❌ Missing TURSO_CONNECTION_URL or TURSO_AUTH_TOKEN in .env');
      process.exit(1);
    }

    console.log('🔍 Testing Turso Database Connection...\n');
    console.log(`URL: ${TURSO_CONNECTION_URL.substring(0, 50)}...`);
    console.log(`Token: ${TURSO_AUTH_TOKEN.substring(0, 20)}...\n`);

    // Import libsql
    const { createClient } = require('@libsql/client');

    const client = createClient({
      url: TURSO_CONNECTION_URL,
      authToken: TURSO_AUTH_TOKEN,
    });

    // Test connection
    console.log('📡 Testing connection...');
    const result = await client.execute('SELECT 1 as test');
    console.log('✅ Connection successful!\n');

    // Get table list
    console.log('📋 Checking database tables...\n');
    const tables = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `);

    const tableList = tables.rows.map(r => r.name);
    const requiredTables = [
      'users', 'jobs', 'payments', 'orderFiles', 'notifications', 
      'ratings', 'invoices', 'messages', 'jobAttachments', 'invitations'
    ];

    let allPresent = true;
    for (const table of requiredTables) {
      if (tableList.includes(table)) {
        console.log(`  ✅ ${table}`);
      } else {
        console.log(`  ❌ ${table} - MISSING`);
        allPresent = false;
      }
    }

    if (tableList.length > 0 && tableList.length !== requiredTables.length) {
      console.log(`\n  Other tables (${tableList.length} total):`);
      const others = tableList.filter(t => !requiredTables.includes(t));
      for (const table of others.slice(0, 5)) {
        console.log(`    • ${table}`);
      }
      if (others.length > 5) {
        console.log(`    ... and ${others.length - 5} more`);
      }
    }

    if (allPresent) {
      console.log('\n✅ All required tables present!');
    } else {
      console.log('\n⚠️  Some tables missing. Run: npm run db:push');
    }

    // Check sample data
    console.log('\n📊 Sample data counts:');
    try {
      const userCount = await client.execute('SELECT COUNT(*) as count FROM users');
      console.log(`  users: ${userCount.rows[0]?.count || 0} records`);

      const jobCount = await client.execute('SELECT COUNT(*) as count FROM jobs');
      console.log(`  jobs: ${jobCount.rows[0]?.count || 0} records`);

      const paymentCount = await client.execute('SELECT COUNT(*) as count FROM payments');
      console.log(`  payments: ${paymentCount.rows[0]?.count || 0} records`);
    } catch (e) {
      console.log(`  ⚠️  Could not fetch counts: ${e.message}`);
    }

    console.log('\n✅ Database is ready to use!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify .env file has valid TURSO_CONNECTION_URL');
    console.error('2. Verify .env file has valid TURSO_AUTH_TOKEN');
    console.error('3. Check Turso dashboard: https://app.turso.tech');
    console.error('4. Ensure database is active and not suspended');
    process.exit(1);
  }
}

testConnection();
