// src/services/callLog.service.ts
import { PoolClient } from "pg";
import { withTransaction } from "../db/transactions";
import { ActionRepository } from "../repositories/action.repo";
import { DealRepository } from "../repositories/deal.repo";

export interface CallLogInput {
  leadId: string;
  userId: string;
  disposition: "NOT_INTERESTED" | "INTERESTED" | "CONTACTED";
  notes?: string;
  nextCallbackAt?: Date;
  durationSeconds?: number;
  cropType?: string;
  acreage?: number;
  dropReason?: string;
}

export interface CallLogResult {
  callLogId: string;
  leadId: string;
  newStatus: string;
  attemptCount: number;
}

const repo = new ActionRepository();
const dealRepo = new DealRepository();

export async function recordCallLog(input: CallLogInput): Promise<CallLogResult> {
  return withTransaction(async (tx: PoolClient) => {
    // Lock the lead row
    const leadRes = await tx.query(
      `SELECT id, status, attempt_count, assigned_to FROM leads WHERE id = $1 FOR UPDATE`,
      [input.leadId]
    );
    if (leadRes.rows.length === 0) throw new Error("Lead not found");
    const lead = leadRes.rows[0];

    if (lead.assigned_to !== input.userId)
      throw new Error("Lead is not assigned to this user");

    let newStatus = lead.status;

    // Insert call log
    await repo.call(
      tx,
      input.leadId,
      input.userId,
      input.disposition,
      input.notes || null,
      input.durationSeconds || null
    );

    // Handle dispositions
    if (input.disposition === "NOT_INTERESTED") {
      const dropReason = input.dropReason || "OTHER"; // ✅ default value

      if (lead.status === "ASSIGNED") {
        // Step 1: ASSIGNED → CONTACTED
        await tx.query(
          `UPDATE leads SET status = 'CONTACTED', attempt_count = attempt_count + 1, last_contacted_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [input.leadId]
        );
      }

      // Step 2: CONTACTED → DROPPED with drop_reason
      await tx.query(
        `UPDATE leads 
         SET status = 'DROPPED', drop_reason = $1, attempt_count = attempt_count + 1, last_contacted_at = NOW(), updated_at = NOW() 
         WHERE id = $2`,
        [dropReason, input.leadId]
      );
      newStatus = "DROPPED";

      // Record drop entry
      await repo.drop(tx, input.leadId, input.userId, dropReason);
    } else if (input.disposition === "INTERESTED") {

      const cropType = input.cropType || null;
      const acreage = input.acreage || null;

      if (!cropType || !acreage) {
        throw new Error("INTERESTED calls require cropType and acreage");
      }

      // Step 1: ASSIGNED → CONTACTED (if needed)
      if (lead.status === "ASSIGNED") {
        await tx.query(
          `UPDATE leads 
       SET status = 'CONTACTED',
           attempt_count = attempt_count + 1,
           last_contacted_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
          [input.leadId]
        );
      }

      //  imp STEP: CREATE DEAL
      const deal = await dealRepo.create(tx, {
        leadId: input.leadId,
        cropType: cropType,
        estimatedQuantity: acreage,
        expectedValue: undefined,
        createdBy: input.userId,
      });

      //  Move Deal NEW → CONTACTED
      await dealRepo.updateState(tx, deal.id, "CONTACTED");

      // Step 2: CONTACTED → VISIT_REQUESTED
      await tx.query(
        `UPDATE leads 
     SET status = 'VISIT_REQUESTED',
         crop_type = $1,
         acreage = $2,
         attempt_count = attempt_count + 1,
         last_contacted_at = NOW(),
         updated_at = NOW()
     WHERE id = $3`,
        [cropType, acreage, input.leadId]
      );

      newStatus = "VISIT_REQUESTED";

      await repo.requestFieldVisit(tx, input.leadId, input.userId, cropType);
    }

    else if (input.disposition === "CONTACTED") {
      // Just update attempt count and last_contacted_at
      if (lead.status !== "CONTACTED") {
        await tx.query(
          `UPDATE leads 
           SET status = 'CONTACTED', attempt_count = attempt_count + 1, last_contacted_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [input.leadId]
        );
      } else {
        // Already CONTACTED, just increment attempt_count
        await tx.query(
          `UPDATE leads 
           SET attempt_count = attempt_count + 1, last_contacted_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [input.leadId]
        );
      }
      newStatus = "CONTACTED";
    }

    // Get updated attempt count
    const attemptCount = (
      await tx.query(`SELECT attempt_count FROM leads WHERE id = $1`, [input.leadId])
    ).rows[0].attempt_count;

    return {
      callLogId: "", // repo.call currently does not return ID
      leadId: input.leadId,
      newStatus,
      attemptCount,
    };
  });
}