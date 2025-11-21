import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function fixApprovedColumn() {
  try {
    console.log('🔧 Checking and fixing approved column in users table...');
    
    // Try to add the approved column
    try {
      await db.run(sql`ALTER TABLE users ADD COLUMN approved INTEGER NOT NULL DEFAULT 0;`);
      console.log('✅ Successfully added approved column to users table');
    } catch (error: any) {
      if (error.message?.includes('duplicate column')) {
        console.log('ℹ️  Column approved already exists in users table');
      } else {
        throw error;
      }
    }

    // Verify the column exists by checking table info
    const tableInfo = await db.all(sql`PRAGMA table_info(users);`);
    const hasApproved = tableInfo.some((col: any) => col.name === 'approved');
    
    if (hasApproved) {
      console.log('✅ Verified: approved column exists in users table');
      
      // Update all managers to be approved
      const result = await db.run(sql`
        UPDATE users 
        SET approved = 1 
        WHERE role = 'manager' AND approved = 0;
      `);
      console.log(`✅ Updated ${result.changes} manager(s) to approved status`);
    } else {
      console.error('❌ Failed to add approved column');
    }

    console.log('\n📊 Current table structure:');
    tableInfo.forEach((col: any) => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });

  } catch (error: any) {
    console.error('❌ Error fixing approved column:', error.message);
    throw error;
  }
}

fixApprovedColumn()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
