// backend/src/services/dealStateMachine.service.ts

import { DealState } from "../models/deal.model";

const allowedTransitions: Record<DealState, DealState[]> = {
  NEW: ["CONTACTED"],

  CONTACTED: [
    "VISIT_REQUESTED",
    "SOLD",       // allow direct sale after visit verification
    "LOST"
  ],

  VISIT_REQUESTED: ["VISIT_ASSIGNED"],

  VISIT_ASSIGNED: [
    "VISIT_COMPLETED",
    "SOLD",
    "LOST"
  ],

  VISIT_COMPLETED: [
    "NEGOTIATION",
    "SOLD",
    "LOST"
  ],

  NEGOTIATION: ["SOLD", "LOST"],

  SOLD: [],
  LOST: [],
  DORMANT: []
};

export function validateDealTransition(
  current: DealState,
  next: DealState
) {
  if (!allowedTransitions[current].includes(next)) {
    throw new Error(
      `Invalid deal state transition: ${current} → ${next}`
    );
  }
}