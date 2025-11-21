import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobAttachments } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/v2/files/[id] - Get file details (uses job_attachments table)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = parseInt(params.id);

    if (Number.isNaN(fileId)) {
      return NextResponse.json({ error: 'Invalid file id' }, { status: 400 });
    }

    const [file] = await db.select().from(jobAttachments).where(eq(jobAttachments.id, fileId));

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json({ file });
  } catch (error: any) {
    console.error('Error fetching file:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch file' }, { status: 500 });
  }
}

// DELETE /api/v2/files/[id] - Delete file (uploader or admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const [file] = await db.select().from(jobAttachments).where(eq(jobAttachments.id, fileId));

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const role = searchParams.get('role');
    if (file.uploadedBy !== parseInt(userId) && role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized to delete this file' }, { status: 403 });
    }

    await db.delete(jobAttachments).where(eq(jobAttachments.id, fileId));

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete file' }, { status: 500 });
  }
}