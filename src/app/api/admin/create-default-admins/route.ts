import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    // Create direct database client
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    const adminAccounts = [
      { email: 'topwriteessays@gmail.com', name: 'Top Write Essays Admin' },
      { email: 'm.d.techpoint25@gmail.com', name: 'MD TechPoint Admin' },
      { email: 'maguna956@gmail.com', name: 'Maguna Admin' },
      { email: 'tasklynk01@gmail.com', name: 'TaskLynk Admin' },
      { email: 'maxwellotieno11@gmail.com', name: 'Maxwell Otieno Admin' },
      { email: 'ashleydothy3162@gmail.com', name: 'Ashley Dothy Admin' },
    ];

    const password = 'kemoda2025';
    const hashedPassword = await bcrypt.hash(password, 10);
    const results = [];

    // role_id: 1=admin based on previous system
    const adminRoleId = 1;

    for (const account of adminAccounts) {
      // Check if admin already exists
      const existing = await client.execute({
        sql: 'SELECT id, email, status FROM users WHERE email = ?',
        args: [account.email]
      });

      if (existing.rows.length > 0) {
        results.push({
          email: account.email,
          status: 'already_exists',
          id: existing.rows[0].id
        });
        continue;
      }

      // Create admin user
      await client.execute({
        sql: `INSERT INTO users (
          email, password, name, phone, role_id, status, 
          balance_available, balance_pending, total_earned, 
          rating, completed_orders, approved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          account.email,
          hashedPassword,
          account.name,
          '+254700000000',
          adminRoleId,
          'approved',
          0,
          0,
          0,
          0,
          0,
          new Date().toISOString()
        ]
      });

      results.push({
        email: account.email,
        status: 'created',
        name: account.name
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin accounts processed successfully',
      results,
      credentials: {
        password: 'kemoda2025',
        emails: adminAccounts.map(a => a.email)
      }
    });

  } catch (error) {
    console.error('Create admins error:', error);
    return NextResponse.json({
      error: 'Failed to create admin accounts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}