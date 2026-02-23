/**
 * Admin Routes - Production Example
 * 
 * Demonstrates advanced production patterns:
 * - Bulk operations with transactions
 * - Audit trail integration
 * - Complex queries with filtering
 * - Report generation
 */

import { Router, Request, Response } from 'express';
import { auth as authenticate } from '../middlewares/auth';
import { requireRole, requireActiveUser } from '../middlewares/rbac.middleware';
import { auditFromRequest, getRecentAuditLogs, getAuditStatistics } from '../services/audit.service';
import { withTransaction } from '../db/transactions';
import { pool } from '../config/db';
import { validateLeadTransition } from '../services/stateMachine.service';
import { PoolClient } from 'pg';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireActiveUser);
router.use(requireRole(['ADMIN']));

/**
 * POST /admin/users
 * Create a new user
 */
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { name, username, password, role, phone, email } = req.body;

    // Validate required fields
    if (!name || !username || !password || !role) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'name, username, password, and role are required',
      });
    }

    // Hash password (assuming bcrypt is used)
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, username, password_hash, role, phone, email, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, name, username, role, phone, email, is_active, created_at`,
      [name, username, passwordHash, role, phone, email]
    );

    const newUser = result.rows[0];

    // Create audit log
    await auditFromRequest(req, 'USER', newUser.id, 'CREATE', {
      username,
      role,
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        ...newUser,
        password_hash: undefined, // Never return password hash
      },
    });
  } catch (error: any) {
    console.error('Error creating user:', error);

    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Username already exists',
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create user',
    });
  }
});

/**
 * POST /admin/campaigns/:campaignId/assign-leads
 * Bulk assign leads to telecallers
 * Uses transaction to ensure atomic assignment
 */
router.post(
  '/campaigns/:campaignId/assign-leads',
  async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const { telecallerId, count = 10 } = req.body;

      if (!telecallerId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'telecallerId is required',
        });
      }

      // Verify telecaller exists and has correct role
      const telecallerResult = await pool.query(
        'SELECT id, role, is_active FROM users WHERE id = $1',
        [telecallerId]
      );

      if (telecallerResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Telecaller not found',
        });
      }

      const telecaller = telecallerResult.rows[0];

      if (telecaller.role !== 'TELECALLER') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'User is not a telecaller',
        });
      }

      if (!telecaller.is_active) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Telecaller account is inactive',
        });
      }

      // Perform bulk assignment in transaction
      const assignedLeads = await withTransaction(async (tx: PoolClient) => {
        // Get unassigned leads
        const leadsResult = await tx.query(
          `SELECT id FROM leads
           WHERE campaign_id = $1
             AND status = 'NEW'
             AND assigned_to IS NULL
           ORDER BY created_at ASC
           LIMIT $2
           FOR UPDATE`,
          [campaignId, count]
        );

        if (leadsResult.rows.length === 0) {
          throw new Error('No unassigned leads available in this campaign');
        }

        const leadIds = leadsResult.rows.map((row) => row.id);

        // Update leads status and assignment
        await tx.query(
          `UPDATE leads
           SET assigned_to = $1,
               status = 'ASSIGNED',
               updated_at = NOW()
           WHERE id = ANY($2)`,
          [telecallerId, leadIds]
        );

        // Create assignment records
        for (const leadId of leadIds) {
          await tx.query(
            `INSERT INTO assignments (lead_id, user_id, assigned_by, is_active)
             VALUES ($1, $2, $3, true)`,
            [leadId, telecallerId, req.user!.id]
          );

          // Create audit log for each assignment
          await tx.query(
            `INSERT INTO audit_logs (user_id, entity_type, entity_id, action, metadata)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              req.user!.id,
              'LEAD',
              leadId,
              'ASSIGN',
              JSON.stringify({
                assignedTo: telecallerId,
                campaignId,
              }),
            ]
          );
        }

        return leadIds;
      });

      res.json({
        message: 'Leads assigned successfully',
        campaignId,
        telecallerId,
        assignedCount: assignedLeads.length,
        leadIds: assignedLeads,
      });
    } catch (error: any) {
      console.error('Error assigning leads:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to assign leads',
      });
    }
  }
);

/**
 * GET /admin/reports/campaign/:campaignId
 * Generate campaign performance report
 */
router.get(
  '/reports/campaign/:campaignId',
  async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;

      // Verify campaign exists
      const campaignResult = await pool.query(
        'SELECT * FROM campaigns WHERE id = $1',
        [campaignId]
      );

      if (campaignResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Campaign not found',
        });
      }

      const campaign = campaignResult.rows[0];

      // Get lead statistics
      const leadsStatsResult = await pool.query(
        `SELECT 
          status,
          COUNT(*) as count,
          COUNT(DISTINCT assigned_to) as unique_assignees
        FROM leads
        WHERE campaign_id = $1
        GROUP BY status`,
        [campaignId]
      );

      const leadsByStatus: Record<string, { count: number; assignees: number }> = {};
      leadsStatsResult.rows.forEach((row) => {
        leadsByStatus[row.status] = {
          count: parseInt(row.count),
          assignees: parseInt(row.unique_assignees),
        };
      });

      // Get telecaller performance
      const telecallerStatsResult = await pool.query(
        `SELECT 
          u.id,
          u.name,
          COUNT(DISTINCT l.id) as leads_assigned,
          COUNT(DISTINCT cl.id) as total_calls,
          COUNT(DISTINCT cl.id) FILTER (WHERE cl.disposition = 'INTERESTED') as interested_calls,
          COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'FIELD_REQUESTED') as field_requests,
          AVG(l.attempt_count) as avg_attempts
        FROM users u
        LEFT JOIN leads l ON l.assigned_to = u.id AND l.campaign_id = $1
        LEFT JOIN call_logs cl ON cl.lead_id = l.id AND cl.user_id = u.id
        WHERE u.role = 'TELECALLER'
          AND u.is_active = true
        GROUP BY u.id, u.name
        HAVING COUNT(DISTINCT l.id) > 0
        ORDER BY field_requests DESC, interested_calls DESC`,
        [campaignId]
      );

      // Get conversion funnel
      const funnelResult = await pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'NEW') as new_leads,
          COUNT(*) FILTER (WHERE status = 'ASSIGNED') as assigned_leads,
          COUNT(*) FILTER (WHERE status = 'CONTACTED') as contacted_leads,
          COUNT(*) FILTER (WHERE status = 'FIELD_REQUESTED') as field_requested_leads,
          COUNT(*) FILTER (WHERE status = 'DROPPED') as dropped_leads
        FROM leads
        WHERE campaign_id = $1`,
        [campaignId]
      );

      const funnel = funnelResult.rows[0];

      // Calculate conversion rates
      const totalLeads = Object.values(leadsByStatus).reduce(
        (sum, stat: any) => sum + stat.count,
        0
      );

      res.json({
        campaign: {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          startDate: campaign.start_date,
          endDate: campaign.end_date,
          isActive: campaign.is_active,
        },
        summary: {
          totalLeads,
          leadsByStatus,
          conversionFunnel: {
            new: parseInt(funnel.new_leads),
            assigned: parseInt(funnel.assigned_leads),
            contacted: parseInt(funnel.contacted_leads),
            fieldRequested: parseInt(funnel.field_requested_leads),
            dropped: parseInt(funnel.dropped_leads),
          },
          conversionRates: {
            assignmentRate:
              totalLeads > 0
                ? ((parseInt(funnel.assigned_leads) / totalLeads) * 100).toFixed(2)
                : '0.00',
            contactRate:
              totalLeads > 0
                ? ((parseInt(funnel.contacted_leads) / totalLeads) * 100).toFixed(2)
                : '0.00',
            fieldRequestRate:
              totalLeads > 0
                ? ((parseInt(funnel.field_requested_leads) / totalLeads) * 100).toFixed(2)
                : '0.00',
          },
        },
        telecallerPerformance: telecallerStatsResult.rows.map((row) => ({
          userId: row.id,
          name: row.name,
          leadsAssigned: parseInt(row.leads_assigned),
          totalCalls: parseInt(row.total_calls),
          interestedCalls: parseInt(row.interested_calls),
          fieldRequests: parseInt(row.field_requests),
          avgAttempts: parseFloat(row.avg_attempts).toFixed(2),
        })),
      });
    } catch (error) {
      console.error('Error generating campaign report:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to generate campaign report',
      });
    }
  }
);

/**
 * GET /admin/audit-logs
 * Get system-wide audit logs with filtering
 */
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const {
      entityType,
      action,
      userId,
      startDate,
      endDate,
      limit = 100,
    } = req.query;

    const filters: any = {};

    if (entityType) filters.entityType = entityType as string;
    if (action) filters.action = action as string;
    if (userId) filters.userId = userId as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const logs = await getRecentAuditLogs(filters, Number(limit));

    res.json({
      logs,
      count: logs.length,
      filters,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch audit logs',
    });
  }
});

/**
 * GET /admin/audit-stats
 * Get audit statistics
 */
router.get('/audit-stats', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await getAuditStatistics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json(stats);
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch audit statistics',
    });
  }
});

/**
 * PATCH /admin/users/:userId/status
 * Activate or deactivate a user
 */
router.patch('/users/:userId/status', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'isActive must be a boolean',
      });
    }

    // Prevent admin from deactivating themselves
    if (userId === req.user!.id && !isActive) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'You cannot deactivate your own account',
      });
    }

    const result = await pool.query(
      `UPDATE users 
       SET is_active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, username, role, is_active`,
      [isActive, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    const user = result.rows[0];

    // Create audit log
    await auditFromRequest(req, 'USER', userId, 'UPDATE', {
      action: isActive ? 'activated' : 'deactivated',
    });

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user,
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user status',
    });
  }
});

/**
 * GET /admin/dashboard
 * Get system-wide statistics for admin dashboard
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    // Get user counts
    const userStatsResult = await pool.query(`
      SELECT 
        role,
        COUNT(*) FILTER (WHERE is_active = true) as active_count,
        COUNT(*) as total_count
      FROM users
      GROUP BY role
    `);

    const userStats: Record<string, { active: number; total: number }> = {};
    userStatsResult.rows.forEach((row) => {
      userStats[row.role] = {
        active: parseInt(row.active_count),
        total: parseInt(row.total_count),
      };
    });

    // Get campaign stats
    const campaignStatsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active
      FROM campaigns
    `);

    const campaignStats = campaignStatsResult.rows[0];

    // Get lead stats
    const leadStatsResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM leads
      GROUP BY status
    `);

    const leadStats: Record<string, number> = {};
    leadStatsResult.rows.forEach((row) => {
      leadStats[row.status] = parseInt(row.count);
    });

    // Get today's activity
    const todayActivityResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT cl.id) as calls_today,
        COUNT(DISTINCT cl.user_id) as active_telecallers,
        COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'FIELD_REQUESTED') as field_requests_today
      FROM call_logs cl
      LEFT JOIN leads l ON cl.lead_id = l.id 
        AND l.updated_at >= CURRENT_DATE
      WHERE cl.created_at >= CURRENT_DATE
    `);

    const todayActivity = todayActivityResult.rows[0];

    res.json({
      users: userStats,
      campaigns: {
        total: parseInt(campaignStats.total),
        active: parseInt(campaignStats.active),
      },
      leads: leadStats,
      todayActivity: {
        callsToday: parseInt(todayActivity.calls_today),
        activeTelecallers: parseInt(todayActivity.active_telecallers),
        fieldRequestsToday: parseInt(todayActivity.field_requests_today),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch dashboard data',
    });
  }
});

export default router;
