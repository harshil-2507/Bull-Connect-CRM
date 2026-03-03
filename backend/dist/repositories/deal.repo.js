"use strict";
// backend/src/repositories/deal.repo.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealRepository = void 0;
class DealRepository {
    async lock(tx, dealId) {
        const res = await tx.query(`SELECT id, status FROM deals WHERE id = $1 FOR UPDATE`, [dealId]);
        if (!res.rowCount)
            throw new Error("Deal not found");
        return res.rows[0];
    }
    async updateState(tx, dealId, state) {
        await tx.query(`UPDATE deals
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2`, [state, dealId]);
    }
    async create(tx, data) {
        const res = await tx.query(`
      INSERT INTO deals (
        lead_id,
        crop_type,
        estimated_quantity,
        expected_value,
        status,
        telecaller_id,
        created_by,
        is_active
      )
      VALUES ($1, $2, $3, $4, 'NEW', $5, $6, true)
      RETURNING *
      `, [
            data.leadId,
            data.cropType ?? null,
            data.estimatedQuantity ?? null,
            data.expectedValue ?? null,
            data.telecallerId ?? null,
            data.createdBy ?? null,
        ]);
        return res.rows[0];
    }
    async findById(tx, dealId) {
        const res = await tx.query(`SELECT * FROM deals WHERE id = $1`, [dealId]);
        if (!res.rowCount)
            return null;
        return res.rows[0];
    }
    async findByLeadId(tx, leadId) {
        const res = await tx.query(`SELECT *
       FROM deals
       WHERE lead_id = $1
       ORDER BY created_at DESC`, [leadId]);
        return res.rows;
    }
    async assign(tx, dealId, userId) {
        await tx.query(`
    UPDATE deals
    SET assigned_to = $1,
        updated_at = NOW()
    WHERE id = $2
    `, [userId, dealId]);
    }
}
exports.DealRepository = DealRepository;
