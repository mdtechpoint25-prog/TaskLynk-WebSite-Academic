import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, orderFiles, users } from '@/db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';

// GET /api/v2/orders/[id]/files - Role-aware files listing (uses order_files)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    if (!orderId) {
      return NextResponse.json({ error: 'Valid order id required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const role = (searchParams.get('role') || '').toLowerCase();
    const userIdStr = searchParams.get('userId');
    const includeDrafts = (searchParams.get('includeDrafts') || 'false') === 'true';
    const deliveredOnly = (searchParams.get('deliveredOnly') || 'false') === 'true';

    const userId = userIdStr ? parseInt(userIdStr) : undefined;

    // Load order for status/ownership checks
    const [order] = await db.select().from(jobs).where(eq(jobs.id, orderId));
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Client restrictions
    if (role === 'client') {
      // Only expose files to client AFTER admin delivers the order
      const allowedStatuses = ['delivered', 'approved', 'paid', 'completed'];
      if (!allowedStatuses.includes(order.status)) {
        return NextResponse.json({
          error: `Files not available. Order must be delivered first. Current status: ${order.status}`,
          currentStatus: order.status,
        }, { status: 403 });
      }
      if (order.clientId !== userId) {
        return NextResponse.json({ error: 'Not authorized to view files for this order' }, { status: 403 });
      }
    }

    // Query order_files joined with uploader
    const rows = await db
      .select({
        id: orderFiles.id,
        orderId: orderFiles.orderId,
        uploadedBy: orderFiles.uploadedBy,
        fileUrl: orderFiles.fileUrl,
        fileName: orderFiles.fileName,
        fileSize: orderFiles.fileSize,
        mimeType: orderFiles.mimeType,
        fileType: orderFiles.fileType,
        notes: orderFiles.notes,
        versionNumber: orderFiles.versionNumber,
        createdAt: orderFiles.createdAt,
        uploaderId: users.id,
        uploaderName: users.name,
        uploaderRole: users.role,
      })
      .from(orderFiles)
      .leftJoin(users, eq(orderFiles.uploadedBy, users.id))
      .where(eq(orderFiles.orderId, orderId))
      .orderBy(desc(orderFiles.createdAt));

    // Role filtering logic
    const filtered = rows.filter((r) => {
      const uploaderRole = (r.uploaderRole || '').toLowerCase();
      const isDraft = r.fileType === 'draft';

      if (role === 'client') {
        // Client never sees drafts
        if (isDraft) return false;
        // Client sees own uploads (initial files they uploaded) and non-drafts from others after delivery
        return true;
      }

      if (role === 'freelancer') {
        // Freelancers can see all including drafts by default unless includeDrafts=false
        if (!includeDrafts && isDraft) return false;
        return true;
      }

      if (role === 'manager' || role === 'admin' || role === 'account_owner') {
        if (!includeDrafts && isDraft) return false;
        return true;
      }

      // Unknown role: default hide drafts unless explicitly included
      if (!includeDrafts && isDraft) return false;
      return true;
    });

    return NextResponse.json({
      success: true,
      orderId,
      orderStatus: order.status,
      files: filtered.map((f) => ({
        id: f.id,
        orderId: f.orderId,
        fileName: f.fileName,
        fileUrl: f.fileUrl,
        fileSize: f.fileSize,
        fileType: f.mimeType,
        uploadType: f.fileType, // keep UI compatibility
        category: null,
        uploadedAt: f.createdAt,
        uploadedBy: f.uploadedBy,
        uploaderName: f.uploaderName,
        uploaderRole: f.uploaderRole === 'writer' ? 'freelancer' : f.uploaderRole,
        version: f.versionNumber,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching order files:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch order files' }, { status: 500 });
  }
}