"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadRepository = void 0;
class LeadRepository {
    async lock(tx, leadId) {
        const res = await tx.query(`SELECT id, lead_status FROM leads WHERE id = $1 FOR UPDATE`, [leadId]);
        if (!res.rowCount)
            throw new Error("Lead not found");
        return res.rows[0]; // { id: string; lead_status: LeadState }
    }
    async updateState(tx, leadId, state) {
        await tx.query(`UPDATE leads SET lead_status = $1 WHERE id = $2`, [state, leadId]);
    }
}
exports.LeadRepository = LeadRepository;
