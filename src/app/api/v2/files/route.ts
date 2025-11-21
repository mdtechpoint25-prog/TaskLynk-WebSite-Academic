import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobAttachments, jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/v2/files - Get files for an order
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    // Get all files for the order from jobAttachments table
    const filesList = await db
      .select()
      .from(jobAttachments)
      .where(eq(jobAttachments.jobId, parseInt(orderId)))
      .orderBy(jobAttachments.createdAt);

    return NextResponse.json({ files: filesList });
  } catch (error: any) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch files' }, { status: 500 });
  }
}

// POST /api/v2/files - Upload a file
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, uploaderId, fileName, fileUrl, fileSize, fileType, uploadType } = body;

    if (!orderId || !uploaderId || !fileName || !fileUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify order exists
    const [order] = await db.select().from(jobs).where(eq(jobs.id, parseInt(orderId)));

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Create file record in jobAttachments table
    const [newFile] = await db
      .insert(jobAttachments)
      .values({
        jobId: parseInt(orderId),
        uploadedBy: parseInt(uploaderId),
        fileName,
        fileUrl,
        fileSize: fileSize || 0,
        fileType: fileType || 'application/octet-stream',
        uploadType: uploadType || 'other', // draft, final, initial, revision, other
        createdAt: now,
      })
      .returning();

    return NextResponse.json(
      {
        file: newFile,
        info: 'File uploaded successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
  }
}