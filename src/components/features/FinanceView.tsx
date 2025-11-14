import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  CurrencyDollar, 
  TrendUp,
  Download,
  Receipt,
  ChartBar
} from '@phosphor-icons/react'
import type { Transaction } from '@/lib/types'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/data-utils'

interface FinanceViewProps {
  transactions: Transaction[]
  loading?: boolean
}

export function FinanceView({ transactions, loading }: FinanceViewProps) {
  const stats = useMemo(() => {
    const completed = transactions.filter(t => t.status === 'completed')
    const totalRevenue = completed.reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0)
    const totalRefunds = completed.reduce((sum, t) => sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0)
    
    const byType = completed.reduce((acc, t) => {
      if (t.amount > 0) {
        acc[t.type] = (acc[t.type] || 0) + t.amount
      }
      return acc
    }, {} as Record<string, number>)
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentRevenue = completed
      .filter(t => new Date(t.date) > thirtyDaysAgo && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    
    return {
      totalRevenue,
      totalRefunds,
      netRevenue: totalRevenue - totalRefunds,
      recentRevenue,
      membershipDues: byType.membership_dues || 0,
      eventRevenue: byType.event_registration || 0,
      donations: byType.donation || 0,
      transactionCount: completed.length
    }
  }, [transactions])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Finance</h1>
          <p className="text-muted-foreground mt-1">
            Track revenue and manage transactions
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2" size={18} />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Total Revenue
              </p>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                {loading ? '...' : formatCurrency(stats.totalRevenue)}
              </p>
              <div className="flex items-center gap-1 text-sm">
                <TrendUp className="text-teal" weight="bold" size={16} />
                <span className="text-teal font-medium">+12.5%</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center">
              <CurrencyDollar size={24} weight="duotone" className="text-teal" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Membership Dues
            </p>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {loading ? '...' : formatCurrency(stats.membershipDues)}
            </p>
            <p className="text-sm text-muted-foreground">
              {((stats.membershipDues / stats.totalRevenue) * 100).toFixed(1)}% of revenue
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Event Revenue
            </p>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {loading ? '...' : formatCurrency(stats.eventRevenue)}
            </p>
            <p className="text-sm text-muted-foreground">
              {((stats.eventRevenue / stats.totalRevenue) * 100).toFixed(1)}% of revenue
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Donations
            </p>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {loading ? '...' : formatCurrency(stats.donations)}
            </p>
            <p className="text-sm text-muted-foreground">
              {((stats.donations / stats.totalRevenue) * 100).toFixed(1)}% of revenue
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <ChartBar size={20} className="text-muted-foreground" />
            <h2 className="text-lg font-semibold">Revenue Breakdown</h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Membership Dues</span>
                <span className="text-sm text-muted-foreground">
                  {((stats.membershipDues / stats.totalRevenue) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(stats.membershipDues / stats.totalRevenue) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Event Revenue</span>
                <span className="text-sm text-muted-foreground">
                  {((stats.eventRevenue / stats.totalRevenue) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal transition-all"
                  style={{ width: `${(stats.eventRevenue / stats.totalRevenue) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Donations</span>
                <span className="text-sm text-muted-foreground">
                  {((stats.donations / stats.totalRevenue) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${(stats.donations / stats.totalRevenue) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Net Revenue</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatCurrency(stats.netRevenue)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              After {formatCurrency(stats.totalRefunds)} in refunds
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2">
              <Receipt size={20} className="text-muted-foreground" />
              <h2 className="text-lg font-semibold">Recent Transactions</h2>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted animate-shimmer rounded w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <CurrencyDollar size={48} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No transactions yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.slice(0, 20).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {transaction.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        {transaction.referenceId && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {transaction.referenceId}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(transaction.date)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-semibold tabular-nums ${
                          transaction.amount >= 0 ? 'text-teal' : 'text-destructive'
                        }`}
                      >
                        {transaction.amount >= 0 ? '+' : ''}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
