import { Card } from '@/components/ui/card'
import type { ReactNode } from 'react'
interface StatCardProps {

  trendLabel?: string
  loading?: boo

  if (loading) {
      <Card className
          <div cl
            <div cl
 

  }
  const isPositi
  const bgCo
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

          
                {isPositive ? '+' : ''}{Math.abs(trend)}%
              <span className="text-xs text-muted-foregr
          )}
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center
        </div>
    </Card>
}























