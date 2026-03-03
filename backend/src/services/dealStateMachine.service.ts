// backend/src/services/dealStateMachine.service.ts

import { DealState } from "../models/deal.model";

const transitions: Record<DealState, DealState[]> = {
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

export function validateDealTransition(
  current: DealState,
  next: DealState
) {
  if (!transitions[current].includes(next)) {
    throw new Error(
      `Invalid deal state transition: ${current} → ${next}`
    );
  }
}