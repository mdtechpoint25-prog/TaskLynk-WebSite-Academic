import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, orderFiles } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

// POST /api/v2/orders/[id]/upload/draft
// Body: { uploaderId:number, notes?:string, files: [{ url, name, size, mimeType }] }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    if (!orderId) return NextResponse.json({ error: "Valid order id required" }, { status: 400 });

    const body = await request.json();
    const { uploaderId, notes, files } = body as {
      uploaderId: number;
      notes?: string;
      files: { url: string; name: string; size: number; mimeType: string }[];
    };

    if (!uploaderId || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "uploaderId and files are required" }, { status: 400 });
    }

    const [job] = await db.select().from(jobs).where(eq(jobs.id, orderId));
    if (!job) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (["cancelled", "closed"].includes(job.status)) {
      return NextResponse.json({ error: `Order is ${job.status}, uploading disabled` }, { status: 409 });
    }

    // Compute new version number (max + 1)
    const [latest] = await db
      .select({ versionNumber: orderFiles.versionNumber })
      .from(orderFiles)
      .where(eq(orderFiles.orderId, orderId))
      .orderBy(desc(orderFiles.versionNumber))
      .limit(1);
    const newVersion = (latest?.versionNumber || 0) + 1;

    const now = new Date().toISOString();
    const values = files.map((f) => ({
      orderId,
      uploadedBy: Number(uploaderId),
      fileUrl: f.url,
      fileName: f.name,
      fileSize: Number(f.size || 0),
      mimeType: f.mimeType || "application/octet-stream",
      fileType: "draft" as const,
      notes: notes || null,
      versionNumber: newVersion,
      createdAt: now,
    }));

    const inserted = await db.insert(orderFiles).values(values).returning();

    // Auto-progress to in_progress when uploading draft from accepted/assigned
    if (["accepted", "assigned"].includes(job.status)) {
      await db.update(jobs).set({ status: "in_progress", draftDelivered: 1 }).where(eq(jobs.id, orderId));
    }

    return NextResponse.json({ success: true, version: newVersion, files: inserted });
  } catch (error: any) {
    console.error("Draft upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload draft" }, { status: 500 });
  }
}
