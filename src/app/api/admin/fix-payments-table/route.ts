import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function POST() {
  try {
    console.log('Starting migration to add missing columns to payments table...');

    // Create direct LibSQL client
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Check current table structure
    const tableInfo = await client.execute('PRAGMA table_info(payments)');
    console.log('Current payments table columns:', tableInfo.rows);

    const columnsToAdd = [
      { name: 'job_id', definition: 'INTEGER NOT NULL' },
      { name: 'client_id', definition: 'INTEGER NOT NULL' },
      { name: 'freelancer_id', definition: 'INTEGER' },
    ];

    const results: string[] = [];
    const errors: string[] = [];

    for (const column of columnsToAdd) {
      const hasColumn = tableInfo.rows.some((row: any) => row.name === column.name);

      if (hasColumn) {
        results.push(`ℹ️  Column already exists: ${column.name}`);
        console.log(`ℹ️  Column already exists: ${column.name}`);
        continue;
      }

      try {
        console.log(`Adding column: ${column.name}`);
        // For NOT NULL columns, we need to add with a default value first
        let query = `ALTER TABLE payments ADD COLUMN ${column.name} ${column.definition.replace('NOT NULL', '')}`;
        await client.execute(query);
        
        results.push(`✅ Added column: ${column.name}`);
        console.log(`✅ Successfully added: ${column.name}`);
      } catch (error: any) {
        errors.push(`❌ Failed to add ${column.name}: ${error.message}`);
        console.error(`❌ Failed to add ${column.name}:`, error);
      }
    }

    // Test the migration
    const testQuery = await client.execute('SELECT * FROM payments LIMIT 1');
    console.log('Test query result:', testQuery.rows);

    return NextResponse.json({
      success: true,
      message: 'Payments table migration completed',
      results,
      errors,
      testResults: testQuery.rows,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Migration failed',
      details: error.toString(),
    }, { status: 500 });
  }
}