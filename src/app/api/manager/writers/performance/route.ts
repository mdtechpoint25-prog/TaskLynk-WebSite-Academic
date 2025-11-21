import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, users, ratings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const managerId = request.nextUrl.searchParams.get('managerId');

    if (!managerId) {
      return NextResponse.json(
        { error: 'Missing managerId' },
        { status: 400 }
      );
    }

    const managerJobs = await db
      .select({ id: jobs.id, assignedFreelancerId: jobs.assignedFreelancerId })
      .from(jobs)
      .where(eq(jobs.managerId, parseInt(managerId)));

    const writerMap = new Map();

    for (const job of managerJobs) {
      if (!job.assignedFreelancerId) continue;

      if (!writerMap.has(job.assignedFreelancerId)) {
        const writer = await db
          .select({ id: users.id, name: users.name, earned: users.totalEarned })
          .from(users)
          .where(eq(users.id, job.assignedFreelancerId))
          .limit(1);

        if (writer[0]) {
          writerMap.set(job.assignedFreelancerId, {
            id: job.assignedFreelancerId,
            name: writer[0].name,
            totalOrders: 0,
            completedOrders: 0,
            earned: writer[0].earned,
          });
        }
      }

      const writerData = writerMap.get(job.assignedFreelancerId);
      if (writerData) {
        writerData.totalOrders += 1;
        if (job.status === 'completed' || job.status === 'paid') {
          writerData.completedOrders += 1;
        }
      }
    }

    const writers = await Promise.all(
      Array.from(writerMap.values()).map(async (writer) => {
        const writerRatings = await db
          .select()
          .from(ratings)
          .where(eq(ratings.rateeId, writer.id));

        const avgRating =
          writerRatings.length > 0
            ? writerRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / writerRatings.length
            : 0;

        return {
          id: writer.id,
          writerId: writer.id,
          writerName: writer.name,
          totalOrders: writer.totalOrders,
          completedOrders: writer.completedOrders,
          averageRating: avgRating,
          onTimeDelivery: writer.completedOrders > 0 ? 85 : 0,
          avgCompletionTime: '5 days',
          totalEarned: parseFloat(writer.earned as string),
        };
      })
    );

    return NextResponse.json({ writers });
  } catch (error) {
    console.error('Failed to fetch writer performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch writer performance' },
      { status: 500 }
    );
  }
}
