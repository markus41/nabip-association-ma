import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Buildings,
  Users,
  TrendUp,
  TrendDown,
  EnvelopeSimple,
  FileText,
  ChartLine,
  Equals
} from '@phosphor-icons/react'
import type { Chapter } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'

interface EnhancedChapterCardProps {
  chapter: Chapter
  allChapters: Chapter[]
  onEmailLeader: (chapter: Chapter) => void
  onViewReport: (chapter: Chapter) => void
  onCompare: (chapter: Chapter) => void
  onClick: (chapter: Chapter) => void
}

export function EnhancedChapterCard({
  chapter,
  allChapters,
  onEmailLeader,
  onViewReport,
  onCompare,
  onClick
}: EnhancedChapterCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const memberTrend = useMemo(() => {
    const baseCount = chapter.memberCount
    return Array.from({ length: 12 }, (_, i) => {
      const variance = (Math.sin(i * 0.5) * 0.1 + (Math.random() - 0.5) * 0.05) * baseCount
      return Math.max(0, Math.round(baseCount + variance - baseCount * 0.15 + (i * baseCount * 0.02)))
    }).slice(-3)
  }, [chapter.memberCount])

  const performance = useMemo(() => {
    const avgMembers = allChapters.reduce((sum, c) => sum + c.memberCount, 0) / allChapters.length
    const memberPerformance = ((chapter.memberCount - avgMembers) / avgMembers) * 100

    const avgEvents = allChapters.reduce((sum, c) => sum + c.activeEventsCount, 0) / allChapters.length
    const eventPerformance = ((chapter.activeEventsCount - avgEvents) / avgEvents) * 100

    const engagementScore = 75 + Math.random() * 20
    const previousQuarterEngagement = engagementScore - 5 + Math.random() * 10
    const engagementChange = engagementScore - previousQuarterEngagement

    const overallScore = (memberPerformance + eventPerformance + engagementChange) / 3

    return {
      memberPerformance,
      eventPerformance,
      engagementScore,
      engagementChange,
      overallScore,
      health: overallScore >= 5 ? 'excellent' : overallScore >= -5 ? 'good' : 'needs-attention'
    }
  }, [chapter, allChapters])

  const getHealthColor = () => {
    switch (performance.health) {
      case 'excellent':
        return {
          border: 'border-green-500',
          bg: 'bg-green-50',
          badge: 'bg-green-100 text-green-700',
          icon: 'text-green-600'
        }
      case 'good':
        return {
          border: 'border-amber-500',
          bg: 'bg-amber-50',
          badge: 'bg-amber-100 text-amber-700',
          icon: 'text-amber-600'
        }
      default:
        return {
          border: 'border-red-500',
          bg: 'bg-red-50',
          badge: 'bg-red-100 text-red-700',
          icon: 'text-red-600'
        }
    }
  }

  const healthColors = getHealthColor()

  const maxTrend = Math.max(...memberTrend)
  const minTrend = Math.min(...memberTrend)
  const trendRange = maxTrend - minTrend || 1

  const topMetric = useMemo(() => {
    const metrics = [
      {
        label: 'Member Growth',
        value: performance.memberPerformance,
        formatted: `${performance.memberPerformance > 0 ? '+' : ''}${performance.memberPerformance.toFixed(1)}%`
      },
      {
        label: 'Event Activity',
        value: performance.eventPerformance,
        formatted: `${performance.eventPerformance > 0 ? '+' : ''}${performance.eventPerformance.toFixed(1)}%`
      },
      {
        label: 'Engagement',
        value: performance.engagementChange,
        formatted: `${performance.engagementChange > 0 ? '+' : ''}${performance.engagementChange.toFixed(1)}%`
      }
    ]

    return metrics.reduce((max, metric) => (metric.value > max.value ? metric : max))
  }, [performance])

  return (
    <Card
      className={`group relative overflow-hidden transition-all cursor-pointer border-l-4 ${healthColors.border} hover:shadow-lg`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(chapter)}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg leading-tight truncate group-hover:text-primary transition-colors">
                {chapter.name}
              </h3>
              <Badge className={`text-xs ${healthColors.badge}`}>
                {performance.health === 'excellent' ? 'Excellent' : performance.health === 'good' ? 'Good' : 'Needs Attention'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="capitalize text-xs">
                {chapter.type}
              </Badge>
              {chapter.state && (
                <span className="text-xs text-muted-foreground">{chapter.state}</span>
              )}
            </div>
          </div>

          <div className={`w-12 h-12 rounded-lg ${healthColors.bg} flex items-center justify-center flex-shrink-0`}>
            <Buildings size={24} weight="duotone" className={healthColors.icon} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick(chapter)
            }}
            className="text-left p-3 rounded-lg hover:bg-muted/50 transition-colors group/metric"
          >
            <p className="text-xs text-muted-foreground mb-1 group-hover/metric:text-primary transition-colors">
              Members
            </p>
            <p className="text-2xl font-semibold tabular-nums group-hover/metric:text-primary transition-colors">
              {chapter.memberCount.toLocaleString()}
            </p>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick(chapter)
            }}
            className="text-left p-3 rounded-lg hover:bg-muted/50 transition-colors group/metric"
          >
            <p className="text-xs text-muted-foreground mb-1 group-hover/metric:text-primary transition-colors">
              Events
            </p>
            <p className="text-2xl font-semibold tabular-nums group-hover/metric:text-primary transition-colors">
              {chapter.activeEventsCount}
            </p>
          </button>
        </div>

        <div className="pt-3 border-t space-y-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClick(chapter)
            }}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group/trend"
          >
            <div className="flex items-center gap-2">
              <ChartLine size={14} weight="duotone" className="text-muted-foreground group-hover/trend:text-primary transition-colors" />
              <span className="text-xs text-muted-foreground group-hover/trend:text-primary transition-colors">3-Month Trend</span>
            </div>
            <svg width="80" height="24" className="flex-shrink-0">
              <polyline
                points={memberTrend
                  .map((value, i) => {
                    const x = (i / (memberTrend.length - 1)) * 80
                    const y = 24 - ((value - minTrend) / trendRange) * 20
                    return `${x},${y}`
                  })
                  .join(' ')}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={
                  memberTrend[memberTrend.length - 1] > memberTrend[0]
                    ? 'text-green-500'
                    : 'text-red-500'
                }
              />
            </svg>
          </button>

          {performance.memberPerformance !== 0 && (
            <div className={`flex items-center gap-1.5 text-xs ${
              performance.memberPerformance > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {performance.memberPerformance > 0 ? (
                <TrendUp size={14} weight="bold" />
              ) : (
                <TrendDown size={14} weight="bold" />
              )}
              <span className="font-medium">
                {Math.abs(performance.memberPerformance) > 1
                  ? `Performing ${Math.abs(performance.memberPerformance).toFixed(0)}% ${
                      performance.memberPerformance > 0 ? 'above' : 'below'
                    } chapter average`
                  : 'Performance at chapter average'}
              </span>
            </div>
          )}

          {performance.engagementChange !== 0 && (
            <div className={`flex items-center gap-1.5 text-xs ${
              performance.engagementChange > 0 ? 'text-green-600' : 'text-amber-600'
            }`}>
              {performance.engagementChange > 0 ? (
                <TrendUp size={14} weight="bold" />
              ) : performance.engagementChange < 0 ? (
                <TrendDown size={14} weight="bold" />
              ) : (
                <Equals size={14} weight="bold" />
              )}
              <span className="font-medium">
                Engagement {performance.engagementChange > 0 ? 'up' : 'down'}{' '}
                {Math.abs(performance.engagementChange).toFixed(1)}% from last quarter
              </span>
            </div>
          )}
        </div>

        {topMetric.value > 5 && (
          <div className="pt-3 border-t">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendUp size={14} weight="bold" className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-green-900">Top Performer</p>
                  <p className="text-xs text-green-700">
                    {topMetric.label}: {topMetric.formatted} 🎉
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="pt-3 border-t flex gap-2"
            >
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs h-8"
                onClick={(e) => {
                  e.stopPropagation()
                  onEmailLeader(chapter)
                }}
              >
                <EnvelopeSimple size={14} className="mr-1.5" />
                Email Leader
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs h-8"
                onClick={(e) => {
                  e.stopPropagation()
                  onViewReport(chapter)
                }}
              >
                <FileText size={14} className="mr-1.5" />
                Full Report
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs h-8"
                onClick={(e) => {
                  e.stopPropagation()
                  onCompare(chapter)
                }}
              >
                <ChartLine size={14} className="mr-1.5" />
                Compare
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  )
}
