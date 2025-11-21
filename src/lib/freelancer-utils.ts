// Freelancer utilities - extracted to avoid HMR issues

export const STATUS_MAP: Record<string, string[]> = {
  'on-hold': ['on_hold', 'on-hold', 'assigned', 'pending_assignment'],
  'in-progress': ['in_progress', 'assigned'],
  'editing': ['editing'],
  'done': ['delivered'],
  'delivered': ['delivered'],
  'revision': ['revision'],
  'approved': ['approved'],
  'completed': ['completed'],
  'cancelled': ['cancelled', 'canceled'],
};

import { calculateWriterPayout, writerCPP, isTechnicalWorkType } from '@/lib/payment-calculations';

/**
 * Calculate freelancer earnings based on CPP model
 * pages * (200 default | 230 technical)
 */
export const calculateFreelancerEarnings = (pages: number, workType?: string): number => {
  return calculateWriterPayout(pages, workType || '');
};

/**
 * Calculate admin commission (now admin profit) = client amount - (writer payout + manager payouts)
 * Note: prefer computing in API using job.managerEarnings from DB. This helper is kept for compatibility.
 */
export const calculateAdminCommission = (clientAmount: number, pages = 0, workType?: string, managerTotal = 0): number => {
  const writer = calculateWriterPayout(pages, workType || '');
  const profit = clientAmount - (writer + managerTotal);
  return profit < 0 ? 0 : Math.round(profit * 100) / 100;
};