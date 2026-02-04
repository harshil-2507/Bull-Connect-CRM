export type LeadState =
  | "UNASSIGNED"
  | "TELE_PROSPECTING"
  | "FIELD_VISIT_PENDING"
  | "FIELD_VERIFICATION"
  | "CONVERTED"
  | "DROPPED";

export const ALLOWED_TRANSITIONS: Record<LeadState, LeadState[]> = {
  UNASSIGNED: ["TELE_PROSPECTING"],
  TELE_PROSPECTING: ["TELE_PROSPECTING", "FIELD_VISIT_PENDING", "DROPPED"],
  FIELD_VISIT_PENDING: ["FIELD_VERIFICATION"],
  FIELD_VERIFICATION: ["CONVERTED", "DROPPED"],
  CONVERTED: [],
  DROPPED: [],
};

export function assertValidTransition(from: LeadState, to: LeadState) {
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new Error(`Invalid transition: ${from} → ${to}`);
  }
}