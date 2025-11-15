import { useState, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  Buildings,
  MapTrifold,
  Users,
  EnvelopeSimple,
  Phone,
  Copy,
  PencilSimple,
  Eye,
  ChatCircle,
  ChartLine,
  CaretDown,
  Check,
  CalendarDots,
  TrendUp,
  TrendDown,
  Minus
} from '@phosphor-icons/react'
import type { Chapter } from '@/lib/types'
import type { ChapterTrendData } from '@/lib/chapter-analytics-utils'
import {
  generateChapterTrendData,
  calculateGrowthRate,
  getTrendDirection,
  getSparklineColor,
  getTrendColor,
  formatGrowthRate
} from '@/lib/chapter-analytics-utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

/**
 * Establishes enhanced chapter card with sparkline trend visualization.
 * Implements accessible hover interactions and real-time metric displays.
 *
 * Best for: Chapter overview with immediate visual feedback on growth trends
 *
 * @param chapter - Chapter data to display
 * @param showSparklines - Whether to display trend sparklines (default: true)
 * @param sparklineData - Optional pre-generated sparkline data (improves performance)
 * @param onEdit - Callback to open edit dialog
 * @param onViewDetails - Callback to navigate to chapter detail view
 * @param onMessageLeaders - Callback to open messaging interface
 * @param onViewMembers - Callback to filter member list by chapter
 * @param onViewAnalytics - Callback to open analytics drawer
 * @param showQuickActions - Whether to show quick action buttons on hover (default: true)
 * @param showContactDetails - Whether to show contact details section (default: true)
 */
export interface ChapterCardEnhancedProps {
  chapter: Chapter
  showSparklines?: boolean
  sparklineData?: ChapterTrendData
  onEdit?: (chapter: Chapter) => void
  onViewDetails?: (chapter: Chapter) => void
  onMessageLeaders?: (chapter: Chapter) => void
  onViewMembers?: (chapterId: string) => void
  onViewAnalytics?: (chapterId: string) => void
  showQuickActions?: boolean
  showContactDetails?: boolean
}

/**
 * Custom tooltip for sparkline charts showing exact values.
 */
const SparklineTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-background border rounded-lg shadow-lg p-2">
      <p className="text-xs font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{payload[0].value.toLocaleString()}</p>
    </div>
  )
}

/**
 * Sparkline chart component for visualizing metric trends.
 */
interface SparklineProps {
  data: number[]
  labels: string[]
  color: string
  height?: number
  label: string
}

const Sparkline = ({ data, labels, color, height = 30, label }: SparklineProps) => {
  const chartData = useMemo(() => {
    return data.map((value, index) => ({
      name: labels[index],
      value
    }))
  }, [data, labels])

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          aria-label={`${label} trend chart`}
        />
        <RechartsTooltip
          content={<SparklineTooltip />}
          cursor={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function ChapterCardEnhanced({
  chapter,
  showSparklines = true,
  sparklineData,
  onEdit,
  onViewDetails,
  onMessageLeaders,
  onViewMembers,
  onViewAnalytics,
  showQuickActions = true,
  showContactDetails = true
}: ChapterCardEnhancedProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showAllLeaders, setShowAllLeaders] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)
  const [phoneCopied, setPhoneCopied] = useState(false)

  // Generate sparkline data (memoized for performance)
  const trendData = useMemo(() => {
    return sparklineData || generateChapterTrendData(chapter)
  }, [chapter, sparklineData])

  // Calculate growth metrics (memoized)
  const growthMetrics = useMemo(() => {
    const memberGrowth = calculateGrowthRate(trendData.memberTrend)
    const eventGrowth = calculateGrowthRate(trendData.eventTrend)
    const revenueGrowth = calculateGrowthRate(trendData.revenueTrend)

    return {
      memberGrowth,
      eventGrowth,
      revenueGrowth,
      memberDirection: getTrendDirection(memberGrowth),
      eventDirection: getTrendDirection(eventGrowth),
      revenueDirection: getTrendDirection(revenueGrowth)
    }
  }, [trendData])

  const getChapterIcon = (type: Chapter['type']) => {
    switch (type) {
      case 'national':
        return <Buildings size={24} weight="duotone" className="text-primary" />
      case 'state':
        return <MapTrifold size={24} weight="duotone" className="text-teal" />
      case 'local':
        return <Users size={24} weight="duotone" className="text-accent-foreground" />
    }
  }

  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return <TrendUp size={14} weight="bold" className="text-green-600" />
      case 'down':
        return <TrendDown size={14} weight="bold" className="text-red-600" />
      case 'neutral':
        return <Minus size={14} weight="bold" className="text-gray-500" />
    }
  }

  const handleCopyEmail = useCallback(async (email: string) => {
    try {
      await navigator.clipboard.writeText(email)
      setEmailCopied(true)
      toast.success('Email Copied', {
        description: 'Email address copied to clipboard'
      })
      setTimeout(() => setEmailCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy email')
    }
  }, [])

  const handleCopyPhone = useCallback(async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone)
      setPhoneCopied(true)
      toast.success('Phone Copied', {
        description: 'Phone number copied to clipboard'
      })
      setTimeout(() => setPhoneCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy phone')
    }
  }, [])

  const handlePhoneClick = useCallback((phone: string) => {
    window.location.href = `tel:${phone}`
  }, [])

  const president = chapter.president || chapter.leadership?.[0]
  const displayLeaders = showAllLeaders
    ? chapter.leadership || []
    : (chapter.leadership || []).slice(0, 3)
  const hasMoreLeaders = (chapter.leadership?.length || 0) > 3

  return (
    <Card
      className="group relative overflow-hidden transition-all hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewDetails?.(chapter)}
      role="article"
      aria-label={`${chapter.name} chapter card with analytics`}
    >
      {/* Quick Actions Overlay */}
      <AnimatePresence>
        {showQuickActions && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-1"
            onClick={(e) => e.stopPropagation()}
          >
            <TooltipProvider delayDuration={300}>
              {onEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(chapter)
                      }}
                      aria-label="Edit chapter"
                    >
                      <PencilSimple size={16} weight="bold" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit Chapter</TooltipContent>
                </Tooltip>
              )}

              {onViewDetails && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewDetails(chapter)
                      }}
                      aria-label="View chapter details"
                    >
                      <Eye size={16} weight="bold" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View Details</TooltipContent>
                </Tooltip>
              )}

              {onMessageLeaders && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onMessageLeaders(chapter)
                      }}
                      aria-label="Message chapter leaders"
                    >
                      <ChatCircle size={16} weight="bold" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Message Leaders</TooltipContent>
                </Tooltip>
              )}

              {onViewMembers && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewMembers(chapter.id)
                      }}
                      aria-label="View chapter members"
                    >
                      <Users size={16} weight="bold" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View Members</TooltipContent>
                </Tooltip>
              )}

              {onViewAnalytics && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewAnalytics(chapter.id)
                      }}
                      aria-label="View chapter analytics"
                    >
                      <ChartLine size={16} weight="bold" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Quick Stats</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight truncate group-hover:text-primary transition-colors">
              {chapter.name}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="capitalize text-xs">
                {chapter.type}
              </Badge>
              {chapter.state && (
                <span className="text-xs text-muted-foreground">{chapter.state}</span>
              )}
              {chapter.city && (
                <span className="text-xs text-muted-foreground">• {chapter.city}</span>
              )}
            </div>
          </div>

          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {getChapterIcon(chapter.type)}
          </div>
        </div>

        {/* Stats with Sparklines */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users size={12} weight="bold" />
                Members
              </p>
              <div className="flex items-center gap-1">
                {getTrendIcon(growthMetrics.memberDirection)}
                <span className={`text-[10px] font-medium ${getTrendColor(growthMetrics.memberDirection)}`}>
                  {formatGrowthRate(growthMetrics.memberGrowth)}
                </span>
              </div>
            </div>
            <p className="text-2xl font-semibold tabular-nums mb-2">
              {chapter.memberCount.toLocaleString()}
            </p>
            {showSparklines && (
              <div className="h-[30px]" aria-label="Member growth trend">
                <Sparkline
                  data={trendData.memberTrend}
                  labels={trendData.labels}
                  color={getSparklineColor(growthMetrics.memberDirection)}
                  label="Member growth"
                />
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CalendarDots size={12} weight="bold" />
                Events
              </p>
              <div className="flex items-center gap-1">
                {getTrendIcon(growthMetrics.eventDirection)}
                <span className={`text-[10px] font-medium ${getTrendColor(growthMetrics.eventDirection)}`}>
                  {formatGrowthRate(growthMetrics.eventGrowth)}
                </span>
              </div>
            </div>
            <p className="text-2xl font-semibold tabular-nums mb-2">
              {chapter.activeEventsCount}
            </p>
            {showSparklines && (
              <div className="h-[30px]" aria-label="Event attendance trend">
                <Sparkline
                  data={trendData.eventTrend}
                  labels={trendData.labels}
                  color="#3b82f6"
                  label="Event attendance"
                />
              </div>
            )}
          </div>
        </div>

        {/* Revenue Sparkline (if applicable) */}
        {showSparklines && chapter.revenueShare !== undefined && (
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Revenue Trend</p>
              <div className="flex items-center gap-1">
                {getTrendIcon(growthMetrics.revenueDirection)}
                <span className={`text-[10px] font-medium ${getTrendColor(growthMetrics.revenueDirection)}`}>
                  {formatGrowthRate(growthMetrics.revenueGrowth)}
                </span>
              </div>
            </div>
            <div className="h-[30px]" aria-label="Revenue trend">
              <Sparkline
                data={trendData.revenueTrend}
                labels={trendData.labels}
                color="#a855f7"
                label="Revenue"
              />
            </div>
          </div>
        )}

        {/* Contact Details Section */}
        {showContactDetails && (chapter.president || chapter.contactEmail || chapter.phone || chapter.leadership) && (
          <div className="pt-3 border-t space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Contact Details</h4>

            {/* President/Primary Leader */}
            {president && (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={typeof president === 'string' ? undefined : president.imageUrl}
                    alt={typeof president === 'string' ? president : president.name}
                  />
                  <AvatarFallback className="text-xs">
                    {(typeof president === 'string' ? president : president.name)
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {typeof president === 'string' ? president : president.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {typeof president === 'string' ? 'President' : president.role}
                  </p>
                </div>
              </div>
            )}

            {/* Contact Email */}
            {chapter.contactEmail && (
              <div className="flex items-center gap-2">
                <EnvelopeSimple size={16} className="text-muted-foreground shrink-0" />
                <a
                  href={`mailto:${chapter.contactEmail}`}
                  className="text-sm text-primary hover:underline truncate flex-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {chapter.contactEmail}
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopyEmail(chapter.contactEmail!)
                  }}
                  aria-label="Copy email address"
                >
                  {emailCopied ? (
                    <Check size={14} weight="bold" className="text-green-600" />
                  ) : (
                    <Copy size={14} weight="bold" />
                  )}
                </Button>
              </div>
            )}

            {/* Contact Phone */}
            {chapter.phone && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-muted-foreground shrink-0" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePhoneClick(chapter.phone!)
                  }}
                  className="text-sm text-primary hover:underline truncate flex-1 text-left"
                >
                  {chapter.phone}
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopyPhone(chapter.phone!)
                  }}
                  aria-label="Copy phone number"
                >
                  {phoneCopied ? (
                    <Check size={14} weight="bold" className="text-green-600" />
                  ) : (
                    <Copy size={14} weight="bold" />
                  )}
                </Button>
              </div>
            )}

            {/* Leadership Team */}
            {chapter.leadership && chapter.leadership.length > 0 && (
              <Collapsible
                open={showAllLeaders}
                onOpenChange={setShowAllLeaders}
                className="space-y-2"
              >
                <div className="space-y-2">
                  {displayLeaders.map((leader, index) => (
                    <div key={leader.id || index} className="flex items-center gap-2 text-xs">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={leader.imageUrl} alt={leader.name} />
                        <AvatarFallback className="text-[10px]">
                          {leader.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{leader.name}</p>
                        <p className="text-muted-foreground truncate">{leader.role}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {hasMoreLeaders && (
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {showAllLeaders ? 'Show Less' : `Show All (${chapter.leadership.length})`}
                      <CaretDown
                        size={12}
                        weight="bold"
                        className={`ml-1 transition-transform ${showAllLeaders ? 'rotate-180' : ''}`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                )}

                <CollapsibleContent>
                  {/* Additional leaders are rendered above */}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}

        {/* Website Link */}
        {chapter.websiteUrl && (
          <div className="pt-3 border-t">
            <a
              href={chapter.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Visit Chapter Website →
            </a>
          </div>
        )}
      </div>
    </Card>
  )
}
