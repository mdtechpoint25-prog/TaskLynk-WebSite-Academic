import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function GET() {
  try {
    console.log('Checking database triggers...');

    // Create direct LibSQL client
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Get all triggers
    const triggersResult = await client.execute(`
      SELECT name, tbl_name, sql 
      FROM sqlite_master 
      WHERE type = 'trigger'
    `);

    console.log('Found triggers:', triggersResult.rows);

    return NextResponse.json({
      success: true,
      triggers: triggersResult.rows,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error checking triggers:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to check triggers',
    }, { status: 500 });
  }
}