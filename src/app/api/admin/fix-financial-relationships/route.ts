import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const results: string[] = [];

    // Step 1: Add financial columns to jobs table if they don't exist
    const financialColumns = [
      "ALTER TABLE jobs ADD COLUMN freelancer_earnings REAL DEFAULT 0",
      "ALTER TABLE jobs ADD COLUMN manager_earnings REAL DEFAULT 0",
      "ALTER TABLE jobs ADD COLUMN admin_profit REAL DEFAULT 0",
      "ALTER TABLE jobs ADD COLUMN client_total REAL DEFAULT 0"
    ];

    for (const query of financialColumns) {
      try {
        await db.run(sql.raw(query));
        results.push(`✓ Added column: ${query.split('ADD COLUMN ')[1]?.split(' ')[0]}`);
      } catch (e: any) {
        if (e.message?.includes('duplicate column')) {
          results.push(`○ Column already exists: ${query.split('ADD COLUMN ')[1]?.split(' ')[0]}`);
        } else {
          results.push(`✗ Error adding column: ${e.message}`);
        }
      }
    }

    // Step 2: Create order_financials table linked to jobs
    try {
      await db.run(sql.raw(`
        CREATE TABLE IF NOT EXISTS order_financials (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          job_id INTEGER NOT NULL UNIQUE,
          client_amount REAL NOT NULL DEFAULT 0,
          writer_amount REAL NOT NULL DEFAULT 0,
          manager_assign_amount REAL DEFAULT 10,
          manager_submit_amount REAL DEFAULT 0,
          platform_fee REAL DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        )
      `));
      results.push('✓ Created order_financials table');
    } catch (e: any) {
      results.push(`○ order_financials table: ${e.message}`);
    }

    // Create index on job_id
    try {
      await db.run(sql.raw('CREATE INDEX IF NOT EXISTS idx_order_financials_job_id ON order_financials(job_id)'));
      results.push('✓ Created index on order_financials.job_id');
    } catch (e: any) {
      results.push(`○ Index: ${e.message}`);
    }

    // Step 3: Create trigger to auto-update user balances on payment confirmation
    try {
      await db.run(sql.raw('DROP TRIGGER IF EXISTS trg_update_balances_on_payment'));
      await db.run(sql.raw(`
        CREATE TRIGGER trg_update_balances_on_payment
        AFTER UPDATE ON jobs
        WHEN NEW.payment_confirmed = 1 AND OLD.payment_confirmed = 0
        BEGIN
          -- Update freelancer balance
          UPDATE users
          SET 
            balance = balance + NEW.freelancer_earnings,
            total_earned = total_earned + NEW.freelancer_earnings
          WHERE id = NEW.assigned_freelancer_id AND NEW.assigned_freelancer_id IS NOT NULL;
          
          -- Update manager balance (using client's assigned manager)
          UPDATE users
          SET 
            balance = balance + NEW.manager_earnings,
            total_earned = total_earned + NEW.manager_earnings
          WHERE id = (SELECT assigned_manager_id FROM users WHERE id = NEW.client_id)
            AND (SELECT assigned_manager_id FROM users WHERE id = NEW.client_id) IS NOT NULL;
        END
      `));
      results.push('✓ Created trigger: trg_update_balances_on_payment');
    } catch (e: any) {
      results.push(`✗ Trigger error: ${e.message}`);
    }

    // Step 4: Backfill financial records for existing jobs
    try {
      const jobs: any[] = await db.all(sql`
        SELECT 
          id,
          amount,
          pages,
          slides,
          work_type,
          assigned_freelancer_id,
          client_id
        FROM jobs
        WHERE id NOT IN (SELECT job_id FROM order_financials WHERE 1=1)
      `);

      let backfilled = 0;
      for (const job of jobs) {
        // Calculate writer earnings based on work type and units
        let writerAmount = 0;
        if (job.work_type === 'writing') {
          writerAmount = (job.pages || 0) * 200;
        } else if (job.work_type === 'slides') {
          writerAmount = (job.slides || 0) * 100;
        } else if (job.work_type === 'technical') {
          writerAmount = (job.pages || 0) * 230;
        } else {
          writerAmount = (job.pages || 0) * 200;
        }

        const managerAssignFee = job.assigned_freelancer_id ? 10 : 0;
        const managerSubmitFee = (job.pages || 0) * 10;
        const managerTotal = managerAssignFee + managerSubmitFee;
        const clientTotal = job.amount || 0;
        const platformFee = Math.max(0, clientTotal - writerAmount - managerTotal);

        // Insert financial record
        await db.run(sql`
          INSERT INTO order_financials (job_id, client_amount, writer_amount, manager_assign_amount, manager_submit_amount, platform_fee)
          VALUES (${job.id}, ${clientTotal}, ${writerAmount}, ${managerAssignFee}, ${managerSubmitFee}, ${platformFee})
        `);

        // Update job financial columns
        await db.run(sql`
          UPDATE jobs
          SET 
            freelancer_earnings = ${writerAmount},
            manager_earnings = ${managerTotal},
            admin_profit = ${platformFee},
            client_total = ${clientTotal}
          WHERE id = ${job.id}
        `);

        backfilled++;
      }

      results.push(`✓ Backfilled ${backfilled} financial records`);
    } catch (e: any) {
      results.push(`✗ Backfill error: ${e.message}`);
    }

    // Step 5: Verify relationships
    try {
      const verifyQuery: any[] = await db.all(sql`
        SELECT 
          (SELECT COUNT(*) FROM jobs) as total_jobs,
          (SELECT COUNT(DISTINCT job_id) FROM order_financials) as jobs_with_financials
      `);

      results.push('✓ Verification complete:');
      results.push(`  - Total jobs: ${verifyQuery[0]?.total_jobs || 0}`);
      results.push(`  - Jobs with financial records: ${verifyQuery[0]?.jobs_with_financials || 0}`);
    } catch (e: any) {
      results.push(`○ Verification: ${e.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Financial relationships fixed successfully',
      details: results
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || String(error)
    }, { status: 500 });
  }
}