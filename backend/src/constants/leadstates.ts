/**
 * Canonical lead states (single source of truth) — aligned with PRD
 */

export type LeadStatus =
  | "NEW"
  | "ASSIGNED"
  | "CONTACTED"
  | "TAGGED"
  | "VISIT_REQUESTED"
  | "VISIT_ASSIGNED"
  | "VISIT_COMPLETED"
  | "SOLD"
  | "ORDER_CREATED"
  | "CLOSED"
  | "REJECTED"
  | "INVALID"
  | "WAITING_NURTURE"
  | "RE_ENGAGED"
  | "DORMANT";

export const LEAD_STATUS_VALUES: LeadStatus[] = [
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

export const INITIAL_LEAD_STATUS: LeadStatus = "NEW";

export const ALLOWED_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ["ASSIGNED", "DORMANT"],
  ASSIGNED: ["CONTACTED", "DORMANT"],
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

export function assertValidTransition(from: LeadStatus, to: LeadStatus) {
  if (from === to) return;
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid transition: ${from} -> ${to}`);
  }
}

export function getAllowedNextStates(status: LeadStatus): LeadStatus[] {
  return ALLOWED_TRANSITIONS[status] || [];
}

export function isTerminalStatus(status: LeadStatus): boolean {
  return (ALLOWED_TRANSITIONS[status] || []).length === 0;
}
