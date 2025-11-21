import { db } from '@/db';
import { users, jobs } from '@/db/schema';
import { eq, and, gte, lt, like } from 'drizzle-orm';

/**
 * Generates a unique display ID for a user based on their role
 * @param role - User role: 'admin', 'client', 'freelancer', or 'account_owner'
 * @returns Formatted display ID string
 */
export async function generateUserDisplayId(role: string): Promise<string> {
  try {
    // Validate role
    if (!['admin', 'client', 'freelancer', 'account_owner'].includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    // Determine prefix and pad length
    let prefix = '';
    let pad = 0;
    switch (role) {
      case 'admin':
        prefix = 'ADMN#'; pad = 4; break;
      case 'freelancer':
        prefix = 'FRL#'; pad = 8; break;
      case 'client':
      case 'account_owner':
        // Treat both client and account_owner under the same CLT# sequence to avoid UNIQUE conflicts
        prefix = 'CLT#'; pad = 7; break;
      default:
        throw new Error(`Unhandled role: ${role}`);
    }

    // Fetch existing displayIds with this prefix across ALL roles (prevents collisions between client/account_owner)
    const existing = await db
      .select({ displayId: users.displayId })
      .from(users)
      .where(like(users.displayId, `${prefix}%`));

    // Compute the next number based on the current max numeric suffix
    let maxNum = 0;
    for (const row of existing) {
      const id = row.displayId ?? '';
      if (id.startsWith(prefix)) {
        const numericPart = id.slice(prefix.length).replace(/\D/g, '');
        const num = parseInt(numericPart, 10);
        if (!Number.isNaN(num) && num > maxNum) maxNum = num;
      }
    }
    const nextNumber = maxNum + 1;
    const displayId = `${prefix}${nextNumber.toString().padStart(pad, '0')}`;

    return displayId;
  } catch (error) {
    console.error('Error generating user display ID:', error);
    throw new Error(`Failed to generate display ID for role ${role}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates a unique display ID for a job with year-based sequence
 * Returns format: #YY000001 (2-digit year + 6 digits)
 *
 * Updated to compute the MAX suffix within the current-year prefix instead of COUNT,
 * preventing duplicates when rows are deleted or under concurrency.
 */
export async function generateJobDisplayId(): Promise<string> {
  try {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const prefix = `#${yy}`;

    // Fetch all existing displayIds for current year prefix and compute max suffix
    const existing = await db
      .select({ displayId: jobs.displayId })
      .from(jobs)
      .where(like(jobs.displayId, `${prefix}%`));

    let maxSuffix = 0;
    for (const row of existing) {
      const id = row.displayId ?? '';
      // Prefer strict pattern first: #YY######
      const m = id.match(/^#(\d{2})(\d{6})$/);
      if (m && m[1] === yy) {
        const n = parseInt(m[2], 10);
        if (!Number.isNaN(n) && n > maxSuffix) maxSuffix = n;
        continue;
      }
      // Fallback: take any numeric tail after prefix
      if (id.startsWith(prefix)) {
        const tail = id.slice(prefix.length).replace(/\D/g, '');
        const n = parseInt(tail, 10);
        if (!Number.isNaN(n) && n > maxSuffix) maxSuffix = n;
      }
    }

    const nextNumber = maxSuffix + 1;
    const displayId = `#${yy}${String(nextNumber).padStart(6, '0')}`;

    return displayId;
  } catch (error) {
    console.error('Error generating job display ID:', error);
    throw new Error(`Failed to generate job display ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}