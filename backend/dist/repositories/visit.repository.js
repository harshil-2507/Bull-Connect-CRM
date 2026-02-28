"use strict";
// backend/src/repositories/visit.repository.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitRepository = void 0;
const db_1 = require("../config/db");
class VisitRepository {
    async create(tx, data) {
        const res = await tx.query(`
      INSERT INTO visits (
        visit_request_id,
        lead_id,
        field_exec_id,
        assigned_by,
        scheduled_at
      )
      SELECT
        vr.id,
        vr.lead_id,
        $1,
        $2,
        $3
      FROM visit_requests vr
      WHERE vr.id = $4
      RETURNING *
      `, [
            data.fieldExecId,
            data.assignedBy,
            data.scheduledAt ?? null,
            data.visitRequestId,
        ]);
        return this.mapRow(res.rows[0]);
    }
    async updateStatus(tx, visitId, status) {
        await tx.query(`
      UPDATE visits
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      `, [status, visitId]);
    }
    async completeVisit(tx, visitId, outcome, outcomeNotes, endLat, endLng) {
        await tx.query(`
      UPDATE visits
      SET
        status = 'COMPLETED',
        outcome = $1,
        outcome_notes = $2,
        completed_at = NOW(),
        end_lat = $3,
        end_lng = $4,
        updated_at = NOW()
      WHERE id = $5
      `, [
            outcome,
            outcomeNotes ?? null,
            endLat ?? null,
            endLng ?? null,
            visitId,
        ]);
    }
    async findById(id) {
        const res = await db_1.pool.query(`SELECT * FROM visits WHERE id = $1`, [id]);
        if (!res.rows.length)
            return null;
        return this.mapRow(res.rows[0]);
    }
    mapRow(row) {
        return {
            id: row.id,
            visitRequestId: row.visit_request_id,
            leadId: row.lead_id,
            fieldExecId: row.field_exec_id,
            assignedBy: row.assigned_by,
            scheduledAt: row.scheduled_at,
            startedAt: row.started_at,
            completedAt: row.completed_at,
            startLat: row.start_lat,
            startLng: row.start_lng,
            endLat: row.end_lat,
            endLng: row.end_lng,
            status: row.status,
            outcome: row.outcome,
            outcomeNotes: row.outcome_notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
exports.VisitRepository = VisitRepository;
