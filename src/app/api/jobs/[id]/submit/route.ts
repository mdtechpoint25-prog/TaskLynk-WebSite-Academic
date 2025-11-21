import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, notifications, users, jobStatusLogs, jobAttachments, orderFiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Writer submits final work once.
// Prevent multiple final submissions by blocking if job is already in editing/delivered/completed/paid.
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: "Valid job ID is required", code: "INVALID_ID" },
        { status: 400 }
      );
    }

    const jobId = parseInt(id);

    const rows = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Job not found", code: "JOB_NOT_FOUND" },
        { status: 404 }
      );
    }

    const job = rows[0] as any;

    // Require job to be assigned and have an assigned freelancer
    if (String(job.status) !== "assigned" || !job.assignedFreelancerId) {
      return NextResponse.json(
        { error: "Order is not in an assignable state for submission", code: "INVALID_STATUS" },
        { status: 400 }
      );
    }

    // Enforce at least one FINAL file uploaded by the assigned freelancer
    // Check orderFiles table which is used by the v2 endpoints
    const finalFiles = await db
      .select({ id: orderFiles.id })
      .from(orderFiles)
      .where(
        and(
          eq(orderFiles.orderId, jobId),
          eq(orderFiles.fileType, "final_document")
        )
      )
      .limit(1);

    if (finalFiles.length === 0) {
      return NextResponse.json(
        {
          error: "You must upload at least one FINAL file before submitting",
          code: "NO_FINAL_FILES",
        },
        { status: 400 }
      );
    }

    // Block duplicate final submissions based on status
    const terminalOrSubmittedStatuses = ["editing", "delivered", "completed", "paid"];
    if (terminalOrSubmittedStatuses.includes(String(job.status))) {
      return NextResponse.json(
        {
          error: "Order has already been submitted/reviewed. Multiple final submissions are not allowed.",
          code: "ALREADY_SUBMITTED",
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    const updated = await db
      .update(jobs)
      .set({
        status: "editing", // move to editing/QA stage after writer submission
        updatedAt: now,
      })
      .where(eq(jobs.id, jobId))
      .returning();

    // AUDIT LOG: submission -> moved to editing
    try {
      await db.insert(jobStatusLogs).values({
        jobId: jobId,
        oldStatus: job.status as string,
        newStatus: "editing",
        changedBy: null,
        note: "Writer submitted work; moved to editing",
        createdAt: now,
      });
    } catch (logErr) {
      console.error("Failed to log writer submission:", logErr);
    }

    // Create in-platform notifications for Admins and Client
    try {
      const updatedJob = updated[0] as any;

      // Notify all admins
      const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
      for (const admin of adminUsers) {
        await db.insert(notifications).values({
          userId: admin.id,
          jobId: updatedJob.id,
          type: 'order_submitted',
          title: 'Submission Received',
          message: `Order ${updatedJob.displayId || `#${updatedJob.id}`} has been submitted by the writer and moved to editing.`,
          read: false,
          createdAt: now,
        });
      }

      // Notify client
      if (updatedJob.clientId) {
        await db.insert(notifications).values({
          userId: updatedJob.clientId,
          jobId: updatedJob.id,
          type: 'order_submitted',
          title: 'Order Under Review',
          message: `Your order ${updatedJob.displayId || `#${updatedJob.id}`} has been submitted and is currently under review.`,
          read: false,
          createdAt: now,
        });
      }
    } catch (notifErr) {
      console.error('Failed to create submission notifications:', notifErr);
    }

    return NextResponse.json(
      {
        job: updated[0],
        message: "Submission received. Order moved to editing for QA/manager review.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error as Error).message },
      { status: 500 }
    );
  }
}