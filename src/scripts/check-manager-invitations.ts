import { db } from '@/db';
import { managerInvitations, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function checkManagerInvitations() {
  try {
    console.log('📋 Checking manager invitations...\n');
    
    // Get all invitations
    const invites = await db.select().from(managerInvitations);
    
    if (invites.length === 0) {
      console.log('❌ No manager invitations found in the database');
      console.log('\n💡 To create a manager invitation, an admin needs to use the invite API or create one manually.\n');
    } else {
      console.log(`✅ Found ${invites.length} manager invitation(s):\n`);
      invites.forEach((invite, index) => {
        console.log(`${index + 1}. Email: ${invite.email}`);
        console.log(`   Token: ${invite.token}`);
        console.log(`   Used: ${invite.used ? 'Yes' : 'No'}`);
        console.log(`   Created: ${invite.createdAt}`);
        console.log(`   Expires: ${invite.expiresAt || 'Never'}`);
        console.log('');
      });
    }

    // Check existing managers
    console.log('\n👥 Checking existing managers...\n');
    const managers = await db.select().from(users).where(eq(users.role, 'manager'));
    
    if (managers.length === 0) {
      console.log('❌ No managers found in the database');
    } else {
      console.log(`✅ Found ${managers.length} manager(s):\n`);
      managers.forEach((manager, index) => {
        console.log(`${index + 1}. Name: ${manager.name}`);
        console.log(`   Email: ${manager.email}`);
        console.log(`   Display ID: ${manager.displayId}`);
        console.log(`   Approved: ${manager.approved ? 'Yes' : 'No'}`);
        console.log(`   Status: ${manager.status}`);
        console.log('');
      });
    }

    // Create a test invitation if none exist
    if (invites.length === 0) {
      console.log('📝 Creating a test manager invitation...\n');
      
      const testEmail = 'testmanager@gmail.com';
      const testToken = `mgr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.insert(managerInvitations).values({
        email: testEmail,
        token: testToken,
        createdBy: null,
        createdAt: new Date().toISOString(),
        used: false,
        usedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });
      
      console.log('✅ Test invitation created!');
      console.log(`   Email: ${testEmail}`);
      console.log(`   Token: ${testToken}`);
      console.log(`   Registration URL: http://localhost:3000/manager/register?token=${testToken}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkManagerInvitations()
  .then(() => {
    console.log('✅ Check completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
