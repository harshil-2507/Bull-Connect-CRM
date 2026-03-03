"use strict";
// backend/src/services/dealState.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealStateService = void 0;
const transactions_1 = require("../db/transactions");
const deal_repo_1 = require("../repositories/deal.repo");
const dealStateMachine_service_1 = require("./dealStateMachine.service");
class DealStateService {
    constructor() {
        this.dealRepo = new deal_repo_1.DealRepository();
    }
    /**
     * Generic transition handler
     */
    async transition(dealId, nextState) {
        await (0, transactions_1.withTransaction)(async (tx) => {
            // Lock row
            const deal = await this.dealRepo.lock(tx, dealId);
            // Validate transition
            (0, dealStateMachine_service_1.validateDealTransition)(deal.status, nextState);
            // Update state
            await this.dealRepo.updateState(tx, dealId, nextState);
        });
    }
    /**
     * Assign telecaller to deal
     */
    async assignTelecaller(dealId, telecallerId) {
        await (0, transactions_1.withTransaction)(async (tx) => {
            await this.dealRepo.assign(tx, dealId, telecallerId);
        });
    }
    /**
     * Assign field executive to deal
     */
    async assignFieldExec(dealId, fieldExecId) {
        await (0, transactions_1.withTransaction)(async (tx) => {
            await this.dealRepo.assign(tx, dealId, fieldExecId);
        });
    }
}
exports.DealStateService = DealStateService;
