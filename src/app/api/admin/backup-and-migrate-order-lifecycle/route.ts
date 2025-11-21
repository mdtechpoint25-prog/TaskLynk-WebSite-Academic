import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

// Admin endpoint: backup key tables and migrate schema for enhanced order lifecycle
// Non-destructive: only creates backup tables and adds missing columns/tables

function ok(msg: string) { return { ok: true, message: msg }; }

export async function POST() {
  const url = process.env.TURSO_CONNECTION_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    return NextResponse.json({ ok: false, error: "Missing database env vars" }, { status: 500 });
  }

  const client = createClient({ url, authToken });

  const report: any = { backups: [], columns: [], tables: [], backfill: [], errors: [] };

  const run = async (sql: string, args?: any[]) => {
    try {
      return await client.execute({ sql, args });
    } catch (e: any) {
      throw new Error(e?.message || String(e));
    }
  };

  const tryExec = async (label: string, sql: string) => {
    try {
      await run(sql);
      report.tables.push(ok(label));
    } catch (e: any) {
      // ignore duplicate table/column errors
      const m = e.message?.toLowerCase() || "";
      if (!(m.includes("already exists") || m.includes("duplicate") || m.includes("syntax error near \"if not exists\""))) {
        report.errors.push({ step: label, error: e.message });
      } else {
        report.tables.push({ ok: true, message: `${label} (exists)` });
      }
    }
  };

  const addColumn = async (table: string, name: string, def: string) => {
    try {
      await run(`ALTER TABLE ${table} ADD COLUMN ${name} ${def}`);
      report.columns.push(ok(`${table}.${name}`));
    } catch (e: any) {
      const m = e.message?.toLowerCase() || "";
      if (m.includes("duplicate column name") || m.includes("already exists")) {
        report.columns.push({ ok: true, message: `${table}.${name} (exists)` });
      } else {
        report.errors.push({ step: `addColumn ${table}.${name}`, error: e.message });
      }
    }
  };

  const tablesToBackup = [
    "jobs",
    "bids",
    "job_files",
    "job_attachments",
    "invoices",
    "payments",
    "messages",
    "revisions"
  ];

  try {
    // 1) Create backup tables and snapshot data
    for (const t of tablesToBackup) {
      try {
        await tryExec(`create ${t}_backup`, `CREATE TABLE IF NOT EXISTS ${t}_backup AS SELECT * FROM ${t} WHERE 0`);
        // add backup_at column if missing (best-effort)
        try {
          await run(`ALTER TABLE ${t}_backup ADD COLUMN backup_at TEXT`);
        } catch (e: any) {
          // ignore duplicate column
        }
        await run(`INSERT INTO ${t}_backup SELECT *, datetime('now') as backup_at FROM ${t}`);
        const cnt = await run(`SELECT COUNT(*) as c FROM ${t}_backup`);
        report.backups.push({ table: t, rowsInBackup: (cnt.rows[0] as any).c });
      } catch (e: any) {
        report.errors.push({ step: `backup ${t}`, error: e.message });
      }
    }

    // 2) Ensure supporting tables
    await tryExec(
      "order_sequences",
      `CREATE TABLE IF NOT EXISTS order_sequences (
        year_small INTEGER PRIMARY KEY,
        last_seq INTEGER NOT NULL DEFAULT 0
      )`
    );

    await tryExec(
      "balance_ledger",
      `CREATE TABLE IF NOT EXISTS balance_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        job_id INTEGER,
        change_amount REAL,
        reason TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(job_id) REFERENCES jobs(id)
      )`
    );

    // 3) Add/ensure columns on jobs
    await addColumn("jobs", "pages_count", "INTEGER NOT NULL DEFAULT 0");
    await addColumn("jobs", "slides_count", "INTEGER NOT NULL DEFAULT 0");
    await addColumn("jobs", "problems_count", "INTEGER NOT NULL DEFAULT 0");
    await addColumn("jobs", "amount_paid", "REAL NOT NULL DEFAULT 0");
    await addColumn("jobs", "assigned_manager_id", "INTEGER");
    await addColumn("jobs", "assigned_writer_id", "INTEGER");
    // Some projects may miss these two
    await addColumn("jobs", "account_order_number", "TEXT");

    // 4) Extend invoices table with new financial fields (non-destructive)
    await addColumn("invoices", "order_id", "TEXT");
    await addColumn("invoices", "account_order_number", "TEXT");
    await addColumn("invoices", "pages_count", "INTEGER DEFAULT 0");
    await addColumn("invoices", "slides_count", "INTEGER DEFAULT 0");
    await addColumn("invoices", "problems_count", "INTEGER DEFAULT 0");
    await addColumn("invoices", "total_amount", "REAL DEFAULT 0");
    await addColumn("invoices", "amount_to_writer", "REAL DEFAULT 0");
    await addColumn("invoices", "amount_to_manager", "REAL DEFAULT 0");
    await addColumn("invoices", "manager_id", "INTEGER");
    await addColumn("invoices", "writer_id", "INTEGER");
    await addColumn("invoices", "paid_at", "TEXT");
    await addColumn("invoices", "status", "TEXT DEFAULT 'unpaid'");

    // 5) Best-effort backfill
    try {
      await run(`UPDATE jobs SET pages_count = COALESCE(pages,0) WHERE pages_count IS NULL OR pages_count = 0`);
      await run(`UPDATE jobs SET slides_count = COALESCE(slides,0) WHERE slides_count IS NULL OR slides_count = 0`);
      await run(`UPDATE jobs SET problems_count = COALESCE(problems_count,0) WHERE problems_count IS NULL`);
    } catch (e: any) {
      report.errors.push({ step: "backfill page/slide/problem counts", error: e.message });
    }

    // Backfill assigned_writer_id from existing assignedFreelancerId if present
    try {
      await run(`UPDATE jobs SET assigned_writer_id = assigned_freelancer_id WHERE assigned_writer_id IS NULL AND assigned_freelancer_id IS NOT NULL`);
    } catch (e: any) {
      // ignore if column doesn't exist in this project flavor
    }

    // 6) Keep existing order_id values; if any null/empty, set to display_id as fallback
    try {
      await run(`UPDATE jobs SET order_id = display_id WHERE (order_id IS NULL OR order_id = '') AND display_id IS NOT NULL`);
    } catch (e: any) {
      // ignore
    }

    // 7) Summary counts
    const jobsCount = await run(`SELECT COUNT(*) as c FROM jobs`);
    const invoicesCount = await run(`SELECT COUNT(*) as c FROM invoices`);

    return NextResponse.json({
      ok: true,
      summary: {
        jobs: (jobsCount.rows[0] as any).c,
        invoices: (invoicesCount.rows[0] as any).c,
      },
      ...report,
      note:
        "Backups created, lifecycle columns ensured, balance_ledger created, order_sequences created. Existing order_id preserved; generator can be implemented app-side. No destructive changes applied.",
    });
  } catch (error: any) {
    report.errors.push({ step: "fatal", error: error?.message || String(error) });
    return NextResponse.json({ ok: false, errors: report.errors }, { status: 500 });
  } finally {
    try { client.close(); } catch {}
  }
}
