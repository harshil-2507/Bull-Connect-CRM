// backend/src/models/visit.model.ts

export type VisitStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type VisitOutcome =
  | "SOLD"
  | "WAITING"
  | "DROPPED"
  | "QUALITY_REJECTED";

export interface Visit {
  id: string;
  visitRequestId: string;
  leadId: string;
  fieldExecId: string;
  assignedBy: string;

  scheduledAt?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;

  startLat?: number | null;
  startLng?: number | null;
  endLat?: number | null;
  endLng?: number | null;

  status: VisitStatus;

  outcome?: VisitOutcome | null;
  outcomeNotes?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for ground manager assigning visit
 */
export interface AssignVisitDTO {
  visitRequestId: string;
  fieldExecId: string;
  assignedBy: string;
  scheduledAt?: Date;
}

/**
 * DTO for completing visit
 */
export interface CompleteVisitDTO {
  visitId: string;
  outcome: VisitOutcome;
  outcomeNotes?: string;
  endLat?: number;
  endLng?: number;
}