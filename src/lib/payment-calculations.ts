/**
 * Centralized payment calculation functions for TaskLynk
 *
 * OLD model (still used as fallback):
 * - Minimum client cost-per-page (CPP) = KSh 240 (validation handled server-side)
 * - Minimum client cost-per-slide (CPS) = KSh 150
 * - Writer CPP: default 200; technical orders = 270-350 (using 270 as base)
 * - Writer CPS (slides): 100
 * - Manager earnings: 10 on assign; on submit 10 + 5 * (pages - 1)
 * - Admin profit = client payment - (writer payout + manager payouts)
 *
 * NEW CPP LEVEL SYSTEM (Primary):
 * - Freelancers progress through 5 tiers: Starter (150) → Rising (160) → Established (170) → Expert (180) → Master (200)
 * - Technical work adds +20 CPP bonus across all tiers
 * - Progress based on completed orders: 3 → 5 → 15 → 27 → ∞
 */

import { getCurrentCPP, isWorkTypeTechnical } from './cpp-calculation';

const TECHNICAL_KEYWORDS = [
  'excel',
  'spss',
  'stata',
  'r ',
  ' r',
  'python',
  'data analysis',
  'programming',
  'powerpoint',
  'presentation',
  'technical',
  'coding',
  'jasp',
  'jamovi'
];

export function isTechnicalWorkType(workType: string | null | undefined): boolean {
  if (!workType) return false;
  const t = workType.toLowerCase();
  return TECHNICAL_KEYWORDS.some((k) => t.includes(k));
}

/** Return writer CPP based on work type */
export function writerCPP(workType: string | null | undefined): number {
  return isTechnicalWorkType(workType) ? 270 : 200;
}

/** Writer compensation per slide */
export function writerPerSlide(): number {
  return 100;
}

/** Client minimum CPP - 240 for regular, 270 for technical */
export function clientMinCPP(workType?: string | null | undefined): number {
  return isTechnicalWorkType(workType) ? 270 : 240;
}

/** Client minimum CPS */
export function clientMinCPS(): number {
  return 150;
}

/** Calculate writer payout based on pages and work type CPP (legacy helper: pages only) */
export function calculateWriterPayout(pages: number | null | undefined, workType: string | null | undefined): number {
  const p = Math.max(0, Number(pages || 0));
  return Math.round(p * writerCPP(workType) * 100) / 100;
}

/** Calculate writer payout including pages and slides */
export function calculateWriterEarnings(
  pages: number | null | undefined,
  slides: number | null | undefined,
  workType: string | null | undefined
): number {
  const p = Math.max(0, Number(pages || 0));
  const s = Math.max(0, Number(slides || 0));
  const amount = p * writerCPP(workType) + s * writerPerSlide();
  return Math.round(amount * 100) / 100;
}

/** Minimum client amount required by pages */
export function minRequiredClientAmount(pages: number | null | undefined, workType?: string | null | undefined): number {
  const p = Math.max(0, Number(pages || 0));
  return p * clientMinCPP(workType);
}

/** Minimum client amount required by slides */
export function minRequiredClientSlideAmount(slides: number | null | undefined): number {
  const s = Math.max(0, Number(slides || 0));
  return s * clientMinCPS();
}

/** Manager earnings helpers */
export function managerAssignFee(): number {
  return 10;
}
export function managerSubmitFee(pages: number | null | undefined): number {
  const p = Math.max(0, Number(pages || 0));
  if (p <= 0) return 0;
  return 10 + 5 * Math.max(p - 1, 0);
}
export function calculateManagerEarnings(params: { assigned: boolean; submitted: boolean; pages: number | null | undefined }): number {
  let total = 0;
  if (params.assigned) total += managerAssignFee();
  if (params.submitted) total += managerSubmitFee(params.pages);
  return Math.round(total * 100) / 100;
}

/**
 * Backward-compat: previously returned 70% of client payment.
 * Now returns 0 and callers should switch to calculateWriterPayout/calculateWriterEarnings.
 */
export function calculateFreelancerAmount(_clientPayment: number): number {
  return 0;
}

/**
 * NEW CPP LEVEL SYSTEM - Calculate writer payout based on CPP tier
 * @param pages Number of pages
 * @param workType Type of work (determines if technical)
 * @param completedOrders Number of orders the freelancer has completed (determines CPP level)
 * @returns Calculated writer payout
 */
export function calculateWriterPayoutByCPPLevel(
  pages: number | null | undefined,
  workType: string | null | undefined,
  completedOrders: number = 0
): number {
  const p = Math.max(0, Number(pages || 0));
  const isTechnical = isWorkTypeTechnical(workType);
  const cppRate = getCurrentCPP(completedOrders, isTechnical);
  return Math.round(p * cppRate * 100) / 100;
}

/**
 * NEW CPP LEVEL SYSTEM - Calculate total writer earnings (pages + slides) based on CPP tier
 * @param pages Number of pages
 * @param slides Number of slides
 * @param workType Type of work (determines if technical)
 * @param completedOrders Number of orders the freelancer has completed (determines CPP level)
 * @returns Calculated total writer earnings
 */
export function calculateWriterEarningsByCPPLevel(
  pages: number | null | undefined,
  slides: number | null | undefined,
  workType: string | null | undefined,
  completedOrders: number = 0
): number {
  const p = Math.max(0, Number(pages || 0));
  const s = Math.max(0, Number(slides || 0));
  const isTechnical = isWorkTypeTechnical(workType);
  const cppRate = getCurrentCPP(completedOrders, isTechnical);
  const amount = p * cppRate + s * writerPerSlide();
  return Math.round(amount * 100) / 100;
}

/**
 * Get current CPP rate for a freelancer (wrapper for easier use)
 */
export function getFreelancerCPPRate(
  workType: string | null | undefined,
  completedOrders: number = 0
): number {
  const isTechnical = isWorkTypeTechnical(workType);
  return getCurrentCPP(completedOrders, isTechnical);
}

/**
 * Backward-compat: previously returned 30% of client payment.
 * Now returns 0 and callers should compute admin profit as
 * (client amount) - (writer payout + manager payouts).
 */
export function calculateAdminCommission(_clientPayment: number): number {
  return 0;
}