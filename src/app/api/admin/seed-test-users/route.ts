import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// POST /api/admin/seed-test-users
// Seeds 4 test users: admin, manager, client, freelancer
// All accounts are approved and active to enable immediate login
export async function POST() {
  try {
    const now = new Date().toISOString();

    const testUsers = [
      {
        displayId: 'ADM#TEST001',
        email: 'testadmin@gmail.com',
        name: 'Test Admin',
        role: 'admin' as const,
        phone: '+254700000001',
      },
      {
        displayId: 'MGR#TEST001',
        email: 'testmanager@gmail.com',
        name: 'Test Manager',
        role: 'manager' as const,
        phone: '+254700000002',
      },
      {
        displayId: 'CLT#TEST001',
        email: 'testclient@gmail.com',
        name: 'Test Client',
        role: 'client' as const,
        phone: '+254700000003',
      },
      {
        displayId: 'FRL#TEST001',
        email: 'testfreelancer@gmail.com',
        name: 'Test Freelancer',
        role: 'freelancer' as const,
        phone: '+254700000004',
      },
    ];

    // Password: Test123!
    const passwordHash = await bcrypt.hash('Test123!', 10);

    const created: { id: number; email: string; role: string }[] = [];
    const ensured: { id: number; email: string; role: string }[] = [];

    for (const u of testUsers) {
      // Check existing by email
      const existing = await db.select().from(users).where(eq(users.email, u.email)).limit(1);
      if (existing.length) {
        // Ensure role + approval + status
        await db
          .update(users)
          .set({
            role: u.role,
            approved: true,
            status: 'active',
            emailVerified: true,
            suspendedUntil: null,
            suspensionReason: null,
            rejectedAt: null,
            rejectionReason: null,
            updatedAt: now,
          })
          .where(eq(users.id, existing[0].id));
        ensured.push({ id: existing[0].id, email: existing[0].email, role: u.role });
        continue;
      }

      // Try insert with RETURNING first (if supported)
      let insertedId: number | null = null;
      try {
        const res = await db
          .insert(users)
          .values({
            displayId: u.displayId,
            email: u.email,
            password: passwordHash,
            name: u.name,
            role: u.role,
            approved: true,
            emailVerified: true,
            balance: 0,
            earned: 0,
            totalEarnings: 0,
            rating: 0,
            phone: u.phone,
            status: 'active',
            totalEarned: 0,
            totalSpent: 0,
            completedJobs: 0,
            suspendedUntil: null,
            suspensionReason: null,
            rejectedAt: null,
            rejectionReason: null,
            createdAt: now,
            updatedAt: now,
          })
          .returning({ id: users.id });
        if (res && res[0]) {
          insertedId = res[0].id as number;
        }
      } catch (_err) {
        // Fallback: insert without returning
        try {
          await db.insert(users).values({
            displayId: u.displayId,
            email: u.email,
            password: passwordHash,
            name: u.name,
            role: u.role,
            approved: true,
            emailVerified: true,
            balance: 0,
            earned: 0,
            totalEarnings: 0,
            rating: 0,
            phone: u.phone,
            status: 'active',
            totalEarned: 0,
            totalSpent: 0,
            completedJobs: 0,
            suspendedUntil: null,
            suspensionReason: null,
            rejectedAt: null,
            rejectionReason: null,
            createdAt: now,
            updatedAt: now,
          });
        } catch (e2) {
          // Ignore if conflict occurred concurrently
        }
      }

      // Select back to ensure ID
      const sel = await db
        .select({ id: users.id, email: users.email, role: users.role })
        .from(users)
        .where(eq(users.email, u.email))
        .limit(1);
      if (sel[0]) created.push(sel[0] as any);
    }

    // Fetch final records to return IDs reliably
    const final = [] as any[];
    for (const u of testUsers) {
      const row = await db
        .select({ id: users.id, email: users.email, role: users.role, name: users.name, approved: users.approved, status: users.status })
        .from(users)
        .where(eq(users.email, u.email))
        .limit(1);
      if (row[0]) final.push(row[0]);
    }

    return NextResponse.json({ 
      ok: true, 
      created, 
      ensured, 
      users: final,
      credentials: {
        password: 'Test123!',
        emails: testUsers.map(u => u.email)
      }
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || String(error) }, { status: 500 });
  }
}