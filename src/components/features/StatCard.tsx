import { Card } from '@/components/ui/card'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon: ReactNode
  loading?: boolean
}

export function StatCard({ title, value, trend, trendLabel, icon, loading }: StatCardProps) {
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
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tabular-nums">{value}</p>
          {trend !== undefined && (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${bgColor} ${trendColor}`}>
              {isPositive ? '+' : ''}{Math.abs(trend)}%
              {trendLabel && <span className="text-xs text-muted-foreground font-normal">{trendLabel}</span>}
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
