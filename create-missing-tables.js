#!/usr/bin/env node

/**
 * Create missing tables: orderFiles and jobAttachments
 */

const fs = require('fs');
const path = require('path');

async function createMissingTables() {
  try {
    const { createClient } = require('@libsql/client');
    
    const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
    let TURSO_CONNECTION_URL = '';
    let TURSO_AUTH_TOKEN = '';

    for (const line of envContent.split('\n')) {
      if (line.startsWith('TURSO_CONNECTION_URL=')) {
        TURSO_CONNECTION_URL = line.replace('TURSO_CONNECTION_URL=', '').trim().replace(/^"/, '').replace(/"$/, '');
      }
      if (line.startsWith('TURSO_AUTH_TOKEN=')) {
        TURSO_AUTH_TOKEN = line.replace('TURSO_AUTH_TOKEN=', '').trim().replace(/^"/, '').replace(/"$/, '');
      }
    }

    const client = createClient({
      url: TURSO_CONNECTION_URL,
      authToken: TURSO_AUTH_TOKEN,
    });

    console.log('🔧 Creating missing tables...\n');

    // 1. Create orderFiles table
    try {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS orderFiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          orderId INTEGER NOT NULL,
          uploadedBy INTEGER NOT NULL,
          fileUrl TEXT NOT NULL,
          fileName TEXT NOT NULL,
          fileSize INTEGER NOT NULL,
          mimeType TEXT NOT NULL,
          fileType TEXT NOT NULL,
          notes TEXT,
          versionNumber INTEGER NOT NULL DEFAULT 1,
          createdAt TEXT NOT NULL,
          FOREIGN KEY(orderId) REFERENCES jobs(id) ON DELETE CASCADE,
          FOREIGN KEY(uploadedBy) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ orderFiles table created');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️  orderFiles table already exists');
      } else {
        console.log('❌ Error creating orderFiles:', e.message);
      }
    }

    // 2. Create jobAttachments table
    try {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS jobAttachments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          jobId INTEGER NOT NULL,
          uploadedBy INTEGER NOT NULL,
          fileName TEXT NOT NULL,
          fileUrl TEXT NOT NULL,
          fileSize INTEGER NOT NULL,
          fileType TEXT NOT NULL,
          uploadType TEXT NOT NULL,
          attachmentCategory TEXT,
          scheduledDeletionAt TEXT,
          deletedAt TEXT,
          createdAt TEXT NOT NULL,
          FOREIGN KEY(jobId) REFERENCES jobs(id) ON DELETE CASCADE,
          FOREIGN KEY(uploadedBy) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ jobAttachments table created');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️  jobAttachments table already exists');
      } else {
        console.log('❌ Error creating jobAttachments:', e.message);
      }
    }

    // 3. Create indexes for better performance
    try {
      await client.execute('CREATE INDEX IF NOT EXISTS idx_orderfiles_orderid ON orderFiles(orderId)');
      console.log('✅ orderFiles index created');
    } catch (e) {
      console.log('ℹ️  orderFiles index already exists or skipped');
    }

    try {
      await client.execute('CREATE INDEX IF NOT EXISTS idx_jobattachments_jobid ON jobAttachments(jobId)');
      console.log('✅ jobAttachments index created');
    } catch (e) {
      console.log('ℹ️  jobAttachments index already exists or skipped');
    }

    // Verify
    const tables = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND (name='orderFiles' OR name='jobAttachments')
      ORDER BY name
    `);

    console.log('\n✅ Verification:');
    for (const row of tables.rows) {
      console.log(`   ✓ ${row.name}`);
    }

    console.log('\n✅ All tables ready!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createMissingTables();
