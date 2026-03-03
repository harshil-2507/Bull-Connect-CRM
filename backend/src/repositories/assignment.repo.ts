// src/repositories/assignment.repo.ts
import { PoolClient } from "pg";
import { pool } from "../config/db";

export class AssignmentRepository {
  async assignTelecaller(
    tx: PoolClient,
    leadId: string,
    telecallerId: string,
    managerId: string
  ) {
    await tx.query(
      `
      INSERT INTO assignments (lead_id, user_id, assigned_by)
      VALUES ($1, $2, $3)
      `,
      [leadId, telecallerId, managerId]
    );
  }

  async getAllTeleAssignments() {
    const res = await pool.query(`SELECT * FROM assignments ORDER BY id DESC`);
    return res.rows;
  }

  async getTeleAssignmentById(id: string) {
    const res = await pool.query(`SELECT * FROM assignments WHERE id = $1`, [id]);
    return res.rows[0];
  }
  async assignFieldExec(
    tx: PoolClient,
    fieldRequestId: string,
    fieldExecId: string,
    managerId: string
  ) {
    await tx.query(
      `
    INSERT INTO assignments (lead_id, user_id, assigned_by)
    SELECT vr.lead_id, $1, $2
    FROM visit_requests vr
    WHERE vr.id = $3
    `,
      [fieldExecId, managerId, fieldRequestId]
    );
  }
}
