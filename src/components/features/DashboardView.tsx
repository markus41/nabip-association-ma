import { StatCard } from './StatCard'
import { PersonalizedGreeting } from './PersonalizedGreeting'
import { SmartNotifications, SmartNotificationData } from './SmartNotification'
import { MemberGrowthChart } from './MemberGrowthChart'
import { UserCircle, CalendarDots, CurrencyDollar, EnvelopeSimple, Users, Warning } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DashboardStats, Event, Transaction } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/data-utils'
import { CustomLineChart, CustomBarChart } from './ChartComponents'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'

interface DashboardViewProps {
  stats: DashboardStats
  upcomingEvents: Event[]
  recentTransactions: Transaction[]
  loading?: boolean
}

export function DashboardView({ stats, upcomingEvents, recentTransactions, loading }: DashboardViewProps) {
  const { user } = useAuth()
  const userName = user?.name || 'Demo User'
  const userRole = user?.role || 'member'

  const dailyChanges = [
    { label: 'New Members', value: 3, isPositive: true },
    { label: 'Event Registrations', value: 12, isPositive: true },
    { label: 'Revenue', value: -2, isPositive: false },
  ]

  const generateSmartNotifications = (): SmartNotificationData[] => {
    const notifications: SmartNotificationData[] = []

    if (stats.pendingRenewals && stats.pendingRenewals > 20) {
      const renewalRate = 100 - Math.floor((stats.pendingRenewals / stats.activeMembers) * 100)
      notifications.push({
        id: 'renewal-alert',
        severity: 'warning',
        title: 'Renewal Rate Requires Attention',
        message: `Renewal rate dropped 5% this week - ${stats.pendingRenewals} members need immediate outreach to prevent lapsing.`,
        actionLabel: 'View Members',
        onAction: () => toast.info('Navigate to Members view'),
        metric: `${renewalRate}% renewal rate`
      })
    }

    if (stats.expiringSoon && stats.expiringSoon > 15) {
      notifications.push({
        id: 'expiring-alert',
        severity: 'critical',
        title: 'Critical: Members in Grace Period',
        message: `${stats.expiringSoon} members are expired or in grace period. Act now to retain these memberships and prevent revenue loss.`,
        actionLabel: 'Take Action',
        onAction: () => toast.info('Opening retention campaign'),
      })
    }

    const upcomingThisWeek = upcomingEvents.filter(e => {
      const daysUntil = Math.floor((new Date(e.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 7 && e.registeredCount < e.capacity * 0.5
    }).length

    if (upcomingThisWeek > 0) {
      notifications.push({
        id: 'event-registration',
        severity: 'info',
        title: 'Low Event Registration',
        message: `${upcomingThisWeek} events this week have low attendance. Consider sending reminder emails to boost participation.`,
        actionLabel: 'Send Reminders',
        onAction: () => toast.success('Preparing event reminder campaign'),
      })
    }

    if (stats.revenueGrowth < 0) {
      notifications.push({
        id: 'revenue-decline',
        severity: 'warning',
        title: 'Revenue Trend Alert',
        message: `Revenue is down ${Math.abs(stats.revenueGrowth)}% compared to last period. Review payment processing and follow up on outstanding invoices.`,
        actionLabel: 'View Finance',
        onAction: () => toast.info('Navigate to Finance view'),
      })
    }

    return notifications
  }

  const smartNotifications = generateSmartNotifications()

  const getEventUrgency = (event: Event): { color: string; bgColor: string; label: string } => {
    const daysUntil = Math.floor((new Date(event.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil <= 7) {
      return { 
        color: 'text-destructive', 
        bgColor: 'bg-destructive/10 border-destructive/20', 
        label: 'This Week' 
      }
    } else if (daysUntil <= 14) {
      return { 
        color: 'text-accent', 
        bgColor: 'bg-accent/10 border-accent/20', 
        label: 'Next Week' 
      }
    } else {
      return { 
        color: 'text-teal', 
        bgColor: 'bg-teal/10 border-teal/20', 
        label: 'Upcoming' 
      }
    }
  }

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-destructive'
    if (percentage >= 70) return 'bg-accent'
    return 'bg-teal'
  }

  const memberTrendData = [
    { month: 'Jan', active: 18500, pending: 420 },
    { month: 'Feb', active: 18750, pending: 380 },
    { month: 'Mar', active: 19100, pending: 350 },
    { month: 'Apr', active: 19400, pending: 410 },
    { month: 'May', active: 19800, pending: 390 },
    { month: 'Jun', active: 20150, pending: 360 },
  ]

  const revenueByTypeData = [
    { type: 'Membership Dues', amount: 1650000 },
    { type: 'Event Registrations', amount: 478000 },
    { type: 'Donations', amount: 100000 },
    { type: 'Sponsorships', amount: 125000 },
    { type: 'Other', amount: 47000 },
  ]

  return (
    <div className="space-y-6">
      <PersonalizedGreeting
        userName={userName}
        userRole={userRole}
        dailyChanges={dailyChanges}
        loading={loading}
      />

      {smartNotifications.length > 0 && (
        <SmartNotifications notifications={smartNotifications} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Members"
          value={loading ? '...' : stats.totalMembers.toLocaleString()}
          trend={stats.memberGrowth}
          trendLabel="vs yesterday"
          icon={<UserCircle size={24} weight="duotone" />}
          loading={loading}
        />
        <StatCard
          title="Active Members"
          value={loading ? '...' : stats.activeMembers.toLocaleString()}
          trend={2.3}
          trendLabel="vs yesterday"
          icon={<Users size={24} weight="duotone" />}
          loading={loading}
        />
        <StatCard
          title="Total Revenue"
          value={loading ? '...' : formatCurrency(stats.totalRevenue)}
          trend={stats.revenueGrowth}
          trendLabel="vs yesterday"
          icon={<CurrencyDollar size={24} weight="duotone" />}
          loading={loading}
        />
        <StatCard
          title="Upcoming Events"
          value={loading ? '...' : stats.upcomingEvents}
          trend={5}
          trendLabel="vs yesterday"
          icon={<CalendarDots size={24} weight="duotone" />}
          loading={loading}
        />
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Upcoming Events</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Color-coded by urgency and registration progress
            </p>
          </div>
          <CalendarDots size={20} className="text-muted-foreground" />
        </div>
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg bg-muted animate-shimmer h-24" />
            ))
          ) : upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No upcoming events
            </p>
          ) : (
            upcomingEvents.slice(0, 5).map((event) => {
              const urgency = getEventUrgency(event)
              const percentage = Math.round((event.registeredCount / event.capacity) * 100)
              const progressColor = getProgressColor(percentage)

              return (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border transition-all hover:shadow-md ${urgency.bgColor}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">{event.name}</h3>
                        <Badge variant="outline" className={`shrink-0 ${urgency.color} border-current`}>
                          {urgency.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.startDate, true)} • {event.location}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Registration Progress</span>
                      <span className="font-semibold tabular-nums">
                        {event.registeredCount}/{event.capacity} ({percentage}% full)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${progressColor} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <EnvelopeSimple size={20} className="text-muted-foreground" />
          <h2 className="text-lg font-semibold">Email Engagement</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
              Emails Sent
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {loading ? '...' : stats.emailsSent.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
              Avg Engagement
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {loading ? '...' : `${stats.avgEngagementScore}%`}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
              Active Campaigns
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {loading ? '...' : '12'}
            </p>
          </div>
        </div>
      </Card>

      <MemberGrowthChart loading={loading} />

      <CustomBarChart
        data={revenueByTypeData}
        bars={[
          { dataKey: 'amount', name: 'Revenue', color: 'oklch(0.25 0.05 250)' },
        ]}
        xAxisKey="type"
        title="Revenue Sources"
        description="YTD revenue breakdown by category"
        loading={loading}
      />

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <CurrencyDollar size={20} className="text-muted-foreground" />
        </div>
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2">
                <div className="h-4 w-32 bg-muted animate-shimmer rounded" />
                <div className="h-4 w-16 bg-muted animate-shimmer rounded" />
              </div>
            ))
          ) : recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent transactions
            </p>
          ) : (
            recentTransactions.slice(0, 8).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(transaction.date)}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    transaction.amount >= 0 ? 'text-teal' : 'text-destructive'
                  }`}
                >
                  {transaction.amount >= 0 ? '+' : ''}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

export default DashboardView
