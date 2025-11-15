/**
 * Audit Logger
 * Tracks all administrative actions for compliance and security
 */

import type { AuditLog } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  EXPORT = 'export',
  IMPORT = 'import',
  ROLE_ASSIGN = 'role_assign',
  ROLE_REVOKE = 'role_revoke',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export class AuditLogger {
  private logs: AuditLog[] = []

  constructor() {
    // Load existing logs from localStorage
    const stored = localStorage.getItem('ams-audit-logs')
    if (stored) {
      try {
        this.logs = JSON.parse(stored)
      } catch (e) {
        console.error('Failed to load audit logs:', e)
        this.logs = []
      }
    }
  }

  /**
   * Log an action
   */
  async log(
    userId: string,
    userName: string,
    action: AuditAction,
    entity: string,
    entityId: string,
    changes?: Record<string, { old: any; new: any }>,
    metadata?: Record<string, any>
  ): Promise<AuditLog> {
    const auditLog: AuditLog = {
      id: uuidv4(),
      userId,
      userName,
      action,
      entity,
      entityId,
      changes,
      metadata,
      timestamp: new Date().toISOString(),
      ipAddress: 'demo', // In production, would capture real IP
      userAgent: navigator.userAgent,
    }

    this.logs.push(auditLog)
    this.save()

    return auditLog
  }

  /**
   * Log a role assignment
   */
  async logRoleAssignment(
    userId: string,
    userName: string,
    targetUserId: string,
    targetUserName: string,
    oldRole: string,
    newRole: string,
    reason?: string
  ): Promise<AuditLog> {
    return this.log(
      userId,
      userName,
      AuditAction.ROLE_ASSIGN,
      'user',
      targetUserId,
      {
        role: { old: oldRole, new: newRole },
      },
      {
        targetUserName,
        reason,
      }
    )
  }

  /**
   * Query audit logs
   */
  query(filters: {
    userId?: string
    entity?: string
    action?: AuditAction
    startDate?: Date
    endDate?: Date
  }): AuditLog[] {
    let filtered = [...this.logs]

    if (filters.userId) {
      filtered = filtered.filter((log) => log.userId === filters.userId)
    }

    if (filters.entity) {
      filtered = filtered.filter((log) => log.entity === filters.entity)
    }

    if (filters.action) {
      filtered = filtered.filter((log) => log.action === filters.action)
    }

    if (filters.startDate) {
      filtered = filtered.filter(
        (log) => new Date(log.timestamp) >= filters.startDate!
      )
    }

    if (filters.endDate) {
      filtered = filtered.filter(
        (log) => new Date(log.timestamp) <= filters.endDate!
      )
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  /**
   * Get all logs
   */
  getAll(): AuditLog[] {
    return [...this.logs].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  /**
   * Get recent logs
   */
  getRecent(limit: number = 10): AuditLog[] {
    return this.getAll().slice(0, limit)
  }

  /**
   * Clear all logs (for demo purposes)
   */
  clear(): void {
    this.logs = []
    this.save()
  }

  /**
   * Save logs to localStorage
   */
  private save(): void {
    try {
      localStorage.setItem('ams-audit-logs', JSON.stringify(this.logs))
    } catch (e) {
      console.error('Failed to save audit logs:', e)
    }
  }
}

// Singleton instance
export const auditLogger = new AuditLogger()
