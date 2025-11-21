import { db } from '@/db';
import { emailLogs } from '@/db/schema';
import { lt } from 'drizzle-orm';

/**
 * 📧 FIX #27: Missing Email Log Cleanup
 * Cleanup old email logs to prevent infinite table growth
 */

export async function cleanupOldEmailLogs(daysToKeep: number = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffISO = cutoffDate.toISOString();

    const result = await db
      .delete(emailLogs)
      .where(lt(emailLogs.createdAt, cutoffISO))
      .returning({ id: emailLogs.id });

    console.log(`Deleted ${result.length} old email logs`);

    return {
      deleted: result.length,
      cutoffDate: cutoffISO,
    };
  } catch (error) {
    console.error('Error cleaning up old email logs:', error);
    throw error;
  }
}

/**
 * Cron job handler for automated cleanup
 */
export async function scheduleEmailLogCleanup() {
  try {
    console.log('Running scheduled email log cleanup...');
    const result = await cleanupOldEmailLogs(30); // Keep last 30 days
    console.log(
      `Email log cleanup completed: ${result.deleted} logs deleted`
    );
    return result;
  } catch (error) {
    console.error('Scheduled email log cleanup failed:', error);
    throw error;
  }
}
