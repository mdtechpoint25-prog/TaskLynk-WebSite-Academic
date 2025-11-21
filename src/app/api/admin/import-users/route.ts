import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userData } = body;

    if (!Array.isArray(userData)) {
      return NextResponse.json(
        { success: false, error: 'userData must be an array' },
        { status: 400 }
      );
    }

    const results = {
      imported: 0,
      updated: 0,
      errors: [] as string[]
    };

    for (const user of userData) {
      try {
        // Check if user exists by email
        const existing = await db.select().from(users).where(eq(users.email, user.email)).limit(1);

        // Prepare user data - convert numeric strings to actual numbers/booleans
        const userData = {
          email: user.email,
          password: user.password, // Already bcrypt hashed
          name: user.name,
          role: user.role,
          approved: Boolean(parseInt(user.approved || '0')),
          balance: parseFloat(user.balance || '0'),
          rating: parseFloat(user.rating || '0'),
          phone: user.phone || null,
          status: user.status || 'active',
          display_id: user.display_id || null,
          profile_picture_url: user.profile_picture_url || null,
          domain_id: user.domain_id ? parseInt(user.domain_id) : null,
          last_login_ip: user.last_login_ip || null,
          last_login_at: user.last_login_at || null,
          earned: parseFloat(user.earned || '0'),
          total_earnings: parseFloat(user.total_earnings || '0'),
          last_login_device: user.last_login_device || null,
          login_count: parseInt(user.login_count || '0'),
          client_priority: user.client_priority || 'regular',
          freelancer_badge: user.freelancer_badge || null,
          client_tier: user.client_tier || 'basic',
          email_verified: Boolean(parseInt(user.email_verified || '0')),
          account_id: user.account_id ? parseInt(user.account_id) : null,
          assigned_manager_id: user.assigned_manager_id ? parseInt(user.assigned_manager_id) : null,
          account_name: user.account_name || null,
          suspended_until: user.suspended_until || null,
          suspension_reason: user.suspension_reason || null,
          blacklist_reason: user.blacklist_reason || null,
          rejected_at: user.rejected_at || null,
          rejection_reason: user.rejection_reason || null,
          total_earned: parseFloat(user.total_earned || '0'),
          total_spent: parseFloat(user.total_spent || '0'),
          completed_jobs: parseInt(user.completed_jobs || '0'),
          completion_rate: parseFloat(user.completion_rate || '0')
        };

        if (existing.length > 0) {
          // Update existing user
          await db.update(users)
            .set({
              ...userData,
              updated_at: user.updated_at || new Date().toISOString()
            })
            .where(eq(users.email, user.email));
          results.updated++;
        } else {
          // Insert new user
          await db.insert(users).values({
            ...userData,
            created_at: user.created_at || new Date().toISOString(),
            updated_at: user.updated_at || new Date().toISOString()
          });
          results.imported++;
        }
      } catch (error) {
        results.errors.push(`Failed to import ${user.email}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import complete: ${results.imported} new users, ${results.updated} updated`,
      results
    });
  } catch (error) {
    console.error('Import users error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to import users' 
      },
      { status: 500 }
    );
  }
}
