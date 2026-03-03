// backend/src/models/lead.model.ts

/**
 * Lead lifecycle states — single source of truth.
 * This MUST match:
 *  - Database enum / constraint
 *  - leadStateMachine.ts
 */
export type LeadState =
  | "NEW"
  | "ASSIGNED"
  | "CONTACTED"
  | "VISIT_REQUESTED"
  | "VISIT_ASSIGNED"
  | "VISIT_COMPLETED"
  | "SOLD"
  | "DROPPED";

/**
 * Lead acquisition source
 */
export type LeadSource =
  | "COLD"        // CSV upload
  | "WARM"        // Inbound call
  | "SCOUT"       // Field discovery
  | "REFERRAL";

/**
 * Primary Lead Entity
 * Represents a single farmer in pipeline
 */
export interface Lead {
  id: string;

  // Farmer Info
  farmerName: string;
  phoneNumber: string;
  farmerType?: string | null;         //  NEW

  // Location Info
  village: string | null;
  taluka: string | null;
  district: string | null;
  state: string | null;
  bullCentre?: string | null;         // NEW

  // Business Info
  cropType?: string | null;           // keep existing
  estimatedQuantity?: number | null;  // keep existing
  totalLandBigha?: number | null;     //  NEW
  interestedInWarehouse?: boolean | null;  // NEW
  previousExperience?: string | null;      //  NEW

  // Lifecycle
  status: LeadState;
  source: LeadSource;

  // Assignment Info
  telecallerId?: string | null;
  fieldExecId?: string | null;

  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for creating a lead
 */
export interface CreateLeadDTO {
  farmerName: string;
  phoneNumber: string;
  farmerType?: string;              //  NEW

  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  bullCentre?: string;              //  NEW

  cropType?: string;
  estimatedQuantity?: number;

  totalLandBigha?: number;          //  NEW
  interestedInWarehouse?: boolean;  //  NEW
  previousExperience?: string;      //  NEW

  source: LeadSource;
}

/**
 * DTO for updating lead details (NOT status transitions)
 */
export interface UpdateLeadDTO {
  farmerName?: string;
  phoneNumber?: string;
  farmerType?: string;              //  NEW

  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  bullCentre?: string;              //  NEW

  cropType?: string;
  estimatedQuantity?: number;

  totalLandBigha?: number;          //  NEW
  interestedInWarehouse?: boolean;  // NEW
  previousExperience?: string;      // NEW

  isActive?: boolean;
}
