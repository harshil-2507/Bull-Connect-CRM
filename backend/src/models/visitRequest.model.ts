// backend/src/models/visitRequest.model.ts

export type VisitRequestStatus =
  | "PENDING"
  | "ASSIGNED"
  | "CANCELLED";

export interface VisitRequest {
  id: string;
  leadId: string;
  requestedBy: string;
  priority: number;
  notes?: string | null;
  status: VisitRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO when telecaller requests visit
 */
export interface CreateVisitRequestDTO {
  leadId: string;
  requestedBy: string;
  notes?: string;
  priority?: number;
}