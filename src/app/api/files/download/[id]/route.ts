import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobAttachments, orderFiles, jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Extract Cloudinary public_id from URL
function extractPublicIdFromUrl(url: string): { publicId: string; resourceType: 'image' | 'video' | 'raw' } | null {
  try {
    // Example URL: https://res.cloudinary.com/deicqit1a/raw/upload/v1762471287/tasklynk/uploads/job_23/1762471287672-file.pdf
    const urlPattern = /cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)$/;
    const match = url.match(urlPattern);
    
    if (match) {
      const resourceType = match[1] as 'image' | 'video' | 'raw';
      const publicId = match[2]; // Full path after upload/ (includes folders and filename)
      return { publicId, resourceType };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid attachment ID is required' },
        { status: 400 }
      );
    }

    const fileId = parseInt(id);

    // Role-aware visibility parameters
    const { searchParams } = new URL(request.url);
    const role = (searchParams.get('role') || '').toLowerCase();
    const userIdStr = searchParams.get('userId');
    const userId = userIdStr ? parseInt(userIdStr) : undefined;

    if (!role || !userId) {
      return NextResponse.json({ error: 'role and userId are required' }, { status: 400 });
    }

    // Fetch attachment from legacy job_attachments first
    const attachment = await db
      .select()
      .from(jobAttachments)
      .where(eq(jobAttachments.id, fileId))
      .limit(1);

    let fileName: string | null = null;
    let fileUrl: string | null = null;
    let contentTypeSource: string | null = null; // fileType (legacy) or mimeType (order_files)
    let origin: 'legacy' | 'order' = 'legacy';
    let relatedJobId: number | null = null;
    let uploadedBy: number | null = null;
    let orderFileType: string | null = null; // draft/final_document/etc for order_files

    if (attachment.length > 0) {
      const file = attachment[0];
      fileName = file.fileName;
      fileUrl = file.fileUrl;
      contentTypeSource = file.fileType || null;
      origin = 'legacy';
      relatedJobId = file.jobId;
      uploadedBy = file.uploadedBy;
    } else {
      // Fallback: look into new order_files table
      const of = await db
        .select()
        .from(orderFiles)
        .where(eq(orderFiles.id, fileId))
        .limit(1);

      if (of.length === 0) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }

      const file = of[0];
      fileName = file.fileName;
      fileUrl = file.fileUrl;
      contentTypeSource = file.mimeType || null;
      origin = 'order';
      relatedJobId = file.orderId;
      uploadedBy = file.uploadedBy;
      orderFileType = file.fileType; // e.g., draft, final_document
    }

    if (!fileUrl || !fileName || !relatedJobId) {
      return NextResponse.json(
        { error: 'Invalid file record' },
        { status: 500 }
      );
    }

    // Load job for visibility checks
    const jobRows = await db.select().from(jobs).where(eq(jobs.id, relatedJobId)).limit(1);
    if (jobRows.length === 0) {
      return NextResponse.json({ error: 'Related order not found' }, { status: 404 });
    }
    const job = jobRows[0];

    // Role-based access control
    const allowedClientStatuses = ['delivered', 'approved', 'paid', 'completed'];

    if (role === 'client') {
      // Client must own the job
      if (job.clientId !== userId) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
      // Client can always download their own uploads (legacy attachments they uploaded)
      if (origin === 'legacy' && uploadedBy === userId) {
        // allowed (e.g., initial requirements files)
      } else {
        // For writer/manager/admin uploads, only after delivery
        if (!allowedClientStatuses.includes(job.status)) {
          return NextResponse.json({ error: 'Files available after delivery' }, { status: 403 });
        }
        // Never expose drafts to clients
        if (origin === 'order' && orderFileType === 'draft') {
          return NextResponse.json({ error: 'Drafts are not accessible to client' }, { status: 403 });
        }
      }
    } else if (role === 'freelancer') {
      // Freelancer must be assigned to the job
      if (job.assignedFreelancerId !== userId) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
      // Freelancers can access all their job files including drafts
    } else if (role === 'manager' || role === 'admin' || role === 'account_owner') {
      // Managers/Admins/Account owners have access
    } else {
      return NextResponse.json({ error: 'Unknown role' }, { status: 403 });
    }

    // Handle external links differently
    if (contentTypeSource === 'external/link') {
      return NextResponse.redirect(fileUrl);
    }

    // ✅ NEW: Generate signed URL for Cloudinary files
    const cloudinaryInfo = extractPublicIdFromUrl(fileUrl);
    
    if (cloudinaryInfo) {
      try {
        console.log('Generating signed URL for:', cloudinaryInfo);
        
        // Generate signed URL with 5-minute expiration
        const signedUrl = cloudinary.url(cloudinaryInfo.publicId, {
          resource_type: cloudinaryInfo.resourceType,
          type: 'upload',
          sign_url: true,
          secure: true,
          expires_at: Math.floor(Date.now() / 1000) + 300, // 5 minutes
        });
        
        console.log('Generated signed URL:', signedUrl);
        
        // Fetch file using signed URL
        const fileResponse = await fetch(signedUrl);
        
        if (!fileResponse.ok) {
          throw new Error(`Failed to fetch file: ${fileResponse.status} ${fileResponse.statusText}`);
        }

        // Get file buffer
        const fileBuffer = await fileResponse.arrayBuffer();

        // Determine content type
        let contentType = contentTypeSource || 'application/octet-stream';
        
        // If not set or generic, try to infer from file extension
        if (contentType === 'application/octet-stream' || !contentType) {
          const ext = fileName.split('.').pop()?.toLowerCase();
          const mimeTypes: Record<string, string> = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'txt': 'text/plain',
            'csv': 'text/csv',
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
            '7z': 'application/x-7z-compressed',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
          };
          contentType = mimeTypes[ext || ''] || 'application/octet-stream';
        }

        // Create response with proper headers for download
        const response = new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
            'Content-Length': fileBuffer.byteLength.toString(),
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });

        return response;
      } catch (signedUrlError) {
        console.error('Signed URL download failed:', signedUrlError);
        // Fall through to original method
      }
    }

    // ✅ FALLBACK: Original fetch method (for non-Cloudinary URLs)
    try {
      // Fetch file from storage (Cloudinary, Backblaze, etc.)
      const fileResponse = await fetch(fileUrl);
      
      if (!fileResponse.ok) {
        throw new Error('Failed to fetch file from storage');
      }

      // Get file buffer
      const fileBuffer = await fileResponse.arrayBuffer();

      // Determine content type
      let contentType = contentTypeSource || 'application/octet-stream';
      
      // If fileType is not set or generic, try to infer from file extension
      if (contentType === 'application/octet-stream' || !contentType) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'ppt': 'application/vnd.ms-powerpoint',
          'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'txt': 'text/plain',
          'csv': 'text/csv',
          'zip': 'application/zip',
          'rar': 'application/x-rar-compressed',
          '7z': 'application/x-7z-compressed',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'svg': 'image/svg+xml',
        };
        contentType = mimeTypes[ext || ''] || 'application/octet-stream';
      }

      // Create response with proper headers for download
      const response = new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
          'Content-Length': fileBuffer.byteLength.toString(),
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });

      return response;
    } catch (fetchError) {
      console.error('Error fetching file from storage:', fetchError);
      
      // Fallback: redirect to direct URL
      return NextResponse.redirect(fileUrl);
    }
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}