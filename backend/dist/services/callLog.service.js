"use strict";
/**
 * Call Logging Service - Production Grade
 *
 * Handles telecaller call dispositions with:
 * - Transactional integrity
 * - State machine enforcement
 * - Automatic lead updates
 * - Audit trail
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordCallLog = recordCallLog;
exports.getCallHistory = getCallHistory;
exports.getTodayCallStats = getTodayCallStats;
exports.bulkRecordCalls = bulkRecordCalls;
const transactions_1 = require("../db/transactions");
const stateMachine_service_1 = require("./stateMachine.service");
/**
 * Records a call attempt and updates lead accordingly
 * Uses database transaction to ensure atomicity
 */
async function recordCallLog(input) {
    return (0, transactions_1.withTransaction)(async (tx) => {
        // 1. Get current lead state (with row lock)
        const leadResult = await tx.query(`SELECT id, status, attempt_count, assigned_to FROM leads WHERE id = $1 FOR UPDATE`, [input.leadId]);
        if (leadResult.rows.length === 0) {
            throw new Error(`Lead not found: ${input.leadId}`);
        }
        const lead = leadResult.rows[0];
        const currentStatus = lead.status;
        // 2. Verify ownership - telecaller can only call assigned leads
        if (lead.assigned_to !== input.userId) {
            throw new Error('Lead is not assigned to this user');
        }
        // 3. Verify lead is in callable state
        if (!['ASSIGNED', 'CONTACTED'].includes(currentStatus)) {
            throw new Error(`Lead cannot be called in ${currentStatus} status`);
        }
        // 4. Determine new status based on disposition
        let newStatus = currentStatus;
        const statusChange = (0, stateMachine_service_1.getStatusChangeFromDisposition)(currentStatus, input.disposition, { cropType: input.cropType, acreage: input.acreage });
        if (statusChange) {
            // First call on ASSIGNED lead moves to CONTACTED
            if (currentStatus === 'ASSIGNED') {
                newStatus = 'CONTACTED';
            }
            else {
                newStatus = statusChange;
            }
            // Validate transition
            (0, stateMachine_service_1.validateLeadTransition)(currentStatus, newStatus);
            // Validate business rules
            (0, stateMachine_service_1.validateStatusBusinessRules)(newStatus, {
                cropType: input.cropType,
                acreage: input.acreage,
                dropReason: input.dropReason,
            });
        }
        // 5. Insert call log
        const callLogResult = await tx.query(`INSERT INTO call_logs (
        lead_id,
        user_id,
        disposition,
        notes,
        next_callback_at,
        duration_seconds,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, created_at`, [
            input.leadId,
            input.userId,
            input.disposition,
            input.notes || null,
            input.nextCallbackAt || null,
            input.durationSeconds || null,
        ]);
        const callLogId = callLogResult.rows[0].id;
        // 6. Update lead
        const updateFields = [
            'attempt_count = attempt_count + 1',
            'last_contacted_at = NOW()',
        ];
        const updateValues = [];
        let paramIndex = 1;
        // Update status if changed
        if (newStatus !== currentStatus) {
            updateFields.push(`status = $${paramIndex++}`);
            updateValues.push(newStatus);
        }
        // Update callback time if provided
        if (input.nextCallbackAt) {
            updateFields.push(`next_callback_at = $${paramIndex++}`);
            updateValues.push(input.nextCallbackAt);
        }
        // Update crop info for FIELD_REQUESTED
        if (newStatus === 'FIELD_REQUESTED') {
            updateFields.push(`crop_type = $${paramIndex++}`);
            updateValues.push(input.cropType);
            updateFields.push(`acreage = $${paramIndex++}`);
            updateValues.push(input.acreage);
        }
        // Update drop info for DROPPED
        if (newStatus === 'DROPPED') {
            updateFields.push(`drop_reason = $${paramIndex++}`);
            updateValues.push(input.dropReason);
            if (input.dropNotes) {
                updateFields.push(`drop_notes = $${paramIndex++}`);
                updateValues.push(input.dropNotes);
            }
        }
        updateValues.push(input.leadId);
        const updateResult = await tx.query(`UPDATE leads 
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING attempt_count`, updateValues);
        const attemptCount = updateResult.rows[0].attempt_count;
        // 7. Create audit log entry for status change
        if (newStatus !== currentStatus) {
            await tx.query(`INSERT INTO audit_logs (
          user_id,
          entity_type,
          entity_id,
          action,
          metadata,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`, [
                input.userId,
                'LEAD',
                input.leadId,
                'STATUS_CHANGE',
                JSON.stringify({
                    from: currentStatus,
                    to: newStatus,
                    disposition: input.disposition,
                    call_log_id: callLogId,
                }),
            ]);
        }
        return {
            callLogId,
            leadId: input.leadId,
            newStatus,
            attemptCount,
        };
    });
}
/**
 * Get call history for a lead
 */
async function getCallHistory(leadId, limit = 50) {
    const { pool } = await Promise.resolve().then(() => __importStar(require('../config/db')));
    const result = await pool.query(`SELECT 
      cl.id,
      cl.disposition,
      cl.notes,
      cl.next_callback_at,
      cl.duration_seconds,
      cl.created_at,
      u.name AS caller_name,
      u.role AS caller_role
    FROM call_logs cl
    JOIN users u ON cl.user_id = u.id
    WHERE cl.lead_id = $1
    ORDER BY cl.created_at DESC
    LIMIT $2`, [leadId, limit]);
    return result.rows;
}
/**
 * Get telecaller's call statistics for today
 */
async function getTodayCallStats(userId) {
    const { pool } = await Promise.resolve().then(() => __importStar(require('../config/db')));
    const result = await pool.query(`SELECT 
      COUNT(*) as total_calls,
      COUNT(*) FILTER (WHERE disposition = 'INTERESTED') as interested,
      COUNT(*) FILTER (WHERE disposition = 'NOT_INTERESTED') as not_interested,
      COUNT(*) FILTER (WHERE disposition = 'CALLBACK') as callbacks,
      COALESCE(AVG(duration_seconds), 0) as avg_duration
    FROM call_logs
    WHERE user_id = $1
      AND created_at >= CURRENT_DATE
      AND created_at < CURRENT_DATE + INTERVAL '1 day'`, [userId]);
    const row = result.rows[0];
    return {
        totalCalls: parseInt(row.total_calls),
        interested: parseInt(row.interested),
        notInterested: parseInt(row.not_interested),
        callbacks: parseInt(row.callbacks),
        avgDuration: parseFloat(row.avg_duration),
    };
}
/**
 * Bulk log calls (for import scenarios)
 * Still maintains transactional integrity per call
 */
async function bulkRecordCalls(calls) {
    const results = [];
    for (const call of calls) {
        try {
            const result = await recordCallLog(call);
            results.push(result);
        }
        catch (error) {
            // Log error but continue with other calls
            console.error(`Failed to log call for lead ${call.leadId}:`, error);
        }
    }
    return results;
}
