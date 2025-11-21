import { db } from '@/db';
import { adminAuditLogs } from '@/db/schema';

/**
 * Admin Audit Logging System
 * Tracks all admin actions for accountability and security
 */

export interface AdminAuditDetails {
  [key: string]: any;
}

/**
 * Log an admin action to the audit trail
 * 
 * @param adminId - ID of the admin performing the action
 * @param action - Type of action (e.g., 'approve_user', 'confirm_payment')
 * @param targetId - ID of the affected entity (user, payment, job, etc.)
 * @param targetType - Type of entity ('user', 'payment', 'job', 'payout', etc.)
 * @param details - Additional context as an object (will be JSON stringified)
 * @param ipAddress - IP address of the admin (optional)
 * @param userAgent - User agent string (optional)
 */
export async function logAdminAction(
  adminId: number,
  action: string,
  targetId: number | null,
  targetType: string,
  details?: AdminAuditDetails,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    const now = new Date().toISOString();
    
    await db.insert(adminAuditLogs).values({
      adminId,
      action,
      targetId,
      targetType,
      details: details ? JSON.stringify(details) : null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      timestamp: now,
      createdAt: now,
    });
    
    console.log(`[Audit] Admin ${adminId} performed ${action} on ${targetType} ${targetId}`);
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw - logging failure shouldn't break main operation
  }
}

/**
 * Helper to extract IP address from Next.js request
 */
export function getClientIp(request: Request): string | undefined {
  // Try various headers in order of preference
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return undefined;
}

/**
 * Helper to extract user agent from Next.js request
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * Convenience function to log admin action with request context
 */
export async function logAdminActionWithRequest(
  request: Request,
  adminId: number,
  action: string,
  targetId: number | null,
  targetType: string,
  details?: AdminAuditDetails
): Promise<void> {
  const ipAddress = getClientIp(request);
  const userAgent = getUserAgent(request);
  
  await logAdminAction(
    adminId,
    action,
    targetId,
    targetType,
    details,
    ipAddress,
    userAgent
  );
}

/**
 * Common admin actions for consistent naming
 */
export const AdminActions = {
  // User management
  APPROVE_USER: 'approve_user',
  REJECT_USER: 'reject_user',
  SUSPEND_USER: 'suspend_user',
  UNSUSPEND_USER: 'unsuspend_user',
  DELETE_USER: 'delete_user',
  BLACKLIST_USER: 'blacklist_user',
  EDIT_USER: 'edit_user',
  
  // Payment management
  CONFIRM_PAYMENT: 'confirm_payment',
  REJECT_PAYMENT: 'reject_payment',
  
  // Payout management
  APPROVE_PAYOUT: 'approve_payout',
  REJECT_PAYOUT: 'reject_payout',
  PROCESS_PAYOUT: 'process_payout',
  
  // Job management
  APPROVE_JOB: 'approve_job',
  CANCEL_JOB: 'cancel_job',
  ASSIGN_JOB: 'assign_job',
  
  // Message moderation
  APPROVE_MESSAGE: 'approve_message',
  REJECT_MESSAGE: 'reject_message',
  
  // System configuration
  UPDATE_SETTINGS: 'update_settings',
  CREATE_ADMIN: 'create_admin',
  INVITE_MANAGER: 'invite_manager',
} as const;

/**
 * Target types for consistent naming
 */
export const AuditTargetTypes = {
  USER: 'user',
  PAYMENT: 'payment',
  PAYOUT: 'payout',
  JOB: 'job',
  MESSAGE: 'message',
  SETTINGS: 'settings',
  INVITATION: 'invitation',
} as const;
