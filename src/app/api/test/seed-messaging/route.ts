import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { and, eq } from 'drizzle-orm';
import { jobs, users, jobMessages, jobAttachments, messages } from '@/db/schema';

// POST /api/test/seed-messaging
// Body: { jobId, clientId?, writerId?, adminId, managerId? }
// Seeds a handful of messages (pending + approved) and files (initial/submission/revision/final)
// Also seeds global messages table used by admin moderation (/api/messages)
// Security: only allowed in development or when ALLOW_TEST_SEEDS=true
export async function POST(req: NextRequest) {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const allowTestSeeds = process.env.ALLOW_TEST_SEEDS === 'true';

    if (!isDevelopment && !allowTestSeeds) {
      return NextResponse.json(
        { error: 'Test seeding is only allowed in development or with ALLOW_TEST_SEEDS=true', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { jobId, clientId: clientIdRaw, writerId: writerIdRaw, adminId: adminIdRaw, managerId: managerIdRaw } = body || {};

    if (!jobId || !adminIdRaw) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, adminId' },
        { status: 400 }
      );
    }

    const parsedJobId = Number(jobId);
    const adminId = Number(adminIdRaw);
    const managerId = managerIdRaw ? Number(managerIdRaw) : undefined;

    // Validate job
    const [job] = await db.select().from(jobs).where(eq(jobs.id, parsedJobId));
    if (!job) {
      return NextResponse.json(
        { error: `Job ${parsedJobId} not found` },
        { status: 404 }
      );
    }

    // Resolve/validate users
    const derivedClientId = clientIdRaw ? Number(clientIdRaw) : job.clientId;
    const derivedWriterId = writerIdRaw ? Number(writerIdRaw) : job.assignedFreelancerId;

    const [client] = await db.select().from(users).where(eq(users.id, Number(derivedClientId)));
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found for provided/derived clientId' },
        { status: 404 }
      );
    }

    let writer = null as null | typeof client;
    if (derivedWriterId) {
      const [w] = await db.select().from(users).where(eq(users.id, Number(derivedWriterId)));
      writer = w || null;
    }

    const [admin] = await db.select().from(users).where(eq(users.id, adminId));
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    const nowIso = new Date().toISOString();
    const tenMinAgoIso = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    // Seed job messages (visible in /api/jobs/[id]/messages)
    const jobMsgsToInsert = [
      {
        jobId: parsedJobId,
        senderId: client.id,
        message: 'Hi writer, please confirm you received the order instructions.',
        messageType: 'text' as const,
        adminApproved: 0, // pending
        createdAt: tenMinAgoIso,
      },
      writer && {
        jobId: parsedJobId,
        senderId: writer.id,
        message: 'Hello! I have received the instructions and started working on the draft.',
        messageType: 'text' as const,
        adminApproved: 1, // approved
        createdAt: tenMinAgoIso,
      },
      writer && {
        jobId: parsedJobId,
        senderId: writer.id,
        message: 'Draft uploaded. Please review and share any revisions.',
        messageType: 'text' as const,
        adminApproved: 1,
        createdAt: nowIso,
      },
      managerId && {
        jobId: parsedJobId,
        senderId: managerId,
        message: 'Manager note: Keep the tone formal and ensure APA 7 formatting.',
        messageType: 'text' as const,
        adminApproved: 1,
        createdAt: nowIso,
      },
    ].filter(Boolean) as any[];

    const insertedJobMessages = jobMsgsToInsert.length
      ? await db.insert(jobMessages).values(jobMsgsToInsert).returning()
      : [];

    // Seed job attachments (visible in job detail pages under uploads)
    const attachmentsToInsert = [
      {
        jobId: parsedJobId,
        uploadedBy: client.id,
        fileName: 'requirements.pdf',
        fileUrl: 'https://example.com/requirements.pdf',
        fileSize: 120_000,
        fileType: 'application/pdf',
        uploadType: 'initial',
        attachmentCategory: 'requirement',
        createdAt: nowIso,
      },
      writer && {
        jobId: parsedJobId,
        uploadedBy: writer.id,
        fileName: 'draft.docx',
        fileUrl: 'https://example.com/draft.docx',
        fileSize: 200_000,
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        uploadType: 'submission',
        attachmentCategory: 'submission',
        createdAt: nowIso,
      },
      {
        jobId: parsedJobId,
        uploadedBy: client.id,
        fileName: 'revision_notes.txt',
        fileUrl: 'https://example.com/revision_notes.txt',
        fileSize: 5_000,
        fileType: 'text/plain',
        uploadType: 'revision',
        attachmentCategory: 'revision',
        createdAt: nowIso,
      },
      writer && {
        jobId: parsedJobId,
        uploadedBy: writer.id,
        fileName: 'final_paper.pdf',
        fileUrl: 'https://example.com/final_paper.pdf',
        fileSize: 500_000,
        fileType: 'application/pdf',
        uploadType: 'final',
        attachmentCategory: 'final',
        createdAt: nowIso,
      },
    ].filter(Boolean) as any[];

    const insertedAttachments = attachmentsToInsert.length
      ? await db.insert(jobAttachments).values(attachmentsToInsert).returning()
      : [];

    // Seed global messages used by /admin/messages moderation page (/api/messages)
    // Insert sequentially and ignore any failures to avoid blocking seeding
    const globalInserted: any[] = [];

    try {
      if (writer) {
        const [row1] = await db
          .insert(messages)
          .values({
            senderId: client.id,
            receiverId: writer.id,
            jobId: parsedJobId,
            content: 'Client -> Writer (pending moderation)',
            fileUrl: '',
            adminApproved: 0,
            createdAt: nowIso,
          })
          .returning();
        if (row1) globalInserted.push(row1);
      }
    } catch (e) {
      console.warn('seed-messaging: skipped global message 1', e);
    }

    try {
      const [row2] = await db
        .insert(messages)
        .values({
          senderId: admin.id,
          receiverId: client.id,
          jobId: parsedJobId,
          content: 'Admin -> Client (auto-approved)',
          fileUrl: '',
          adminApproved: 1,
          createdAt: nowIso,
        })
        .returning();
      if (row2) globalInserted.push(row2);
    } catch (e) {
      console.warn('seed-messaging: skipped global message 2', e);
    }

    try {
      const [row3] = await db
        .insert(messages)
        .values({
          senderId: client.id,
          receiverId: admin.id,
          jobId: parsedJobId,
          content: 'Client -> Admin (pending moderation)',
          fileUrl: '',
          adminApproved: 0,
          createdAt: nowIso,
        })
        .returning();
      if (row3) globalInserted.push(row3);
    } catch (e) {
      console.warn('seed-messaging: skipped global message 3', e);
    }

    return NextResponse.json({
      success: true,
      job: { id: job.id, title: job.title, status: job.status, displayId: job.displayId },
      inserted: {
        jobMessages: insertedJobMessages.length,
        attachments: insertedAttachments.length,
        globalMessages: globalInserted.length,
      },
      sample: {
        jobMessages: insertedJobMessages,
        attachments: insertedAttachments,
        globalMessages: globalInserted,
      },
      note:
        'Seeded job messages (pending + approved), job attachments (initial/submission/revision/final). Global messages are optional and ignored on failure.',
    });
  } catch (error: any) {
    console.error('seed-messaging error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to seed messaging' },
      { status: 500 }
    );
  }
}