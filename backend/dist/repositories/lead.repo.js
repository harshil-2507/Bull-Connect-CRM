"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadRepository = void 0;
class LeadRepository {
    async lock(tx, leadId) {
        const res = await tx.query(`SELECT id, status FROM leads WHERE id = $1 FOR UPDATE`, [leadId]);
        if (!res.rowCount)
            throw new Error("Lead not found");
        return res.rows[0]; // { id: string; status: LeadState }
    }
    // backend/src/repositories/lead.repo.ts
    async updateState(tx, leadId, state, assignedTo) {
        if (assignedTo) {
            await tx.query(`UPDATE leads SET status = $1, assigned_to = $2 WHERE id = $3`, [state, assignedTo, leadId]);
        }
        else {
            await tx.query(`UPDATE leads SET status = $1 WHERE id = $2`, [state, leadId]);
        }
    }
}
exports.LeadRepository = LeadRepository;
