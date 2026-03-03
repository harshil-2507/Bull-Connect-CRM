// backend/src/repositories/deal.repo.ts

import { PoolClient } from "pg";
import { DealState } from "../models/deal.model";

export class DealRepository {

  async lock(tx: PoolClient, dealId: string) {
    const res = await tx.query(
      `SELECT id, status FROM deals WHERE id = $1 FOR UPDATE`,
      [dealId]
    );

    if (!res.rowCount) throw new Error("Deal not found");

    return res.rows[0] as { id: string; status: DealState };
  }

  async updateState(
    tx: PoolClient,
    dealId: string,
    state: DealState
  ) {
    await tx.query(
      `UPDATE deals
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [state, dealId]
    );
  }

  async create(
  tx: PoolClient,
  data: {
    leadId: string;
    cropType?: string;
    estimatedQuantity?: number;
    expectedValue?: number;
    createdBy: string;
  }
) {
  const res = await tx.query(
    `
    INSERT INTO deals (
      lead_id,
      crop_type,
      estimated_quantity,
      expected_value,
      status,
      created_by,
      assigned_to
    )
    VALUES ($1,$2,$3,$4,'NEW',$5,$5)
    RETURNING *
    `,
    [
      data.leadId,
      data.cropType ?? null,
      data.estimatedQuantity ?? null,
      data.expectedValue ?? null,
      data.createdBy
    ]
  );

  return res.rows[0];
}

  async findById(tx: PoolClient, dealId: string) {
    const res = await tx.query(
      `SELECT * FROM deals WHERE id = $1`,
      [dealId]
    );

    if (!res.rowCount) return null;

    return res.rows[0];
  }

  async findByLeadId(tx: PoolClient, leadId: string) {
    const res = await tx.query(
      `SELECT *
       FROM deals
       WHERE lead_id = $1
       ORDER BY created_at DESC`,
      [leadId]
    );

    return res.rows;
  }

  async assign(
    tx: PoolClient,
    dealId: string,
    userId: string
  ) {
    await tx.query(
      `
    UPDATE deals
    SET assigned_to = $1,
        updated_at = NOW()
    WHERE id = $2
    `,
      [userId, dealId]
    );
  }
}