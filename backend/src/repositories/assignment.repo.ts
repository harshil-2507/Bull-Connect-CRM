import { PoolClient } from "pg";

export class AssignmentRepository {
  async assignTelecaller(
    tx: PoolClient,
    leadId: string,
    telecallerId: string
  ) {
    await tx.query(
      `INSERT INTO tele_assignments (lead_id, telecaller_id)
       VALUES ($1, $2)`,
      [leadId, telecallerId]
    );
  }

  async assignFieldExec(
    tx: PoolClient,
    fieldRequestId: string,
    fieldExecId: string,
    assignedBy: string
  ) {
    await tx.query(
      `INSERT INTO field_assignments
       (field_request_id, field_exec_id, assigned_by)
       VALUES ($1, $2, $3)`,
      [fieldRequestId, fieldExecId, assignedBy]
    );
  }
}