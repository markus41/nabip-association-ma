import { StatCard } from './StatCard'
import { UserCircle, CalendarDots, CurrencyDollar, EnvelopeSimple } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DashboardStats, Event, Transaction } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/data-utils'
import { CustomLineChart, CustomBarChart } from './ChartComponents'

interface DashboardViewProps {
  stats: DashboardStats
  upcomingEvents: Event[]
  recentTransactions: Transaction[]
  loading?: boolean
}

export function DashboardView({ stats, upcomingEvents, recentTransactions, loading }: DashboardViewProps) {
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
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to the NABIP Association Management System
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Members"
          value={loading ? '...' : stats.totalMembers.toLocaleString()}
          trend={stats.memberGrowth}
          icon={<UserCircle size={24} weight="duotone" />}
          loading={loading}
        />
        <StatCard
          title="Active Members"
          value={loading ? '...' : stats.activeMembers.toLocaleString()}
          icon={<UserCircle size={24} weight="duotone" />}
          loading={loading}
        />
        <StatCard
          title="Total Revenue"
          value={loading ? '...' : formatCurrency(stats.totalRevenue)}
          trend={stats.revenueGrowth}
          icon={<CurrencyDollar size={24} weight="duotone" />}
          loading={loading}
        />
        <StatCard
          title="Upcoming Events"
          value={loading ? '...' : stats.upcomingEvents}
          icon={<CalendarDots size={24} weight="duotone" />}
          loading={loading}
        />
      </div>

      {(stats.pendingRenewals! > 0 || stats.expiringSoon! > 0) && (
        <Card className="p-4 border-accent bg-accent/5">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Membership Alerts</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                {stats.pendingRenewals! > 0 && (
                  <p>• {stats.pendingRenewals} members have renewals due within 30 days</p>
                )}
                {stats.expiringSoon! > 0 && (
                  <p>• {stats.expiringSoon} members are expired or in grace period</p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm">View Details</Button>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Upcoming Events</h2>
          <CalendarDots size={20} className="text-muted-foreground" />
        </div>
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted animate-shimmer h-20" />
            ))
          ) : upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No upcoming events
            </p>
          ) : (
            upcomingEvents.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{event.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(event.startDate, true)}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2 shrink-0">
                    {event.registeredCount}/{event.capacity}
                  </Badge>
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal transition-all"
                    style={{
                      width: `${(event.registeredCount / event.capacity) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomLineChart
          data={memberTrendData}
          lines={[
            { dataKey: 'active', name: 'Active Members', color: 'oklch(0.25 0.05 250)' },
            { dataKey: 'pending', name: 'Pending Approvals', color: 'oklch(0.60 0.12 200)' },
          ]}
          xAxisKey="month"
          title="Member Trends"
          description="Six-month membership growth and pending applications"
          loading={loading}
        />

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
      </div>

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
