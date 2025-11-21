import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function addAccountNameColumn() {
  try {
    console.log('🔧 Adding account_name column to pending_registrations table...');
    
    // Check if column already exists
    const tableInfo = await db.run(sql`PRAGMA table_info(pending_registrations)`);
    console.log('Current table structure:', tableInfo);
    
    // Add the account_name column if it doesn't exist
    await db.run(sql`
      ALTER TABLE pending_registrations 
      ADD COLUMN account_name TEXT
    `);
    
    console.log('✅ Successfully added account_name column!');
    
    // Verify the change
    const updatedTableInfo = await db.run(sql`PRAGMA table_info(pending_registrations)`);
    console.log('Updated table structure:', updatedTableInfo);
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('duplicate column name')) {
      console.log('✅ Column already exists, no action needed.');
    } else {
      console.error('❌ Error adding column:', error);
      throw error;
    }
  }
}

addAccountNameColumn()
  .then(() => {
    console.log('✅ Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
