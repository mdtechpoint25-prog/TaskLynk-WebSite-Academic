import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function POST() {
  try {
    console.log('Starting to fix user roles based on display_id patterns...');

    // Create direct LibSQL client
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Get all users
    const usersResult = await client.execute('SELECT id, display_id, email FROM users');
    const users = usersResult.rows;

    console.log(`Found ${users.length} users to process`);

    const updates: string[] = [];
    const errors: string[] = [];

    for (const user of users) {
      const displayId = user.display_id as string;
      const userId = user.id as number;
      const email = user.email as string;
      let role = 'client'; // default

      // Determine role based on display_id or email
      if (displayId?.startsWith('A')) {
        role = 'admin';
      } else if (displayId?.startsWith('M')) {
        role = 'manager';
      } else if (displayId?.startsWith('F')) {
        role = 'freelancer';
      } else if (displayId?.startsWith('C')) {
        role = 'client';
      }

      // Check if this is a known admin email
      const adminEmails = [
        'topwriteessays@gmail.com',
        'm.d.techpoint25@gmail.com',
        'maguna956@gmail.com',
        'tasklynk01@gmail.com',
        'maxwellotieno11@gmail.com',
        'ashleydothy3162@gmail.com'
      ];

      if (adminEmails.includes(email.toLowerCase())) {
        role = 'admin';
      }

      try {
        await client.execute({
          sql: 'UPDATE users SET role = ? WHERE id = ?',
          args: [role, userId],
        });
        updates.push(`✅ User ${userId} (${displayId}): Set role to ${role}`);
        console.log(`✅ Updated user ${userId} to role: ${role}`);
      } catch (error: any) {
        errors.push(`❌ User ${userId}: ${error.message}`);
        console.error(`❌ Failed to update user ${userId}:`, error);
      }
    }

    // Verify the updates
    const verifyResult = await client.execute(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY role
    `);

    return NextResponse.json({
      success: true,
      message: 'User roles fixed successfully',
      updates,
      errors,
      totalProcessed: users.length,
      roleDistribution: verifyResult.rows,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Fix roles error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fix roles',
      details: error.toString(),
    }, { status: 500 });
  }
}