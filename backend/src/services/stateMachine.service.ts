/**
 * Lead State Machine - Production Grade
 * 
 * Enforces strict state transitions for lead lifecycle.
 * Transitions are validated both in application code and database triggers.
 * 
 * State Flow:
 * NEW → ASSIGNED → CONTACTED → (FIELD_REQUESTED | DROPPED)
 */

import { LeadState } from "../models/lead.model";

/**
 * Allowed state transitions map
 * Terminal states (FIELD_REQUESTED, DROPPED) have no outgoing transitions
 */
export const ALLOWED_TRANSITIONS: Record<LeadState, LeadState[]> = {
  NEW: ['ASSIGNED', 'CONTACTED', 'DROPPED'],
  ASSIGNED: ['CONTACTED', 'DROPPED'],
  CONTACTED: ['VISIT_REQUESTED', 'DROPPED', 'CONTACTED'],

  VISIT_REQUESTED: ['VISIT_ASSIGNED'],

  VISIT_ASSIGNED: ['VISIT_COMPLETED'],

  VISIT_COMPLETED: ['SOLD', 'DROPPED'],

  SOLD: [],

  DROPPED: [],
};

/**
 * Validates if a state transition is allowed
 * @throws Error if transition is invalid
 */
export function validateLeadTransition(
  currentStatus: LeadState,
  nextStatus: LeadState
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
export function isTerminalStatus(status: LeadState): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}

/**
 * Gets all allowed next states for a given status
 */
export function getAllowedNextStates(status: LeadState): LeadState[] {
  return ALLOWED_TRANSITIONS[status];
}

/**
 * Validates business rules for status transitions
 * @throws Error if business rules are violated
 */
export function validateStatusBusinessRules(
  nextStatus: LeadState,
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

    case 'VISIT_REQUESTED':
      if (!data.cropType || !data.acreage) {
        throw new Error('crop_type and acreage are required for VISIT_REQUESTED status');
      }
      if (data.acreage <= 0) {
        throw new Error('acreage must be greater than 0');
      }
      break;

    case 'DROPPED':
      if (!data.dropReason) {
        data.dropReason = 'OTHER'; // Default drop reason if not provided

      }
      break;
  }
}

/**
 * Call dispositions that map to lead status transitions
 */
export type CallDisposition =
  | 'INTERESTED'
  | 'CONTACTED'
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
  currentStatus: LeadState,
  disposition: CallDisposition,
  data?: { cropType?: string; acreage?: number }
): LeadState | null {
  switch (disposition) {
    case 'INTERESTED':
      // If lead is contacted and has crop info, move to field requested
      if (currentStatus === 'CONTACTED' && data?.cropType && data?.acreage) {
        return 'VISIT_REQUESTED';
      }
      // Otherwise, just mark as contacted
      return currentStatus === 'ASSIGNED' ? 'CONTACTED' : null;

    case 'NOT_INTERESTED':
    case 'INVALID_NUMBER':
      // These should drop the lead if in contacted state. Dropping an
      // ASSIGNED lead is handled by the caller (promoting through CONTACTED)
      // because the database trigger forbids a direct ASSIGNED→DROPPED update.
      return currentStatus === 'CONTACTED' ? 'DROPPED' : null;

    case 'CONTACTED':
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
  TELECALLER_CAN_ACCESS: ['ASSIGNED', 'CONTACTED'] as LeadState[],
  FIELD_EXEC_CAN_ACCESS: ['VISIT_REQUESTED'] as LeadState[],
  FIELD_MANAGER_CAN_ACCESS: ['VISIT_REQUESTED', 'CONTACTED'] as LeadState[],
} as const;

/**
 * Checks if a role can access leads in a given status
 */
export function canRoleAccessStatus(role: string, status: LeadState): boolean {
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
