import { withTransaction } from "../db/transactions";
import { ActionRepository } from "../repositories/action.repo";
import { LeadRepository } from "../repositories/lead.repo";

export class LeadStateService {
  private actionRepo = new ActionRepository();
  private leadRepo = new LeadRepository();

  /**
   * Telecaller marks a lead as INTERESTED
   * Automatically moves lead to FIELD_VISIT_PENDING
   */
  async markInterested(
    leadId: string,
    telecallerId: string,
    notes: string
  ) {
    return withTransaction(async (tx) => {
      await this.actionRepo.createCallAction(
        tx,
        leadId,
        telecallerId,
        "INTERESTED",
        notes
      );

      await this.leadRepo.updateState(
        tx,
        leadId,
        "FIELD_VISIT_PENDING"
      );
    });
  }
}