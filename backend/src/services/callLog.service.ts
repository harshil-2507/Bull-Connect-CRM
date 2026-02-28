/**
 * Call Logging Service - Production Grade
 * 
 * Handles telecaller call dispositions with:
 * - Transactional integrity
 * - State machine enforcement
 * - Automatic lead updates
 * - Audit trail
 */

import { PoolClient } from 'pg';
import { withTransaction } from '../db/transactions';
import {
  CallDisposition,
  DropReason,
  validateLeadTransition,
  validateStatusBusinessRules,
  getStatusChangeFromDisposition,
} from './stateMachine.service';
import { LeadState } from '../models/lead.model';

type LeadStatus = LeadState;

export interface CallLogInput {
  leadId: string;
  userId: string;
  disposition: CallDisposition;
  notes?: string;
  nextCallbackAt?: Date;
  durationSeconds?: number;
  
  // Required for INTERESTED disposition
  cropType?: string;
  acreage?: number;
  
  // Required for drop dispositions
  dropReason?: DropReason;
  dropNotes?: string;
}

export interface CallLogResult {
  callLogId: string;
  leadId: string;
  newStatus: LeadStatus;
  attemptCount: number;
}

/**
 * Records a call attempt and updates lead accordingly
 * Uses database transaction to ensure atomicity
 */
 export async function recordCallLog(input: CallLogInput): Promise<CallLogResult> {
   return withTransaction(async (tx: PoolClient) => {
     // 1. Get current lead state (with row lock)
    const leadResult = await tx.query(
      `SELECT id, status, attempt_count, assigned_to FROM leads WHERE id = $1 FOR UPDATE`,
      [input.leadId]
    );

    if (leadResult.rows.length === 0) {
      throw new Error(`Lead not found: ${input.leadId}`);
    }

    const lead = leadResult.rows[0];
    const currentStatus: LeadStatus = lead.status;
    
    // 2. Verify ownership - telecaller can only call assigned leads
    if (lead.assigned_to !== input.userId) {
      throw new Error('Lead is not assigned to this user');
    }

    // 3. Verify lead is in callable state
    if (!['ASSIGNED', 'CONTACTED'].includes(currentStatus)) {
      throw new Error(`Lead cannot be called in ${currentStatus} status`);
    }

    // 4. Determine new status based on disposition
    let newStatus = currentStatus as LeadStatus;
    const statusChange = getStatusChangeFromDisposition(
      currentStatus as LeadState,
      input.disposition,
      { cropType: input.cropType, acreage: input.acreage }
    );

    if (statusChange) {
      // First call on ASSIGNED lead moves to CONTACTED
      if (currentStatus === 'ASSIGNED') {
        newStatus = 'CONTACTED' as LeadStatus;
      } else {
        newStatus = statusChange as LeadStatus;
      }

      // Validate transition
      validateLeadTransition(currentStatus as LeadState, newStatus as LeadState);

      // Validate business rules
      validateStatusBusinessRules(newStatus as LeadState, {
        cropType: input.cropType,
        acreage: input.acreage,
        dropReason: input.dropReason,
      });
    }

    // 5. Insert call log
    const callLogResult = await tx.query(
      `INSERT INTO call_logs (
        lead_id,
        user_id,
        disposition,
        notes,
        next_callback_at,
        duration_seconds,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, created_at`,
      [
        input.leadId,
        input.userId,
        input.disposition,
        input.notes || null,
        input.nextCallbackAt || null,
        input.durationSeconds || null,
      ]
    );

    const callLogId = callLogResult.rows[0].id;

    // 6. Update lead
    const updateFields: string[] = [
      'attempt_count = attempt_count + 1',
      'last_contacted_at = NOW()',
    ];
    const updateValues: any[] = [];
    let paramIndex = 1;

    // Update status if changed
    if (newStatus !== currentStatus) {
      // update legacy status column AND canonical lead_status_v2 (additive)
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(newStatus);
      updateFields.push(`lead_status_v2 = $${paramIndex++}`);
      updateValues.push(newStatus);
    }

    // Update callback time if provided
    if (input.nextCallbackAt) {
      updateFields.push(`next_callback_at = $${paramIndex++}`);
      updateValues.push(input.nextCallbackAt);
    }

    // Update crop info for VISIT_REQUESTED (was FIELD_REQUESTED)
    if (newStatus === 'VISIT_REQUESTED') {
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
    
    const updateResult = await tx.query(
      `UPDATE leads 
       SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING attempt_count`,
      updateValues
    );

    const attemptCount = updateResult.rows[0].attempt_count;

    // 7. Create audit log entry for status change
    if (newStatus !== currentStatus) {
      // Insert into canonical lead_status_history for transition audit
      await tx.query(
        `INSERT INTO lead_status_history (
          lead_id,
          changed_by,
          from_status,
          to_status,
          metadata,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          input.leadId,
          input.userId,
          currentStatus,
          newStatus,
          JSON.stringify({ disposition: input.disposition, call_log_id: callLogId }),
        ]
      );

      // Also keep existing audit_logs insert for compatibility
      await tx.query(
        `INSERT INTO audit_logs (
          user_id,
          entity_type,
          entity_id,
          action,
          metadata,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          input.userId,
          'LEAD',
          input.leadId,
          'STATUS_CHANGE',
          JSON.stringify({ from: currentStatus, to: newStatus, disposition: input.disposition, call_log_id: callLogId }),
        ]
      );
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
export async function getCallHistory(
  leadId: string,
  limit: number = 50
): Promise<any[]> {
  const { pool } = await import('../config/db');
  
  const result = await pool.query(
    `SELECT 
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
    LIMIT $2`,
    [leadId, limit]
  );

  return result.rows;
}

/**
 * Get telecaller's call statistics for today
 */
export async function getTodayCallStats(userId: string): Promise<{
  totalCalls: number;
  interested: number;
  notInterested: number;
  callbacks: number;
  avgDuration: number;
}> {
  const { pool } = await import('../config/db');
  
  const result = await pool.query(
    `SELECT 
      COUNT(*) as total_calls,
      COUNT(*) FILTER (WHERE disposition = 'INTERESTED') as interested,
      COUNT(*) FILTER (WHERE disposition = 'NOT_INTERESTED') as not_interested,
      COUNT(*) FILTER (WHERE disposition = 'CALLBACK') as callbacks,
      COALESCE(AVG(duration_seconds), 0) as avg_duration
    FROM call_logs
    WHERE user_id = $1
      AND created_at >= CURRENT_DATE
      AND created_at < CURRENT_DATE + INTERVAL '1 day'`,
    [userId]
  );

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
export async function bulkRecordCalls(
  calls: CallLogInput[]
): Promise<CallLogResult[]> {
  const results: CallLogResult[] = [];
  
  for (const call of calls) {
    try {
      const result = await recordCallLog(call);
      results.push(result);
    } catch (error) {
      // Log error but continue with other calls
      console.error(`Failed to log call for lead ${call.leadId}:`, error);
    }
  }
  
  return results;
}
