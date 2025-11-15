import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  CreditCard,
  CalendarBlank,
  Wallet,
  TrendUp,
  TrendDown,
  ArrowsDownUp,
  ChartLine,
  Receipt,
  Envelope,
  ArrowCounterClockwise,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ArrowBendUpLeft
} from '@phosphor-icons/react'
import { formatCurrency } from '@/lib/data-utils'
import { motion, AnimatePresence } from 'framer-motion'
import type { Transaction, TransactionType } from '@/lib/types'

interface InteractiveRevenueBreakdownProps {
  transactions: Transaction[]
  period: 'this_month' | 'last_month' | 'same_month_last_year'
  onPeriodChange: (period: 'this_month' | 'last_month' | 'same_month_last_year') => void
}

interface DrillDownData {
  type: 'membership_type' | 'chapter' | 'time_period'
  items: Array<{ label: string; amount: number; percentage: number }>
}

export function InteractiveRevenueBreakdown({
  transactions,
  period,
  onPeriodChange
}: InteractiveRevenueBreakdownProps) {
  const [selectedCategory, setSelectedCategory] = useState<TransactionType | null>(null)
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null)

  const completedTransactions = transactions.filter(t => t.status === 'completed')
  const totalRevenue = completedTransactions.reduce((sum, t) => (t.amount > 0 ? sum + t.amount : sum), 0)

  const revenueByType = completedTransactions.reduce((acc, t) => {
    if (t.amount > 0) {
      acc[t.type] = (acc[t.type] || 0) + t.amount
    }
    return acc
  }, {} as Record<TransactionType, number>)

  const previousMonthRevenue = totalRevenue * (0.88 + Math.random() * 0.24)
  const revenueGrowth = ((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 100

  const forecastNextMonth = totalRevenue * (1 + revenueGrowth / 100) * (0.95 + Math.random() * 0.1)

  const revenueCategories = [
    {
      label: 'Membership Dues',
      type: 'membership_dues' as TransactionType,
      amount: revenueByType.membership_dues || 0,
      percentage: ((revenueByType.membership_dues || 0) / totalRevenue) * 100,
      color: 'bg-primary',
      lightColor: 'bg-primary/10',
      textColor: 'text-primary',
      icon: CreditCard
    },
    {
      label: 'Event Revenue',
      type: 'event_registration' as TransactionType,
      amount: revenueByType.event_registration || 0,
      percentage: ((revenueByType.event_registration || 0) / totalRevenue) * 100,
      color: 'bg-teal',
      lightColor: 'bg-teal/10',
      textColor: 'text-teal',
      icon: CalendarBlank
    },
    {
      label: 'Donations',
      type: 'donation' as TransactionType,
      amount: revenueByType.donation || 0,
      percentage: ((revenueByType.donation || 0) / totalRevenue) * 100,
      color: 'bg-accent',
      lightColor: 'bg-accent/10',
      textColor: 'text-accent-foreground',
      icon: Wallet
    }
  ]

  const handleCategoryClick = (type: TransactionType, label: string) => {
    setSelectedCategory(type)

    if (type === 'membership_dues') {
      setDrillDownData({
        type: 'membership_type',
        items: [
          { label: 'Individual', amount: (revenueByType[type] || 0) * 0.65, percentage: 65 },
          { label: 'Organizational', amount: (revenueByType[type] || 0) * 0.25, percentage: 25 },
          { label: 'Student', amount: (revenueByType[type] || 0) * 0.07, percentage: 7 },
          { label: 'Lifetime', amount: (revenueByType[type] || 0) * 0.03, percentage: 3 }
        ]
      })
    } else if (type === 'event_registration') {
      setDrillDownData({
        type: 'time_period',
        items: [
          { label: 'Week 1', amount: (revenueByType[type] || 0) * 0.15, percentage: 15 },
          { label: 'Week 2', amount: (revenueByType[type] || 0) * 0.35, percentage: 35 },
          { label: 'Week 3', amount: (revenueByType[type] || 0) * 0.28, percentage: 28 },
          { label: 'Week 4', amount: (revenueByType[type] || 0) * 0.22, percentage: 22 }
        ]
      })
    } else {
      setDrillDownData({
        type: 'chapter',
        items: [
          { label: 'California', amount: (revenueByType[type] || 0) * 0.30, percentage: 30 },
          { label: 'Texas', amount: (revenueByType[type] || 0) * 0.22, percentage: 22 },
          { label: 'Florida', amount: (revenueByType[type] || 0) * 0.18, percentage: 18 },
          { label: 'New York', amount: (revenueByType[type] || 0) * 0.15, percentage: 15 },
          { label: 'Other', amount: (revenueByType[type] || 0) * 0.15, percentage: 15 }
        ]
      })
    }
  }

  return (
    <Card className="flex flex-col">
      <div className="p-5 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Revenue Breakdown</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Interactive view • Click categories to drill down
            </p>
          </div>
          <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="same_month_last_year">Same Month Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {revenueCategories.map((category) => {
            const Icon = category.icon
            const isSelected = selectedCategory === category.type

            return (
              <motion.button
                key={category.type}
                onClick={() => handleCategoryClick(category.type, category.label)}
                className={`text-left space-y-2.5 p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-transparent hover:border-border hover:bg-muted/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg ${category.lightColor} flex items-center justify-center`}>
                      <Icon size={18} weight="duotone" className={category.textColor} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{category.label}</p>
                      <p className="text-xs text-muted-foreground">{category.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <p className="text-base font-semibold tabular-nums">{formatCurrency(category.amount)}</p>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${category.percentage}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className={`h-full ${category.color} rounded-full`}
                  />
                </div>
              </motion.button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {drillDownData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="p-4 bg-muted/30 border-dashed">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ChartLine size={18} weight="duotone" className="text-primary" />
                    <h3 className="text-sm font-semibold">
                      Breakdown by{' '}
                      {drillDownData.type === 'membership_type'
                        ? 'Membership Type'
                        : drillDownData.type === 'chapter'
                        ? 'Chapter'
                        : 'Time Period'}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(null)
                      setDrillDownData(null)
                    }}
                  >
                    Close
                  </Button>
                </div>

                <div className="space-y-3">
                  {drillDownData.items.map((item, idx) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{item.percentage}%</span>
                            <span className="text-sm font-semibold tabular-nums">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-background rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.05 }}
                            className="h-full bg-primary rounded-full"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 pt-6 border-t space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <ArrowsDownUp size={16} weight="bold" className="text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">Period Comparison</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalRevenue)}</p>
                <div
                  className={`flex items-center gap-1 text-sm font-semibold ${
                    revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {revenueGrowth >= 0 ? (
                    <TrendUp size={14} weight="bold" />
                  ) : (
                    <TrendDown size={14} weight="bold" />
                  )}
                  {Math.abs(revenueGrowth).toFixed(1)}%
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <ChartLine size={16} weight="bold" className="text-blue-600" />
                <p className="text-xs font-medium text-blue-700">Revenue Forecast</p>
              </div>
              <p className="text-2xl font-bold tabular-nums text-blue-900">
                {formatCurrency(forecastNextMonth)}
              </p>
              <p className="text-xs text-blue-600 mt-1">Projected for next month</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

interface TransactionActionProps {
  transaction: Transaction
  onSendReceipt: () => void
  onProcessRefund: () => void
  onViewInvoice: () => void
}

export function TransactionActions({
  transaction,
  onSendReceipt,
  onProcessRefund,
  onViewInvoice
}: TransactionActionProps) {
  const [confirmAction, setConfirmAction] = useState<'receipt' | 'refund' | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleAction = async (action: 'receipt' | 'refund') => {
    setProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    setProcessing(false)
    setConfirmAction(null)

    if (action === 'receipt') {
      onSendReceipt()
    } else {
      onProcessRefund()
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            setConfirmAction('receipt')
          }}
        >
          <Envelope size={14} className="mr-1.5" />
          Receipt
        </Button>

        {transaction.status === 'completed' && transaction.amount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            onClick={(e) => {
              e.stopPropagation()
              setConfirmAction('refund')
            }}
          >
            <ArrowCounterClockwise size={14} className="mr-1.5" />
            Refund
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            onViewInvoice()
          }}
        >
          <FileText size={14} className="mr-1.5" />
          Invoice
        </Button>
      </div>

      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'receipt' ? 'Send Receipt' : 'Process Refund'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'receipt'
                ? 'Are you sure you want to send a receipt email for this transaction?'
                : 'Are you sure you want to refund this transaction? This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          <Card className="p-4 bg-muted/50">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction</span>
                <span className="font-medium">{transaction.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{formatCurrency(transaction.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs">{transaction.referenceId || 'N/A'}</span>
              </div>
            </div>
          </Card>

          {confirmAction === 'refund' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-amber-700 text-xs font-bold">!</span>
              </div>
              <p className="text-xs text-amber-700">
                This will immediately refund {formatCurrency(transaction.amount)} to the original payment method.
                The member will be notified via email.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={() => handleAction(confirmAction!)}
              disabled={processing}
              variant={confirmAction === 'refund' ? 'destructive' : 'default'}
            >
              {processing ? 'Processing...' : confirmAction === 'receipt' ? 'Send Receipt' : 'Process Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function getPaymentStatusStyle(status: string) {
  switch (status) {
    case 'completed':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        icon: CheckCircle,
        animate: 'animate-pulse-success'
      }
    case 'pending':
    case 'processing':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: Clock,
        animate: ''
      }
    case 'failed':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: XCircle,
        animate: 'animate-shake'
      }
    case 'refunded':
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-600',
        icon: ArrowBendUpLeft,
        animate: ''
      }
    default:
      return {
        bg: 'bg-muted',
        border: 'border-border',
        text: 'text-muted-foreground',
        icon: Receipt,
        animate: ''
      }
  }
}
