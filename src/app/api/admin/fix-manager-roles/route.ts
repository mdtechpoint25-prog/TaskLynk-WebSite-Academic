import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    // Step 1: Get all current managers to show what we're fixing
    const currentManagers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    }).from(users).where(eq(users.role, 'manager'));

    // Step 2: Reset all managers to 'client' role
    await db.update(users)
      .set({ role: 'client' })
      .where(eq(users.role, 'manager'));

    // Step 3: Ensure admin accounts are properly set
    const adminEmails = [
      'topwriteessays@gmail.com',
      'm.d.techpoint25@gmail.com',
      'maguna956@gmail.com',
      'tasklynk01@gmail.com',
      'maxwellotieno11@gmail.com'
    ];

    await db.update(users)
      .set({ role: 'admin', approved: true })
      .where(inArray(users.email, adminEmails));

    // Step 4: Clear any manager assignments
    await db.update(users)
      .set({ assignedManagerId: null })
      .where(eq(users.assignedManagerId, users.assignedManagerId));

    // Step 5: Get final role counts
    const allUsers = await db.select({
      role: users.role,
    }).from(users);

    const roleCounts = allUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      message: 'User roles have been restored successfully',
      previousManagers: currentManagers,
      currentRoleCounts: roleCounts,
    });
  } catch (error) {
    console.error('Error fixing manager roles:', error);
    return NextResponse.json(
      { error: 'Failed to fix manager roles' },
      { status: 500 }
    );
  }
}
