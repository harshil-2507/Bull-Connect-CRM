// backend/src/services/deal.service.ts

import { withTransaction } from "../db/transactions";
import { DealRepository } from "../repositories/deal.repo";
import { CreateDealDTO } from "../models/deal.model";

export class DealService {
  private dealRepo = new DealRepository();

  /**
   * Create a new Deal for a Lead
   * Does NOT change state beyond default NEW.
   */
  async createDeal(data: CreateDealDTO) {
    return withTransaction(async (tx) => {
      const deal = await this.dealRepo.create(tx, {
        leadId: data.leadId,
        cropType: data.cropType,
        estimatedQuantity: data.estimatedQuantity,
        expectedValue: data.expectedValue,
        createdBy: data.createdBy,
      });

      return deal;
    });
  }

  /**
   * Get Deal by ID
   */
  async getDealById(dealId: string) {
    return withTransaction(async (tx) => {
      const deal = await this.dealRepo.findById(tx, dealId);

      if (!deal) {
        throw new Error("Deal not found");
      }

      return deal;
    });
  }

  /**
   * Get all Deals for a specific Lead
   */
  async getDealsByLead(leadId: string) {
    return withTransaction(async (tx) => {
      return this.dealRepo.findByLeadId(tx, leadId);
    });
  }

  /**
   * Soft deactivate a Deal
   */
  async deactivateDeal(dealId: string) {
    return withTransaction(async (tx) => {
      await tx.query(
        `
        UPDATE deals
        SET is_active = false,
            updated_at = NOW()
        WHERE id = $1
        `,
        [dealId]
      );
    });
  }
}