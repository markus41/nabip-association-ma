import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Shield,
  Users,
  Buildings,
  ChartBar,
  GearSix,
  Plugs,
  FileText,
  MagnifyingGlass,
  Download,
  Plus,
  Warning,
  CheckCircle,
  XCircle,
  Clock
} from '@phosphor-icons/react'
import { formatDate, formatCurrency } from '@/lib/data-utils'
import type { User, AuditLog, SystemConfig, Integration, Member, Chapter, Event } from '@/lib/types'
import { toast } from 'sonner'

interface NationalAdminViewProps {
  users: User[]
  auditLogs: AuditLog[]
  systemConfig: SystemConfig[]
  integrations: Integration[]
  members: Member[]
  chapters: Chapter[]
  events: Event[]
  loading?: boolean
}

export function NationalAdminView({
  users,
  auditLogs,
  systemConfig,
  integrations,
  members,
  chapters,
  events,
  loading
}: NationalAdminViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState('overview')

  // Calculate system-wide statistics
  const stats = useMemo(() => {
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.isActive).length
    const adminUsers = users.filter(u => u.role !== 'member').length
    const recentLogins = users.filter(u => {
      if (!u.lastLoginAt) return false
      const daysSinceLogin = (Date.now() - new Date(u.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceLogin <= 7
    }).length

    const totalChapters = chapters.length
    const totalMembers = members.length
    const activeMembers = members.filter(m => m.status === 'active').length
    const totalEvents = events.length
    const upcomingEvents = events.filter(e => new Date(e.startDate) > new Date()).length

    const activeIntegrations = integrations.filter(i => i.status === 'active').length
    const recentAuditActions = auditLogs.filter(log => {
      const hoursSince = (Date.now() - new Date(log.timestamp).getTime()) / (1000 * 60 * 60)
      return hoursSince <= 24
    }).length

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      recentLogins,
      totalChapters,
      totalMembers,
      activeMembers,
      totalEvents,
      upcomingEvents,
      activeIntegrations,
      recentAuditActions
    }
  }, [users, chapters, members, events, integrations, auditLogs])

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users
    const term = searchTerm.toLowerCase()
    return users.filter(u =>
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    )
  }, [users, searchTerm])

  // Group audit logs by date
  const groupedAuditLogs = useMemo(() => {
    const groups: Record<string, AuditLog[]> = {}
    auditLogs.slice(0, 50).forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString()
      if (!groups[date]) groups[date] = []
      groups[date].push(log)
    })
    return groups
  }, [auditLogs])

  // Group system config by category
  const groupedConfig = useMemo(() => {
    const groups: Record<string, SystemConfig[]> = {}
    systemConfig.forEach(config => {
      if (!groups[config.category]) groups[config.category] = []
      groups[config.category].push(config)
    })
    return groups
  }, [systemConfig])

  const handleExportData = (type: string) => {
    toast.success('Export Started', {
      description: `Preparing ${type} data export...`
    })
  }

  const handleManageUser = (userId: string) => {
    toast.info('User Management', {
      description: `Opening user management for ${userId}`
    })
  }

  const handleEditConfig = (configId: string) => {
    toast.info('Edit Configuration', {
      description: 'Configuration editor would open here'
    })
  }

  const handleTestIntegration = (integrationId: string) => {
    toast.info('Testing Integration', {
      description: 'Running integration connectivity test...'
    })
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'national_admin': return 'destructive'
      case 'state_admin': return 'default'
      case 'chapter_admin': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} weight="fill" className="text-green-600" />
      case 'inactive': return <XCircle size={16} weight="fill" className="text-gray-400" />
      case 'error': return <Warning size={16} weight="fill" className="text-red-600" />
      default: return <Clock size={16} weight="fill" className="text-yellow-600" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">National Admin</h1>
            <p className="text-muted-foreground">System-wide administration and monitoring</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">National Admin</h1>
          <p className="text-muted-foreground">
            System-wide administration, monitoring, and configuration
          </p>
        </div>
        <Button onClick={() => handleExportData('system-report')}>
          <Download size={16} weight="bold" className="mr-2" />
          System Report
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.adminUsers} admins
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Users size={24} weight="duotone" className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Chapters</p>
              <p className="text-2xl font-bold">{stats.totalChapters}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalMembers.toLocaleString()} total members
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Buildings size={24} weight="duotone" className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Integrations</p>
              <p className="text-2xl font-bold">{stats.activeIntegrations}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {integrations.length} total configured
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Plugs size={24} weight="duotone" className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Audit Actions (24h)</p>
              <p className="text-2xl font-bold">{stats.recentAuditActions}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.recentLogins} recent logins
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Shield size={24} weight="duotone" className="text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <ChartBar size={16} weight="bold" className="mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users size={16} weight="bold" className="mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="config">
            <GearSix size={16} weight="bold" className="mr-2" />
            System Config
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Plugs size={16} weight="bold" className="mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileText size={16} weight="bold" className="mr-2" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">System Health</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Users</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{stats.activeUsers}/{stats.totalUsers}</span>
                    <Badge variant="outline" className="bg-green-50">
                      {Math.round((stats.activeUsers / stats.totalUsers) * 100)}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Members</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{stats.activeMembers}/{stats.totalMembers}</span>
                    <Badge variant="outline" className="bg-green-50">
                      {Math.round((stats.activeMembers / stats.totalMembers) * 100)}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Upcoming Events</span>
                  <span className="text-sm font-medium">{stats.upcomingEvents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Integration Status</span>
                  <Badge variant="outline" className="bg-green-50">
                    {stats.activeIntegrations} Active
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => handleExportData('users')}>
                  <Download size={16} weight="bold" className="mr-2" />
                  Export All Users
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleExportData('members')}>
                  <Download size={16} weight="bold" className="mr-2" />
                  Export All Members
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleExportData('chapters')}>
                  <Download size={16} weight="bold" className="mr-2" />
                  Export Chapter Data
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleExportData('audit-logs')}>
                  <Download size={16} weight="bold" className="mr-2" />
                  Export Audit Logs
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">User Accounts</h3>
              <Button size="sm" onClick={() => toast.info('Create user dialog would open')}>
                <Plus size={16} weight="bold" className="mr-2" />
                Add User
              </Button>
            </div>
            
            <div className="relative mb-4">
              <MagnifyingGlass size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2">
              {filteredUsers.slice(0, 20).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.name}</p>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                        {!user.isActive && (
                          <Badge variant="outline" className="bg-red-50">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.lastLoginAt && (
                      <span className="text-xs text-muted-foreground">
                        Last login: {formatDate(user.lastLoginAt)}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleManageUser(user.id)}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredUsers.length > 20 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  Load More ({filteredUsers.length - 20} remaining)
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* System Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          {Object.entries(groupedConfig).map(([category, configs]) => (
            <Card key={category} className="p-6">
              <h3 className="font-semibold mb-4 capitalize">{category} Settings</h3>
              <div className="space-y-3">
                {configs.map((config) => (
                  <div
                    key={config.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{config.key.replace(/_/g, ' ')}</p>
                        {config.isPublic && (
                          <Badge variant="outline" className="text-xs">Public</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                      <p className="text-sm font-mono mt-1">{config.value}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditConfig(config.id)}
                    >
                      <GearSix size={16} weight="bold" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">External Integrations</h3>
              <Button size="sm" onClick={() => toast.info('Add integration dialog would open')}>
                <Plus size={16} weight="bold" className="mr-2" />
                Add Integration
              </Button>
            </div>
            
            <div className="space-y-3">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Plugs size={24} weight="duotone" className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{integration.name}</p>
                        {getStatusIcon(integration.status)}
                        <Badge variant="outline" className="capitalize">
                          {integration.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Last sync: {integration.lastSyncAt ? formatDate(integration.lastSyncAt) : 'Never'}
                      </p>
                      {integration.errorMessage && (
                        <p className="text-sm text-red-600 mt-1">
                          {integration.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestIntegration(integration.id)}
                    >
                      Test
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast.info('Configure integration')}
                    >
                      <GearSix size={16} weight="bold" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">System Audit Log</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportData('audit-logs')}
              >
                <Download size={16} weight="bold" className="mr-2" />
                Export
              </Button>
            </div>

            <div className="space-y-4">
              {Object.entries(groupedAuditLogs).map(([date, logs]) => (
                <div key={date}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">{date}</h4>
                  <div className="space-y-1">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 rounded-lg border text-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{log.action}</span>
                            <span className="text-muted-foreground">{log.entity}</span>
                            <Badge variant="outline" className="text-xs">
                              {log.entityId}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">
                            User: {log.userId} • IP: {log.ipAddress}
                          </p>
                          {log.changes && (
                            <pre className="mt-1 text-xs bg-muted p-2 rounded">
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
