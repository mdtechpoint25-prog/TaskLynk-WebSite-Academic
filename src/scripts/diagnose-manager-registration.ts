import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { users, managerInvitations } from '@/db/schema';
import bcrypt from 'bcryptjs';

async function diagnoseManagerRegistration() {
  try {
    console.log('=== DIAGNOSING MANAGER REGISTRATION ===\n');

    // 1. Check users table structure
    console.log('1. Users table columns:');
    const tableInfo = await db.all(sql`PRAGMA table_info(users)`);
    console.log(JSON.stringify(tableInfo, null, 2));

    // 2. Check if role_id column exists and roles table
    console.log('\n2. Checking roles table:');
    try {
      const roles = await db.all(sql`SELECT * FROM roles`);
      console.log(JSON.stringify(roles, null, 2));
    } catch (e) {
      console.log('Roles table does not exist or error:', e);
    }

    // 3. Check CHECK constraints on users table
    console.log('\n3. Users table schema:');
    const schema = await db.all(sql`SELECT sql FROM sqlite_master WHERE type='table' AND name='users'`);
    console.log(JSON.stringify(schema, null, 2));

    // 4. Try a test insert with minimal fields
    console.log('\n4. Testing minimal manager insert:');
    const testEmail = `test-manager-${Date.now()}@test.com`;
    const testPassword = await bcrypt.hash('test123', 10);
    const testDisplayId = `MNG${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
    const now = new Date().toISOString();

    try {
      await db.run(sql`
        INSERT INTO users (
          display_id, email, password, name, role,
          approved, email_verified, status,
          created_at
        ) VALUES (
          ${testDisplayId}, ${testEmail}, ${testPassword}, 'Test Manager', 'manager',
          1, 1, 'approved',
          ${now}
        )
      `);
      console.log('✅ Test insert successful!');

      // Clean up test user
      await db.run(sql`DELETE FROM users WHERE email = ${testEmail}`);
      console.log('✅ Test user cleaned up');
    } catch (insertError: any) {
      console.log('❌ Test insert failed:');
      console.log('Error message:', insertError.message);
      console.log('Full error:', insertError);
    }

    // 5. Check manager_invitations table
    console.log('\n5. Manager invitations table:');
    const invitations = await db.all(sql`SELECT * FROM manager_invitations LIMIT 5`);
    console.log(JSON.stringify(invitations, null, 2));

  } catch (error) {
    console.error('Diagnosis error:', error);
  } finally {
    process.exit(0);
  }
}

diagnoseManagerRegistration();
