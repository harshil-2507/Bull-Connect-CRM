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

  async call(
    leadId: string,
    telecallerId: string,
    disposition: string,
    notes: string | null
  ) {
    await withTransaction(async (tx) => {
      const lead = await this.leadRepo.lock(tx, leadId);

      if (disposition === "INTERESTED") {
        assertValidTransition(lead.lead_status, "FIELD_VISIT_PENDING");
        await this.actionRepo.call(tx, leadId, telecallerId, disposition, notes);
        await this.leadRepo.updateState(tx, leadId, "FIELD_VISIT_PENDING");
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