import { withTransaction } from "../db/transactions";
import { LeadRepository } from "../repositories/lead.repo";
import { AssignmentRepository } from "../repositories/assignment.repo";
import { ActionRepository } from "../repositories/action.repo";
import {
  LeadState,
  assertValidTransition,
} from "./leadStateMachine";

export class LeadStateService {
  private leadRepo = new LeadRepository();
  private assignRepo = new AssignmentRepository();
  private actionRepo = new ActionRepository();

  async assignTelecaller(leadId: string, telecallerId: string, managerId: string) {
    await withTransaction(async (tx) => {
      const lead = await this.leadRepo.lock(tx, leadId);
      assertValidTransition(lead.lead_status, "TELE_PROSPECTING");

      const res = await tx.query(`SELECT id, role FROM users WHERE id = $1`, [telecallerId]);
      if (!res.rowCount) throw new Error("Telecaller not found");
      if (res.rows[0].role !== "TELECALLER") throw new Error("User is not a telecaller");

      await this.assignRepo.assignTelecaller(tx, leadId, telecallerId, managerId);
      await this.leadRepo.updateState(tx, leadId, "TELE_PROSPECTING");
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
        SELECT l.id, l.name, l.phone, l.taluka, l.district, l.geo_state, l.lead_status
        FROM leads l
        JOIN tele_assignments t ON t.lead_id = l.id
        WHERE t.user_id = $1
          AND l.lead_status IN ('UNASSIGNED', 'TELE_PROSPECTING')
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
        lead_status: LeadState;
      };

      // Lock + update the lead state to TELE_PROSPECTING if it was UNASSIGNED
      if (lead.lead_status === "UNASSIGNED") {
        assertValidTransition("UNASSIGNED", "TELE_PROSPECTING");
        await this.leadRepo.updateState(tx, lead.id, "TELE_PROSPECTING");
        lead.lead_status = "TELE_PROSPECTING";
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

    // 1️⃣ Always log call
    await this.actionRepo.call(tx, leadId, telecallerId, disposition, notes);

    // 2️⃣ Handle transitions
    if (disposition === "INTERESTED") {
      assertValidTransition(lead.lead_status, "FIELD_VISIT_PENDING");

      // 🔥 Create field request entry
      await this.actionRepo.requestFieldVisit(
        tx,
        leadId,
        telecallerId,
        "UNKNOWN" // we can improve this later
      );

      await this.leadRepo.updateState(tx, leadId, "FIELD_VISIT_PENDING");
    }

    if (disposition === "NOT_INTERESTED") {
      assertValidTransition(lead.lead_status, "DROPPED");
      await this.leadRepo.updateState(tx, leadId, "DROPPED");
    }

    if (disposition === "FOLLOW_UP") {
      assertValidTransition(lead.lead_status, "TELE_PROSPECTING");
    }
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
      assertValidTransition(lead.lead_status, status);

      await this.actionRepo.verify(
        tx,
        leadId,
        fieldExecId,
        true,
        photo,
        status
      );

      await this.leadRepo.updateState(tx, leadId, status);
    });
  }
}