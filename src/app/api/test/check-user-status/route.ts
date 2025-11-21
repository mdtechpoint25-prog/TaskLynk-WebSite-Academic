import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Get user info
    const userResult = await client.execute({
      sql: 'SELECT id, email, name, role_id, status, approved_at, created_at FROM users WHERE email = ?',
      args: [email.trim().toLowerCase()]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role_id: user.role_id,
        status: user.status,
        approved_at: user.approved_at,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Check user status error:', error);
    return NextResponse.json({
      error: 'Failed to check user status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
