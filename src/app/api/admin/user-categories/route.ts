import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, userCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/admin/user-categories
 * Get all user categories with user details
 */
export async function GET(req: NextRequest) {
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

    // Get all user categories with user details
    const categories = await db
      .select({
        id: userCategories.id,
        userId: userCategories.userId,
        category: userCategories.category,
        assignedAt: userCategories.assignedAt,
        assignedBy: userCategories.assignedBy,
        notes: userCategories.notes,
        createdAt: userCategories.createdAt,
        updatedAt: userCategories.updatedAt,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
        userStatus: users.status,
      })
      .from(userCategories)
      .leftJoin(users, eq(userCategories.userId, users.id));

    // Group by category for summary
    const summary = {
      admin: categories.filter(c => c.category === 'admin').length,
      manager: categories.filter(c => c.category === 'manager').length,
      freelancer: categories.filter(c => c.category === 'freelancer').length,
      client_with_account: categories.filter(c => c.category === 'client_with_account').length,
      client_without_account: categories.filter(c => c.category === 'client_without_account').length,
      total: categories.length,
    };

    return NextResponse.json({
      categories,
      summary
    });
  } catch (error) {
    console.error('Error fetching user categories:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/user-categories
 * Assign or update a user's category
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

    const body = await req.json();
    const { userId, category, notes } = body;

    if (!userId || !category) {
      return NextResponse.json({ error: 'userId and category are required' }, { status: 400 });
    }

    // Validate category
    const validCategories = ['client_with_account', 'client_without_account', 'admin', 'freelancer', 'manager'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` }, { status: 400 });
    }

    // Check if user exists
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has a category
    const [existingCategory] = await db
      .select()
      .from(userCategories)
      .where(eq(userCategories.userId, userId));

    if (existingCategory) {
      // Update existing category
      await db
        .update(userCategories)
        .set({
          category,
          notes: notes || existingCategory.notes,
          assignedBy: adminUser.id,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userCategories.userId, userId));

      return NextResponse.json({
        success: true,
        message: 'User category updated successfully',
        category: {
          userId,
          category,
          userName: targetUser.name,
          userEmail: targetUser.email,
        }
      });
    } else {
      // Create new category
      await db.insert(userCategories).values({
        userId,
        category,
        assignedAt: new Date().toISOString(),
        assignedBy: adminUser.id,
        notes: notes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: 'User category assigned successfully',
        category: {
          userId,
          category,
          userName: targetUser.name,
          userEmail: targetUser.email,
        }
      });
    }
  } catch (error) {
    console.error('Error assigning user category:', error);
    return NextResponse.json({ 
      error: 'Failed to assign user category',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
