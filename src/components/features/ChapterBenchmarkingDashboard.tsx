import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Target,
  TrendUp,
  Users,
  CalendarDots,
  ChartLine,
  Lightbulb,
  Trophy,
  ArrowUp,
  ArrowDown,
  CheckCircle
} from '@phosphor-icons/react'
import type { Chapter } from '@/lib/types'
import {
  generateChapterBenchmark,
  formatPercentage
} from '@/lib/chapter-analytics-utils'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts'

/**
 * Establishes comprehensive chapter benchmarking dashboard with percentile rankings.
 * Implements radar chart visualization and actionable insights generation.
 *
 * Best for: Deep performance analysis against national averages and peer benchmarks
 *
 * @param chapter - Chapter to benchmark
 * @param allChapters - All chapters for comparison
 */
export interface ChapterBenchmarkingDashboardProps {
  chapter: Chapter
  allChapters: Chapter[]
}

export function ChapterBenchmarkingDashboard({
  chapter,
  allChapters
}: ChapterBenchmarkingDashboardProps) {
  // Generate benchmark data
  const benchmark = useMemo(() => {
    return generateChapterBenchmark(chapter, allChapters)
  }, [chapter, allChapters])

  // Prepare radar chart data
  const radarData = useMemo(() => {
    return [
      {
        metric: 'Member Engagement',
        'Your Chapter': benchmark.percentileScores.memberEngagement,
        'National Avg': 50,
        'Peer Avg': 50,
        'Top Performers': 90
      },
      {
        metric: 'Event Frequency',
        'Your Chapter': benchmark.percentileScores.eventFrequency,
        'National Avg': 50,
        'Peer Avg': 50,
        'Top Performers': 90
      },
      {
        metric: 'Revenue',
        'Your Chapter': benchmark.percentileScores.revenueContribution,
        'National Avg': 50,
        'Peer Avg': 50,
        'Top Performers': 90
      },
      {
        metric: 'Member Growth',
        'Your Chapter': benchmark.percentileScores.memberGrowth,
        'National Avg': 50,
        'Peer Avg': 50,
        'Top Performers': 90
      },
      {
        metric: 'Retention',
        'Your Chapter': benchmark.percentileScores.retention,
        'National Avg': 50,
        'Peer Avg': 50,
        'Top Performers': 90
      }
    ]
  }, [benchmark])

  const getPerformanceLevel = (percentile: number): {
    label: string
    color: string
    bgColor: string
  } => {
    if (percentile >= 90) return { label: 'Excellent', color: 'text-green-700', bgColor: 'bg-green-100' }
    if (percentile >= 75) return { label: 'Very Good', color: 'text-green-600', bgColor: 'bg-green-50' }
    if (percentile >= 50) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50' }
    if (percentile >= 25) return { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    return { label: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-50' }
  }

  const getPercentileColor = (percentile: number): string => {
    if (percentile >= 75) return 'text-green-600'
    if (percentile >= 50) return 'text-blue-600'
    if (percentile >= 25) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getComparisonIcon = (current: number, comparison: number) => {
    if (current > comparison) return <ArrowUp size={14} weight="bold" className="text-green-600" />
    if (current < comparison) return <ArrowDown size={14} weight="bold" className="text-red-600" />
    return null
  }

  const overallPerformance = useMemo(() => {
    const scores = Object.values(benchmark.percentileScores)
    const average = scores.reduce((a, b) => a + b, 0) / scores.length
    return Math.round(average)
  }, [benchmark])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{chapter.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Performance Benchmarking & Analysis
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="capitalize">
              {chapter.type} Chapter
            </Badge>
            {chapter.state && (
              <span className="text-sm text-muted-foreground">{chapter.state}</span>
            )}
          </div>
        </div>

        <Card className={`p-4 ${getPerformanceLevel(overallPerformance).bgColor}`}>
          <div className="flex items-center gap-2">
            <Trophy size={24} weight="duotone" className={getPerformanceLevel(overallPerformance).color} />
            <div>
              <p className="text-xs text-muted-foreground">Overall Performance</p>
              <p className={`text-2xl font-bold ${getPerformanceLevel(overallPerformance).color}`}>
                {overallPerformance}th
              </p>
              <p className="text-xs font-medium">Percentile</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Percentile Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={20} weight="duotone" className="text-primary" />
            <p className="text-sm font-medium">Member Engagement</p>
          </div>
          <p className={`text-3xl font-bold mb-2 ${getPercentileColor(benchmark.percentileScores.memberEngagement)}`}>
            {benchmark.percentileScores.memberEngagement}th
          </p>
          <Progress value={benchmark.percentileScores.memberEngagement} className="h-2 mb-2" />
          <Badge className={getPerformanceLevel(benchmark.percentileScores.memberEngagement).bgColor}>
            {getPerformanceLevel(benchmark.percentileScores.memberEngagement).label}
          </Badge>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDots size={20} weight="duotone" className="text-primary" />
            <p className="text-sm font-medium">Event Frequency</p>
          </div>
          <p className={`text-3xl font-bold mb-2 ${getPercentileColor(benchmark.percentileScores.eventFrequency)}`}>
            {benchmark.percentileScores.eventFrequency}th
          </p>
          <Progress value={benchmark.percentileScores.eventFrequency} className="h-2 mb-2" />
          <Badge className={getPerformanceLevel(benchmark.percentileScores.eventFrequency).bgColor}>
            {getPerformanceLevel(benchmark.percentileScores.eventFrequency).label}
          </Badge>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ChartLine size={20} weight="duotone" className="text-primary" />
            <p className="text-sm font-medium">Revenue</p>
          </div>
          <p className={`text-3xl font-bold mb-2 ${getPercentileColor(benchmark.percentileScores.revenueContribution)}`}>
            {benchmark.percentileScores.revenueContribution}th
          </p>
          <Progress value={benchmark.percentileScores.revenueContribution} className="h-2 mb-2" />
          <Badge className={getPerformanceLevel(benchmark.percentileScores.revenueContribution).bgColor}>
            {getPerformanceLevel(benchmark.percentileScores.revenueContribution).label}
          </Badge>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendUp size={20} weight="duotone" className="text-primary" />
            <p className="text-sm font-medium">Member Growth</p>
          </div>
          <p className={`text-3xl font-bold mb-2 ${getPercentileColor(benchmark.percentileScores.memberGrowth)}`}>
            {benchmark.percentileScores.memberGrowth}th
          </p>
          <Progress value={benchmark.percentileScores.memberGrowth} className="h-2 mb-2" />
          <Badge className={getPerformanceLevel(benchmark.percentileScores.memberGrowth).bgColor}>
            {getPerformanceLevel(benchmark.percentileScores.memberGrowth).label}
          </Badge>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target size={20} weight="duotone" className="text-primary" />
            <p className="text-sm font-medium">Retention</p>
          </div>
          <p className={`text-3xl font-bold mb-2 ${getPercentileColor(benchmark.percentileScores.retention)}`}>
            {benchmark.percentileScores.retention}th
          </p>
          <Progress value={benchmark.percentileScores.retention} className="h-2 mb-2" />
          <Badge className={getPerformanceLevel(benchmark.percentileScores.retention).bgColor}>
            {getPerformanceLevel(benchmark.percentileScores.retention).label}
          </Badge>
        </Card>
      </div>

      {/* Radar Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Across Dimensions</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Compare your chapter's percentile rankings against national, peer, and top performer benchmarks
        </p>

        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#6b7280', fontSize: 10 }}
              />
              <Radar
                name="Your Chapter"
                dataKey="Your Chapter"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Radar
                name="National Average"
                dataKey="National Avg"
                stroke="#6b7280"
                fill="#6b7280"
                fillOpacity={0.2}
              />
              <Radar
                name="Peer Average"
                dataKey="Peer Avg"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.2}
              />
              <Radar
                name="Top Performers (90th %)"
                dataKey="Top Performers"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.2}
              />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Detailed Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* National Comparison */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target size={20} weight="duotone" />
            National Benchmarks
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Member Engagement</span>
              <div className="flex items-center gap-2">
                {getComparisonIcon(
                  benchmark.percentileScores.memberEngagement,
                  50
                )}
                <span className="text-sm font-medium">
                  {formatPercentage(benchmark.nationalAverage.memberEngagement)}
                </span>
              </div>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm">Event Frequency</span>
              <div className="flex items-center gap-2">
                {getComparisonIcon(
                  benchmark.percentileScores.eventFrequency,
                  50
                )}
                <span className="text-sm font-medium">
                  {benchmark.nationalAverage.eventFrequency.toFixed(1)} events
                </span>
              </div>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm">Member Growth</span>
              <div className="flex items-center gap-2">
                {getComparisonIcon(
                  benchmark.percentileScores.memberGrowth,
                  50
                )}
                <span className="text-sm font-medium">
                  {formatPercentage(benchmark.nationalAverage.memberGrowth)}
                </span>
              </div>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm">Retention Rate</span>
              <div className="flex items-center gap-2">
                {getComparisonIcon(
                  benchmark.percentileScores.retention,
                  50
                )}
                <span className="text-sm font-medium">
                  {formatPercentage(benchmark.nationalAverage.retention)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Peer Comparison */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users size={20} weight="duotone" />
            Peer Chapter Benchmarks
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Compared to other {chapter.type} chapters
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Member Engagement</span>
              <div className="flex items-center gap-2">
                {getComparisonIcon(
                  benchmark.percentileScores.memberEngagement,
                  50
                )}
                <span className="text-sm font-medium">
                  {formatPercentage(benchmark.peerAverage.memberEngagement)}
                </span>
              </div>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm">Event Frequency</span>
              <div className="flex items-center gap-2">
                {getComparisonIcon(
                  benchmark.percentileScores.eventFrequency,
                  50
                )}
                <span className="text-sm font-medium">
                  {benchmark.peerAverage.eventFrequency.toFixed(1)} events
                </span>
              </div>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm">Member Growth</span>
              <div className="flex items-center gap-2">
                {getComparisonIcon(
                  benchmark.percentileScores.memberGrowth,
                  50
                )}
                <span className="text-sm font-medium">
                  {formatPercentage(benchmark.peerAverage.memberGrowth)}
                </span>
              </div>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm">Retention Rate</span>
              <div className="flex items-center gap-2">
                {getComparisonIcon(
                  benchmark.percentileScores.retention,
                  50
                )}
                <span className="text-sm font-medium">
                  {formatPercentage(benchmark.peerAverage.retention)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Actionable Insights */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lightbulb size={20} weight="duotone" className="text-yellow-600" />
          Actionable Insights & Recommendations
        </h3>

        <div className="space-y-3">
          {benchmark.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-background rounded-lg">
              <CheckCircle size={20} weight="duotone" className="text-primary mt-0.5 shrink-0" />
              <p className="text-sm">{recommendation}</p>
            </div>
          ))}
        </div>

        {overallPerformance >= 75 && (
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-950 rounded-lg">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              Outstanding Performance! Your chapter is in the top quartile across key metrics.
              Continue these strong practices to maintain excellence.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
