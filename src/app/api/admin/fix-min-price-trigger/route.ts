import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function POST() {
  try {
    const results: string[] = [];

    // Drop existing pricing triggers
    await db.run(sql.raw("DROP TRIGGER IF EXISTS trg_jobs_min_price_ins"));
    results.push("Dropped trg_jobs_min_price_ins");

    await db.run(sql.raw("DROP TRIGGER IF EXISTS trg_jobs_min_price_upd"));
    results.push("Dropped trg_jobs_min_price_upd");

    // Recreate with correct pricing: 250 KSh per page, 150 KSh per slide
    const insertTrigger = `
      CREATE TRIGGER trg_jobs_min_price_ins BEFORE INSERT ON jobs
      WHEN NEW.amount < IFNULL(NEW.pages,0)*250 + IFNULL(NEW.slides,0)*150
      BEGIN
        SELECT RAISE(ABORT,'MIN_PRICE');
      END;
    `;
    await db.run(sql.raw(insertTrigger));
    results.push("Created trg_jobs_min_price_ins with 250/page, 150/slide");

    const updateTrigger = `
      CREATE TRIGGER trg_jobs_min_price_upd BEFORE UPDATE OF amount, pages, slides ON jobs
      WHEN NEW.amount < IFNULL(NEW.pages,0)*250 + IFNULL(NEW.slides,0)*150
      BEGIN
        SELECT RAISE(ABORT,'MIN_PRICE');
      END;
    `;
    await db.run(sql.raw(updateTrigger));
    results.push("Created trg_jobs_min_price_upd with 250/page, 150/slide");

    return NextResponse.json({ 
      success: true, 
      message: "Pricing triggers updated successfully",
      results 
    });
  } catch (error: any) {
    console.error("Fix min price trigger error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || String(error) 
    }, { status: 500 });
  }
}
