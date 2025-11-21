import { db } from '@/db';
import { managerInvitations } from '@/db/schema';
import crypto from 'crypto';

async function createTestInvitation() {
  const email = `test-manager-${Date.now()}@example.com`;
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now

  await db.insert(managerInvitations).values({
    email,
    token,
    createdBy: 1, // Admin user
    createdAt: now,
    expiresAt,
    used: false,
  });

  console.log('✅ Test manager invitation created!');
  console.log('Email:', email);
  console.log('Token:', token);
  console.log('Expires:', expiresAt);
  console.log('\nRegistration URL:', `http://localhost:3000/manager/register?token=${token}`);
  console.log('\nTest with:');
  console.log(`curl -X POST http://localhost:3000/api/invitations/register \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"token":"${token}","password":"Test123!","fullName":"Test Manager","phoneNumber":"0712345678"}'`);

  process.exit(0);
}

createTestInvitation();
