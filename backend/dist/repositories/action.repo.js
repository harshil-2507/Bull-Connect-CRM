"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionRepository = void 0;
class ActionRepository {
    async call(tx, leadId, telecallerId, disposition, notes, callDuration = null // optional, add if you want to track duration
    ) {
        await tx.query(`INSERT INTO call_logs
      (lead_id, user_id, outcome, notes, call_duration)
      VALUES ($1, $2, $3, $4, $5)`, [leadId, telecallerId, disposition, notes, callDuration]);
    }
    async requestFieldVisit(tx, leadId, requestedBy, crop) {
        await tx.query(`INSERT INTO field_requests
        (lead_id, requested_by, primary_crop)
        VALUES ($1,$2,$3)`, [leadId, requestedBy, crop]);
    }
    async verify(tx, leadId, fieldExecId, gpsOk, photo, status) {
        await tx.query(`INSERT INTO field_verifications
        (lead_id, field_exec_id, gps_checkin_ok, photo_ref, final_status)
        VALUES ($1,$2,$3,$4,$5)`, [leadId, fieldExecId, gpsOk, photo, status]);
    }
    async drop(tx, leadId, markedBy, reason) {
        await tx.query(`INSERT INTO drop_reasons (lead_id, marked_by, reason)
        VALUES ($1,$2,$3)`, [leadId, markedBy, reason]);
    }
}
exports.ActionRepository = ActionRepository;
