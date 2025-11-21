import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobAttachments } from '@/db/schema';
import { and, lte, isNull, sql } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

/**
 * 🗑️ FIX #23: File Upload Cleanup Implementation
 * Admin endpoint to manually trigger cleanup of expired files
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const now = new Date().toISOString();

    // Get files past deletion date that haven't been deleted yet
    const filesToDelete = await db
      .select()
      .from(jobAttachments)
      .where(
        and(
          lte(jobAttachments.scheduledDeletionAt, now),
          isNull(jobAttachments.deletedAt)
        )
      );

    console.log(`Found ${filesToDelete.length} files to delete`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const file of filesToDelete) {
      try {
        // Extract file path from URL
        const fileUrl = file.fileUrl;
        let filePath: string;

        if (fileUrl.includes('supabase.co/storage')) {
          // Parse Supabase URL
          const urlParts = fileUrl.split('/storage/v1/object/public/');
          if (urlParts.length > 1) {
            filePath = urlParts[1];
          } else {
            throw new Error('Invalid Supabase URL format');
          }

          // Delete from Supabase Storage
          const { error: deleteError } = await supabase.storage
            .from('job-files')
            .remove([filePath]);

          if (deleteError) {
            throw deleteError;
          }
        }

        // Mark as deleted in database
        await db
          .update(jobAttachments)
          .set({ deletedAt: now })
          .where(sql`${jobAttachments.id} = ${file.id}`);

        successCount++;
      } catch (fileError: any) {
        console.error(`Error deleting file ${file.id}:`, fileError);
        errorCount++;
        errors.push(`File ${file.id}: ${fileError.message}`);
      }
    }

    return NextResponse.json({
      message: 'File cleanup completed',
      total: filesToDelete.length,
      deleted: successCount,
      failed: errorCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error in file cleanup:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cleanup files' },
      { status: 500 }
    );
  }
}
