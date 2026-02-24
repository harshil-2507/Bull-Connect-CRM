// backend/src/services/leadStateMachine.ts

import { LeadState } from "../models/lead.model";

export const ALLOWED_TRANSITIONS: Record<LeadState, LeadState[]> = {
  NEW: ["ASSIGNED"],
  ASSIGNED: ["CONTACTED", "DROPPED"],
  CONTACTED: ["VISIT_REQUESTED", "DROPPED"],
  VISIT_REQUESTED: ["VISIT_ASSIGNED", "DROPPED"],
  VISIT_ASSIGNED: ["VISIT_COMPLETED"],
  VISIT_COMPLETED: ["SOLD", "DROPPED"],
  SOLD: [],
  DROPPED: [],
};

export function assertValidTransition(from: LeadState, to: LeadState) {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new Error(`Invalid transition: ${from} → ${to}`);
  }
}