// backend/src/models/deal.model.ts

/**
 * Deal lifecycle states — separate from LeadState.
 * Represents a single commercial opportunity.
 */
export type DealState =
  | "NEW"
  | "CONTACTED"
  | "VISIT_REQUESTED"
  | "VISIT_ASSIGNED"
  | "VISIT_COMPLETED"
  | "NEGOTIATION"
  | "SOLD"
  | "LOST"
  | "DORMANT";

/**
 * Deal Entity
 * One Lead can have multiple Deals.
 */
export interface Deal {
  id: string;

  // Relationship
  leadId: string;

  // Business Context
  cropType: string | null;
  estimatedQuantity: number | null;
  expectedValue: number | null;

  // Lifecycle
  status: DealState;

  // Assignment
  telecallerId?: string | null;
  fieldExecId?: string | null;

  // Closure
  closedReason?: string | null;
  closedAt?: Date | null;

  // Metadata
  createdBy?: string | null;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for creating a Deal
 */
export interface CreateDealDTO {
  leadId: string;

  cropType?: string;
  estimatedQuantity?: number;
  expectedValue?: number;

  telecallerId?: string;
  createdBy: string;
}

/**
 * DTO for updating Deal details (NOT status transitions)
 */
export interface UpdateDealDTO {
  cropType?: string;
  estimatedQuantity?: number;
  expectedValue?: number;

  telecallerId?: string;
  fieldExecId?: string;

  isActive?: boolean;
}