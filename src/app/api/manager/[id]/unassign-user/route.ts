import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, jobs, managers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * DELETE /api/manager/[id]/unassign-user
 * Manager or Admin unassigns a user from manager
 * TIER 3 FIX #11: Manager can't unassign users
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const managerId = parseInt(params.id);
    if (isNaN(managerId)) {
      return NextResponse.json(
        { error: 'Invalid manager ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userId, userType } = body; // userType: 'client' or 'freelancer'

    if (!userId || !userType) {
      return NextResponse.json(
        { error: 'User ID and user type (client/freelancer) are required' },
        { status: 400 }
      );
    }

    // Verify manager exists
    const manager = await db.select()
      .from(users)
      .where(and(
        eq(users.id, managerId),
        eq(users.role, 'manager')
      ))
      .limit(1);

    if (manager.length === 0) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

    // Verify user exists
    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is assigned to this manager
    if (user[0].assignedManagerId !== managerId) {
      return NextResponse.json(
        { error: 'This user is not assigned to you' },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    // Unassign user
    await db.update(users)
      .set({
        assignedManagerId: null,
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    // If unassigning all their orders, reassign to admin or queue
    // (Optional: could also create notification or leave unassigned)
    if (userType === 'freelancer') {
      const assignedJobs = await db.select()
        .from(jobs)
        .where(eq(jobs.assignedFreelancerId, userId));

      // Mark jobs as needing reassignment
      for (const job of assignedJobs) {
        await db.update(jobs)
          .set({
            managerId: null,
            updatedAt: now,
          })
          .where(eq(jobs.id, job.id));
      }
    }

    return NextResponse.json({
      success: true,
      message: `${userType === 'client' ? 'Client' : 'Freelancer'} unassigned successfully`,
      userId,
      managerId,
      unassignedAt: now,
    });

  } catch (error) {
    console.error('Unassign error:', error);
    return NextResponse.json(
      { error: 'Failed to unassign user' },
      { status: 500 }
    );
  }
}
