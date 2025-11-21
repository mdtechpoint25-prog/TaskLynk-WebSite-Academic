import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users, bids, notifications, jobStatusLogs } from '@/db/schema';
import { eq, and, ne, sql } from 'drizzle-orm';
import { sendEmail, getJobAssignedEmailHTML } from '@/lib/email';
import { logAdminAction, AdminActions, AuditTargetTypes } from '@/lib/admin-audit';

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid job ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const jobId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { freelancerId, changedBy } = body;

    // Validate freelancerId is provided
    if (freelancerId === undefined || freelancerId === null) {
      return NextResponse.json(
        {
          error: 'Freelancer ID is required',
          code: 'MISSING_FREELANCER_ID'
        },
        { status: 400 }
      );
    }

    // Validate freelancerId is a valid integer
    if (typeof freelancerId !== 'number' || isNaN(freelancerId) || !Number.isInteger(freelancerId)) {
      return NextResponse.json(
        {
          error: 'Valid freelancer ID is required',
          code: 'INVALID_FREELANCER_ID'
        },
        { status: 400 }
      );
    }

    // Check if job exists
    const existingJob = await db.select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (existingJob.length === 0) {
      return NextResponse.json(
        {
          error: 'Job not found',
          code: 'JOB_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Get freelancer details
    const freelancer = await db.select()
      .from(users)
      .where(eq(users.id, freelancerId))
      .limit(1);

    if (freelancer.length === 0) {
      return NextResponse.json(
        {
          error: 'Freelancer not found',
          code: 'FREELANCER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // CRITICAL: Accept the bid from the assigned freelancer
    await db.update(bids)
      .set({ status: 'accepted' })
      .where(and(
        eq(bids.jobId, jobId),
        eq(bids.freelancerId, freelancerId)
      ));

    // CRITICAL: Reject all other bids for this job
    await db.update(bids)
      .set({ status: 'rejected' })
      .where(and(
        eq(bids.jobId, jobId),
        ne(bids.freelancerId, freelancerId)
      ));

    // Update job with assigned freelancer, status to assigned (writer must accept), and timestamp
    const updatedJob = await db.update(jobs)
      .set({
        assignedFreelancerId: freelancerId,
        status: 'assigned',
        updatedAt: new Date().toISOString()
      })
      .where(eq(jobs.id, jobId))
      .returning();

    if (updatedJob.length === 0) {
      return NextResponse.json(
        {
          error: 'Failed to update job',
          code: 'UPDATE_FAILED'
        },
        { status: 500 }
      );
    }

    // AUDIT LOG: assignment status change
    try {
      await db.insert(jobStatusLogs).values({
        jobId,
        oldStatus: (existingJob[0] as any).status as string,
        newStatus: 'assigned',
        changedBy: changedBy || null,
        note: 'Manager assigned writer',
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to log assignment:', e);
    }

    // 📝 AUDIT: Log job assignment
    if (changedBy) {
      await logAdminAction(
        changedBy,
        AdminActions.ASSIGN_JOB,
        jobId,
        AuditTargetTypes.JOB,
        {
          jobId,
          orderNumber: (existingJob[0] as any).orderNumber,
          freelancerId,
          freelancerName: freelancer[0].name,
          freelancerEmail: freelancer[0].email,
          previousStatus: (existingJob[0] as any).status,
          newStatus: 'assigned',
        }
      );
    }

    // CREDIT MANAGER: assignment fee KSh 10 (flat per order)
    try {
      let managerIdToCredit: number | null = null;
      // Prefer freelancer's manager
      managerIdToCredit = (freelancer[0] as any)?.assignedManagerId ?? null;
      if (!managerIdToCredit) {
        // Fallback to client's manager
        const clientId = (existingJob[0] as any).clientId as number | undefined;
        if (clientId) {
          const clientRow = await db.select().from(users).where(eq(users.id, clientId)).limit(1);
          managerIdToCredit = clientRow[0]?.assignedManagerId ?? null;
        }
      }
      if (!managerIdToCredit && changedBy && Number.isInteger(changedBy)) {
        // If provided in payload, use the manager performing assignment
        managerIdToCredit = changedBy;
      }
      if (managerIdToCredit) {
        await db.update(users)
          .set({
            balance: sql`COALESCE(${users.balance}, 0) + ${10}`,
            totalEarned: sql`COALESCE(${users.totalEarned}, 0) + ${10}`,
          })
          .where(eq(users.id, managerIdToCredit));
        // Notify manager about assignment fee
        await db.insert(notifications).values({
          userId: managerIdToCredit,
          jobId: updatedJob[0].id as number,
          type: 'manager_assignment_fee',
          title: 'Assignment Fee Credited',
          message: `You earned KSh 10 assignment fee for order ${(updatedJob[0] as any).displayId || `#${updatedJob[0].id}`}.`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (creditErr) {
      console.error('Failed to credit manager assignment fee:', creditErr);
    }

    // Send email notification to freelancer
    const job = updatedJob[0];
    try {
      await sendEmail({
        to: freelancer[0].email,
        subject: `[Order ${job.displayId || `#${job.id}`}] Assigned to You`,
        html: getJobAssignedEmailHTML(
          freelancer[0].name,
          job.title,
          job.id,
          new Date(job.deadline).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          job.amount
        ),
      });
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    // In-platform notifications: freelancer + client
    try {
      const now = new Date().toISOString();

      // Notify assigned freelancer
      await db.insert(notifications).values({
        userId: freelancerId,
        jobId: job.id,
        type: 'job_assigned',
        title: 'Order Assigned',
        message: `Order ${job.displayId || `#${job.id}`} has been assigned to you. Please accept to start.`,
        read: false,
        createdAt: now,
      });

      // Notify client
      await db.insert(notifications).values({
        userId: job.clientId as number,
        jobId: job.id,
        type: 'order_assigned',
        title: 'Assigned to Writer',
        message: `Your order ${job.displayId || `#${job.id}`} has been assigned to a writer. Waiting for acceptance.`,
        read: false,
        createdAt: now,
      });
    } catch (notifErr) {
      console.error('Failed to create assignment notifications:', notifErr);
    }

    return NextResponse.json(job, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}