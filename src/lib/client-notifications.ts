import { db } from '@/db';
import { notifications } from '@/db/schema';

/**
 * Client Notification System
 * Triggers notifications for client-related order events
 */

export async function notifyClientOrderApproved(
  jobId: number, 
  clientId: number, 
  orderNumber: string
) {
  const now = new Date().toISOString();
  
  await db.insert(notifications).values({
    userId: clientId,
    jobId,
    type: 'order_approved',
    title: 'Order Approved',
    message: `Your order ${orderNumber} has been approved by admin. A writer will be assigned soon.`,
    read: false,
    createdAt: now,
  });
}

export async function notifyClientWriterAssigned(
  jobId: number, 
  clientId: number, 
  orderNumber: string,
  writerName: string
) {
  const now = new Date().toISOString();
  
  await db.insert(notifications).values({
    userId: clientId,
    jobId,
    type: 'writer_assigned',
    title: 'Writer Assigned',
    message: `${writerName} has been assigned to work on your order ${orderNumber}.`,
    read: false,
    createdAt: now,
  });
}

export async function notifyClientWorkDelivered(
  jobId: number, 
  clientId: number, 
  orderNumber: string
) {
  const now = new Date().toISOString();
  
  await db.insert(notifications).values({
    userId: clientId,
    jobId,
    type: 'work_delivered',
    title: 'Work Delivered',
    message: `Your order ${orderNumber} is ready for review. Please review and approve or request revisions.`,
    read: false,
    createdAt: now,
  });
}

export async function notifyClientRevisionSubmitted(
  jobId: number, 
  clientId: number, 
  orderNumber: string
) {
  const now = new Date().toISOString();
  
  await db.insert(notifications).values({
    userId: clientId,
    jobId,
    type: 'revision_submitted',
    title: 'Revision Submitted',
    message: `Revised work for order ${orderNumber} has been submitted. Please review.`,
    read: false,
    createdAt: now,
  });
}

export async function notifyClientPaymentConfirmed(
  jobId: number, 
  clientId: number, 
  orderNumber: string
) {
  const now = new Date().toISOString();
  
  await db.insert(notifications).values({
    userId: clientId,
    jobId,
    type: 'payment_confirmed',
    title: 'Payment Confirmed',
    message: `Your payment for order ${orderNumber} has been confirmed. You can now download the files.`,
    read: false,
    createdAt: now,
  });
}

export async function notifyClientOrderCompleted(
  jobId: number, 
  clientId: number, 
  orderNumber: string
) {
  const now = new Date().toISOString();
  
  await db.insert(notifications).values({
    userId: clientId,
    jobId,
    type: 'order_completed',
    title: 'Order Completed',
    message: `Order ${orderNumber} has been marked as completed. Thank you for your business!`,
    read: false,
    createdAt: now,
  });
}

export async function notifyClientOrderCancelled(
  jobId: number, 
  clientId: number, 
  orderNumber: string,
  reason?: string
) {
  const now = new Date().toISOString();
  
  await db.insert(notifications).values({
    userId: clientId,
    jobId,
    type: 'order_cancelled',
    title: 'Order Cancelled',
    message: `Your order ${orderNumber} has been cancelled${reason ? `: ${reason}` : '.'}`,
    read: false,
    createdAt: now,
  });
}
