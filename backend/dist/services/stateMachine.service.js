"use strict";
/**
 * Lead State Machine - Production Grade
 *
 * Enforces strict state transitions for lead lifecycle.
 * Transitions are validated both in application code and database triggers.
 *
 * State Flow:
 * NEW → ASSIGNED → CONTACTED → (FIELD_REQUESTED | DROPPED)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATUS_REQUIREMENTS = exports.ALLOWED_TRANSITIONS = void 0;
exports.validateLeadTransition = validateLeadTransition;
exports.isTerminalStatus = isTerminalStatus;
exports.getAllowedNextStates = getAllowedNextStates;
exports.validateStatusBusinessRules = validateStatusBusinessRules;
exports.getStatusChangeFromDisposition = getStatusChangeFromDisposition;
exports.canRoleAccessStatus = canRoleAccessStatus;
/**
 * Allowed state transitions map
 * Terminal states (FIELD_REQUESTED, DROPPED) have no outgoing transitions
 */
exports.ALLOWED_TRANSITIONS = {
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
function validateLeadTransition(currentStatus, nextStatus) {
    // Same status is always allowed (idempotent)
    if (currentStatus === nextStatus) {
        return;
    }
    const allowedNextStates = exports.ALLOWED_TRANSITIONS[currentStatus];
    if (!allowedNextStates.includes(nextStatus)) {
        throw new Error(`Invalid lead status transition: ${currentStatus} → ${nextStatus}. ` +
            `Allowed transitions from ${currentStatus}: ${allowedNextStates.join(', ') || 'none (terminal state)'}`);
    }
}
/**
 * Checks if a status is terminal (no further transitions allowed)
 */
function isTerminalStatus(status) {
    return exports.ALLOWED_TRANSITIONS[status].length === 0;
}
/**
 * Gets all allowed next states for a given status
 */
function getAllowedNextStates(status) {
    return exports.ALLOWED_TRANSITIONS[status];
}
/**
 * Validates business rules for status transitions
 * @throws Error if business rules are violated
 */
function validateStatusBusinessRules(nextStatus, data) {
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
 * Maps call dispositions to potential status changes
 */
function getStatusChangeFromDisposition(currentStatus, disposition, data) {
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
exports.STATUS_REQUIREMENTS = {
    TELECALLER_CAN_ACCESS: ['ASSIGNED', 'CONTACTED'],
    FIELD_EXEC_CAN_ACCESS: ['FIELD_REQUESTED'],
    FIELD_MANAGER_CAN_ACCESS: ['FIELD_REQUESTED', 'CONTACTED'],
};
/**
 * Checks if a role can access leads in a given status
 */
function canRoleAccessStatus(role, status) {
    switch (role) {
        case 'TELECALLER':
            return exports.STATUS_REQUIREMENTS.TELECALLER_CAN_ACCESS.includes(status);
        case 'FIELD_EXEC':
            return exports.STATUS_REQUIREMENTS.FIELD_EXEC_CAN_ACCESS.includes(status);
        case 'FIELD_MANAGER':
            return exports.STATUS_REQUIREMENTS.FIELD_MANAGER_CAN_ACCESS.includes(status);
        case 'MANAGER':
        case 'ADMIN':
            return true; // Managers and admins can access all statuses
        default:
            return false;
    }
}
