import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobAttachments, jobs, users, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Allowed file formats (server-side validation)
const ALLOWED_FORMATS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx',
  'xls', 'xlsx', 'txt', 'rtf',
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg',
  'zip', 'rar', '7z', 'tar', 'gz',
  'mp3', 'mp4', 'wav', 'avi', 'mov',
  'csv', 'json', 'xml'
];

// ✅ CRITICAL: Maximum file size (40MB)
const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40MB in bytes

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const jobId = formData.get('jobId') as string;
    const uploadedBy = formData.get('uploadedBy') as string;
    const uploadType = formData.get('uploadType') as string; // 'initial', 'draft', 'final', 'revision'
    const file = formData.get('file') as File;

    // Validate inputs
    if (!jobId || isNaN(parseInt(jobId))) {
      return NextResponse.json(
        { error: 'Valid job ID is required', code: 'INVALID_JOB_ID' },
        { status: 400 }
      );
    }

    if (!uploadedBy || isNaN(parseInt(uploadedBy))) {
      return NextResponse.json(
        { error: 'Valid uploader user ID is required', code: 'INVALID_UPLOADED_BY' },
        { status: 400 }
      );
    }

    if (!uploadType || !['initial', 'draft', 'final', 'revision', 'additional'].includes(uploadType)) {
      return NextResponse.json(
        { error: 'Valid upload type is required (initial, draft, final, revision, additional)', code: 'INVALID_UPLOAD_TYPE' },
        { status: 400 }
      );
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'File is required', code: 'MISSING_FILE' },
        { status: 400 }
      );
    }

    // ✅ VALIDATE FILE FORMAT (Backend validation)
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt) {
      return NextResponse.json(
        { error: 'File must have an extension', code: 'NO_FILE_EXTENSION' },
        { status: 400 }
      );
    }
    
    if (!ALLOWED_FORMATS.includes(fileExt)) {
      return NextResponse.json(
        { error: `Unsupported file type: .${fileExt}. Please upload a supported file format.`, code: 'INVALID_FILE_FORMAT' },
        { status: 400 }
      );
    }

    // ✅ Validate file size (max 40MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size must not exceed 40MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`, code: 'FILE_TOO_LARGE' },
        { status: 413 }
      );
    }

    let url = '';
    
    // ✅ PRIMARY: Try Replit App Storage first
    try {
      console.log(`📤 Uploading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      
      const { uploadToReplitStorage, isReplitStorageAvailable } = await import('@/lib/replit-storage');
      
      if (isReplitStorageAvailable()) {
        const filePath = `job-${jobId}/${Date.now()}-${file.name}`;
        const buffer = await file.arrayBuffer();
        const result = await uploadToReplitStorage(filePath, Buffer.from(buffer));
        
        if (result.success && result.url) {
          url = result.url;
          console.log(`✅ File uploaded to Replit Storage: ${url}`);
        } else {
          throw new Error(result.error || 'Replit storage upload failed');
        }
      } else {
        throw new Error('Replit storage not available');
      }
    } catch (replitError) {
      // ✅ FALLBACK: Use Cloudinary if Replit storage fails
      console.warn('⚠️ Replit storage failed, falling back to Cloudinary:', replitError instanceof Error ? replitError.message : replitError);
      
      try {
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append('file', file);
        cloudinaryFormData.append('folder', 'tasklynk/job-files');
        
        const cloudinaryResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cloudinary/upload`, {
          method: 'POST',
          body: cloudinaryFormData,
        });
        
        if (!cloudinaryResponse.ok) {
          const errorData = await cloudinaryResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Cloudinary upload failed');
        }
        
        const cloudinaryData = await cloudinaryResponse.json();
        url = cloudinaryData.url;
        
        console.log(`✅ File uploaded to Cloudinary: ${url}`);
      } catch (cloudinaryError) {
        console.error('❌ All storage methods failed:', cloudinaryError);
        return NextResponse.json(
          { 
            error: 'Failed to upload file to any storage backend', 
            details: cloudinaryError instanceof Error ? cloudinaryError.message : 'Unknown error',
            code: 'STORAGE_UPLOAD_FAILED'
          },
          { status: 500 }
        );
      }
    }

    // ✅ Store file metadata in database with ORIGINAL FILENAME preserved
    const newAttachment = await db.insert(jobAttachments)
      .values({
        jobId: parseInt(jobId),
        uploadedBy: parseInt(uploadedBy),
        fileName: file.name, // ✅ PRESERVE ORIGINAL FILENAME with extension
        fileUrl: url,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream', // ✅ PRESERVE MIME TYPE
        uploadType: uploadType,
        createdAt: new Date().toISOString(),
      })
      .returning();

    // NOTIFICATION SYSTEM: Notify all users associated with this order about new file
    try {
      const job = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, parseInt(jobId)))
        .limit(1);

      if (job.length > 0) {
        const usersToNotify: number[] = [];
        
        // Add client (always notified)
        usersToNotify.push(job[0].clientId);
        
        // Add assigned freelancer if exists
        if (job[0].assignedFreelancerId) {
          usersToNotify.push(job[0].assignedFreelancerId);
        }
        
        // Add all admins
        const admins = await db
          .select()
          .from(users)
          .where(eq(users.role, 'admin'))
          .all();
        
        admins.forEach(admin => {
          if (!usersToNotify.includes(admin.id)) {
            usersToNotify.push(admin.id);
          }
        });

        // Don't notify the uploader
        const filteredUsers = usersToNotify.filter(id => id !== parseInt(uploadedBy));

        // Determine file type message
        let fileTypeMessage = 'A new file';
        if (uploadType === 'initial') {
          fileTypeMessage = 'A new order file';
        } else if (uploadType === 'draft') {
          fileTypeMessage = 'A draft file';
        } else if (uploadType === 'final') {
          fileTypeMessage = 'A completed file';
        } else if (uploadType === 'revision') {
          fileTypeMessage = 'A revision file';
        }

        // Create notifications for all users
        for (const userId of filteredUsers) {
          try {
            await db.insert(notifications).values({
              userId,
              jobId: job[0].id,
              type: 'file_uploaded',
              title: `New File Added to Order ${job[0].displayId}`,
              message: `${fileTypeMessage} "${file.name}" has been uploaded to order "${job[0].title}"`,
              read: false,
              createdAt: new Date().toISOString(),
            });
          } catch (notifError) {
            console.error(`Failed to create notification for user ${userId}:`, notifError);
          }
        }
      }
    } catch (notificationError) {
      console.error('Failed to create file upload notifications:', notificationError);
      // Don't fail the upload if notifications fail
    }

    return NextResponse.json({
      success: true,
      attachment: newAttachment[0],
      message: `File "${file.name}" uploaded successfully with format preserved`
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}