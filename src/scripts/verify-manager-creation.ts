import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function verifyManagerCreation() {
  try {
    console.log('=== VERIFYING MANAGER CREATION ===\n');

    // Check users with role='manager'
    const managers = await db.all(sql`
      SELECT id, display_id, email, name, role, role_id, status, approved, created_at
      FROM users
      WHERE role = 'manager'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log('Recent manager users:');
    console.log(JSON.stringify(managers, null, 2));

    // Check managers table structure
    console.log('\n\nManagers table structure:');
    const tableInfo = await db.all(sql`PRAGMA table_info(managers)`);
    console.log(JSON.stringify(tableInfo, null, 2));

    // Check managers table records
    console.log('\n\nManagers table records:');
    const managerProfiles = await db.all(sql`SELECT * FROM managers ORDER BY created_at DESC LIMIT 5`);
    console.log(JSON.stringify(managerProfiles, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

verifyManagerCreation();
