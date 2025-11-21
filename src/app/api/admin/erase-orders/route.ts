import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

const TABLES_IN_DELETE_ORDER = [
  "job_status_logs",
  "email_notifications",
  "job_files",
  "revisions",
  "ratings",
  "job_messages",
  "job_attachments",
  "invoices",
  "payments",
  "bids",
  "jobs",
];

export async function POST() {
  const results: { table: string; ok: boolean; error?: string }[] = [];
  try {
    for (const table of TABLES_IN_DELETE_ORDER) {
      try {
        await db.run(sql.raw(`DELETE FROM ${table}`));
        results.push({ table, ok: true });
      } catch (e: any) {
        // Ignore if table is missing or any other non-critical error
        results.push({ table, ok: false, error: e?.message || String(e) });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
