/**
 * Telecaller Routes - Production Example
 * 
 * Demonstrates production-grade route implementation with:
 * - Role-based access control
 * - Ownership verification
 * - State machine enforcement
 * - Transaction handling
 * - Audit logging
 */

import { Router, Request, Response } from 'express';
import { auth as authenticate } from '../middlewares/auth';
import {
  requireRole,
  requireLeadOwnership,
  requireTelecallerAccess,
  requireActiveUser,
  rateLimit,
} from '../middlewares/rbac.middleware';
import {
  recordCallLog,
  // getCallHistory,
  // getTodayCallStats,
  CallLogInput,
} from '../services/callLog.service';
import { auditFromRequest } from '../services/audit.service';
import { pool } from '../config/db';
import { validateLeadTransition } from '../services/stateMachine.service';

const router = Router();

// All routes require authentication and active user status
router.use(authenticate);
router.use(requireActiveUser);

/**
 * GET /telecaller/leads
 * Get all leads assigned to the authenticated telecaller
 */
router.get(
  '/leads',
  requireRole(['TELECALLER', 'MANAGER', 'ADMIN']),
  rateLimit(100, 60000), // 100 requests per minute
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { status, page = 1, limit = 50 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      let query = `
        SELECT 
          l.id,
          l.farmer_name,
          l.phone_number,
          l.village,
          l.taluka,
          l.district,
          l.state,
          l.status,
          l.attempt_count,
          l.last_contacted_at,
          l.next_callback_at,
          l.created_at,
          c.name as campaign_name,
          c.id as campaign_id
        FROM leads l
        JOIN campaigns c ON l.campaign_id = c.id
        WHERE l.assigned_to = $1
      `;

      const params: any[] = [userId];
      let paramIndex = 2;

      if (status) {
        query += ` AND l.status = $${paramIndex++}`;
        params.push(status);
      }

      // Show only ASSIGNED and CONTACTED leads for telecallers
      if (req.user!.role === 'TELECALLER') {
        query += ` AND l.status IN ('ASSIGNED', 'CONTACTED')`;
      }

      query += ` ORDER BY 
        CASE 
          WHEN l.next_callback_at IS NOT NULL AND l.next_callback_at <= NOW() THEN 0
          ELSE 1
        END,
        l.next_callback_at ASC NULLS LAST,
        l.created_at ASC
      `;

      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(Number(limit), offset);

      const result = await pool.query(query, params);

      // Get total count
      const countResult = await pool.query(
        `SELECT COUNT(*) as total 
         FROM leads 
         WHERE assigned_to = $1 
         AND status IN ('ASSIGNED', 'CONTACTED')`,
        [userId]
      );

      res.json({
        leads: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].total),
        },
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch leads',
      });
    }
  }
);

/**
 * GET /telecaller/leads/:leadId
 * Get detailed information about a specific lead
 */
router.get(
  '/leads/:leadId',
  requireRole(['TELECALLER', 'MANAGER', 'ADMIN']),
  requireLeadOwnership,
  async (req: Request, res: Response) => {
    try {
      const { leadId } = req.params;

      const result = await pool.query(
        `SELECT 
          l.*,
          c.name as campaign_name,
          c.description as campaign_description,
          u.name as assigned_to_name
        FROM leads l
        JOIN campaigns c ON l.campaign_id = c.id
        LEFT JOIN users u ON l.assigned_to = u.id
        WHERE l.id = $1`,
        [leadId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Lead not found',
        });
      }

      const lead = result.rows[0];

      // Get call history
      // const callHistory = await getCallHistory(leadId, 10);

      res.json({
        lead,
        // callHistory,
      });
    } catch (error) {
      console.error('Error fetching lead details:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch lead details',
      });
    }
  }
);

/**
 * POST /telecaller/leads/:leadId/call
 * Record a call attempt and update lead status
 * 
 * This is the core telecaller action with full transaction support
 */
router.post(
  '/leads/:leadId/call',
  requireRole(['TELECALLER', 'MANAGER', 'ADMIN']),
  requireLeadOwnership,
  rateLimit(200, 60000), // 200 calls per minute
  async (req: Request, res: Response) => {
    try {
      const { leadId } = req.params;
      const userId = req.user!.id;

      const {
        disposition,
        notes,
        nextCallbackAt,
        durationSeconds,
        cropType,
        acreage,
        dropReason,
        dropNotes,
      } = req.body;

      // Validate required fields
      if (!disposition) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'disposition is required',
        });
      }

      // Validate disposition-specific requirements
      if (disposition === 'INTERESTED') {
        if (cropType && acreage) {
          // Will move to FIELD_REQUESTED
          if (!cropType || !acreage) {
            return res.status(400).json({
              error: 'Bad Request',
              message: 'crop_type and acreage are required for INTERESTED disposition',
            });
          }
        }
      }

      if (disposition === 'NOT_INTERESTED' || disposition === 'INVALID_NUMBER') {
        if (!dropReason) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'drop_reason is required for this disposition',
          });
        }
      }

      // Record call with transaction
      const callLogInput: CallLogInput = {
        leadId,
        userId,
        disposition,
        notes,
        nextCallbackAt: nextCallbackAt ? new Date(nextCallbackAt) : undefined,
        durationSeconds,
        cropType,
        acreage,
        dropReason,
        // dropNotes,
      };

      const result = await recordCallLog(callLogInput);

      // Create audit log
      await auditFromRequest(req, 'CALL_LOG', result.callLogId, 'CREATE', {
        leadId,
        disposition,
        newStatus: result.newStatus,
      });

      res.status(201).json({
        message: 'Call logged successfully',
        callLogId: result.callLogId,
        leadId: result.leadId,
        newStatus: result.newStatus,
        attemptCount: result.attemptCount,
      });
    } catch (error: any) {
      console.error('Error recording call:', error);

      // Handle specific validation errors
      if (error.message?.includes('Invalid transition') || 
          error.message?.includes('required for')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to record call',
      });
    }
  }
);

/**
 * GET /telecaller/leads/:leadId/history
 * Get call history for a lead
 */
router.get(
  '/leads/:leadId/history',
  requireRole(['TELECALLER', 'MANAGER', 'ADMIN']),
  requireLeadOwnership,
  async (req: Request, res: Response) => {
    try {
      const { leadId } = req.params;
      const { limit = 50 } = req.query;

      // const callHistory = await getCallHistory(leadId, Number(limit));

      res.json({
        leadId,
        // callHistory,
      });
    } catch (error) {
      console.error('Error fetching call history:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch call history',
      });
    }
  }
);

/**
 * GET /telecaller/stats
 * Get today's statistics for the authenticated telecaller
 */
router.get(
  '/stats',
  requireRole(['TELECALLER', 'MANAGER', 'ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      // const stats = await getTodayCallStats(userId);

      // Get assigned leads count
      const leadsResult = await pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'ASSIGNED') as pending,
          COUNT(*) FILTER (WHERE status = 'CONTACTED') as contacted,
          COUNT(*) FILTER (WHERE status = 'FIELD_REQUESTED') as field_requested,
          COUNT(*) as total
        FROM leads
        WHERE assigned_to = $1
          AND status IN ('ASSIGNED', 'CONTACTED', 'FIELD_REQUESTED')`,
        [userId]
      );

      const leadsStats = leadsResult.rows[0];

      res.json({
        // calls: stats,
        leads: {
          pending: parseInt(leadsStats.pending),
          contacted: parseInt(leadsStats.contacted),
          fieldRequested: parseInt(leadsStats.field_requested),
          total: parseInt(leadsStats.total),
        },
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch statistics',
      });
    }
  }
);

/**
 * GET /telecaller/callbacks
 * Get leads that need callback
 */
router.get(
  '/callbacks',
  requireRole(['TELECALLER', 'MANAGER', 'ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      const result = await pool.query(
        `SELECT 
          l.id,
          l.farmer_name,
          l.phone_number,
          l.village,
          l.next_callback_at,
          l.attempt_count,
          c.name as campaign_name
        FROM leads l
        JOIN campaigns c ON l.campaign_id = c.id
        WHERE l.assigned_to = $1
          AND l.status = 'CONTACTED'
          AND l.next_callback_at IS NOT NULL
          AND l.next_callback_at <= NOW() + INTERVAL '1 hour'
        ORDER BY l.next_callback_at ASC
        LIMIT 50`,
        [userId]
      );

      res.json({
        callbacks: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      console.error('Error fetching callbacks:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch callbacks',
      });
    }
  }
);

export default router;
