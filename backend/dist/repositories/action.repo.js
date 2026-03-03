"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionRepository = void 0;
class ActionRepository {
    async call(tx, leadId, telecallerId, disposition, notes, callDuration = null) {
        await tx.query(`INSERT INTO call_logs
     (lead_id, user_id, disposition, notes, duration_seconds)
     VALUES ($1, $2, $3, $4, $5)`, [leadId, telecallerId, disposition, notes, callDuration]);
    }
    async requestFieldVisit(tx, leadId, requestedBy, notes = null) {
        await tx.query(`INSERT INTO visit_requests
     (lead_id, requested_by, notes)
     VALUES ($1, $2, $3)`, [leadId, requestedBy, notes]);
    }
    async verify(tx, leadId, fieldExecId, gpsOk, photo, status) {
        await tx.query(`INSERT INTO visits
     (lead_id, field_exec_id, gps_checkin_ok, photo_ref, final_status, verified_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`, [leadId, fieldExecId, gpsOk, photo, status]);
    }
    async drop(tx, leadId, markedBy, reason) {
        await tx.query(`UPDATE leads
     SET drop_reason = $1,
         drop_notes = $2
     WHERE id = $3`, ["OTHER", reason, leadId]);
    }
}
exports.ActionRepository = ActionRepository;
