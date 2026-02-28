"use strict";
// backend/src/services/leadStateMachine.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_TRANSITIONS = void 0;
exports.ValidLeadTransition = ValidLeadTransition;
exports.assertValidTransition = assertValidTransition;
exports.ALLOWED_TRANSITIONS = {
    NEW: ["ASSIGNED"],
    ASSIGNED: ["CONTACTED", "DROPPED"],
    CONTACTED: ["VISIT_REQUESTED", "DROPPED"],
    VISIT_REQUESTED: ["VISIT_ASSIGNED", "DROPPED"],
    VISIT_ASSIGNED: ["VISIT_COMPLETED"],
    VISIT_COMPLETED: ["SOLD", "DROPPED"],
    SOLD: [],
    DROPPED: [],
};
function ValidLeadTransition(from, to) {
    const allowed = exports.ALLOWED_TRANSITIONS[from];
    if (!allowed) {
        throw new Error(`Invalid current state: ${from}. No transitions defined.`);
    }
    if (!allowed.includes(to)) {
        throw new Error(`Invalid transition: ${from} → ${to}`);
    }
}
// backward-compatible alias
function assertValidTransition(from, to) {
    return ValidLeadTransition(from, to);
}
