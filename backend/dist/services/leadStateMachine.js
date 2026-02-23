"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_TRANSITIONS = void 0;
exports.assertValidTransition = assertValidTransition;
exports.ALLOWED_TRANSITIONS = {
    UNASSIGNED: ["TELE_PROSPECTING"],
    TELE_PROSPECTING: ["TELE_PROSPECTING", "FIELD_VISIT_PENDING", "DROPPED"],
    FIELD_VISIT_PENDING: ["FIELD_VERIFICATION"],
    FIELD_VERIFICATION: ["CONVERTED", "DROPPED"],
    CONVERTED: [],
    DROPPED: [],
};
function assertValidTransition(from, to) {
    if (!exports.ALLOWED_TRANSITIONS[from].includes(to)) {
        throw new Error(`Invalid transition: ${from} → ${to}`);
    }
}
