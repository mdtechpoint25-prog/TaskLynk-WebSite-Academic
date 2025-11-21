import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, orderFiles } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

// Allowed final file types
const FINAL_TYPES = new Set([
  "final_document",
  "completed_paper",
  "plagiarism_report",
  "ai_report",
]);

// POST /api/v2/orders/[id]/upload/final
// Body: { uploaderId:number, notes?:string, files: [{ url, name, size, mimeType, fileType }]} where fileType in FINAL_TYPES
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
      files: { url: string; name: string; size: number; mimeType: string; fileType: string }[];
    };

    if (!uploaderId || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "uploaderId and files are required" }, { status: 400 });
    }

    // Validate file types
    for (const f of files) {
      if (!FINAL_TYPES.has(f.fileType)) {
        return NextResponse.json({ error: `Invalid fileType ${f.fileType}` }, { status: 400 });
      }
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
      fileType: f.fileType,
      notes: notes || null,
      versionNumber: newVersion,
      createdAt: now,
    }));

    const inserted = await db.insert(orderFiles).values(values).returning();

    // Check readiness across all files for this order
    const all = await db
      .select({ fileType: orderFiles.fileType })
      .from(orderFiles)
      .where(eq(orderFiles.orderId, orderId));

    const hasFinal = all.some((r) => r.fileType === "final_document" || r.fileType === "completed_paper");
    const hasPlag = all.some((r) => r.fileType === "plagiarism_report");
    const hasAI = all.some((r) => r.fileType === "ai_report");

    const requiresReports = !!job.requiresReports;
    const finalReady = requiresReports ? (hasFinal && hasPlag && hasAI) : hasFinal;

    if (finalReady) {
      // Move to editing if not already beyond
      const next = ["accepted", "assigned", "in_progress", "revision", "editing"].includes(job.status)
        ? "editing"
        : job.status;
      await db
        .update(jobs)
        .set({ finalSubmissionComplete: 1, status: next })
        .where(eq(jobs.id, orderId));
    }

    return NextResponse.json({ success: true, version: newVersion, files: inserted, finalReady });
  } catch (error: any) {
    console.error("Final upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload final files" }, { status: 500 });
  }
}
