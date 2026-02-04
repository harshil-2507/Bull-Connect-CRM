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

  async assignTelecaller(leadId: string, telecallerId: string) {
    await withTransaction(async (tx) => {
      const lead = await this.leadRepo.lock(tx, leadId);
      assertValidTransition(lead.state, "TELE_PROSPECTING");

      await this.assignRepo.assignTelecaller(tx, leadId, telecallerId);
      await this.leadRepo.updateState(tx, leadId, "TELE_PROSPECTING");
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

      if (disposition === "INTERESTED") {
        assertValidTransition(lead.state, "FIELD_VISIT_PENDING");
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
      assertValidTransition(lead.state, status);

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