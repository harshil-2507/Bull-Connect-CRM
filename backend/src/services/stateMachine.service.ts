/**
 * Lead State Machine - Production Grade
 * 
 * Enforces strict state transitions for lead lifecycle.
 * Transitions are validated both in application code and database triggers.
 * 
 * State Flow:
 * NEW → ASSIGNED → CONTACTED → (FIELD_REQUESTED | DROPPED)
 */

export type LeadStatus = 
  | 'NEW'
  | 'ASSIGNED'
  | 'CONTACTED'
  | 'FIELD_REQUESTED'
  | 'DROPPED';

/**
 * Allowed state transitions map
 * Terminal states (FIELD_REQUESTED, DROPPED) have no outgoing transitions
 */
export const ALLOWED_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['ASSIGNED'],
  ASSIGNED: ['CONTACTED'],
  CONTACTED: ['FIELD_REQUESTED', 'DROPPED'],
  FIELD_REQUESTED: [], // Terminal state
  DROPPED: [], // Terminal state
};

/**
 * Validates if a state transition is allowed
 * @throws Error if transition is invalid
 */
export function validateLeadTransition(
  currentStatus: LeadStatus,
  nextStatus: LeadStatus
): void {
  // Same status is always allowed (idempotent)
  if (currentStatus === nextStatus) {
    return;
  }

  const allowedNextStates = ALLOWED_TRANSITIONS[currentStatus];
  
  if (!allowedNextStates.includes(nextStatus)) {
    throw new Error(
      `Invalid lead status transition: ${currentStatus} → ${nextStatus}. ` +
      `Allowed transitions from ${currentStatus}: ${allowedNextStates.join(', ') || 'none (terminal state)'}`
    );
  }
}

/**
 * Checks if a status is terminal (no further transitions allowed)
 */
export function isTerminalStatus(status: LeadStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}

/**
 * Gets all allowed next states for a given status
 */
export function getAllowedNextStates(status: LeadStatus): LeadStatus[] {
  return ALLOWED_TRANSITIONS[status];
}

/**
 * Validates business rules for status transitions
 * @throws Error if business rules are violated
 */
export function validateStatusBusinessRules(
  nextStatus: LeadStatus,
  data: {
    dropReason?: string;
    cropType?: string;
    acreage?: number;
    assignedTo?: string;
  }
): void {
  switch (nextStatus) {
    case 'ASSIGNED':
      if (!data.assignedTo) {
        throw new Error('Lead must be assigned to a user to move to ASSIGNED status');
      }
      break;

    case 'FIELD_REQUESTED':
      if (!data.cropType || !data.acreage) {
        throw new Error('crop_type and acreage are required for FIELD_REQUESTED status');
      }
      if (data.acreage <= 0) {
        throw new Error('acreage must be greater than 0');
      }
      break;

    case 'DROPPED':
      if (!data.dropReason) {
        throw new Error('drop_reason is required for DROPPED status');
      }
      break;
  }
}

/**
 * Call dispositions that map to lead status transitions
 */
export type CallDisposition =
  | 'INTERESTED'
  | 'CALLBACK'
  | 'BUSY'
  | 'NOT_INTERESTED'
  | 'NO_ANSWER'
  | 'INVALID_NUMBER';

/**
 * Drop reasons
 */
export type DropReason =
  | 'NOT_INTERESTED'
  | 'INVALID_NUMBER'
  | 'DUPLICATE'
  | 'OUT_OF_AREA'
  | 'NOT_QUALIFIED'
  | 'OTHER';

/**
 * Maps call dispositions to potential status changes
 */
export function getStatusChangeFromDisposition(
  currentStatus: LeadStatus,
  disposition: CallDisposition,
  data?: { cropType?: string; acreage?: number }
): LeadStatus | null {
  switch (disposition) {
    case 'INTERESTED':
      // If lead is contacted and has crop info, move to field requested
      if (currentStatus === 'CONTACTED' && data?.cropType && data?.acreage) {
        return 'FIELD_REQUESTED';
      }
      // Otherwise, just mark as contacted
      return currentStatus === 'ASSIGNED' ? 'CONTACTED' : null;

    case 'NOT_INTERESTED':
    case 'INVALID_NUMBER':
      // These should drop the lead if in contacted state
      return currentStatus === 'CONTACTED' ? 'DROPPED' : null;

    case 'CALLBACK':
    case 'BUSY':
    case 'NO_ANSWER':
      // These don't change status, just log the call
      return null;

    default:
      return null;
  }
}

/**
 * Status requirements for assignment
 */
export const STATUS_REQUIREMENTS = {
  TELECALLER_CAN_ACCESS: ['ASSIGNED', 'CONTACTED'] as LeadStatus[],
  FIELD_EXEC_CAN_ACCESS: ['FIELD_REQUESTED'] as LeadStatus[],
  FIELD_MANAGER_CAN_ACCESS: ['FIELD_REQUESTED', 'CONTACTED'] as LeadStatus[],
} as const;

/**
 * Checks if a role can access leads in a given status
 */
export function canRoleAccessStatus(role: string, status: LeadStatus): boolean {
  switch (role) {
    case 'TELECALLER':
      return STATUS_REQUIREMENTS.TELECALLER_CAN_ACCESS.includes(status);
    case 'FIELD_EXEC':
      return STATUS_REQUIREMENTS.FIELD_EXEC_CAN_ACCESS.includes(status);
    case 'FIELD_MANAGER':
      return STATUS_REQUIREMENTS.FIELD_MANAGER_CAN_ACCESS.includes(status);
    case 'MANAGER':
    case 'ADMIN':
      return true; // Managers and admins can access all statuses
    default:
      return false;
  }
}
