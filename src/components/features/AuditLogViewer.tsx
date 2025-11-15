/**
 * Audit Log Viewer
 * Displays audit logs for administrative actions
 */

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MagnifyingGlass, FileText } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { auditLogger, AuditAction } from '@/lib/audit/audit-logger'
import type { AuditLog } from '@/lib/types'

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')

  useEffect(() => {
    // Load logs
    setLogs(auditLogger.getAll())
  }, [])

  // Refresh logs periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(auditLogger.getAll())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    const matchesEntity = entityFilter === 'all' || log.entity === entityFilter

    return matchesSearch && matchesAction && matchesEntity
  })

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case AuditAction.CREATE:
        return 'default'
      case AuditAction.UPDATE:
        return 'secondary'
      case AuditAction.DELETE:
        return 'destructive'
      case AuditAction.ROLE_ASSIGN:
        return 'default'
      case AuditAction.LOGIN:
        return 'outline'
      default:
        return 'outline'
    }
  }

  const formatChanges = (log: AuditLog) => {
    if (!log.changes) return null

    return Object.entries(log.changes)
      .map(([key, value]) => {
        if (typeof value === 'object' && 'old' in value && 'new' in value) {
          return `${key}: ${value.old} → ${value.new}`
        }
        return `${key}: ${JSON.stringify(value)}`
      })
      .join(', ')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">
          View all administrative actions and changes
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Action</Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {Object.values(AuditAction).map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Entity</Label>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="chapter">Chapter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card>
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No audit logs found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Changes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.userName}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.userId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.entity}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.entityId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate text-sm text-muted-foreground">
                      {formatChanges(log) || log.metadata?.reason || '-'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredLogs.length} of {logs.length} logs
        </span>
      </div>
    </div>
  )
}
