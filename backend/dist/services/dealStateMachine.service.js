"use strict";
// backend/src/services/dealStateMachine.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDealTransition = validateDealTransition;
const transitions = {
    NEW: ["CONTACTED", "LOST"],
    CONTACTED: ["VISIT_REQUESTED", "LOST"],
    VISIT_REQUESTED: ["VISIT_ASSIGNED", "LOST"],
    VISIT_ASSIGNED: ["VISIT_COMPLETED", "LOST"],
    VISIT_COMPLETED: ["NEGOTIATION", "SOLD", "LOST"],
    NEGOTIATION: ["SOLD", "LOST"],
    SOLD: [],
    LOST: [],
    DORMANT: ["CONTACTED"],
};
function validateDealTransition(current, next) {
    if (!transitions[current].includes(next)) {
        throw new Error(`Invalid deal state transition: ${current} → ${next}`);
    }
}
