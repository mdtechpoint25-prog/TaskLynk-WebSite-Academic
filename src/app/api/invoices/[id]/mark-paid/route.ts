import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, users, jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;

    // Validate invoiceId parameter
    if (!invoiceId || isNaN(parseInt(invoiceId))) {
      return NextResponse.json(
        {
          error: 'Valid invoice ID is required',
          code: 'INVALID_ID'
        },
        { status: 400 }
      );
    }

    const id = parseInt(invoiceId);

    // Query invoice by ID
    const invoiceResult = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    if (invoiceResult.length === 0) {
      return NextResponse.json(
        {
          error: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const invoice = invoiceResult[0];

    // Verify invoice has freelancerId assigned
    if (!invoice.freelancerId) {
      return NextResponse.json(
        {
          error: 'Invoice does not have a freelancer assigned',
          code: 'NO_FREELANCER_ASSIGNED'
        },
        { status: 400 }
      );
    }

    // Check if invoice is already paid
    if (invoice.isPaid) {
      return NextResponse.json(
        {
          error: 'Invoice is already marked as paid',
          code: 'ALREADY_PAID'
        },
        { status: 400 }
      );
    }

    // Get freelancer user record
    const freelancerResult = await db
      .select()
      .from(users)
      .where(eq(users.id, invoice.freelancerId))
      .limit(1);

    if (freelancerResult.length === 0) {
      return NextResponse.json(
        {
          error: 'Freelancer not found',
          code: 'FREELANCER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const freelancer = freelancerResult[0];
    const currentTimestamp = new Date().toISOString();

    // Perform transaction: Update invoice
    const updatedInvoiceResult = await db
      .update(invoices)
      .set({
        isPaid: true,
        paidAt: currentTimestamp,
        updatedAt: currentTimestamp
      })
      .where(eq(invoices.id, id))
      .returning();

    const updatedInvoice = updatedInvoiceResult[0];

    // Update freelancer user: Add freelancerAmount to earned and totalEarnings
    const updatedFreelancerResult = await db
      .update(users)
      .set({
        earned: freelancer.earned + invoice.freelancerAmount,
        totalEarnings: freelancer.totalEarnings + invoice.freelancerAmount,
        updatedAt: currentTimestamp
      })
      .where(eq(users.id, invoice.freelancerId))
      .returning();

    const updatedFreelancer = updatedFreelancerResult[0];

    // Manager payout (if we can resolve a manager for this job)
    let managerPayoutApplied = false;
    let managerIdToCredit: number | null = null;
    let managerAmountToCredit = 0;

    if (invoice.jobId) {
      const jobRows = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, invoice.jobId))
        .limit(1);

      if (jobRows.length > 0) {
        const job = jobRows[0] as any;
        const managerAmount = Number(job.managerEarnings || 0);
        managerAmountToCredit = managerAmount;
        if (managerAmount > 0) {
          // Try to resolve manager via freelancer.assignedManagerId first, then client.assignedManagerId
          let resolvedManagerId: number | null = null;

          // Prefer manager linked to freelancer
          if (freelancer.assignedManagerId) {
            resolvedManagerId = Number(freelancer.assignedManagerId);
          } else {
            // Fallback to client.assignedManagerId
            const clientRows = await db
              .select()
              .from(users)
              .where(eq(users.id, job.clientId))
              .limit(1);
            if (clientRows.length > 0 && (clientRows[0] as any).assignedManagerId) {
              resolvedManagerId = Number((clientRows[0] as any).assignedManagerId);
            }
          }

          if (resolvedManagerId) {
            const managerRows = await db
              .select()
              .from(users)
              .where(eq(users.id, resolvedManagerId))
              .limit(1);
            if (managerRows.length > 0) {
              const manager = managerRows[0];
              await db
                .update(users)
                .set({
                  earned: manager.earned + managerAmount,
                  totalEarnings: manager.totalEarnings + managerAmount,
                  balance: manager.balance + managerAmount,
                  updatedAt: currentTimestamp,
                })
                .where(eq(users.id, resolvedManagerId));
              managerPayoutApplied = true;
              managerIdToCredit = resolvedManagerId;
            }
          }
        }
      }
    }

    // Move related job to completed now that invoice is paid
    if (invoice.jobId) {
      await db
        .update(jobs)
        .set({
          status: 'completed',
          paymentConfirmed: true,
          updatedAt: currentTimestamp,
        })
        .where(eq(jobs.id, invoice.jobId));
    }

    // Remove password from freelancer object
    const { password, ...freelancerWithoutPassword } = updatedFreelancer as any;

    // Return updated entities
    return NextResponse.json(
      {
        invoice: updatedInvoice,
        freelancer: freelancerWithoutPassword,
        jobUpdatedTo: 'completed',
        managerPayoutApplied,
        managerId: managerIdToCredit,
        managerAmount: managerAmountToCredit
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message
      },
      { status: 500 }
    );
  }
}