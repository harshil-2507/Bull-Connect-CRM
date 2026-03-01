"use strict";
/**
 * Canonical lead states (single source of truth) — aligned with PRD
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_TRANSITIONS = exports.INITIAL_LEAD_STATUS = exports.LEAD_STATUS_VALUES = void 0;
exports.assertValidTransition = assertValidTransition;
exports.getAllowedNextStates = getAllowedNextStates;
exports.isTerminalStatus = isTerminalStatus;
exports.LEAD_STATUS_VALUES = [
    "NEW",
    "ASSIGNED",
    "CONTACTED",
    "TAGGED",
    "VISIT_REQUESTED",
    "VISIT_ASSIGNED",
    "VISIT_COMPLETED",
    "SOLD",
    "ORDER_CREATED",
    "CLOSED",
    "REJECTED",
    "INVALID",
    "WAITING_NURTURE",
    "RE_ENGAGED",
    "DORMANT",
];
exports.INITIAL_LEAD_STATUS = "NEW";
exports.ALLOWED_TRANSITIONS = {
    NEW: ["ASSIGNED", "DORMANT"],
    ASSIGNED: ["CONTACTED", "DORMANT", "DROPPED"],
    CONTACTED: ["TAGGED", "VISIT_REQUESTED", "REJECTED", "INVALID", "DORMANT"],
    TAGGED: ["VISIT_REQUESTED", "DORMANT"],
    VISIT_REQUESTED: ["VISIT_ASSIGNED", "DORMANT"],
    VISIT_ASSIGNED: ["VISIT_COMPLETED", "DORMANT"],
    VISIT_COMPLETED: ["SOLD", "WAITING_NURTURE", "DORMANT"],
    WAITING_NURTURE: ["RE_ENGAGED", "DORMANT"],
    RE_ENGAGED: ["SOLD", "DORMANT"],
    SOLD: ["ORDER_CREATED", "DORMANT"],
    ORDER_CREATED: ["CLOSED", "DORMANT"],
    CLOSED: [],
    REJECTED: [],
    INVALID: [],
    DORMANT: [],
};
function assertValidTransition(from, to) {
    if (from === to)
        return;
    const allowed = exports.ALLOWED_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {

        throw new Error(`Invalid transition: ${from} -> ${to}`);
    }
}
function getAllowedNextStates(status) {
    return exports.ALLOWED_TRANSITIONS[status] || [];
}
function isTerminalStatus(status) {
    return (exports.ALLOWED_TRANSITIONS[status] || []).length === 0;
}
