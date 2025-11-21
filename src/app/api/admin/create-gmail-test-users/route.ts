import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST() {
  try {
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash('Test123!', 10);

    const testUsers = [
      {
        displayId: 'ADM#TEST001',
        email: 'testadmin@gmail.com',
        name: 'Test Admin',
        role: 'admin',
        phone: '+254700000001',
      },
      {
        displayId: 'MGR#TEST001',
        email: 'testmanager@gmail.com',
        name: 'Test Manager',
        role: 'manager',
        phone: '+254700000002',
      },
      {
        displayId: 'CLT#TEST001',
        email: 'testclient@gmail.com',
        name: 'Test Client',
        role: 'client',
        phone: '+254700000003',
      },
      {
        displayId: 'FRL#TEST001',
        email: 'testfreelancer@gmail.com',
        name: 'Test Freelancer',
        role: 'freelancer',
        phone: '+254700000004',
      },
    ];

    const created = [];

    for (const user of testUsers) {
      try {
        // Check if user exists
        const existing = await db.execute(
          sql`SELECT id, email FROM users WHERE email = ${user.email} LIMIT 1`
        );

        if (existing.rows && existing.rows.length > 0) {
          // Update existing user to ensure they're active and approved
          await db.execute(
            sql`UPDATE users 
                SET approved = 1, 
                    status = 'active', 
                    email_verified = 1,
                    suspended_until = NULL,
                    suspension_reason = NULL,
                    rejected_at = NULL,
                    rejection_reason = NULL,
                    updated_at = ${now}
                WHERE email = ${user.email}`
          );
          created.push({ ...user, status: 'updated', id: existing.rows[0].id });
        } else {
          // Insert new user
          await db.execute(
            sql`INSERT INTO users (
              display_id, email, password, name, role, approved, email_verified,
              balance, earned, total_earnings, rating, phone, status,
              total_earned, total_spent, completed_jobs, created_at, updated_at
            ) VALUES (
              ${user.displayId}, ${user.email}, ${passwordHash}, ${user.name}, ${user.role},
              1, 1, 0, 0, 0, 0, ${user.phone}, 'active', 0, 0, 0, ${now}, ${now}
            )`
          );

          // Get the inserted user's ID
          const result = await db.execute(
            sql`SELECT id FROM users WHERE email = ${user.email} LIMIT 1`
          );
          
          created.push({ 
            ...user, 
            status: 'created',
            id: result.rows && result.rows.length > 0 ? result.rows[0].id : null 
          });
        }
      } catch (userError: any) {
        console.error(`Error processing user ${user.email}:`, userError);
        created.push({ ...user, status: 'error', error: userError.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: '4 test users with @gmail.com emails have been created/updated',
      users: created,
      credentials: {
        password: 'Test123!',
        loginUrl: '/login',
        accounts: [
          { email: 'testadmin@gmail.com', role: 'admin', dashboard: '/admin/dashboard' },
          { email: 'testmanager@gmail.com', role: 'manager', dashboard: '/manager/dashboard' },
          { email: 'testclient@gmail.com', role: 'client', dashboard: '/client/dashboard' },
          { email: 'testfreelancer@gmail.com', role: 'freelancer', dashboard: '/freelancer/dashboard' },
        ]
      }
    });
  } catch (error: any) {
    console.error('Error creating test users:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create test users', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
