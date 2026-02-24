// backend/src/repositories/visitRequest.repository.ts

import { PoolClient } from "pg";
import { pool } from "../config/db";
import {
  VisitRequest,
  CreateVisitRequestDTO,
} from "../models/visitRequest.model";

export class VisitRequestRepository {
  async create(
    tx: PoolClient,
    data: CreateVisitRequestDTO
  ): Promise<VisitRequest> {
    const res = await tx.query(
      `
      INSERT INTO visit_requests (
        lead_id,
        requested_by,
        priority,
        notes
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        data.leadId,
        data.requestedBy,
        data.priority ?? 1,
        data.notes ?? null,
      ]
    );

    return this.mapRow(res.rows[0]);
  }

  async updateStatus(
    tx: PoolClient,
    id: string,
    status: string
  ) {
    await tx.query(
      `
      UPDATE visit_requests
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      `,
      [status, id]
    );
  }

  async findById(id: string): Promise<VisitRequest | null> {
    const res = await pool.query(
      `SELECT * FROM visit_requests WHERE id = $1`,
      [id]
    );

    if (!res.rows.length) return null;
    return this.mapRow(res.rows[0]);
  }

  private mapRow(row: any): VisitRequest {
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