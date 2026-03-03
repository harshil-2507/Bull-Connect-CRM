import { withTransaction } from "../db/transactions";
import { LeadRepository } from "../repositories/lead.repo";
import { AssignmentRepository } from "../repositories/assignment.repo";
import { ActionRepository } from "../repositories/action.repo";
import { validateLeadTransition } from "./stateMachine.service";
import { LeadState } from "../models/lead.model";
import { DealRepository } from "../repositories/deal.repo";
import { validateDealTransition } from "./dealStateMachine.service";

export class LeadStateService {
  private leadRepo = new LeadRepository();
  private assignRepo = new AssignmentRepository();
  private actionRepo = new ActionRepository();
  private dealRepo = new DealRepository();

  async assignTelecaller(leadId: string, telecallerId: string, managerId: string) {
    await withTransaction(async (tx) => {
      const lead = await this.leadRepo.lock(tx, leadId);
      validateLeadTransition(lead.status, "ASSIGNED");

      const res = await tx.query(`SELECT id, role FROM users WHERE id = $1`, [telecallerId]);
      if (!res.rowCount) throw new Error("Telecaller not found");
      if (res.rows[0].role !== "TELECALLER") throw new Error("User is not a telecaller");

      await this.assignRepo.assignTelecaller(tx, leadId, telecallerId, managerId);
      await this.leadRepo.updateState(tx, leadId, "ASSIGNED", telecallerId);
    });
  }

  async getAllTeleAssignments() {
    const res = await this.assignRepo.getAllTeleAssignments();
    return res;
  }

  async getTeleAssignmentById(id: string) {
    const res = await this.assignRepo.getTeleAssignmentById(id);
    if (!res) throw new Error("Assignment not found");
    return res;
  }

  async getNextLeadForTelecaller(telecallerId: string) {
    return withTransaction(async (tx) => {
      // Find the next lead assigned to this telecaller that is not yet called
      const res = await tx.query(
        `
        SELECT l.id, l.farmer_name, l.phone_number, l.village, l.taluka, l.district, l.state, l.status
        FROM leads l
        JOIN assignments t ON t.lead_id = l.id
        WHERE t.user_id = $1
          AND l.status IN ('NEW', 'CALLBACK_SCHEDULED')
        ORDER BY t.assigned_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
        `,
        [telecallerId]
      );

      if (!res.rowCount) return null;

      const lead = res.rows[0] as {
        id: string;
        name: string;
        phone: string;
        taluka: string | null;
        district: string | null;
        geo_state: string | null;
        status: LeadState;
      };

      // Lock + update the lead state to TELE_PROSPECTING if it was UNASSIGNED
      if (lead.status === "NEW") {
        validateLeadTransition("NEW", "ASSIGNED");
        await this.leadRepo.updateState(tx, lead.id, "ASSIGNED");
        lead.status = "ASSIGNED";
      }

      return lead;
    });
  }

  async call(
    leadId: string,
    telecallerId: string,
    disposition: string,
    notes: string | null
  ) {
    await withTransaction(async (tx) => {
      const lead = await this.leadRepo.lock(tx, leadId);

      const validDispositions = ["INTERESTED", "NOT_INTERESTED", "FOLLOW_UP"];
      if (!validDispositions.includes(disposition)) {
        throw new Error(`Invalid disposition: ${disposition}`);
      }

      // Always log call
      await this.actionRepo.call(tx, leadId, telecallerId, disposition, notes);
      if (disposition === "INTERESTED") {

        //   Create Deal inside SAME transaction
        const deal = await this.dealRepo.create(tx, {
          leadId: leadId,
          createdBy: telecallerId,
        });

        //   Move Deal from NEW → CONTACTED
        validateDealTransition("NEW", "CONTACTED");
        await this.dealRepo.updateState(tx, deal.id, "CONTACTED");

        //  % Continue existing Lead lifecycle (unchanged)

        validateLeadTransition(lead.status, "CONTACTED");
        await this.leadRepo.updateState(tx, leadId, "CONTACTED");

        validateLeadTransition("CONTACTED", "VISIT_REQUESTED");

        await this.actionRepo.requestFieldVisit(
          tx,
          leadId,
          telecallerId,
          notes
        );

        await this.leadRepo.updateState(tx, leadId, "VISIT_REQUESTED");
      }

      if (disposition === "NOT_INTERESTED") {
        // If the lead is still ASSIGNED, promote it to CONTACTED first
        // (some state-machine implementations require DROP only from CONTACTED)
        if (lead.status === "ASSIGNED") {
          validateLeadTransition("ASSIGNED", "CONTACTED");
          await this.leadRepo.updateState(tx, leadId, "CONTACTED");
          lead.status = "CONTACTED" as LeadState;
        }

        validateLeadTransition(lead.status, "DROPPED");

        await this.actionRepo.drop(tx, leadId, telecallerId, notes ?? "No reason provided");
        await this.leadRepo.updateState(tx, leadId, "DROPPED");
      }

      if (disposition === "FOLLOW_UP") {
        validateLeadTransition(lead.status, "CONTACTED");
        await this.leadRepo.updateState(tx, leadId, "CONTACTED");
      }
    });
  }

  /**
  * Get all Field Requests
  */
  async getAllFieldRequests() {
    return withTransaction(async (tx) => {
      const res = await tx.query(
        `SELECT vr.id, vr.lead_id, vr.requested_by, vr.primary_crop, vr.requested_at
       FROM visit_requests vr
       ORDER BY vr.requested_at DESC`
      );
      return res.rows;
    });
  }

  /**
   * Get Field Request by ID
   */
  async getFieldRequestById(id: string) {
    return withTransaction(async (tx) => {
      const res = await tx.query(
        `SELECT vr.id, vr.lead_id, vr.requested_by, vr.primary_crop, vr.requested_at
       FROM visit_requests vr
       WHERE vr.id = $1`,
        [id]
      );

      if (!res.rowCount) throw new Error("Visit request not found");
      return res.rows[0];
    });
  }

  /**
   * Get all Field Verifications
   */
  async getAllFieldVerifications() {
    return withTransaction(async (tx) => {
      const res = await tx.query(
        `SELECT v.id, v.lead_id, v.field_exec_id, v.gps_checkin_ok, v.photo_ref, v.final_status, v.verified_at
       FROM visits v
       ORDER BY v.verified_at DESC`
      );
      return res.rows;
    });
  }

  /**
   * Get Field Verification by ID
   */
  async getFieldVerificationById(id: string) {
    return withTransaction(async (tx) => {
      const res = await tx.query(
        `SELECT v.id, v.lead_id, v.field_exec_id, v.gps_checkin_ok, v.photo_ref, v.final_status, v.verified_at
       FROM visits v
       WHERE v.id = $1`,
        [id]
      );

      if (!res.rowCount) throw new Error("Visit not found");
      return res.rows[0];
    });
  }

  async assignFieldExec(
    fieldRequestId: string,
    fieldExecId: string,
    managerId: string
  ) {
    await withTransaction(async (tx) => {
      await this.assignRepo.assignFieldExec(
        tx,
        fieldRequestId,
        fieldExecId,
        managerId
      );
    });
  }

  async verify(
    leadId: string,
    fieldExecId: string,
    status: "CONVERTED" | "DROPPED",
    photo: string
  ) {
    await withTransaction(async (tx) => {
      const lead = await this.leadRepo.lock(tx, leadId);
      validateLeadTransition(lead.status, status === "CONVERTED" ? "VISIT_COMPLETED" : "DROPPED");

      await this.actionRepo.verify(
        tx,
        leadId,
        fieldExecId,
        true,
        photo,
        status
      );

      await this.leadRepo.updateState(tx, leadId, status === "CONVERTED" ? "VISIT_COMPLETED" : "DROPPED");
    });
  }

  /**
  * Get all assignments for a Field Exec
  */
  async getAssignmentsForExec(fieldExecId: string) {
    return withTransaction(async (tx) => {
      const res = await tx.query(
        `SELECT a.id, a.lead_id, a.user_id, a.assigned_by, a.assigned_at
       FROM assignments a
       WHERE a.user_id = $1
       ORDER BY a.assigned_at DESC`,
        [fieldExecId]
      );

      return res.rows;
    });
  }

  // get all telecallers

  async getAllTelecallers() {
    return withTransaction(async (tx) => {
      const res = await tx.query(
        `SELECT id, username, name, role, phone, email, created_at
         FROM users
         WHERE role = 'TELECALLER'
         ORDER BY name ASC`
      );

      return res.rows;
    });
  }

  /**
   * Get a specific assignment by ID for a Field Exec
   */
  async getAssignmentByIdForExec(id: string, fieldExecId: string) {
    return withTransaction(async (tx) => {
      const res = await tx.query(
        `SELECT a.id,
              a.lead_id,
              a.user_id,
              a.assigned_by,
              a.assigned_at
       FROM assignments a
       WHERE a.id = $1
         AND a.user_id = $2`,
        [id, fieldExecId]
      );

      if (!res.rowCount) {
        throw new Error("Assignment not found or not assigned to you");
      }

      return res.rows[0];
    });
  }
}