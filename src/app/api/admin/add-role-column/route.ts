import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function POST() {
  try {
    console.log('Starting migration to add role column to users table...');

    // Create direct LibSQL client
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Check if role column exists
    const tableInfo = await client.execute('PRAGMA table_info(users)');
    console.log('Current users table columns:', tableInfo.rows);

    const hasRoleColumn = tableInfo.rows.some((row: any) => row.name === 'role');

    if (hasRoleColumn) {
      return NextResponse.json({
        success: true,
        message: 'Role column already exists',
        alreadyExists: true,
      }, { status: 200 });
    }

    // Add role column
    console.log('Adding role column to users table...');
    await client.execute(`
      ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'client'
    `);

    console.log('✅ Successfully added role column');

    // Test the migration by querying
    const testQuery = await client.execute('SELECT id, name, role FROM users LIMIT 5');
    console.log('Test query result:', testQuery.rows);

    return NextResponse.json({
      success: true,
      message: 'Role column added successfully',
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