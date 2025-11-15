import { Card } from '@/components/ui/card'
import { ArrowUp, ArrowDown } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon: ReactNode
  loading?: boolean
}

export function StatCard({ title, value, trend, trendLabel = 'vs yesterday', icon, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-24 bg-muted animate-shimmer rounded" />
            <div className="h-8 w-32 bg-muted animate-shimmer rounded" />
          </div>
          <div className="w-12 h-12 bg-muted animate-shimmer rounded-lg" />
        </div>
      </Card>
    )
  }

  const isPositive = trend !== undefined && trend >= 0
  const trendColor = isPositive ? 'text-teal' : 'text-destructive'
  const bgColor = isPositive ? 'bg-teal/10' : 'bg-destructive/10'

  return (
    <Card className="p-6 hover:shadow-md transition-all hover:scale-[1.02] duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-bold tracking-tight tabular-nums">
            {value}
          </p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${bgColor} w-fit`}>
              {isPositive ? (
                <ArrowUp className={trendColor} weight="bold" size={14} />
              ) : (
                <ArrowDown className={trendColor} weight="bold" size={14} />
              )}
              <span className={`text-xs font-semibold ${trendColor}`}>
                {isPositive ? '+' : ''}{Math.abs(trend)}%
              </span>
              <span className="text-xs text-muted-foreground">{trendLabel}</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
    </Card>
  )
}
