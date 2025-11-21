import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function addAccountNameToUsers() {
  try {
    console.log('🔧 Adding account_name column to users table...');
    
    // Try to add the column
    await db.run(sql`ALTER TABLE users ADD COLUMN account_name TEXT;`);
    
    console.log('✅ Successfully added account_name column to users table');
  } catch (error: any) {
    if (error.message?.includes('duplicate column')) {
      console.log('ℹ️  Column account_name already exists in users table');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }
}

addAccountNameToUsers();
