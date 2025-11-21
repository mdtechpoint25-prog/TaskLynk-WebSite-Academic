import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, notifications, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';

/**
 * Internal utility function to notify all parties on status change
 * TIER 3 FIX #10: Status change notifications missing
 * 
 * Called when job status changes to notify:
 * - Client about order updates
 * - Manager about progress
 * - Admin about significant changes
 * - Writer about next steps
 */
export async function notifyStatusChange(
  jobId: number,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  try {
    const job = await db.select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (job.length === 0) return;

    const order = job[0];
    const now = new Date().toISOString();

    // Get relevant users
    const [client, manager, writer] = await Promise.all([
      db.select().from(users).where(eq(users.id, order.clientId)).limit(1),
      order.managerId ? db.select().from(users).where(eq(users.id, order.managerId)).limit(1) : Promise.resolve([]),
      order.assignedFreelancerId ? db.select().from(users).where(eq(users.id, order.assignedFreelancerId)).limit(1) : Promise.resolve([]),
    ]);

    const statusMessages: Record<string, string> = {
      'pending': 'Order pending admin review',
      'accepted': 'Order accepted and ready for assignment',
      'assigned': 'Order assigned to a writer',
      'in_progress': 'Writer is actively working on your order',
      'editing': 'Order is under quality review by editor',
      'delivered': 'Order has been delivered to you',
      'revision': 'Client has requested revisions',
      'approved': 'Order approved and ready for payment',
      'paid': 'Payment confirmed - order completed',
      'completed': 'Order completed and archived',
      'cancelled': 'Order has been cancelled',
      'on_hold': 'Order is temporarily on hold',
    };

    const message = statusMessages[newStatus] || `Order status changed to ${newStatus}`;

    // 1. NOTIFY CLIENT
    if (client.length > 0) {
      // In-app notification
      await db.insert(notifications).values({
        userId: client[0].id,
        jobId,
        type: 'status_change',
        title: `Order #${order.displayId} Status Update`,
        message,
        read: false,
        createdAt: now,
      });

      // Email notification
      try {
        await sendEmail({
          to: client[0].email,
          subject: `Order #${order.displayId} - ${newStatus.toUpperCase()} - TaskLynk`,
          html: `
            <h2>Order Status Update</h2>
            <p>Hi ${client[0].name},</p>
            <p>Your order <strong>#${order.displayId}</strong> status has been updated:</p>
            <p><strong>${message}</strong></p>
            <p>Order Details:</p>
            <ul>
              <li>Title: ${order.title}</li>
              <li>Status: ${newStatus}</li>
              <li>Deadline: ${new Date(order.deadline).toLocaleDateString()}</li>
            </ul>
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/client/jobs/${order.id}">View Order</a></p>
          `,
        });
      } catch (e) {
        console.error('Failed to send client email:', e);
      }

      // WhatsApp notification
      if (client[0].phone) {
        await notifyWhatsApp(client[0].phone, {
          title: `Order #${order.displayId} Update`,
          message: `${message}\nView: ${process.env.NEXT_PUBLIC_BASE_URL}/client/jobs/${order.id}`,
        }).catch(e => console.error('WhatsApp notification failed:', e));
      }
    }

    // 2. NOTIFY MANAGER
    if (manager.length > 0) {
      // In-app notification
      await db.insert(notifications).values({
        userId: manager[0].id,
        jobId,
        type: 'status_change',
        title: `Order #${order.displayId} Status Update`,
        message: `Order status changed from ${oldStatus} to ${newStatus}`,
        read: false,
        createdAt: now,
      });

      // Email for significant status changes
      if (['in_progress', 'editing', 'delivered', 'revision', 'completed'].includes(newStatus)) {
        try {
          await sendEmail({
            to: manager[0].email,
            subject: `Order #${order.displayId} - ${newStatus.toUpperCase()}`,
            html: `
              <h2>Managed Order Status Update</h2>
              <p>Hi ${manager[0].name},</p>
              <p>An order you're managing has been updated:</p>
              <p><strong>Order #${order.displayId}</strong>: ${message}</p>
              ${newStatus === 'in_progress' ? '<p>Writer has started work on this order.</p>' : ''}
              ${newStatus === 'editing' ? '<p>Order is awaiting quality review.</p>' : ''}
              ${newStatus === 'delivered' ? '<p>Order has been delivered to the client - awaiting approval.</p>' : ''}
              ${newStatus === 'revision' ? '<p>Client has requested revisions - coordinate with writer.</p>' : ''}
              ${newStatus === 'completed' ? '<p>Order is now complete and paid.</p>' : ''}
              <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/manager/orders/${order.displayId}">Manage Order</a></p>
            `,
          });
        } catch (e) {
          console.error('Failed to send manager email:', e);
        }
      }
    }

    // 3. NOTIFY WRITER
    if (writer.length > 0 && ['assigned', 'revision', 'editing', 'delivered', 'completed'].includes(newStatus)) {
      // In-app notification
      await db.insert(notifications).values({
        userId: writer[0].id,
        jobId,
        type: 'status_change',
        title: `Order #${order.displayId} Status Update`,
        message: `Order status: ${message}`,
        read: false,
        createdAt: now,
      });

      // Email for significant changes
      const writerMessages: Record<string, string> = {
        'assigned': 'You have been assigned a new order',
        'revision': 'Client has requested revisions to your work',
        'editing': 'Your work is being reviewed by an editor',
        'delivered': 'Your work has been delivered to the client',
        'completed': 'Order completed! You have been paid.',
      };

      if (newStatus in writerMessages) {
        try {
          await sendEmail({
            to: writer[0].email,
            subject: `Order #${order.displayId} - ${writerMessages[newStatus]}`,
            html: `
              <h2>Order Update</h2>
              <p>Hi ${writer[0].name},</p>
              <p>${writerMessages[newStatus]}</p>
              <p><strong>Order #${order.displayId}</strong></p>
              <p>Title: ${order.title}</p>
              ${newStatus === 'assigned' ? `<p>Deadline: ${new Date(order.deadline).toLocaleDateString()}</p>` : ''}
              ${newStatus === 'revision' ? `<p>Revision Notes: ${order.revisionNotes || 'N/A'}</p>` : ''}
              ${newStatus === 'completed' ? `<p>Payment has been added to your account balance.</p>` : ''}
              <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/freelancer/jobs/${order.id}">View Order</a></p>
            `,
          });
        } catch (e) {
          console.error('Failed to send writer email:', e);
        }
      }
    }

    // 4. NOTIFY ADMIN FOR CRITICAL CHANGES
    const criticalStatuses = ['cancelled', 'completed', 'delivered'];
    if (criticalStatuses.includes(newStatus)) {
      // Get first admin for notification
      const adminUsers = await db.select()
        .from(users)
        .where(eq(users.role, 'admin'))
        .limit(1);

      if (adminUsers.length > 0) {
        try {
          await notifyTelegram(process.env.TELEGRAM_ADMIN_CHAT_ID, {
            title: `Critical: Order #${order.displayId} - ${newStatus}`,
            message: `Order changed from ${oldStatus} to ${newStatus}. Title: ${order.title}. Client: ${client.length > 0 ? client[0].name : 'Unknown'}`,
          }).catch(e => console.error('Telegram notification failed:', e));
        } catch (e) {
          console.error('Failed to notify admin:', e);
        }
      }
    }

  } catch (error) {
    console.error('Error notifying status change:', error);
    // Don't throw - status change succeeded even if notification failed
  }
}

/**
 * POST /api/jobs/[id]/notify-status-change
 * Manually trigger status change notifications (for testing/replay)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = parseInt(params.id);
    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { oldStatus, newStatus } = body;

    if (!oldStatus || !newStatus) {
      return NextResponse.json(
        { error: 'Old and new status are required' },
        { status: 400 }
      );
    }

    await notifyStatusChange(jobId, oldStatus, newStatus);

    return NextResponse.json({
      success: true,
      message: 'Status change notifications sent',
      jobId,
      statusChange: `${oldStatus} → ${newStatus}`,
    });

  } catch (error) {
    console.error('Notify status change error:', error);
    return NextResponse.json(
      { error: 'Failed to send status notifications' },
      { status: 500 }
    );
  }
}
