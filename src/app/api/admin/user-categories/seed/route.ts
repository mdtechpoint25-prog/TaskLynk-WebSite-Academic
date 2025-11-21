import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userCategories } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * POST /api/admin/user-categories/seed
 * Seeds the userCategories table with all existing users based on their current roles
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify admin user
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(token)));

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all users
    const allUsers = await db.select().from(users);
    
    const categorizations: { userId: number; category: string; name: string; email: string }[] = [];

    // Process each user and assign them a category
    for (const currentUser of allUsers) {
      let category: string;

      // Determine category based on user properties
      if (currentUser.role === 'admin') {
        category = 'admin';
      } else if (currentUser.role === 'manager') {
        category = 'manager';
      } else if (currentUser.role === 'freelancer') {
        category = 'freelancer';
      } else if (currentUser.role === 'client' || currentUser.role === 'account_owner') {
        // Check if client has an account
        if (currentUser.accountId || currentUser.accountName) {
          category = 'client_with_account';
        } else {
          category = 'client_without_account';
        }
      } else {
        // Default fallback - shouldn't happen
        category = 'client_without_account';
      }

      // Insert into userCategories table
      try {
        // Check if category already exists for this user
        const existingCategory = await db
          .select()
          .from(userCategories)
          .where(eq(userCategories.userId, currentUser.id))
          .limit(1);

        if (existingCategory.length === 0) {
          await db.insert(userCategories).values({
            userId: currentUser.id,
            category,
            assignedAt: new Date().toISOString(),
            assignedBy: adminUser.id,
            notes: `Auto-categorized based on role: ${currentUser.role}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          categorizations.push({
            userId: currentUser.id,
            category,
            name: currentUser.name,
            email: currentUser.email
          });
        }
      } catch (error) {
        console.error(`Failed to categorize user ${currentUser.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully categorized ${categorizations.length} users`,
      categorizations,
      totalUsersProcessed: allUsers.length
    });
  } catch (error) {
    console.error('Error seeding user categories:', error);
    return NextResponse.json({ 
      error: 'Failed to seed user categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
