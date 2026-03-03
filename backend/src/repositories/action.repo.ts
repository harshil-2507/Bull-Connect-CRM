import { PoolClient } from "pg";

export class ActionRepository {
  async call(
    tx: PoolClient,
    leadId: string,
    telecallerId: string,
    disposition: string,
    notes: string | null,
    callDuration: number | null = null
  ) {
    await tx.query(
      `INSERT INTO call_logs
     (lead_id, user_id, disposition, notes, duration_seconds)
     VALUES ($1, $2, $3, $4, $5)`,
      [leadId, telecallerId, disposition, notes, callDuration]
    );
  }

  async requestFieldVisit(
    tx: PoolClient,
    leadId: string,
    requestedBy: string,
    notes: string | null = null
  ) {
    await tx.query(
      `INSERT INTO visit_requests
     (lead_id, requested_by, notes)
     VALUES ($1, $2, $3)`,
      [leadId, requestedBy, notes]
    );
  }

  async verify(
    tx: PoolClient,
    leadId: string,
    fieldExecId: string,
    outcome: "SOLD" | "DROPPED",
    notes: string
  ) {
    await tx.query(
      `
    UPDATE visits
    SET status = 'COMPLETED',
        outcome = $3,
        outcome_notes = $4,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE lead_id = $1
      AND field_exec_id = $2
      AND status = 'SCHEDULED'
    `,
      [leadId, fieldExecId, outcome, notes]
    );
  }

  async drop(
    tx: PoolClient,
    leadId: string,
    markedBy: string,
    reason: string
  ) {
    await tx.query(
      `UPDATE leads
     SET drop_reason = $1,
         drop_notes = $2
     WHERE id = $3`,
      ["OTHER", reason, leadId]
    );
  }
}