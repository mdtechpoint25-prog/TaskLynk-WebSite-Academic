import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function POST() {
  try {
    const results: any[] = [];

    // 1) Add columns to jobs if not exists
    const addColumns = [
      "ALTER TABLE jobs ADD COLUMN submitted INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE jobs ADD COLUMN submitted_at TEXT",
      "ALTER TABLE jobs ADD COLUMN writer_paid INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE jobs ADD COLUMN writer_paid_at TEXT",
      "ALTER TABLE jobs ADD COLUMN manager_assigned_paid INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE jobs ADD COLUMN manager_assign_paid_at TEXT",
      "ALTER TABLE jobs ADD COLUMN manager_submit_paid INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE jobs ADD COLUMN manager_submit_paid_at TEXT",
    ];

    for (const q of addColumns) {
      try {
        await db.run(sql.raw(q));
        results.push({ ok: true, op: q });
      } catch (e: any) {
        // Column may already exist; ignore duplicate errors
        if (!String(e?.message || "").includes("duplicate column name")) {
          results.push({ ok: false, op: q, error: e?.message });
        }
      }
    }

    // 2) Create order_financials
    const createOrderFinancials = `
      CREATE TABLE IF NOT EXISTS order_financials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        client_amount REAL NOT NULL DEFAULT 0,
        writer_amount REAL NOT NULL DEFAULT 0,
        manager_amount REAL NOT NULL DEFAULT 0,
        platform_fee REAL NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `;
    await db.run(sql.raw(createOrderFinancials));
    results.push({ ok: true, op: "create order_financials" });

    await db.run(sql.raw(
      "CREATE INDEX IF NOT EXISTS idx_order_financials_job ON order_financials(job_id)"
    ));
    results.push({ ok: true, op: "index order_financials(job_id)" });

    // 3) Create order_history
    const createOrderHistory = `
      CREATE TABLE IF NOT EXISTS order_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        actor_id INTEGER REFERENCES users(id),
        action TEXT,
        details TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `;
    await db.run(sql.raw(createOrderHistory));
    results.push({ ok: true, op: "create order_history" });

    await db.run(sql.raw(
      "CREATE INDEX IF NOT EXISTS idx_order_history_job ON order_history(job_id)"
    ));
    results.push({ ok: true, op: "index order_history(job_id)" });

    // 4) Triggers on jobs (use WHEN clauses per SQLite syntax)
    const triggers = [
      // Drop any existing triggers first
      "DROP TRIGGER IF EXISTS trg_jobs_min_price_ins",
      "DROP TRIGGER IF EXISTS trg_jobs_min_price_upd",
      "DROP TRIGGER IF EXISTS trg_jobs_single_submit",
      "DROP TRIGGER IF EXISTS trg_jobs_single_pay",

      // Minimum client price enforcement (INSERT)
      `CREATE TRIGGER trg_jobs_min_price_ins BEFORE INSERT ON jobs
       WHEN NEW.amount < IFNULL(NEW.pages,0)*250 + IFNULL(NEW.slides,0)*150
       BEGIN
         SELECT RAISE(ABORT,'MIN_PRICE');
       END;`,

      // Minimum client price enforcement (UPDATE on relevant columns)
      `CREATE TRIGGER trg_jobs_min_price_upd BEFORE UPDATE OF amount, pages, slides ON jobs
       WHEN NEW.amount < IFNULL(NEW.pages,0)*250 + IFNULL(NEW.slides,0)*150
       BEGIN
         SELECT RAISE(ABORT,'MIN_PRICE');
       END;`,

      // Prevent multiple submissions
      `CREATE TRIGGER trg_jobs_single_submit BEFORE UPDATE ON jobs
       WHEN NEW.submitted=1 AND OLD.submitted=1
       BEGIN
         SELECT RAISE(ABORT,'ALREADY_SUBMITTED');
       END;`,

      // Prevent multiple payment confirmations
      `CREATE TRIGGER trg_jobs_single_pay BEFORE UPDATE ON jobs
       WHEN NEW.payment_confirmed=1 AND OLD.payment_confirmed=1
       BEGIN
         SELECT RAISE(ABORT,'ALREADY_PAID');
       END;`,
    ];

    for (const t of triggers) {
      await db.run(sql.raw(t));
      results.push({ ok: true, op: t.startsWith('CREATE') ? t.split(' ')[2] : t.split(' ')[2] });
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("setup-pricing-triggers error:", error);
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}