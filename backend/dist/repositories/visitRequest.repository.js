"use strict";
// backend/src/repositories/visitRequest.repository.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitRequestRepository = void 0;
const db_1 = require("../config/db");
class VisitRequestRepository {
    async create(tx, data) {
        const res = await tx.query(`
      INSERT INTO visit_requests (
        lead_id,
        requested_by,
        priority,
        notes
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `, [
            data.leadId,
            data.requestedBy,
            data.priority ?? 1,
            data.notes ?? null,
        ]);
        return this.mapRow(res.rows[0]);
    }
    async updateStatus(tx, id, status) {
        await tx.query(`
      UPDATE visit_requests
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      `, [status, id]);
    }
    async findById(id) {
        const res = await db_1.pool.query(`SELECT * FROM visit_requests WHERE id = $1`, [id]);
        if (!res.rows.length)
            return null;
        return this.mapRow(res.rows[0]);
    }
    mapRow(row) {
        return {
            id: row.id,
            leadId: row.lead_id,
            requestedBy: row.requested_by,
            priority: row.priority,
            notes: row.notes,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
exports.VisitRequestRepository = VisitRequestRepository;
