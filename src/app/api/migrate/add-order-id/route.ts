import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function POST(request: NextRequest) {
  try {
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Step 1: Add order_id column
    try {
      await client.execute('ALTER TABLE jobs ADD COLUMN order_id TEXT');
      console.log('✅ Added order_id column');
    } catch (error: any) {
      // If column already exists, ignore the error
      if (error.message?.includes('duplicate column name')) {
        console.log('ℹ️ order_id column already exists');
      } else {
        throw error;
      }
    }

    // Step 2: Update all existing rows to set order_id = display_id
    const updateResult = await client.execute(`
      UPDATE jobs 
      SET order_id = display_id 
      WHERE order_id IS NULL OR order_id = ''
    `);
    console.log(`✅ Updated ${updateResult.rowsAffected} rows with order_id = display_id`);

    // Step 3: Verify the changes
    const verifyResult = await client.execute(`
      SELECT COUNT(*) as total, 
             COUNT(order_id) as with_order_id,
             COUNT(CASE WHEN order_id IS NULL OR order_id = '' THEN 1 END) as without_order_id
      FROM jobs
    `);
    
    const stats = verifyResult.rows[0];

    client.close();

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      stats: {
        totalJobs: stats.total,
        jobsWithOrderId: stats.with_order_id,
        jobsWithoutOrderId: stats.without_order_id,
      },
      rowsUpdated: updateResult.rowsAffected,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Migration failed: ' + (error as Error).message 
      },
      { status: 500 }
    );
  }
}
