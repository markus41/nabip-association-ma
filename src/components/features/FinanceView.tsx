import { useMemo, useState } from 'react'
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
  CreditCard,
  CaretDown,
  CaretUp
} from '@phosphor-icons/react'
import type { Transaction, TransactionType } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/data-utils'
import { InteractiveRevenueBreakdown, TransactionActions, getPaymentStatusStyle } from './InteractiveRevenueBreakdown'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface FinanceViewProps {
  transactions: Transaction[]
  loading?: boolean
}

interface GroupedTransactions {
  type: TransactionType
  description: string
  transactions: Transaction[]
  totalAmount: number
  count: number
}

export function FinanceView({ transactions, loading }: FinanceViewProps) {
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'same_month_last_year'>('this_month')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [runningBalance, setRunningBalance] = useState(0)

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

  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: GroupedTransactions } = {}
    
    transactions.slice(0, 20).forEach(t => {
      const key = `${t.type}-${t.description}`
      if (!groups[key]) {
        groups[key] = {
          type: t.type,
          description: t.description,
          transactions: [],
          totalAmount: 0,
          count: 0
        }
      }
      groups[key].transactions.push(t)
      groups[key].totalAmount += t.amount
      groups[key].count++
    })

    return Object.values(groups).sort((a, b) => 
      new Date(b.transactions[0].date).getTime() - new Date(a.transactions[0].date).getTime()
    )
  }, [transactions])

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey)
    } else {
      newExpanded.add(groupKey)
    }
    setExpandedGroups(newExpanded)
  }

  const handleSendReceipt = (transaction: Transaction) => {
    toast.success('Receipt Sent', {
      description: `Receipt for ${transaction.description} has been emailed.`
    })
  }

  const handleProcessRefund = (transaction: Transaction) => {
    toast.success('Refund Processed', {
      description: `${formatCurrency(transaction.amount)} has been refunded.`,
      duration: 5000
    })
  }

  const handleViewInvoice = (transaction: Transaction) => {
    toast.info('Opening Invoice', {
      description: `Invoice #${transaction.referenceId || transaction.id}`
    })
  }

  const transactionsWithBalance = useMemo(() => {
    let balance = 10000
    return transactions.slice(0, 20).map(t => {
      balance += t.amount
      return { ...t, balance }
    })
  }, [transactions])

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <InteractiveRevenueBreakdown
        transactions={transactions}
        period={period}
        onPeriodChange={setPeriod}
      />

      <Card className="flex flex-col overflow-hidden">
        <div className="p-5 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Recent Transactions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Grouped by type • Showing running balance
              </p>
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs">
              View All
              <ArrowRight size={14} weight="bold" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1 max-h-[600px]">
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
            ) : groupedTransactions.length === 0 ? (
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
              groupedTransactions.map((group, groupIdx) => {
                const groupKey = `${group.type}-${group.description}`
                const isExpanded = expandedGroups.has(groupKey)
                const isGrouped = group.count > 1
                const typeIcons = {
                  membership_dues: CreditCard,
                  event_registration: CalendarBlank,
                  donation: Wallet,
                  refund: TrendDown,
                  late_fee: Receipt
                }
                const Icon = typeIcons[group.type] || Receipt
                const mostRecentTransaction = group.transactions[0]
                const statusStyle = getPaymentStatusStyle(mostRecentTransaction.status)
                const StatusIcon = statusStyle.icon

                return (
                  <div key={groupKey} className="space-y-1">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIdx * 0.05 }}
                      className={`group p-3 rounded-lg border bg-card hover:bg-muted/50 hover:border-muted-foreground/20 transition-all ${
                        isExpanded ? 'border-primary/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-background transition-colors">
                            <Icon size={18} weight="duotone" className="text-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="font-medium text-sm">{group.description}</p>
                              {isGrouped && (
                                <Badge variant="secondary" className="text-xs h-5">
                                  {group.count} transactions
                                </Badge>
                              )}
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusStyle.bg} ${statusStyle.border} border`}>
                                <StatusIcon size={12} weight="fill" className={statusStyle.text} />
                                <span className={`${statusStyle.text} font-medium capitalize`}>
                                  {mostRecentTransaction.status}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                              <span>{formatDate(mostRecentTransaction.date)}</span>
                              {mostRecentTransaction.referenceId && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">{mostRecentTransaction.referenceId}</span>
                                </>
                              )}
                            </div>
                            {!isExpanded && (
                              <div className="mt-2">
                                <TransactionActions
                                  transaction={mostRecentTransaction}
                                  onSendReceipt={() => handleSendReceipt(mostRecentTransaction)}
                                  onProcessRefund={() => handleProcessRefund(mostRecentTransaction)}
                                  onViewInvoice={() => handleViewInvoice(mostRecentTransaction)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p
                            className={`text-base font-bold tabular-nums mb-1 ${
                              group.totalAmount >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {group.totalAmount >= 0 ? '+' : ''}
                            {formatCurrency(group.totalAmount)}
                          </p>
                          {isGrouped && (
                            <button
                              onClick={() => toggleGroup(groupKey)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {isExpanded ? (
                                <>
                                  <CaretUp size={12} weight="bold" />
                                  Collapse
                                </>
                              ) : (
                                <>
                                  <CaretDown size={12} weight="bold" />
                                  Expand
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    <AnimatePresence>
                      {isExpanded && isGrouped && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-12 space-y-1 overflow-hidden"
                        >
                          {group.transactions.map((transaction, idx) => {
                            const statusStyle = getPaymentStatusStyle(transaction.status)
                            const StatusIcon = statusStyle.icon
                            const balance = transactionsWithBalance.find(t => t.id === transaction.id)?.balance || 0

                            return (
                              <motion.div
                                key={transaction.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="p-3 rounded-lg bg-muted/50 border border-dashed"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusStyle.bg} ${statusStyle.border} border`}>
                                        <StatusIcon size={12} weight="fill" className={statusStyle.text} />
                                        <span className={`${statusStyle.text} font-medium capitalize`}>
                                          {transaction.status}
                                        </span>
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDate(transaction.date)}
                                      </span>
                                      {transaction.referenceId && (
                                        <span className="text-xs text-muted-foreground font-mono">
                                          {transaction.referenceId}
                                        </span>
                                      )}
                                    </div>
                                    <TransactionActions
                                      transaction={transaction}
                                      onSendReceipt={() => handleSendReceipt(transaction)}
                                      onProcessRefund={() => handleProcessRefund(transaction)}
                                      onViewInvoice={() => handleViewInvoice(transaction)}
                                    />
                                  </div>
                                  <div className="flex-shrink-0 text-right">
                                    <p
                                      className={`text-sm font-bold tabular-nums ${
                                        transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                      }`}
                                    >
                                      {transaction.amount >= 0 ? '+' : ''}
                                      {formatCurrency(transaction.amount)}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      Balance: {formatCurrency(balance)}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}

export default FinanceView
