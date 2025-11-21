import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { submissions, submissionFiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get('jobId');
    const writerId = request.nextUrl.searchParams.get('writerId');

    if (!jobId || !writerId) {
      return NextResponse.json(
        { error: 'Missing jobId or writerId' },
        { status: 400 }
      );
    }

    const allSubmissions = await db
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.jobId, parseInt(jobId)),
          eq(submissions.writerId, parseInt(writerId))
        )
      );

    return NextResponse.json({ submissions: allSubmissions });
  } catch (error) {
    console.error('Failed to fetch submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      jobId,
      writerId,
      submissionType,
      content,
      wordCount,
      files,
    } = body;

    if (!jobId || !writerId || !submissionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create submission
    const newSubmission = await db
      .insert(submissions)
      .values({
        jobId,
        writerId,
        submissionType,
        content: content || '',
        wordCount: wordCount || 0,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    // Add files if provided
    if (files && files.length > 0 && newSubmission[0]) {
      const submissionId = newSubmission[0].id;
      for (const file of files) {
        await db.insert(submissionFiles).values({
          submissionId,
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          fileSize: file.fileSize,
          fileType: file.fileType,
          uploadedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        submission: newSubmission[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create submission:', error);
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    );
  }
}
