import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('[Migration] Starting comprehensive database migration...');

    const migrations = [];

    // ============================================
    // JOB_MESSAGES TABLE - Add new columns
    // ============================================
    console.log('[Migration] Checking job_messages table...');
    const checkJobMessages = await db.run(sql`PRAGMA table_info(job_messages)`);
    const jobMessageColumns = checkJobMessages.rows as any[];
    
    if (!jobMessageColumns.some((col: any) => col.name === 'approved_by')) {
      console.log('[Migration] Adding approved_by to job_messages...');
      await db.run(sql`ALTER TABLE job_messages ADD COLUMN approved_by INTEGER`);
      migrations.push('job_messages.approved_by added');
    }
    
    if (!jobMessageColumns.some((col: any) => col.name === 'approved_at')) {
      console.log('[Migration] Adding approved_at to job_messages...');
      await db.run(sql`ALTER TABLE job_messages ADD COLUMN approved_at TEXT`);
      migrations.push('job_messages.approved_at added');
    }
    
    if (!jobMessageColumns.some((col: any) => col.name === 'visible_to_client')) {
      console.log('[Migration] Adding visible_to_client to job_messages...');
      await db.run(sql`ALTER TABLE job_messages ADD COLUMN visible_to_client INTEGER DEFAULT 0`);
      migrations.push('job_messages.visible_to_client added');
    }
    
    if (!jobMessageColumns.some((col: any) => col.name === 'visible_to_freelancer')) {
      console.log('[Migration] Adding visible_to_freelancer to job_messages...');
      await db.run(sql`ALTER TABLE job_messages ADD COLUMN visible_to_freelancer INTEGER DEFAULT 0`);
      migrations.push('job_messages.visible_to_freelancer added');
    }

    if (!jobMessageColumns.some((col: any) => col.name === 'attachment_count')) {
      console.log('[Migration] Adding attachment_count to job_messages...');
      await db.run(sql`ALTER TABLE job_messages ADD COLUMN attachment_count INTEGER DEFAULT 0`);
      migrations.push('job_messages.attachment_count added');
    }

    // ============================================
    // JOB_ATTACHMENTS TABLE - Add new columns
    // ============================================
    console.log('[Migration] Checking job_attachments table...');
    const checkAttachments = await db.run(sql`PRAGMA table_info(job_attachments)`);
    const attachmentColumns = checkAttachments.rows as any[];
    
    if (!attachmentColumns.some((col: any) => col.name === 'upload_category')) {
      console.log('[Migration] Adding upload_category to job_attachments...');
      await db.run(sql`ALTER TABLE job_attachments ADD COLUMN upload_category TEXT DEFAULT 'general'`);
      migrations.push('job_attachments.upload_category added');
    }
    
    if (!attachmentColumns.some((col: any) => col.name === 'message_id')) {
      console.log('[Migration] Adding message_id to job_attachments...');
      await db.run(sql`ALTER TABLE job_attachments ADD COLUMN message_id INTEGER`);
      migrations.push('job_attachments.message_id added');
    }
    
    if (!attachmentColumns.some((col: any) => col.name === 'is_visible')) {
      console.log('[Migration] Adding is_visible to job_attachments...');
      await db.run(sql`ALTER TABLE job_attachments ADD COLUMN is_visible INTEGER DEFAULT 1`);
      migrations.push('job_attachments.is_visible added');
    }

    if (!attachmentColumns.some((col: any) => col.name === 'shortened_name')) {
      console.log('[Migration] Adding shortened_name to job_attachments...');
      await db.run(sql`ALTER TABLE job_attachments ADD COLUMN shortened_name TEXT`);
      migrations.push('job_attachments.shortened_name added');
    }

    // ============================================
    // MESSAGES TABLE - Add new columns (for global messages dashboard)
    // ============================================
    console.log('[Migration] Checking messages table...');
    const checkMessages = await db.run(sql`PRAGMA table_info(messages)`);
    const messageColumns = checkMessages.rows as any[];
    
    if (!messageColumns.some((col: any) => col.name === 'approved_by')) {
      console.log('[Migration] Adding approved_by to messages...');
      await db.run(sql`ALTER TABLE messages ADD COLUMN approved_by INTEGER`);
      migrations.push('messages.approved_by added');
    }
    
    if (!messageColumns.some((col: any) => col.name === 'approved_at')) {
      console.log('[Migration] Adding approved_at to messages...');
      await db.run(sql`ALTER TABLE messages ADD COLUMN approved_at TEXT`);
      migrations.push('messages.approved_at added');
    }
    
    if (!messageColumns.some((col: any) => col.name === 'is_read')) {
      console.log('[Migration] Adding is_read to messages...');
      await db.run(sql`ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0`);
      migrations.push('messages.is_read added');
    }

    if (!messageColumns.some((col: any) => col.name === 'attachment_count')) {
      console.log('[Migration] Adding attachment_count to messages...');
      await db.run(sql`ALTER TABLE messages ADD COLUMN attachment_count INTEGER DEFAULT 0`);
      migrations.push('messages.attachment_count added');
    }

    // ============================================
    // Update existing visibility logic
    // ============================================
    console.log('[Migration] Setting visibility for existing messages...');
    
    // For job_messages: Approved messages should be visible to both parties
    await db.run(sql`
      UPDATE job_messages 
      SET visible_to_client = 1, visible_to_freelancer = 1 
      WHERE admin_approved = 1
    `);
    
    // For job_messages: Unapproved messages are only visible to sender and admin
    await db.run(sql`
      UPDATE job_messages 
      SET visible_to_client = 0, visible_to_freelancer = 0 
      WHERE admin_approved = 0 OR admin_approved IS NULL
    `);

    // ============================================
    // Generate shortened names for existing files
    // ============================================
    console.log('[Migration] Generating shortened names for existing files...');
    const existingFiles = await db.run(sql`SELECT id, file_name FROM job_attachments WHERE shortened_name IS NULL`);
    
    for (const file of existingFiles.rows as any[]) {
      const fileName = file.file_name || '';
      const maxLength = 30;
      let shortened = fileName;
      
      if (fileName.length > maxLength) {
        const ext = fileName.substring(fileName.lastIndexOf('.'));
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        shortened = nameWithoutExt.substring(0, maxLength - ext.length - 3) + '...' + ext;
      }
      
      await db.run(sql`UPDATE job_attachments SET shortened_name = ${shortened} WHERE id = ${file.id}`);
    }
    migrations.push('Generated shortened names for existing files');

    // ============================================
    // Final verification
    // ============================================
    console.log('[Migration] Verifying migration...');
    const jobMessagesCount = await db.run(sql`SELECT COUNT(*) as count FROM job_messages`);
    const attachmentsCount = await db.run(sql`SELECT COUNT(*) as count FROM job_attachments`);
    const messagesCount = await db.run(sql`SELECT COUNT(*) as count FROM messages`);

    const stats = {
      job_messages: (jobMessagesCount.rows[0] as any).count,
      job_attachments: (attachmentsCount.rows[0] as any).count,
      messages: (messagesCount.rows[0] as any).count,
      migrations_applied: migrations.length
    };

    console.log('[Migration] Migration completed successfully:', stats);

    return NextResponse.json({
      success: true,
      message: 'Comprehensive migration completed successfully',
      migrations,
      stats
    });

  } catch (error) {
    console.error('[Migration] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}