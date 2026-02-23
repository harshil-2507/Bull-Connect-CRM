/**
 * Role-Based Access Control Middleware - Production Grade
 * 
 * Provides granular access control with:
 * - Role-based route protection
 * - Ownership verification
 * - Resource-level permissions
 */

import { Request, Response, NextFunction } from 'express';
import { Role } from '../types/roles';
import { pool } from '../config/db';

/**
 * Require user to have one of the specified roles
 * 
 * @example
 * router.get('/admin', requireRole(['ADMIN']), handler)
 * router.get('/reports', requireRole(['ADMIN', 'MANAGER']), handler)
 */
export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Verify lead is assigned to the current user
 * Used by telecallers to ensure they only access their assigned leads
 */
export async function requireLeadOwnership(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const leadId = req.params.leadId || req.body.leadId;
  
  if (!leadId) {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'Lead ID is required'
    });
  }

  try {
    const result = await pool.query(
      'SELECT assigned_to FROM leads WHERE id = $1',
      [leadId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Lead not found'
      });
    }

    const lead = result.rows[0];

    // Admins and managers can access all leads
    if (['ADMIN', 'MANAGER'].includes(req.user.role)) {
      return next();
    }

    // Others can only access their assigned leads
    if (lead.assigned_to !== req.user.id) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You can only access leads assigned to you'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking lead ownership:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to verify lead ownership'
    });
  }
}

/**
 * Verify user owns the campaign or is admin/manager
 */
export async function requireCampaignOwnership(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const campaignId = req.params.campaignId || req.body.campaignId;
  
  if (!campaignId) {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'Campaign ID is required'
    });
  }

  try {
    const result = await pool.query(
      'SELECT created_by FROM campaigns WHERE id = $1',
      [campaignId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Campaign not found'
      });
    }

    const campaign = result.rows[0];

    // Admins can access all campaigns
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Managers can access campaigns they created
    if (req.user.role === 'MANAGER' && campaign.created_by === req.user.id) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'You can only access campaigns you created'
    });
  } catch (error) {
    console.error('Error checking campaign ownership:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to verify campaign ownership'
    });
  }
}

/**
 * Verify lead status is appropriate for user role
 * - TELECALLER: Can only access ASSIGNED or CONTACTED leads
 * - FIELD_EXEC: Can only access FIELD_REQUESTED leads
 * - FIELD_MANAGER: Can access FIELD_REQUESTED and CONTACTED leads
 */
export async function requireAppropriateLeadStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const leadId = req.params.leadId || req.body.leadId;
  
  if (!leadId) {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'Lead ID is required'
    });
  }

  try {
    const result = await pool.query(
      'SELECT status FROM leads WHERE id = $1',
      [leadId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'Lead not found'
      });
    }

    const { status } = result.rows[0];

    // Define allowed statuses per role
    const allowedStatuses: Record<Role, string[]> = {
      ADMIN: ['NEW', 'ASSIGNED', 'CONTACTED', 'FIELD_REQUESTED', 'DROPPED'],
      MANAGER: ['NEW', 'ASSIGNED', 'CONTACTED', 'FIELD_REQUESTED', 'DROPPED'],
      TELECALLER: ['ASSIGNED', 'CONTACTED'],
      FIELD_MANAGER: ['FIELD_REQUESTED', 'CONTACTED'],
      FIELD_EXEC: ['FIELD_REQUESTED'],
    };

    const userAllowedStatuses = allowedStatuses[req.user.role] || [];

    if (!userAllowedStatuses.includes(status)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Your role (${req.user.role}) cannot access leads with status ${status}`
      });
    }

    next();
  } catch (error) {
    console.error('Error checking lead status:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to verify lead status'
    });
  }
}

/**
 * Combine ownership and status checks for telecaller actions
 */
export const requireTelecallerAccess = [
  requireRole(['TELECALLER', 'MANAGER', 'ADMIN']),
  requireLeadOwnership,
  requireAppropriateLeadStatus,
];

/**
 * Combine ownership and status checks for field exec actions
 */
export const requireFieldExecAccess = [
  requireRole(['FIELD_EXEC', 'FIELD_MANAGER', 'ADMIN']),
  requireLeadOwnership,
  requireAppropriateLeadStatus,
];

/**
 * Check if user is active
 */
export async function requireActiveUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await pool.query(
      'SELECT is_active FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Your account has been deactivated'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking user status:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to verify user status'
    });
  }
}

/**
 * Rate limiting per user (simple implementation)
 * For production, consider using Redis-based rate limiting
 */
const userRequestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(); // Auth middleware will handle this
    }

    const userId = req.user.id;
    const now = Date.now();
    
    let userRecord = userRequestCounts.get(userId);
    
    // Reset if window expired
    if (!userRecord || userRecord.resetAt < now) {
      userRecord = { count: 0, resetAt: now + windowMs };
      userRequestCounts.set(userId, userRecord);
    }

    userRecord.count++;

    if (userRecord.count > maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((userRecord.resetAt - now) / 1000),
      });
    }

    next();
  };
}
