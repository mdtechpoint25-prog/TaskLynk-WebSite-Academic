import { NextResponse } from 'next/server'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

// POST /api/admin/setup-v2-triggers
// Creates SQLite triggers for the new v2 schema (orders, order_financials)
// - Enforces minimum pricing (KSh 240/page, 150/slide) at DB level
// - Ensures client_total baseline >= pages*240 + slides*150
// - Sets manager assignment fee (10) when status -> 'assigned'
// - Sets manager submit fee (10 + 5*(units-1)) when status -> 'submitted'
// Note: Balance distribution on payment is handled in the payment API route to avoid double credits
export async function POST() {
  try {
    const ops: { ok: boolean; op: string; error?: string }[] = []

    const drops = [
      'DROP TRIGGER IF EXISTS trg_orders_min_baseline_ins',
      'DROP TRIGGER IF EXISTS trg_orders_min_baseline_upd',
      'DROP TRIGGER IF EXISTS trg_orders_assign_manager_fee',
      'DROP TRIGGER IF EXISTS trg_orders_submit_manager_fee',
      // remove old paid credit trigger if it exists
      'DROP TRIGGER IF EXISTS trg_orders_on_paid_credit_balances',
    ]

    for (const q of drops) {
      try {
        await db.run(sql.raw(q))
        ops.push({ ok: true, op: q })
      } catch (e: any) {
        ops.push({ ok: false, op: q, error: e?.message })
      }
    }

    // Enforce minimum client_total baseline: pages*240 + slides*150
    const trgMinInsert = `
      CREATE TRIGGER trg_orders_min_baseline_ins BEFORE INSERT ON orders
      WHEN (
        COALESCE(NEW.client_total,0) < (
          COALESCE(NEW.page_count,0) * 240 + COALESCE(NEW.slide_count,0) * 150
        )
      )
      BEGIN
        SELECT RAISE(ABORT, 'MIN_TOTAL_BASELINE');
      END;
    `

    const trgMinUpdate = `
      CREATE TRIGGER trg_orders_min_baseline_upd BEFORE UPDATE OF client_total, page_count, slide_count ON orders
      WHEN (
        COALESCE(NEW.client_total,0) < (
          COALESCE(NEW.page_count,0) * 240 + COALESCE(NEW.slide_count,0) * 150
        )
      )
      BEGIN
        SELECT RAISE(ABORT, 'MIN_TOTAL_BASELINE');
      END;
    `

    // Manager fee on assignment (status becomes 'assigned')
    const trgAssignFee = `
      CREATE TRIGGER trg_orders_assign_manager_fee AFTER UPDATE OF status ON orders
      WHEN NEW.status = 'assigned' AND (OLD.status IS NULL OR OLD.status <> 'assigned')
      BEGIN
        UPDATE order_financials
        SET manager_assign_amount = 10
        WHERE order_id = NEW.id;
      END;
    `

    // Manager fee on submit (status becomes 'submitted')
    const trgSubmitFee = `
      CREATE TRIGGER trg_orders_submit_manager_fee AFTER UPDATE OF status ON orders
      WHEN NEW.status = 'submitted' AND (OLD.status IS NULL OR OLD.status <> 'submitted')
      BEGIN
        UPDATE order_financials
        SET manager_submit_amount = (
          10 + (
            CASE WHEN NEW.work_type = 'slides'
              THEN CASE WHEN COALESCE(NEW.slide_count,0) > 1 THEN (COALESCE(NEW.slide_count,0) - 1) * 5 ELSE 0 END
              ELSE CASE WHEN COALESCE(NEW.page_count,0) > 1 THEN (COALESCE(NEW.page_count,0) - 1) * 5 ELSE 0 END
            END
          )
        )
        WHERE order_id = NEW.id;
      END;
    `

    for (const q of [trgMinInsert, trgMinUpdate, trgAssignFee, trgSubmitFee]) {
      try {
        await db.run(sql.raw(q))
        ops.push({ ok: true, op: q.split('\n')[0].trim() })
      } catch (e: any) {
        ops.push({ ok: false, op: q.split('\n')[0].trim(), error: e?.message })
      }
    }

    return NextResponse.json({ success: true, results: ops })
  } catch (error: any) {
    console.error('setup-v2-triggers error:', error)
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 })
  }
}