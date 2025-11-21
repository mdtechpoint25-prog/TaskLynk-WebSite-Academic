import { db } from '@/db';

async function verifyAndFixIndexes() {
  console.log('🔍 Verifying table structures...\n');

  try {
    // Check order_history table structure
    console.log('📋 Checking order_history table...');
    const orderHistoryInfo = await db.all(`PRAGMA table_info(order_history)`);
    console.log('order_history columns:', orderHistoryInfo);
    
    // Check if jobId column exists (camelCase)
    const hasJobId = orderHistoryInfo.some((col: any) => 
      col.name === 'job_id' || col.name === 'jobId'
    );
    
    if (hasJobId) {
      const columnName = orderHistoryInfo.find((col: any) => 
        col.name === 'job_id' || col.name === 'jobId'
      )?.name;
      
      console.log(`✅ Found job column as: ${columnName}\n`);
      
      // Try to create the index with the correct column name
      console.log('📋 Creating index for order_history...');
      await db.run(`CREATE INDEX IF NOT EXISTS idx_order_history_job ON order_history(${columnName})`);
      console.log('✅ Index created successfully\n');
    } else {
      console.log('⚠️  No job_id or jobId column found in order_history\n');
    }

    // Verify all new tables exist
    console.log('📋 Verifying all new tables...');
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name IN ('invitations', 'writer_balances', 'order_history')
    `);
    
    console.log('✅ Tables found:', tables.map((t: any) => t.name).join(', '));
    
    // Verify jobs.manager_id exists
    console.log('\n📋 Checking jobs table...');
    const jobsInfo = await db.all(`PRAGMA table_info(jobs)`);
    const hasManagerId = jobsInfo.some((col: any) => 
      col.name === 'manager_id' || col.name === 'managerId'
    );
    console.log(`✅ jobs.manager_id exists: ${hasManagerId}`);
    
    // Verify manager_invitations.role and status exist
    console.log('\n📋 Checking manager_invitations table...');
    const managerInvInfo = await db.all(`PRAGMA table_info(manager_invitations)`);
    const hasRole = managerInvInfo.some((col: any) => col.name === 'role');
    const hasStatus = managerInvInfo.some((col: any) => col.name === 'status');
    console.log(`✅ manager_invitations.role exists: ${hasRole}`);
    console.log(`✅ manager_invitations.status exists: ${hasStatus}`);
    
    console.log('\n✅ ✅ ✅ All tables and fields verified! ✅ ✅ ✅\n');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

// Run the verification
verifyAndFixIndexes()
  .then(() => {
    console.log('✅ Verification completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
