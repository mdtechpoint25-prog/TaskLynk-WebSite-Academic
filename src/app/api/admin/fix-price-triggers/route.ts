import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';

export async function POST() {
  try {
    console.log('Updating price validation triggers...');

    // Create direct LibSQL client
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    // Drop old triggers
    await client.execute('DROP TRIGGER IF EXISTS trg_jobs_min_price_ins');
    await client.execute('DROP TRIGGER IF EXISTS trg_jobs_min_price_upd');
    console.log('✅ Dropped old triggers');

    // Create new triggers with correct pricing: 250 per page, 150 per slide
    await client.execute(`
      CREATE TRIGGER trg_jobs_min_price_ins BEFORE INSERT ON jobs
      WHEN NEW.amount < IFNULL(NEW.pages,0)*250 + IFNULL(NEW.slides,0)*150
      BEGIN
        SELECT RAISE(ABORT,'MIN_PRICE');
      END
    `);
    console.log('✅ Created new INSERT trigger with 250 per page / 150 per slide');

    await client.execute(`
      CREATE TRIGGER trg_jobs_min_price_upd BEFORE UPDATE OF amount, pages, slides ON jobs
      WHEN NEW.amount < IFNULL(NEW.pages,0)*250 + IFNULL(NEW.slides,0)*150
      BEGIN
        SELECT RAISE(ABORT,'MIN_PRICE');
      END
    `);
    console.log('✅ Created new UPDATE trigger with 250 per page / 150 per slide');

    return NextResponse.json({
      success: true,
      message: 'Price validation triggers updated successfully',
      newRules: {
        perPage: 250,
        perSlide: 150
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating triggers:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update triggers',
    }, { status: 500 });
  }
}