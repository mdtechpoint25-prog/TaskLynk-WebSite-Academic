import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/lib/admin-auth';
import { promises as fs } from 'fs';
import path from 'path';
import { db } from '@/db';
import { systemSettings } from '@/db/schema';

interface SystemSettings {
  [key: string]: string | number | boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
  platform_name: 'TaskLynk',
  platform_email: 'support@tasklynk.com',
  platform_description: 'Freelance Platform',
  min_order_amount: 1000,
  max_order_amount: 1000000,
  order_timeout_days: 30,
  platform_fee_percent: 10,
  transaction_fee_percent: 2,
  minimum_payout: 500,
  maximum_payout: 500000,
  registration_enabled: true,
  revisions_enabled: true,
  messaging_enabled: true,
  ratings_enabled: true,
  require_email_verification: true,
  default_payment_method: 'mpesa',
  mpesa_enabled: true,
  paystack_enabled: true,
  payout_processing_days: 1,
  payment_hold_period: 7,
};

// Simple file-based persistence fallback until DB table is available
const SETTINGS_FILE = path.join(process.cwd(), 'src', 'db', 'system-settings.json');

async function readPersistedSettings(): Promise<SystemSettings | null> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return parsed as SystemSettings;
  } catch {
    return null;
  }
}

async function writePersistedSettings(settings: SystemSettings): Promise<void> {
  const dir = path.dirname(SETTINGS_FILE);
  try {
    // ensure directory exists
    await fs.mkdir(dir, { recursive: true });
  } catch {}
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
}

function coerceTypes(obj: Record<string, any>): SystemSettings {
  const out: SystemSettings = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      // try boolean/number coercion when appropriate
      if (v === 'true' || v === 'false') {
        out[k] = v === 'true';
      } else if (!isNaN(Number(v)) && v.trim() !== '') {
        out[k] = Number(v);
      } else {
        out[k] = v;
      }
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
    } else {
      // ignore unsupported types
    }
  }
  return out;
}

function parseByType(type: string, value: string): string | number | boolean {
  if (type === 'boolean') return value === 'true' || value === '1';
  if (type === 'number') return Number(value);
  return value;
}

// GET - Fetch system settings
export async function GET(request: NextRequest) {
  // Check admin authentication
  const authCheck = await requireAdminRole(request);
  if (authCheck.error) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    // Try database first
    try {
      const rows = await db.select().from(systemSettings);
      if (rows && rows.length > 0) {
        const map: SystemSettings = {};
        for (const r of rows as any[]) {
          map[r.key] = parseByType(r.type, r.value);
        }
        return NextResponse.json({ ...DEFAULT_SETTINGS, ...map } as SystemSettings);
      }
    } catch (e) {
      // fall back to file below
    }

    // Try persisted file fallback
    const persisted = await readPersistedSettings();
    const result = { ...DEFAULT_SETTINGS, ...(persisted || {}) } as SystemSettings;
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST - Update system settings
export async function POST(request: NextRequest) {
  // Check admin authentication
  const authCheck = await requireAdminRole(request);
  if (authCheck.error) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
  }

  try {
    const body = await request.json();

    // Validate settings
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No settings provided' },
        { status: 400 }
      );
    }

    // Merge with existing (from DB or file) and defaults
    let base: SystemSettings = {};
    try {
      const rows = await db.select().from(systemSettings);
      if (rows && rows.length) {
        for (const r of rows as any[]) base[r.key] = parseByType(r.type, r.value);
      }
    } catch {}
    if (Object.keys(base).length === 0) {
      const persisted = (await readPersistedSettings()) || {};
      base = persisted;
    }

    const incoming = coerceTypes(body);
    const merged: SystemSettings = { ...DEFAULT_SETTINGS, ...base, ...incoming };

    // Try to persist to DB first; fall back to file if DB op fails
    const now = new Date().toISOString();
    const adminId = (authCheck as any).user?.id || null;

    try {
      await db.transaction(async (tx) => {
        for (const [key, value] of Object.entries(merged)) {
          const type = typeof value as 'string' | 'number' | 'boolean' as any;
          // @ts-ignore drizzle onConflictDoUpdate available on sqlite insert
          await tx.insert(systemSettings)
            .values({ key, value: String(value), type: type as any, updatedBy: adminId, updatedAt: now })
            .onConflictDoUpdate({
              target: systemSettings.key,
              set: { value: String(value), type: type as any, updatedBy: adminId, updatedAt: now }
            });
        }
      });

      // Return from DB after write
      const rows = await db.select().from(systemSettings);
      const saved: SystemSettings = {};
      for (const r of rows as any[]) saved[r.key] = parseByType(r.type, r.value);

      return NextResponse.json({
        success: true,
        message: 'Settings updated successfully',
        settings: saved,
      });
    } catch (dbErr) {
      // Fallback to file
      await writePersistedSettings(merged);
      return NextResponse.json({
        success: true,
        message: 'Settings updated successfully (file storage)',
        settings: merged,
      });
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}