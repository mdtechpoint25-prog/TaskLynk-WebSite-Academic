import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    console.log('Starting order deletion and schema update...');

    // Step 1: Delete all records from order-related tables (in order to respect foreign key constraints)
    await db.run(sql`DELETE FROM job_status_logs`);
    await db.run(sql`DELETE FROM email_notifications`);
    await db.run(sql`DELETE FROM job_files`);
    await db.run(sql`DELETE FROM revisions`);
    await db.run(sql`DELETE FROM ratings`);
    await db.run(sql`DELETE FROM job_messages`);
    await db.run(sql`DELETE FROM job_attachments`);
    await db.run(sql`DELETE FROM invoices`);
    await db.run(sql`DELETE FROM payments`);
    await db.run(sql`DELETE FROM bids`);
    await db.run(sql`DELETE FROM jobs`);

    console.log('All order records deleted successfully');

    // Step 2: Update jobs table schema with new fields
    // Add new columns if they don't exist
    const alterQueries = [
      `ALTER TABLE jobs ADD COLUMN account_linked INTEGER DEFAULT 0 NOT NULL`,
      `ALTER TABLE jobs ADD COLUMN manager_earnings REAL DEFAULT 0`,
      `ALTER TABLE jobs ADD COLUMN freelancer_earnings REAL DEFAULT 0`,
      `ALTER TABLE jobs ADD COLUMN admin_profit REAL DEFAULT 0`,
      `ALTER TABLE jobs ADD COLUMN problems INTEGER`,
      `ALTER TABLE jobs ADD COLUMN paid_order_confirmed_at TEXT`,
      `ALTER TABLE jobs ADD COLUMN approved_by_client_at TEXT`,
    ];

    for (const query of alterQueries) {
      try {
        await db.run(sql.raw(query));
        console.log(`Executed: ${query}`);
      } catch (error: any) {
        // Column might already exist, that's okay
        if (!error.message?.includes('duplicate column name')) {
          console.error(`Error executing ${query}:`, error);
        }
      }
    }

    console.log('Schema updated successfully');

    // IMPORTANT: Do NOT reset user balances or user details

    return NextResponse.json({
      success: true,
      message: 'All order records deleted and schema updated successfully',
      deletedTables: [
        'jobs',
        'bids',
        'payments',
        'invoices',
        'jobAttachments',
        'jobMessages',
        'ratings',
        'revisions',
        'jobFiles',
        'emailNotifications',
        'jobStatusLogs'
      ],
      addedColumns: [
        'account_linked',
        'manager_earnings',
        'freelancer_earnings',
        'admin_profit',
        'problems',
        'paid_order_confirmed_at',
        'approved_by_client_at'
      ]
    });
  } catch (error: any) {
    console.error('Error deleting orders and updating schema:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete orders and update schema', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}