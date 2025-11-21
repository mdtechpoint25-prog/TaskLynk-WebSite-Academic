import { db } from '@/db';
import { notifications } from '@/db/schema';

type NotificationType = 'order' | 'payment' | 'system' | 'rating' | 'message' | 'revision';

interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: number;
  relatedType?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  relatedId,
  relatedType,
}: CreateNotificationParams) {
  try {
    const result = await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      read: false,
      relatedId: relatedId || null,
      relatedType: relatedType || null,
      createdAt: new Date().toISOString(),
    });

    return { success: true, result };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create order notifications
 */
export async function notifyOrderCreated(userId: number, orderId: number, clientName: string) {
  return createNotification({
    userId,
    type: 'order',
    title: 'New Order Received',
    message: `A new order has been created by ${clientName}`,
    relatedId: orderId,
    relatedType: 'order',
  });
}

export async function notifyOrderStatusChange(userId: number, orderId: number, status: string) {
  return createNotification({
    userId,
    type: 'order',
    title: 'Order Status Updated',
    message: `Your order status has been updated to: ${status}`,
    relatedId: orderId,
    relatedType: 'order',
  });
}

export async function notifyOrderCompleted(userId: number, orderId: number) {
  return createNotification({
    userId,
    type: 'order',
    title: 'Order Completed',
    message: 'Your order has been completed successfully',
    relatedId: orderId,
    relatedType: 'order',
  });
}

export async function notifyOrderCancelled(userId: number, orderId: number, reason: string) {
  return createNotification({
    userId,
    type: 'order',
    title: 'Order Cancelled',
    message: `Your order has been cancelled. Reason: ${reason}`,
    relatedId: orderId,
    relatedType: 'order',
  });
}

/**
 * Create payment notifications
 */
export async function notifyPaymentReceived(userId: number, amount: number, orderId: number) {
  return createNotification({
    userId,
    type: 'payment',
    title: 'Payment Received',
    message: `Payment of KES ${amount} has been received for your order`,
    relatedId: orderId,
    relatedType: 'order',
  });
}

export async function notifyPaymentPending(userId: number, amount: number, dueDate: string) {
  return createNotification({
    userId,
    type: 'payment',
    title: 'Payment Due',
    message: `Payment of KES ${amount} is due by ${dueDate}`,
  });
}

export async function notifyPaymentFailed(userId: number, amount: number, reason: string) {
  return createNotification({
    userId,
    type: 'payment',
    title: 'Payment Failed',
    message: `Payment of KES ${amount} failed. Reason: ${reason}`,
  });
}

/**
 * Create rating/review notifications
 */
export async function notifyNewRating(userId: number, ratingId: number, rating: number, reviewer: string) {
  return createNotification({
    userId,
    type: 'rating',
    title: 'New Rating Received',
    message: `${reviewer} has given you a ${rating}-star rating`,
    relatedId: ratingId,
    relatedType: 'rating',
  });
}

export async function notifyNewReview(userId: number, orderId: number, reviewer: string) {
  return createNotification({
    userId,
    type: 'rating',
    title: 'New Review',
    message: `${reviewer} has left a review for your work`,
    relatedId: orderId,
    relatedType: 'order',
  });
}

/**
 * Create revision request notifications
 */
export async function notifyRevisionRequested(userId: number, orderId: number, requesterName: string) {
  return createNotification({
    userId,
    type: 'revision',
    title: 'Revision Requested',
    message: `${requesterName} has requested revisions for your work`,
    relatedId: orderId,
    relatedType: 'order',
  });
}

export async function notifyRevisionCompleted(userId: number, orderId: number) {
  return createNotification({
    userId,
    type: 'revision',
    title: 'Revision Submitted',
    message: 'Your revision has been submitted successfully',
    relatedId: orderId,
    relatedType: 'order',
  });
}

/**
 * Create message notifications
 */
export async function notifyNewMessage(userId: number, messageId: number, senderName: string) {
  return createNotification({
    userId,
    type: 'message',
    title: 'New Message',
    message: `You have a new message from ${senderName}`,
    relatedId: messageId,
    relatedType: 'message',
  });
}

/**
 * Create system notifications
 */
export async function notifySystemMessage(userId: number, title: string, message: string) {
  return createNotification({
    userId,
    type: 'system',
    title,
    message,
  });
}
