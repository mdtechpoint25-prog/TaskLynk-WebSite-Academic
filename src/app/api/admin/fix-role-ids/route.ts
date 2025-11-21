import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

// Correct role_id mapping
const CORRECT_ROLE_MAP: Record<string, number> = {
  'admin': 1,
  'client': 2,
  'manager': 3,
  'freelancer': 4,
  'account_owner': 5
};

export async function POST(request: NextRequest) {
  try {
    console.log('[Fix Role IDs] Starting role_id correction...');

    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Get all users
    const usersResult = await client.execute({
      sql: 'SELECT id, email, role, role_id FROM users',
      args: []
    });

    const updates: Array<{ id: number; email: string; oldRoleId: any; newRoleId: number }> = [];

    for (const user of usersResult.rows) {
      const role = String(user.role);
      const currentRoleId = user.role_id;
      const correctRoleId = CORRECT_ROLE_MAP[role];

      if (correctRoleId && currentRoleId !== correctRoleId) {
        // Update user with correct role_id
        await client.execute({
          sql: 'UPDATE users SET role_id = ? WHERE id = ?',
          args: [correctRoleId, user.id]
        });

        updates.push({
          id: Number(user.id),
          email: String(user.email),
          oldRoleId: currentRoleId,
          newRoleId: correctRoleId
        });

        console.log(`[Fix Role IDs] Updated user ${user.id} (${user.email}): ${role} role_id ${currentRoleId} -> ${correctRoleId}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${updates.length} users with incorrect role_id values`,
      updates
    }, { status: 200 });

  } catch (error) {
    console.error('[Fix Role IDs] Error:', error);
    return NextResponse.json({
      error: 'Failed to fix role_id values',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
