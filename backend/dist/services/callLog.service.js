"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordCallLog = recordCallLog;
const transactions_1 = require("../db/transactions");
const action_repo_1 = require("../repositories/action.repo");
const repo = new action_repo_1.ActionRepository();
async function recordCallLog(input) {
    return (0, transactions_1.withTransaction)(async (tx) => {
        // Lock the lead row
        const leadRes = await tx.query(`SELECT id, status, attempt_count, assigned_to FROM leads WHERE id = $1 FOR UPDATE`, [input.leadId]);
        if (leadRes.rows.length === 0)
            throw new Error("Lead not found");
        const lead = leadRes.rows[0];
        if (lead.assigned_to !== input.userId)
            throw new Error("Lead is not assigned to this user");
        let newStatus = lead.status;
        // Insert call log
        await repo.call(tx, input.leadId, input.userId, input.disposition, input.notes || null, input.durationSeconds || null);
        // Handle dispositions
        if (input.disposition === "NOT_INTERESTED") {
            const dropReason = input.dropReason || "OTHER"; // ✅ default value
            if (lead.status === "ASSIGNED") {
                // Step 1: ASSIGNED → CONTACTED
                await tx.query(`UPDATE leads SET status = 'CONTACTED', attempt_count = attempt_count + 1, last_contacted_at = NOW(), updated_at = NOW() WHERE id = $1`, [input.leadId]);
            }
            // Step 2: CONTACTED → DROPPED with drop_reason
            await tx.query(`UPDATE leads 
         SET status = 'DROPPED', drop_reason = $1, attempt_count = attempt_count + 1, last_contacted_at = NOW(), updated_at = NOW() 
         WHERE id = $2`, [dropReason, input.leadId]);
            newStatus = "DROPPED";
            // Record drop entry
            await repo.drop(tx, input.leadId, input.userId, dropReason);
        }
        else if (input.disposition === "INTERESTED") {
            const cropType = input.cropType || null;
            const acreage = input.acreage || null;
            if (!cropType || !acreage) {
                throw new Error("INTERESTED calls require cropType and acreage");
            }
            await tx.query(`UPDATE leads 
         SET status = 'VISIT_REQUESTED', crop_type = $1, acreage = $2, attempt_count = attempt_count + 1, last_contacted_at = NOW(), updated_at = NOW()
         WHERE id = $3`, [cropType, acreage, input.leadId]);
            newStatus = "VISIT_REQUESTED";
            if (!input.cropType)
                throw new Error("INTERESTED calls require cropType");
            await repo.requestFieldVisit(tx, input.leadId, input.userId, input.cropType);
        }
        else if (input.disposition === "CONTACTED") {
            // Just update attempt count and last_contacted_at
            if (lead.status !== "CONTACTED") {
                await tx.query(`UPDATE leads 
           SET status = 'CONTACTED', attempt_count = attempt_count + 1, last_contacted_at = NOW(), updated_at = NOW()
           WHERE id = $1`, [input.leadId]);
            }
            else {
                // Already CONTACTED, just increment attempt_count
                await tx.query(`UPDATE leads 
           SET attempt_count = attempt_count + 1, last_contacted_at = NOW(), updated_at = NOW()
           WHERE id = $1`, [input.leadId]);
            }
            newStatus = "CONTACTED";
        }
        // Get updated attempt count
        const attemptCount = (await tx.query(`SELECT attempt_count FROM leads WHERE id = $1`, [input.leadId])).rows[0].attempt_count;
        return {
            callLogId: "", // repo.call currently does not return ID
            leadId: input.leadId,
            newStatus,
            attemptCount,
        };
    });
}
