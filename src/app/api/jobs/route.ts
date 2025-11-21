import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, bids, users } from '@/db/schema';
import { eq, and, desc, notInArray, sql } from 'drizzle-orm';
import { generateJobDisplayId } from '@/app/api/utils/generate-display-id/route';
import { sendEmailToAdmins, getNewJobPostingAdminHTML } from '@/lib/email';
import { minRequiredClientAmount, minRequiredClientSlideAmount } from '@/lib/payment-calculations';

const VALID_STATUSES = ['pending', 'accepted', 'approved', 'assigned', 'in_progress', 'editing', 'delivered', 'revision', 'completed', 'cancelled', 'on_hold', 'paid'] as const;

// Helper function to enforce minimum client pricing rules
function computeClientMinimumAmount(pages: number | null | undefined, slides: number | null | undefined, workType?: string | null | undefined): number {
  const p = Math.max(0, Number(pages || 0));
  const s = Math.max(0, Number(slides || 0));
  // Use the updated pricing function that considers work type
  return minRequiredClientAmount(p, workType) + minRequiredClientSlideAmount(s);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const assignedFreelancerId = searchParams.get('assignedFreelancerId');
    const status = searchParams.get('status');
    const excludeFreelancerBids = searchParams.get('excludeFreelancerBids');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Build query conditions
    const conditions: any[] = [];

    if (clientId) {
      const parsedClientId = parseInt(clientId);
      if (isNaN(parsedClientId)) {
        return NextResponse.json({ 
          error: 'Invalid clientId parameter',
          code: 'INVALID_CLIENT_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(jobs.clientId, parsedClientId));
    }

    if (assignedFreelancerId) {
      const parsedFreelancerId = parseInt(assignedFreelancerId);
      if (isNaN(parsedFreelancerId)) {
        return NextResponse.json({ 
          error: 'Invalid assignedFreelancerId parameter',
          code: 'INVALID_FREELANCER_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(jobs.assignedFreelancerId, parsedFreelancerId));
    }

    if (status) {
      if (!VALID_STATUSES.includes(status as any)) {
        return NextResponse.json({ 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS' 
        }, { status: 400 });
      }
      conditions.push(eq(jobs.status, status));
    }

    // Handle excludeFreelancerBids parameter
    if (excludeFreelancerBids) {
      const parsedFreelancerId = parseInt(excludeFreelancerBids);
      if (isNaN(parsedFreelancerId)) {
        return NextResponse.json({ 
          error: 'Invalid excludeFreelancerBids parameter',
          code: 'INVALID_EXCLUDE_FREELANCER_BIDS' 
        }, { status: 400 });
      }

      // Get all job IDs where this freelancer has placed a bid
      const freelancerBids = await db
        .select({ jobId: bids.jobId })
        .from(bids)
        .where(eq(bids.freelancerId, parsedFreelancerId));

      const jobIdsWithBids = freelancerBids.map(bid => bid.jobId);

      // If freelancer has placed bids, exclude those jobs
      if (jobIdsWithBids.length > 0) {
        conditions.push(notInArray(jobs.id, jobIdsWithBids));
      }
    }

    // Fetch jobs with client information using LEFT JOIN
    let query = db
      .select({
        id: jobs.id,
        displayId: jobs.displayId,
        orderNumber: jobs.orderNumber,
        clientId: jobs.clientId,
        clientName: users.name,
        title: jobs.title,
        instructions: jobs.instructions,
        workType: jobs.workType,
        pages: jobs.pages,
        slides: jobs.slides,
        amount: jobs.amount,
        deadline: jobs.deadline,
        status: jobs.status,
        assignedFreelancerId: jobs.assignedFreelancerId,
        adminApproved: jobs.adminApproved,
        clientApproved: jobs.clientApproved,
        approvedByClientAt: jobs.approvedByClientAt,
        revisionRequested: jobs.revisionRequested,
        revisionNotes: jobs.revisionNotes,
        paymentConfirmed: jobs.paymentConfirmed,
        paidOrderConfirmedAt: jobs.paidOrderConfirmedAt,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
      })
      .from(jobs)
      .leftJoin(users, eq(jobs.clientId, users.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);

    // Return with aggressive cache-busting headers for real-time updates
    return NextResponse.json(results, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Accept both JSON and form submissions to avoid 500s on multipart posts
    const contentType = request.headers.get('content-type') || '';
    let body: any = {};
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const form = await request.formData();
      body = Object.fromEntries(Array.from(form.entries()).map(([k, v]) => [k, typeof v === 'string' ? v : (v as File).name]));
    } else {
      // Fallback try JSON
      try { body = await request.json(); } catch { body = {}; }
    }

    const { 
      clientId, 
      title, 
      instructions, 
      workType, 
      pages, 
      slides, 
      amount, 
      deadline, 
      actualDeadline, 
      freelancerDeadline, 
      requestDraft, 
      requestPrintableSources,
      singleSpaced,
      baseCpp,
      effectiveCpp,
      accountOrderNumber, 
      accountLinked 
    } = body;

    // Validation: Required fields
    if (!clientId) {
      return NextResponse.json({ 
        error: 'clientId is required',
        code: 'MISSING_CLIENT_ID' 
      }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || String(title).trim() === '') {
      return NextResponse.json({ 
        error: 'title is required and must be a non-empty string',
        code: 'INVALID_TITLE' 
      }, { status: 400 });
    }

    if (!instructions || typeof instructions !== 'string' || String(instructions).trim() === '') {
      return NextResponse.json({ 
        error: 'instructions is required and must be a non-empty string',
        code: 'INVALID_INSTRUCTIONS' 
      }, { status: 400 });
    }

    // 🔧 FIX: Accept any non-empty workType string
    const rawWorkType = typeof workType === 'string' ? workType.trim() : String(workType || '').trim();
    if (!rawWorkType) {
      return NextResponse.json({ 
        error: 'workType is required',
        code: 'INVALID_WORK_TYPE' 
      }, { status: 400 });
    }
    const normalizedWorkType = rawWorkType || 'Other';

    if (amount === undefined || amount === null) {
      return NextResponse.json({ 
        error: 'amount is required',
        code: 'MISSING_AMOUNT' 
      }, { status: 400 });
    }

    const parsedAmount = parseFloat(String(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ 
        error: 'amount must be a positive number',
        code: 'INVALID_AMOUNT' 
      }, { status: 400 });
    }

    if (!deadline) {
      return NextResponse.json({ 
        error: 'deadline is required',
        code: 'MISSING_DEADLINE' 
      }, { status: 400 });
    }

    // Validate deadline is a valid ISO timestamp
    const parsedDeadlineDate = new Date(String(deadline));
    if (isNaN(parsedDeadlineDate.getTime())) {
      return NextResponse.json({ 
        error: 'deadline must be a valid ISO timestamp',
        code: 'INVALID_DEADLINE' 
      }, { status: 400 });
    }

    // Validate clientId is a valid integer
    const parsedClientId = parseInt(String(clientId));
    if (isNaN(parsedClientId)) {
      return NextResponse.json({ 
        error: 'clientId must be a valid integer',
        code: 'INVALID_CLIENT_ID' 
      }, { status: 400 });
    }

    // Validate optional pages field
    let parsedPages: number | null = null;
    if (pages !== undefined && pages !== null && String(pages).trim() !== '') {
      parsedPages = parseInt(String(pages));
      if (isNaN(parsedPages) || parsedPages < 0) {
        return NextResponse.json({ 
          error: 'pages must be a non-negative integer',
          code: 'INVALID_PAGES' 
        }, { status: 400 });
      }
    }

    // Validate optional slides field
    let parsedSlides: number | null = null;
    if (slides !== undefined && slides !== null && String(slides).trim() !== '') {
      parsedSlides = parseInt(String(slides));
      if (isNaN(parsedSlides) || parsedSlides < 0) {
        return NextResponse.json({ 
          error: 'slides must be a non-negative integer',
          code: 'INVALID_SLIDES' 
        }, { status: 400 });
      }
    }

    // 🔧 FIX: Only enforce minimum pricing if pages or slides are provided
    if (parsedPages !== null || parsedSlides !== null) {
      const minimumAmount = computeClientMinimumAmount(parsedPages, parsedSlides, normalizedWorkType);
      if (minimumAmount > 0 && parsedAmount < minimumAmount) {
        return NextResponse.json({ 
          error: `Amount (KSh ${parsedAmount}) cannot be less than the required minimum (KSh ${minimumAmount}) based on ${parsedPages || 0} page(s) and ${parsedSlides || 0} slide(s).`,
          code: 'AMOUNT_BELOW_MINIMUM',
          minimumAmount
        }, { status: 400 });
      }
    }

    const now = new Date().toISOString();

    // Fetch client to determine account and name for order number generation
    const clientRows = await db.select().from(users).where(eq(users.id, parsedClientId)).limit(1);
    if (clientRows.length === 0) {
      return NextResponse.json({ 
        error: 'Client not found',
        code: 'CLIENT_NOT_FOUND' 
      }, { status: 404 });
    }
    const client = clientRows[0];

    // 🔧 FIX: Simplified account context determination
    const isAccountContext = Boolean(accountLinked);

    // 🔧 FIX: Improved order number generation with better error handling
    let orderNumber = '';
    let accountOrderNumberToSave: string | null = null;
    
    if (isAccountContext) {
      // For account clients, store the external account order number
      const provided = typeof accountOrderNumber === 'string' ? accountOrderNumber.trim() : '';
      if (!provided) {
        return NextResponse.json({
          error: 'Order Number is required for account clients when accountLinked is true',
          code: 'MISSING_ORDER_NUMBER'
        }, { status: 400 });
      }
      
      // Store external account order number
      accountOrderNumberToSave = provided;
      
      // Generate internal order number based on client name
      const firstNameRaw = ((client as any).name || 'Account').trim().split(/\s+/)[0] || 'ACC';
      const alphaOnly = firstNameRaw.replace(/[^A-Za-z]/g, '');
      const basePrefix = (alphaOnly ? alphaOnly.toUpperCase().slice(0, 3) : 'ACC');

      // Find next available sequence number
      const existing = await db
        .select({ orderNumber: jobs.orderNumber })
        .from(jobs)
        .where(sql`${jobs.orderNumber} LIKE ${basePrefix + '%'}`);

      let maxSuffix = 0;
      for (const row of existing) {
        const m = row.orderNumber?.match(/(\d+)$/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (!isNaN(n)) maxSuffix = Math.max(maxSuffix, n);
        }
      }
      
      orderNumber = `${basePrefix}${String(maxSuffix + 1).padStart(4, '0')}`;
    } else {
      // 🔧 FIX: For regular clients, use provided order number or auto-generate
      if (accountOrderNumber && typeof accountOrderNumber === 'string' && accountOrderNumber.trim()) {
        // Client provided an order number (from frontend auto-generation)
        orderNumber = accountOrderNumber.trim();
        accountOrderNumberToSave = null; // Don't store in accountOrderNumber field for regular clients
      } else {
        // Fallback: auto-generate from client name
        const firstNameRaw = ((client as any).name || 'Client').trim().split(/\s+/)[0] || 'Client';
        const alphaOnly = firstNameRaw.replace(/[^A-Za-z]/g, '');
        const basePrefix = (alphaOnly ? alphaOnly.toUpperCase().slice(0, 3) : 'CLT');

        // Find next available sequence number
        const existing = await db
          .select({ orderNumber: jobs.orderNumber })
          .from(jobs)
          .where(sql`${jobs.orderNumber} LIKE ${basePrefix + '%'}`);

        let maxSuffix = 0;
        for (const row of existing) {
          const m = row.orderNumber?.match(/(\d+)$/);
          if (m) {
            const n = parseInt(m[1], 10);
            if (!isNaN(n)) maxSuffix = Math.max(maxSuffix, n);
          }
        }
        
        orderNumber = `${basePrefix}${String(maxSuffix + 1).padStart(4, '0')}`;
        accountOrderNumberToSave = null;
      }
    }

    // Validate order number uniqueness
    const existingOrder = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.orderNumber, orderNumber)).limit(1);
    if (existingOrder.length > 0) {
      return NextResponse.json({
        error: `Order number ${orderNumber} already exists. Please try again.`,
        code: 'ORDER_NUMBER_EXISTS'
      }, { status: 409 });
    }

    // Calculate urgency multiplier based on deadline
    const currentTime = new Date();
    const hoursUntilDeadline = (parsedDeadlineDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
    const urgencyMultiplier = hoursUntilDeadline < 8 ? 1.3 : 1.0;
    const calculatedPrice = parsedAmount * urgencyMultiplier;

    // 🔧 FIX: Retry logic for display ID generation to handle race conditions
    let newJob;
    let retryCount = 0;
    const maxRetries = 5;
    
    while (retryCount < maxRetries) {
      try {
        // Generate unique display ID
        const displayIdCurrent = await generateJobDisplayId();
        
        const insertData: any = {
          displayId: displayIdCurrent,
          orderId: displayIdCurrent,
          clientId: parsedClientId,
          title: String(title).trim(),
          instructions: String(instructions).trim(),
          workType: normalizedWorkType,
          pages: parsedPages,
          slides: parsedSlides,
          amount: parsedAmount,
          deadline: parsedDeadlineDate.toISOString(),
          actualDeadline: actualDeadline || parsedDeadlineDate.toISOString(),
          freelancerDeadline: freelancerDeadline || parsedDeadlineDate.toISOString(),
          requestDraft: requestDraft ? true : false,
          requestPrintableSources: requestPrintableSources ? true : false,
          singleSpaced: singleSpaced ? true : false,
          baseCpp: baseCpp || null,
          effectiveCpp: effectiveCpp || null,
          draftDelivered: false,
          status: 'pending',
          adminApproved: false,
          clientApproved: false,
          revisionRequested: false,
          paymentConfirmed: false,
          invoiceGenerated: false,
          placementPriority: 0,
          managerEarnings: 0,
          freelancerEarnings: 0,
          adminProfit: 0,
          urgencyMultiplier: urgencyMultiplier,
          calculatedPrice: calculatedPrice,
          isRealOrder: true,
          accountLinked: Boolean(isAccountContext),
          createdAt: now,
          updatedAt: now,
          orderNumber,
        };

        // Only add accountOrderNumber if it exists (for account clients)
        if (accountOrderNumberToSave !== null) {
          insertData.accountOrderNumber = accountOrderNumberToSave;
        }

        // Insert job into database
        newJob = await db.insert(jobs).values(insertData).returning();
        
        // Success - break out of retry loop
        break;
      } catch (err: any) {
        const errorMessage = (err?.message || '').toLowerCase();
        
        // Check if it's a duplicate key error for display_id or order_id
        if (errorMessage.includes('unique') && (errorMessage.includes('display_id') || errorMessage.includes('order_id'))) {
          retryCount++;
          console.log(`Display ID collision detected, retry ${retryCount}/${maxRetries}`);
          
          if (retryCount >= maxRetries) {
            return NextResponse.json({
              error: 'Failed to generate unique job ID after multiple attempts. Please try again.',
              code: 'ID_GENERATION_FAILED'
            }, { status: 500 });
          }
          
          // Wait a bit before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 50 * Math.pow(2, retryCount)));
          continue;
        }
        
        // Different error - throw it
        throw err;
      }
    }

    if (!newJob || newJob.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to create job',
        code: 'JOB_CREATE_FAILED' 
      }, { status: 500 });
    }

    // Update client's role grouping if needed
    try {
      if (isAccountContext && (client as any).role !== 'account_owner') {
        await db.update(users).set({ role: 'account_owner', updatedAt: new Date().toISOString() }).where(eq(users.id, parsedClientId));
      }
    } catch (roleErr) {
      console.error('Role update error (non-fatal):', roleErr);
    }

    // Send notification to admins
    try {
      sendEmailToAdmins({
        subject: `[Order ${newJob[0].displayId}] New Job Posted`,
        html: getNewJobPostingAdminHTML(
          (client as any).name,
          (client as any).email,
          String(title).trim(),
          newJob[0].id,
          newJob[0].displayId,
          normalizedWorkType,
          parsedAmount,
          parsedDeadlineDate.toISOString()
        )
      }).catch(err => console.error('Failed to send admin notification:', err));
    } catch (err) {
      console.error('Admin email dispatch error:', err);
    }

    return NextResponse.json(newJob[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/jobs error details:', error);
    console.error('Error stack:', (error as Error).stack);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message,
      details: (error as Error).stack
    }, { status: 500 });
  }
}