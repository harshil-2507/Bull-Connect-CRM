/**
 * Audit Logging Service - Production Grade
 * 
 * Provides comprehensive audit trail for:
 * - User actions
 * - Entity changes
 * - Security events
 * - Compliance tracking
 */

import { PoolClient } from 'pg';
import { pool } from '../config/db';
import { Request } from 'express';

export type EntityType = 'USER' | 'CAMPAIGN' | 'LEAD' | 'ASSIGNMENT' | 'CALL_LOG';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'STATUS_CHANGE';

export interface AuditLogEntry {
  userId?: string;
  entityType: EntityType;
  entityId: string;
  action: AuditAction;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  entry: AuditLogEntry,
  client?: PoolClient
): Promise<string> {
  const executor = client || pool;

  const result = await executor.query(
    `INSERT INTO audit_logs (
      user_id,
      entity_type,
      entity_id,
      action,
      metadata,
      ip_address,
      user_agent,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING id`,
    [
      entry.userId || null,
      entry.entityType,
      entry.entityId,
      entry.action,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
      entry.ipAddress || null,
      entry.userAgent || null,
    ]
  );

  return result.rows[0].id;
}

/**
 * Create audit log from Express request
 */
export async function auditFromRequest(
  req: Request,
  entityType: EntityType,
  entityId: string,
  action: AuditAction,
  metadata?: Record<string, any>
): Promise<string> {
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.get('user-agent');

  return createAuditLog({
    userId: req.user?.id,
    entityType,
    entityId,
    action,
    metadata,
    ipAddress,
    userAgent,
  });
}

/**
 * Get audit logs for an entity
 */
export async function getEntityAuditLogs(
  entityType: EntityType,
  entityId: string,
  limit: number = 100
): Promise<any[]> {
  const result = await pool.query(
    `SELECT 
      al.id,
      al.user_id,
      u.name as user_name,
      u.role as user_role,
      al.entity_type,
      al.entity_id,
      al.action,
      al.metadata,
      al.ip_address,
      al.user_agent,
      al.created_at
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.entity_type = $1 AND al.entity_id = $2
    ORDER BY al.created_at DESC
    LIMIT $3`,
    [entityType, entityId, limit]
  );

  return result.rows;
}

/**
 * Get audit logs for a user's actions
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 100
): Promise<any[]> {
  const result = await pool.query(
    `SELECT 
      al.id,
      al.entity_type,
      al.entity_id,
      al.action,
      al.metadata,
      al.ip_address,
      al.created_at
    FROM audit_logs al
    WHERE al.user_id = $1
    ORDER BY al.created_at DESC
    LIMIT $2`,
    [userId, limit]
  );

  return result.rows;
}

/**
 * Get recent audit logs (admin view)
 */
export async function getRecentAuditLogs(
  filters?: {
    entityType?: EntityType;
    action?: AuditAction;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  },
  limit: number = 100
): Promise<any[]> {
  let query = `
    SELECT 
      al.id,
      al.user_id,
      u.name as user_name,
      u.role as user_role,
      al.entity_type,
      al.entity_id,
      al.action,
      al.metadata,
      al.ip_address,
      al.created_at
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;

  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.entityType) {
    query += ` AND al.entity_type = $${paramIndex++}`;
    params.push(filters.entityType);
  }

  if (filters?.action) {
    query += ` AND al.action = $${paramIndex++}`;
    params.push(filters.action);
  }

  if (filters?.userId) {
    query += ` AND al.user_id = $${paramIndex++}`;
    params.push(filters.userId);
  }

  if (filters?.startDate) {
    query += ` AND al.created_at >= $${paramIndex++}`;
    params.push(filters.startDate);
  }

  if (filters?.endDate) {
    query += ` AND al.created_at <= $${paramIndex++}`;
    params.push(filters.endDate);
  }

  query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex}`;
  params.push(limit);

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Audit middleware - automatically log all STATE_CHANGE actions
 */
export function auditMiddleware(
  entityType: EntityType,
  action: AuditAction,
  options?: {
    getEntityId?: (req: Request) => string;
    getMetadata?: (req: Request) => Record<string, any>;
  }
) {
  return async (req: Request, res: any, next: any) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to capture response
    res.json = (body: any) => {
      // Only audit successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = options?.getEntityId
          ? options.getEntityId(req)
          : req.params.id || body.id;

        const metadata = options?.getMetadata
          ? options.getMetadata(req)
          : {
              method: req.method,
              path: req.path,
              body: req.body,
            };

        // Don't await - fire and forget
        auditFromRequest(req, entityType, entityId, action, metadata).catch(
          (error) => {
            console.error('Failed to create audit log:', error);
          }
        );
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Security event logging (login, logout, failed auth)
 */
export async function logSecurityEvent(
  event: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'PASSWORD_CHANGE',
  userId: string | null,
  metadata: Record<string, any>,
  req?: Request
): Promise<void> {
  const ipAddress = req?.ip || req?.socket.remoteAddress;
  const userAgent = req?.get('user-agent');

  await pool.query(
    `INSERT INTO audit_logs (
      user_id,
      entity_type,
      entity_id,
      action,
      metadata,
      ip_address,
      user_agent,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      userId,
      'USER',
      userId || 'SYSTEM',
      'UPDATE',
      JSON.stringify({ event, ...metadata }),
      ipAddress || null,
      userAgent || null,
    ]
  );
}

/**
 * Get security events (admin only)
 */
export async function getSecurityEvents(
  filters?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  },
  limit: number = 100
): Promise<any[]> {
  let query = `
    SELECT 
      al.id,
      al.user_id,
      u.name as user_name,
      al.metadata,
      al.ip_address,
      al.user_agent,
      al.created_at
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.entity_type = 'USER'
      AND al.metadata->>'event' IN ('LOGIN', 'LOGOUT', 'FAILED_LOGIN', 'PASSWORD_CHANGE')
  `;

  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.userId) {
    query += ` AND al.user_id = $${paramIndex++}`;
    params.push(filters.userId);
  }

  if (filters?.startDate) {
    query += ` AND al.created_at >= $${paramIndex++}`;
    params.push(filters.startDate);
  }

  if (filters?.endDate) {
    query += ` AND al.created_at <= $${paramIndex++}`;
    params.push(filters.endDate);
  }

  query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex}`;
  params.push(limit);

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get audit statistics
 */
export async function getAuditStatistics(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalEvents: number;
  eventsByType: Record<EntityType, number>;
  eventsByAction: Record<AuditAction, number>;
  topUsers: Array<{ userId: string; userName: string; eventCount: number }>;
}> {
  let dateFilter = '';
  const params: any[] = [];
  
  if (startDate) {
    dateFilter += ' AND created_at >= $1';
    params.push(startDate);
  }
  
  if (endDate) {
    dateFilter += ` AND created_at <= $${params.length + 1}`;
    params.push(endDate);
  }

  // Total events
  const totalResult = await pool.query(
    `SELECT COUNT(*) as count FROM audit_logs WHERE 1=1 ${dateFilter}`,
    params
  );

  // Events by type
  const typeResult = await pool.query(
    `SELECT entity_type, COUNT(*) as count 
     FROM audit_logs 
     WHERE 1=1 ${dateFilter}
     GROUP BY entity_type`,
    params
  );

  // Events by action
  const actionResult = await pool.query(
    `SELECT action, COUNT(*) as count 
     FROM audit_logs 
     WHERE 1=1 ${dateFilter}
     GROUP BY action`,
    params
  );

  // Top users
  const usersResult = await pool.query(
    `SELECT 
      al.user_id,
      u.name as user_name,
      COUNT(*) as event_count
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     WHERE al.user_id IS NOT NULL ${dateFilter}
     GROUP BY al.user_id, u.name
     ORDER BY event_count DESC
     LIMIT 10`,
    params
  );

  const eventsByType: Record<string, number> = {};
  typeResult.rows.forEach((row) => {
    eventsByType[row.entity_type] = parseInt(row.count);
  });

  const eventsByAction: Record<string, number> = {};
  actionResult.rows.forEach((row) => {
    eventsByAction[row.action] = parseInt(row.count);
  });

  const topUsers = usersResult.rows.map((row) => ({
    userId: row.user_id,
    userName: row.user_name,
    eventCount: parseInt(row.event_count),
  }));

  return {
    totalEvents: parseInt(totalResult.rows[0].count),
    eventsByType: eventsByType as any,
    eventsByAction: eventsByAction as any,
    topUsers,
  };
}
