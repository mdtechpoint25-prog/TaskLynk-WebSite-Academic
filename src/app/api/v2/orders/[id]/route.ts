import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users, jobAttachments, jobMessages, payments } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/v2/orders/[id] - Get order details with financials
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = Number(params.id);
    if (!Number.isFinite(jobId)) {
      return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
    }

    // Get job
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
    if (!job) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Financials mapped from job row
    const financials = {
      client_amount: job.amount ?? null,
      writer_amount: job.freelancerEarnings ?? null,
      manager_amount: job.managerEarnings ?? null,
      platform_fee: job.adminProfit ?? null,
    };

    // Latest payment for job (if any)
    const [latestPayment] = await db
      .select({
        id: payments.id,
        status: payments.status,
        confirmedByAdmin: payments.confirmedByAdmin,
        confirmedAt: payments.confirmedAt,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(eq(payments.jobId, jobId))
      .orderBy(desc(payments.createdAt))
      .limit(1);

    const payment = latestPayment
      ? {
          payment_status: latestPayment.status || null,
          confirmedByAdmin: (latestPayment.confirmedByAdmin as unknown as number) ?? null,
          confirmedAt: latestPayment.confirmedAt || null,
        }
      : null;

    // Client info
    const [client] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, job.clientId));

    // Writer info
    let writer: { id: number; name: string; email: string; rating: number | null } | null = null;
    if (job.assignedFreelancerId) {
      const [w] = await db
        .select({ id: users.id, name: users.name, email: users.email, rating: users.rating })
        .from(users)
        .where(eq(users.id, job.assignedFreelancerId));
      writer = w || null;
    }

    // 🔴 FIX: Manager info from jobs.manager_id, not client.assignedManagerId
    let manager: { id: number; name: string; email: string } | null = null;
    if (job.managerId) {
      const [m] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, job.managerId));
      manager = m || null;
    }

    // Files / attachments
    const files = await db.select().from(jobAttachments).where(eq(jobAttachments.jobId, jobId));

    // Messages (job chat)
    const jobMessagesData = await db.select().from(jobMessages).where(eq(jobMessages.jobId, jobId));

    return NextResponse.json({
      order: {
        id: job.id,
        displayId: job.displayId,
        orderNumber: job.orderNumber,
        title: job.title,
        workType: job.workType,
        pages: job.pages,
        slides: job.slides,
        amount: job.amount,
        freelancerEarnings: job.freelancerEarnings,
        managerEarnings: job.managerEarnings,
        adminProfit: job.adminProfit,
        status: job.status,
        adminApproved: job.adminApproved,
        clientApproved: job.clientApproved,
        paymentConfirmed: job.paymentConfirmed,
        deadline: job.deadline,
        managerId: job.managerId,
      },
      financials,
      client: client ? { id: client.id, name: client.name, email: client.email } : null,
      writer,
      manager,
      files,
      messages: jobMessagesData,
      payment,
    });
  } catch (error: any) {
    console.error('Error fetching order (v2 detail):', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch order' }, { status: 500 });
  }
}