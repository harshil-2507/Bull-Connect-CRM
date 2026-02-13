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
      INSERT INTO tele_assignments (lead_id, user_id, assigned_by)
      VALUES ($1, $2, $3)
      `,
      [leadId, telecallerId, managerId]
    );
  }

   async getAllTeleAssignments() {
    const res = await pool.query(`SELECT * FROM tele_assignments ORDER BY id DESC`);
    return res.rows;
  }

  async getTeleAssignmentById(id: string) {
    const res = await pool.query(`SELECT * FROM tele_assignments WHERE id = $1`, [id]);
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
      INSERT INTO field_assignments (field_request_id, field_exec_id, assigned_by)
      VALUES ($1, $2, $3)
      `,
      [fieldRequestId, fieldExecId, managerId]
    );
  }
}
