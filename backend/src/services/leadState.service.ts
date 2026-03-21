// backend/src/services/leadState.service.ts

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

  // ============================================================
  //  NEW: BULK ASSIGNMENT (MAIN FEATURE)
  // ============================================================
  async assignLeadsBulk(
    assignments: { leadId: string; userId: string }[],
    managerId: string
  ) {
    return withTransaction(async (tx) => {

      const leadIds = assignments.map(a => a.leadId);

      // 1. Lock all leads
      for (const leadId of leadIds) {
        await this.leadRepo.lock(tx, leadId);
      }

      // 2. Deactivate old assignments
      await this.assignRepo.deactivateExistingAssignments(tx, leadIds);

      // 3. Insert new assignments
      await this.assignRepo.createAssignments(
        tx,
        assignments.map(a => ({
          leadId: a.leadId,
          userId: a.userId,
          assignedBy: managerId
        }))
      );

      // 4. Update leads (status + assigned_to)
      await this.assignRepo.updateLeadsAssignment(tx, assignments);

      return { success: true };
    });
  }

  // ============================================================
  //  UPDATED: SINGLE ASSIGN (uses bulk internally)
  // ============================================================
  async assignTelecaller(
    leadId: string,
    telecallerId: string,
    managerId: string
  ) {
    return this.assignLeadsBulk(
      [{ leadId, userId: telecallerId }],
      managerId
    );
  }

  // ============================================================
  // 📊 GETTERS
  // ============================================================
  async getAllTeleAssignments() {
    return this.assignRepo.getAllTeleAssignments();
  }

  async getTeleAssignmentById(id: string) {
    const res = await this.assignRepo.getTeleAssignmentById(id);
    if (!res) throw new Error("Assignment not found");
    return res;
  }

  async getUnassignedLeads(campaignId: string) {
    return this.assignRepo.getUnassignedLeads(campaignId);
  }

  async getAllTelecallers() {
    return withTransaction(async (tx) => {
      const res = await tx.query(
        `SELECT id, username, name, role, phone, email
         FROM users
         WHERE role = 'TELECALLER' AND is_active = true
         ORDER BY name ASC`
      );
      return res.rows;
    });
  }

  // ============================================================
  // TELECALLER FLOW
  // ============================================================
  async getNextLeadForTelecaller(telecallerId: string) {
    return withTransaction(async (tx) => {

      const res = await tx.query(
        `
        SELECT l.*
        FROM leads l
        JOIN assignments a ON a.lead_id = l.id
        WHERE a.user_id = $1
          AND a.is_active = true
          AND l.status IN ('ASSIGNED', 'CONTACTED')
        ORDER BY a.assigned_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
        `,
        [telecallerId]
      );

      if (!res.rowCount) return null;

      return res.rows[0];
    });
  }
  // ADD THIS INSIDE LeadStateService

  async handleTelecallerCall(input: {
    leadId: string;
    userId: string;
    disposition: "NOT_INTERESTED" | "INTERESTED" | "FOLLOW_UP" | "CONTACTED";
    notes?: string;
    cropType?: string;
    acreage?: number;
    nextCallbackAt?: Date;
  }) {
    return withTransaction(async (tx) => {

      const lead = await this.leadRepo.lock(tx, input.leadId);

      if (lead.assigned_to !== input.userId) {
        throw new Error("Lead not assigned to you");
      }

      // ================= CONTACTED =================
      if (input.disposition === "CONTACTED") {
        await this.leadRepo.updateState(tx, input.leadId, "CONTACTED");
        return { status: "CONTACTED" };
      }

      // ================= FOLLOW UP =================
      if (input.disposition === "FOLLOW_UP") {
        await tx.query(
          `UPDATE leads 
         SET next_callback_at = $1,
             updated_at = NOW()
         WHERE id = $2`,
          [input.nextCallbackAt || null, input.leadId]
        );

        await this.leadRepo.updateState(tx, input.leadId, "CONTACTED");

        return { status: "CONTACTED" };
      }

      // ================= NOT INTERESTED =================
      if (input.disposition === "NOT_INTERESTED") {
        await this.leadRepo.updateState(tx, input.leadId, "CONTACTED");

        await this.actionRepo.drop(
          tx,
          input.leadId,
          input.userId,
          input.notes || "No reason"
        );

        await this.leadRepo.updateState(tx, input.leadId, "DROPPED");

        return { status: "DROPPED" };
      }

      // ================= INTERESTED =================
      if (input.disposition === "INTERESTED") {

        if (!input.cropType || !input.acreage) {
          throw new Error("INTERESTED requires cropType & acreage");
        }

        const deal = await this.dealRepo.create(tx, {
          leadId: input.leadId,
          cropType: input.cropType,
          estimatedQuantity: input.acreage,
          createdBy: input.userId,
        });

        await this.dealRepo.updateState(tx, deal.id, "CONTACTED");

        await this.leadRepo.updateState(tx, input.leadId, "CONTACTED");

        await this.actionRepo.requestFieldVisit(
          tx,
          input.leadId,
          input.userId,
          input.notes || null
        );

        await this.leadRepo.updateState(tx, input.leadId, "VISIT_REQUESTED");

        return { status: "VISIT_REQUESTED" };
      }

      throw new Error("Invalid disposition");
    });
  }
  // ============================================================
  //  CALL LOGIC (UNCHANGED BUT CLEANED)
  // ============================================================
  async call(
    leadId: string,
    telecallerId: string,
    disposition: string,
    notes: string | null,
    cropType?: string,
    acreage?: number
  ) {
    await withTransaction(async (tx) => {

      const lead = await this.leadRepo.lock(tx, leadId);

      const validDispositions = ["INTERESTED", "NOT_INTERESTED", "FOLLOW_UP"];
      if (!validDispositions.includes(disposition)) {
        throw new Error(`Invalid disposition: ${disposition}`);
      }

      await this.actionRepo.call(tx, leadId, telecallerId, disposition, notes);

      // ================= INTERESTED =================
      if (disposition === "INTERESTED") {

        if (!cropType || !acreage) {
          throw new Error("INTERESTED requires cropType & acreage");
        }

        const deal = await this.dealRepo.create(tx, {
          leadId,
          cropType,
          estimatedQuantity: acreage,
          createdBy: telecallerId,
        });

        validateDealTransition("NEW", "CONTACTED");
        await this.dealRepo.updateState(tx, deal.id, "CONTACTED");

        validateLeadTransition(lead.status, "CONTACTED");
        await this.leadRepo.updateState(tx, leadId, "CONTACTED");

        validateLeadTransition("CONTACTED", "VISIT_REQUESTED");

        await this.actionRepo.requestFieldVisit(tx, leadId, telecallerId, notes);
        await this.leadRepo.updateState(tx, leadId, "VISIT_REQUESTED");
      }

      // ================= NOT INTERESTED =================
      if (disposition === "NOT_INTERESTED") {

        if (lead.status === "ASSIGNED") {
          await this.leadRepo.updateState(tx, leadId, "CONTACTED");
        }

        validateLeadTransition("CONTACTED", "DROPPED");

        await this.actionRepo.drop(tx, leadId, telecallerId, notes ?? "No reason");
        await this.leadRepo.updateState(tx, leadId, "DROPPED");
      }

      // ================= FOLLOW UP =================
      if (disposition === "FOLLOW_UP") {
        validateLeadTransition(lead.status, "CONTACTED");
        await this.leadRepo.updateState(tx, leadId, "CONTACTED");
      }
    });
  }

  // ============================================================
  //  FIELD EXEC FLOW (UNCHANGED BUT IMPROVED)
  // ============================================================
  async assignFieldExec(
    fieldRequestId: string,
    fieldExecId: string,
    managerId: string
  ) {
    await withTransaction(async (tx) => {

      const visitRes = await tx.query(
        `SELECT lead_id FROM visit_requests WHERE id = $1 FOR UPDATE`,
        [fieldRequestId]
      );

      if (!visitRes.rowCount) throw new Error("Visit request not found");

      const leadId = visitRes.rows[0].lead_id;

      const lead = await this.leadRepo.lock(tx, leadId);
      validateLeadTransition(lead.status, "VISIT_ASSIGNED");

      const userRes = await tx.query(
        `SELECT role FROM users WHERE id = $1`,
        [fieldExecId]
      );

      if (!userRes.rowCount || userRes.rows[0].role !== "FIELD_EXEC") {
        throw new Error("Invalid Field Executive");
      }

      // deactivate old
      await this.assignRepo.deactivateExistingAssignments(tx, [leadId]);

      await this.assignRepo.createAssignments(tx, [
        { leadId, userId: fieldExecId, assignedBy: managerId }
      ]);

      await tx.query(
        `
        INSERT INTO visits
        (visit_request_id, lead_id, field_exec_id, assigned_by, status)
        VALUES ($1, $2, $3, $4, 'SCHEDULED')
        `,
        [fieldRequestId, leadId, fieldExecId, managerId]
      );

      await this.leadRepo.updateState(tx, leadId, "VISIT_ASSIGNED", fieldExecId);
    });
  }

  // ============================================================
  //  VERIFY FLOW
  // ============================================================
  async verify(
    leadId: string,
    fieldExecId: string,
    finalStatus: "SOLD" | "DROPPED",
    photoRef: string
  ) {
    await withTransaction(async (tx) => {

      const lead = await this.leadRepo.lock(tx, leadId);

      if (lead.status !== "VISIT_ASSIGNED") {
        throw new Error("Invalid state");
      }

      const dealRes = await tx.query(
        `SELECT id, status FROM deals WHERE lead_id = $1 FOR UPDATE`,
        [leadId]
      );

      if (!dealRes.rowCount) throw new Error("Deal not found");

      const deal = dealRes.rows[0];

      await this.actionRepo.verify(tx, leadId, fieldExecId, finalStatus, photoRef);

      await this.leadRepo.updateState(tx, leadId, "VISIT_COMPLETED");

      if (finalStatus === "SOLD") {
        validateDealTransition(deal.status, "SOLD");
        await this.dealRepo.updateState(tx, deal.id, "SOLD");
      } else {
        validateDealTransition(deal.status, "LOST");
        await this.dealRepo.updateState(tx, deal.id, "LOST");
      }
    });
  }

  // ============================================================
  // 📋 FIELD REQUESTS
  // ============================================================

  async getAllFieldRequests() {
    return withTransaction(async (tx) => {
      const res = await tx.query(
        `SELECT vr.id,
              vr.lead_id,
              vr.requested_by,
              vr.priority,
              vr.notes,
              vr.status,
              vr.created_at
       FROM visit_requests vr
       ORDER BY vr.created_at DESC`
      );
      return res.rows;
    });
  }

  async getFieldRequestById(id: string) {
    return withTransaction(async (tx) => {
      const res = await tx.query(
        `SELECT *
       FROM visit_requests
       WHERE id = $1`,
        [id]
      );

      if (!res.rowCount) throw new Error("Visit request not found");

      return res.rows[0];
    });
  }

  // ============================================================
  // 📋 FIELD VERIFICATIONS
  // ============================================================

  async getAllFieldVerifications() {
    return withTransaction(async (tx) => {
      const res = await tx.query(
        `SELECT *
       FROM visits
       ORDER BY completed_at DESC`
      );
      return res.rows;
    });
  }

  async getFieldVerificationById(id: string) {
    return withTransaction(async (tx) => {
      const res = await tx.query(
        `SELECT *
       FROM visits
       WHERE id = $1`,
        [id]
      );

      if (!res.rowCount) throw new Error("Visit not found");

      return res.rows[0];
    });
  }


  // ============================================================
  // 👨‍🌾 FIELD EXEC ASSIGNMENTS
  // ============================================================

  async getAssignmentsForExec(fieldExecId: string) {
    return withTransaction(async (tx) => {
      const res = await tx.query(
        `
      SELECT a.id,
             a.lead_id,
             a.user_id,
             a.assigned_by,
             a.assigned_at
      FROM assignments a
      WHERE a.user_id = $1
        AND a.is_active = true
      ORDER BY a.assigned_at DESC
      `,
        [fieldExecId]
      );

      return res.rows;
    });
  }

  async getAssignmentByIdForExec(id: string, fieldExecId: string) {
    return withTransaction(async (tx) => {
      const res = await tx.query(
        `
      SELECT a.id,
             a.lead_id,
             a.user_id,
             a.assigned_by,
             a.assigned_at
      FROM assignments a
      WHERE a.id = $1
        AND a.user_id = $2
      `,
        [id, fieldExecId]
      );

      if (!res.rowCount) {
        throw new Error("Assignment not found or not assigned to you");
      }

      return res.rows[0];
    });
  }
}