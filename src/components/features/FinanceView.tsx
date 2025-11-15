import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  CurrencyDollar, 
  TrendUp,
  TrendDown,
  Download,
  Receipt,
  ArrowRight,
  Wallet,
  CalendarBlank,
  CreditCard
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

  const revenueCategories = [
    {
      label: 'Membership Dues',
      amount: stats.membershipDues,
      percentage: (stats.membershipDues / stats.totalRevenue) * 100,
      color: 'bg-primary',
      icon: CreditCard
    },
    {
      label: 'Event Revenue',
      amount: stats.eventRevenue,
      percentage: (stats.eventRevenue / stats.totalRevenue) * 100,
      color: 'bg-teal',
      icon: CalendarBlank
    },
    {
      label: 'Donations',
      amount: stats.donations,
      percentage: (stats.donations / stats.totalRevenue) * 100,
      color: 'bg-accent',
      icon: Wallet
    }
  ]

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
          <p className="text-sm text-muted-foreground">
            Track revenue and manage transactions
          </p>
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Download className="mr-2" size={16} />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal/5 rounded-full -mr-12 -mt-12" />
          <div className="relative space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center">
                <CurrencyDollar size={20} weight="duotone" className="text-teal" />
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-teal/10">
                <TrendUp className="text-teal" weight="bold" size={12} />
                <span className="text-teal font-semibold text-xs">12.5%</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Total Revenue
              </p>
              <p className="text-2xl font-bold tracking-tight tabular-nums mt-0.5">
                {loading ? '...' : formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                vs last month
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12" />
          <div className="relative space-y-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard size={20} weight="duotone" className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Membership Dues
              </p>
              <p className="text-2xl font-bold tracking-tight tabular-nums mt-0.5">
                {loading ? '...' : formatCurrency(stats.membershipDues)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {((stats.membershipDues / stats.totalRevenue) * 100).toFixed(1)}% of revenue
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal/5 rounded-full -mr-12 -mt-12" />
          <div className="relative space-y-2">
            <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center">
              <CalendarBlank size={20} weight="duotone" className="text-teal" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Event Revenue
              </p>
              <p className="text-2xl font-bold tracking-tight tabular-nums mt-0.5">
                {loading ? '...' : formatCurrency(stats.eventRevenue)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {((stats.eventRevenue / stats.totalRevenue) * 100).toFixed(1)}% of revenue
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -mr-12 -mt-12" />
          <div className="relative space-y-2">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <Wallet size={20} weight="duotone" className="text-accent" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Donations
              </p>
              <p className="text-2xl font-bold tracking-tight tabular-nums mt-0.5">
                {loading ? '...' : formatCurrency(stats.donations)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {((stats.donations / stats.totalRevenue) * 100).toFixed(1)}% of revenue
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-base font-semibold">Revenue Breakdown</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Distribution by category</p>
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <div className="space-y-4 flex-1">
              {revenueCategories.map((category) => {
                const Icon = category.icon
                return (
                  <div key={category.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <Icon size={18} weight="duotone" className="text-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{category.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {category.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <p className="text-base font-semibold tabular-nums">
                        {formatCurrency(category.amount)}
                      </p>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${category.color} transition-all duration-500 ease-out rounded-full`}
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Net Revenue</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    After {formatCurrency(stats.totalRefunds)} in refunds
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold tabular-nums">
                    {formatCurrency(stats.netRevenue)}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-teal mt-0.5 justify-end">
                    <TrendUp size={12} weight="bold" />
                    <span className="font-medium">8.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          <div className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Recent Transactions</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Latest {transactions.slice(0, 20).length} transactions
                </p>
              </div>
              <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs">
                View All
                <ArrowRight size={14} weight="bold" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-muted animate-shimmer" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3.5 bg-muted animate-shimmer rounded w-1/3" />
                          <div className="h-3 bg-muted animate-shimmer rounded w-1/2" />
                        </div>
                      </div>
                      <div className="h-5 bg-muted animate-shimmer rounded w-16" />
                    </div>
                  </div>
                ))
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Receipt size={28} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">No transactions yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Transactions will appear here once they're processed
                  </p>
                </div>
              ) : (
                transactions.slice(0, 20).map((transaction) => {
                  const isPositive = transaction.amount >= 0
                  const typeIcons = {
                    membership_dues: CreditCard,
                    event_registration: CalendarBlank,
                    donation: Wallet,
                    refund: TrendDown,
                    late_fee: Receipt
                  }
                  const Icon = typeIcons[transaction.type] || Receipt
                  
                  return (
                    <div
                      key={transaction.id}
                      className="group p-3 rounded-lg border bg-card hover:bg-muted/50 hover:border-muted-foreground/20 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-background transition-colors">
                            <Icon size={18} weight="duotone" className="text-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm">{transaction.description}</p>
                              <Badge variant="outline" className="text-xs h-5">
                                {transaction.type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span>{formatDate(transaction.date)}</span>
                              {transaction.referenceId && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">{transaction.referenceId}</span>
                                </>
                              )}
                              <Badge 
                                variant="outline" 
                                className={`${getStatusColor(transaction.status)} text-xs h-5`}
                              >
                                {transaction.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p
                            className={`text-base font-bold tabular-nums ${
                              isPositive ? 'text-teal' : 'text-destructive'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  )
}
