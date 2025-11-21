import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

async function addAccountNameToUsers() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  try {
    console.log('🔧 Adding account_name column to users table...');
    
    // Check if column already exists
    const tableInfo = await client.execute('PRAGMA table_info(users)');
    const hasAccountName = tableInfo.rows.some((row: any) => row.name === 'account_name');
    
    if (hasAccountName) {
      console.log('ℹ️  Column account_name already exists in users table');
    } else {
      await client.execute('ALTER TABLE users ADD COLUMN account_name TEXT;');
      console.log('✅ Successfully added account_name column to users table');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.close();
  }
}

addAccountNameToUsers();
