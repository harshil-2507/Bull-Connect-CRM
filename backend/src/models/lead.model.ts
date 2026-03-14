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

  farmerName: string;
  phoneNumber: string;
  alternatePhone?: string | null;   // NEW
  farmerId?: string | null;         // NEW

  farmerType?: string | null;
  bullCentre?: string | null;

  village: string | null;
  taluka: string | null;
  district: string | null;
  state: string | null;

  source?: string | null;           // NEW
  productType?: string | null;      // NEW

  cropType?: string | null;
  estimatedQuantity?: number | null;

  totalLandBigha?: number | null;
  interestedInWarehouse?: boolean | null;
  previousExperience?: boolean | null;

  experienceOrRemarks?: string | null; // NEW

  // CASTOR
  castorBori?: number | null;
  castorExpectedPrice?: number | null;
  castorOfferedPrice?: number | null;
  castorExpectedHarvestTime?: Date | null;
  castorVavetarBigha?: number | null;
  castorDealStatus?: string | null;
  castorIntentToSell?: string | null;

  // GROUNDNUT
  groundnutBori?: number | null;
  groundnutExpectedPrice?: number | null;
  groundnutOfferedPrice?: number | null;
  groundnutExpectedHarvestTime?: Date | null;
  groundnutVavetarBigha?: number | null;
  groundnutIntentToSell?: string | null;

  status: LeadState;

  telecallerId?: string | null;
  fieldExecId?: string | null;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
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
