// src/services/callLog.service.ts

import { PoolClient } from "pg";
import { withTransaction } from "../db/transactions";
import { ActionRepository } from "../repositories/action.repo";

export interface CallLogInput {
  leadId: string;
  userId: string;
  disposition:
    | "NOT_INTERESTED"
    | "INTERESTED"
    | "CALLBACK"
    | "BUSY"
    | "NO_ANSWER"
    | "INVALID_NUMBER"; // ✅ FIXED ENUMS
  notes?: string;
  durationSeconds?: number;
}

const repo = new ActionRepository();

export async function recordCallOnly(input: CallLogInput) {
  return withTransaction(async (tx: PoolClient) => {

    const leadRes = await tx.query(
      `SELECT id, assigned_to FROM leads WHERE id = $1 FOR UPDATE`,
      [input.leadId]
    );

    if (!leadRes.rowCount) throw new Error("Lead not found");

    if (leadRes.rows[0].assigned_to !== input.userId) {
      throw new Error("Lead not assigned to you");
    }

    await repo.call(
      tx,
      input.leadId,
      input.userId,
      input.disposition,
      input.notes || null,
      input.durationSeconds || null
    );

    return { success: true };
  });
}