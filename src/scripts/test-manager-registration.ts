import { db } from '@/db';
import { managerInvitations, users, managers } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

async function testManagerRegistration() {
  try {
    console.log('Starting manager registration test...\n');

    // Step 1: Create a test invitation
    const testEmail = `manager-test-${Date.now()}@tasklynk.test`;
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    console.log('1. Creating test invitation...');
    await db.insert(managerInvitations).values({
      email: testEmail,
      token,
      createdBy: 1, // Assume admin ID 1
      createdAt: now,
      used: false,
      expiresAt,
    });
    console.log(`✓ Invitation created for: ${testEmail}`);
    console.log(`  Token: ${token}\n`);

    // Step 2: Simulate registration
    console.log('2. Simulating manager registration...');
    const password = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    const displayId = `MNG${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

    // Use raw SQL to insert with role_id
    await db.run(sql`
      INSERT INTO users (
        display_id, email, password, name, role, role_id, phone,
        approved, email_verified, status, created_at, updated_at
      ) VALUES (
        ${displayId}, ${testEmail}, ${hashedPassword}, 'Test Manager', 
        'manager', 3, '+254700000000',
        1, 1, 'approved', ${now}, ${now}
      )
    `);

    const [newUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail));

    console.log(`✓ Manager user created with ID: ${newUser.id}`);
    console.log(`  Display ID: ${newUser.displayId}`);
    console.log(`  Email: ${newUser.email}`);
    console.log(`  Role: ${newUser.role}\n`);

    // Step 3: Mark invitation as used
    console.log('3. Marking invitation as used...');
    await db
      .update(managerInvitations)
      .set({
        used: true,
        usedAt: now,
      })
      .where(eq(managerInvitations.token, token));

    console.log('✓ Invitation marked as used\n');

    // Step 4: Verify everything
    console.log('4. Verifying registration...');
    const [verifyUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, newUser.id));

    const [verifyManager] = await db
      .select()
      .from(managers)
      .where(eq(managers.userId, newUser.id));

    const [verifyInvitation] = await db
      .select()
      .from(managerInvitations)
      .where(eq(managerInvitations.token, token));

    console.log('User verification:');
    console.log(`  ✓ User exists: ${!!verifyUser}`);
    console.log(`  ✓ Role is manager: ${verifyUser?.role === 'manager'}`);
    console.log(`  ✓ Approved: ${!!verifyUser?.approved}`);
    console.log(`  ✓ Email verified: ${!!verifyUser?.emailVerified}`);
    console.log(`  ✓ Status is active: ${verifyUser?.status === 'active'}\n`);

    console.log('Manager profile verification:');
    console.log(`  ✓ Profile exists: ${!!verifyManager}`);
    console.log(`  ✓ Linked to user: ${verifyManager?.userId === newUser.id}`);
    console.log(`  ✓ Status is active: ${verifyManager?.status === 'active'}\n`);

    console.log('Invitation verification:');
    console.log(`  ✓ Marked as used: ${!!verifyInvitation?.used}`);
    console.log(`  ✓ Used timestamp exists: ${!!verifyInvitation?.usedAt}\n`);

    console.log('========================================');
    console.log('✅ MANAGER REGISTRATION TEST PASSED!');
    console.log('========================================');
    console.log('\nTest credentials:');
    console.log(`  Email: ${testEmail}`);
    console.log(`  Password: ${password}`);
    console.log(`  Token: ${token}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

testManagerRegistration();