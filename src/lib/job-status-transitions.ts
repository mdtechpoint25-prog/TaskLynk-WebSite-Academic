/**
 * 🔄 FIX #22: Missing Job Status Validation
 * Validate job status transitions to prevent invalid state changes
 */

export type JobStatus =
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'delivered'
  | 'revision'
  | 'approved'
  | 'paid'
  | 'completed'
  | 'cancelled'
  | 'editing'; // QA/review stage

/**
 * Valid job status transitions map
 * Each key is a current status, and the array contains valid next statuses
 */
export const VALID_JOB_STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  pending: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'cancelled', 'editing'],
  in_progress: ['delivered', 'cancelled', 'editing'],
  editing: ['delivered', 'revision', 'cancelled'], // QA stage
  delivered: ['revision', 'paid', 'approved'],
  revision: ['delivered', 'cancelled', 'editing'],
  approved: ['paid'],
  paid: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};

/**
 * Validate if a status transition is allowed
 * @param oldStatus Current job status
 * @param newStatus Desired new status
 * @returns true if transition is valid, false otherwise
 */
export function validateStatusTransition(
  oldStatus: string,
  newStatus: string
): boolean {
  // If statuses are the same, allow (idempotent)
  if (oldStatus === newStatus) {
    return true;
  }

  const validTransitions = VALID_JOB_STATUS_TRANSITIONS[oldStatus as JobStatus];

  if (!validTransitions) {
    console.error(`Invalid current status: ${oldStatus}`);
    return false;
  }

  return validTransitions.includes(newStatus as JobStatus);
}

/**
 * Get human-readable error message for invalid transition
 */
export function getTransitionError(
  oldStatus: string,
  newStatus: string
): string {
  const validTransitions = VALID_JOB_STATUS_TRANSITIONS[oldStatus as JobStatus];

  if (!validTransitions) {
    return `Invalid current status: ${oldStatus}`;
  }

  return `Cannot transition from "${oldStatus}" to "${newStatus}". Valid transitions: ${validTransitions.join(', ')}`;
}

/**
 * Get all valid next statuses for a given current status
 */
export function getValidNextStatuses(currentStatus: string): JobStatus[] {
  return VALID_JOB_STATUS_TRANSITIONS[currentStatus as JobStatus] || [];
}

/**
 * Check if a status is terminal (no further transitions allowed)
 */
export function isTerminalStatus(status: string): boolean {
  const validTransitions = VALID_JOB_STATUS_TRANSITIONS[status as JobStatus];
  return validTransitions ? validTransitions.length === 0 : false;
}
