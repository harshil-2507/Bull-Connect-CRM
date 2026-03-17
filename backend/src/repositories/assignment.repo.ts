// src/repositories/assignment.repo.ts
import { PoolClient } from "pg";
import { pool } from "../config/db";

export class AssignmentRepository {

  /**
   * Deactivate existing assignments for given leads
   */
  async deactivateExistingAssignments(tx: PoolClient, leadIds: string[]) {
    await tx.query(
      `
      UPDATE assignments
      SET is_active = false
      WHERE lead_id = ANY($1::uuid[]) 
        AND is_active = true
      `,
      [leadIds]
    );
  }

  /**
   * Insert new assignments (bulk)
   */
  async createAssignments(
    tx: PoolClient,
    assignments: { leadId: string; userId: string; assignedBy: string }[]
  ) {
    if (!assignments.length) return;

    const values: any[] = [];
    const placeholders: string[] = [];

    assignments.forEach((a, i) => {
      const base = i * 3;
      placeholders.push(
        `($${base + 1}::uuid, $${base + 2}::uuid, $${base + 3}::uuid)`
      );
      values.push(a.leadId, a.userId, a.assignedBy);
    });

    await tx.query(
      `
      INSERT INTO assignments (lead_id, user_id, assigned_by)
      VALUES ${placeholders.join(",")}
      `,
      values
    );
  }

  /**
   * Update leads assigned_to + status (BULK + UUID SAFE)
   */
  async updateLeadsAssignment(
  tx: PoolClient,
  assignments: { leadId: string; userId: string }[]
) {
  if (!assignments.length) return;

  const values: any[] = [];
  const cases: string[] = [];

  assignments.forEach((a, i) => {
    const idx = i * 2;

    cases.push(`WHEN id = $${idx + 1}::uuid THEN $${idx + 2}::uuid`);

    values.push(a.leadId, a.userId);
  });

  const whereIds = assignments
    .map((_, i) => `$${i * 2 + 1}::uuid`)
    .join(",");

  await tx.query(
    `
    UPDATE leads
    SET 
      assigned_to = CASE ${cases.join(" ")} END,
      updated_at = NOW()
    WHERE id IN (${whereIds})
    `,
    values
  );
}
  /**
   * Get unassigned leads by campaign
   */
  async getUnassignedLeads(campaignId: string) {
    const res = await pool.query(
      `
      SELECT *
      FROM leads
      WHERE campaign_id = $1::uuid
        AND assigned_to IS NULL
      ORDER BY created_at DESC
      `,
      [campaignId]
    );
    return res.rows;
  }

  /**
   * Get all tele assignments
   */
  async getAllTeleAssignments() {
    const res = await pool.query(`
      SELECT 
        a.*,
        u.name as telecaller_name
      FROM assignments a
      JOIN users u ON u.id = a.user_id
      ORDER BY a.assigned_at DESC
    `);
    return res.rows;
  }

  /**
   * Get assignment by ID
   */
  async getTeleAssignmentById(id: string) {
    const res = await pool.query(
      `
      SELECT *
      FROM assignments
      WHERE id = $1::uuid
      `,
      [id]
    );
    return res.rows[0];
  }
}