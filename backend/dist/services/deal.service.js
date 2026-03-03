"use strict";
// backend/src/services/deal.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealService = void 0;
const transactions_1 = require("../db/transactions");
const deal_repo_1 = require("../repositories/deal.repo");
class DealService {
    constructor() {
        this.dealRepo = new deal_repo_1.DealRepository();
    }
    /**
     * Create a new Deal for a Lead
     * Does NOT change state beyond default NEW.
     */
    async createDeal(data) {
        return (0, transactions_1.withTransaction)(async (tx) => {
            const deal = await this.dealRepo.create(tx, {
                leadId: data.leadId,
                cropType: data.cropType,
                estimatedQuantity: data.estimatedQuantity,
                expectedValue: data.expectedValue,
                telecallerId: data.telecallerId,
                createdBy: data.createdBy,
            });
            return deal;
        });
    }
    /**
     * Get Deal by ID
     */
    async getDealById(dealId) {
        return (0, transactions_1.withTransaction)(async (tx) => {
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
    async getDealsByLead(leadId) {
        return (0, transactions_1.withTransaction)(async (tx) => {
            return this.dealRepo.findByLeadId(tx, leadId);
        });
    }
    /**
     * Soft deactivate a Deal
     */
    async deactivateDeal(dealId) {
        return (0, transactions_1.withTransaction)(async (tx) => {
            await tx.query(`
        UPDATE deals
        SET is_active = false,
            updated_at = NOW()
        WHERE id = $1
        `, [dealId]);
        });
    }
}
exports.DealService = DealService;
