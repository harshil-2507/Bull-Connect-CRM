// backend/src/services/dealState.service.ts

import { withTransaction } from "../db/transactions";
import { DealRepository } from "../repositories/deal.repo";
import { validateDealTransition } from "./dealStateMachine.service";
import { DealState } from "../models/deal.model";

export class DealStateService {
  private dealRepo = new DealRepository();

  /**
   * Generic transition handler
   */
  async transition(
    dealId: string,
    nextState: DealState
  ) {
    await withTransaction(async (tx) => {
      // Lock row
      const deal = await this.dealRepo.lock(tx, dealId);

      // Validate transition
      validateDealTransition(deal.status, nextState);

      // Update state
      await this.dealRepo.updateState(tx, dealId, nextState);
    });
  }

  /**
   * Assign telecaller to deal
   */
  async assignTelecaller(
  dealId: string,
  telecallerId: string
) {
  await withTransaction(async (tx) => {
    await this.dealRepo.assign(tx, dealId, telecallerId);
  });
}

  /**
   * Assign field executive to deal
   */
  async assignFieldExec(
  dealId: string,
  fieldExecId: string
) {
  await withTransaction(async (tx) => {
    await this.dealRepo.assign(tx, dealId, fieldExecId);
  });
}
}
