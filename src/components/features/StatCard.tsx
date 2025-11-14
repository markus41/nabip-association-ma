import { Card } from '@/components/ui/card'
import { TrendUp, TrendDown } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  trend?: number
  icon: ReactNode
  loading?: boolean
}

export function StatCard({ title, value, trend, icon, loading }: StatCardProps) {
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

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              {trend >= 0 ? (
                <>
                  <TrendUp className="text-teal" weight="bold" size={16} />
                  <span className="text-teal font-medium">+{trend}%</span>
                </>
              ) : (
                <>
                  <TrendDown className="text-destructive" weight="bold" size={16} />
                  <span className="text-destructive font-medium">{trend}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
    </Card>
  )
}
