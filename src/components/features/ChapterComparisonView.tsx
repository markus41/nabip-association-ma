import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DownloadSimple,
  FilePdf,
  FileCsv,
  TrendUp,
  TrendDown,
  Minus,
  Share,
  ChartBar
} from '@phosphor-icons/react'
import type { Chapter } from '@/lib/types'
import {
  generateChapterComparison,
  getTrendDirection,
  getTrendColor,
  formatGrowthRate,
  formatPercentage
} from '@/lib/chapter-analytics-utils'
import { ChapterComparisonSelector } from './ChapterComparisonSelector'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

/**
 * Establishes comprehensive chapter comparison view with side-by-side metrics analysis.
 * Implements data export, shareable links, and visual trend indicators.
 *
 * Best for: Multi-chapter performance analysis and benchmarking
 *
 * @param chapters - All available chapters
 * @param preSelectedIds - Initially selected chapter IDs
 * @param onExport - Optional callback for custom export handling
 */
export interface ChapterComparisonViewProps {
  chapters: Chapter[]
  preSelectedIds?: string[]
  onExport?: (format: 'pdf' | 'csv', data: any) => void
}

export function ChapterComparisonView({
  chapters,
  preSelectedIds = [],
  onExport
}: ChapterComparisonViewProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(preSelectedIds)
  const [compactMode, setCompactMode] = useState(false)

  // Generate comparison data for selected chapters
  const comparisonData = useMemo(() => {
    const selectedChapters = chapters.filter(c => selectedIds.includes(c.id))
    return selectedChapters.map(chapter => generateChapterComparison(chapter, chapters))
  }, [chapters, selectedIds])

  // Calculate aggregate stats
  const aggregateStats = useMemo(() => {
    if (comparisonData.length === 0) {
      return {
        totalMembers: 0,
        avgMemberCount: 0,
        totalEvents: 0,
        avgEngagement: 0,
        avgGrowthRate: 0
      }
    }

    const totalMembers = comparisonData.reduce((sum, c) => sum + c.chapter.memberCount, 0)
    const totalEvents = comparisonData.reduce((sum, c) => sum + c.chapter.activeEventsCount, 0)
    const avgEngagement = comparisonData.reduce((sum, c) => sum + c.metrics.engagementScore, 0) / comparisonData.length
    const avgGrowthRate = comparisonData.reduce((sum, c) => sum + c.metrics.memberGrowthRate, 0) / comparisonData.length

    return {
      totalMembers,
      avgMemberCount: Math.round(totalMembers / comparisonData.length),
      totalEvents,
      avgEngagement: Math.round(avgEngagement),
      avgGrowthRate
    }
  }, [comparisonData])

  // Prepare chart data
  const chartData = useMemo(() => {
    return comparisonData.map(c => ({
      name: c.chapter.name,
      Members: c.chapter.memberCount,
      Events: c.chapter.activeEventsCount,
      'Engagement Score': c.metrics.engagementScore
    }))
  }, [comparisonData])

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

  const handleExportCSV = () => {
    try {
      // Build CSV content
      const headers = [
        'Chapter Name',
        'Type',
        'State/City',
        'Member Count',
        'Member Growth',
        'Active Events',
        'Event Growth',
        'Engagement Score',
        'Retention Rate',
        'Rank by Members',
        'Rank by Events',
        'Rank by Engagement'
      ]

      const rows = comparisonData.map(c => [
        c.chapter.name,
        c.chapter.type,
        c.chapter.city || c.chapter.state || '',
        c.chapter.memberCount,
        formatGrowthRate(c.metrics.memberGrowthRate),
        c.chapter.activeEventsCount,
        formatGrowthRate(c.metrics.eventAttendanceRate),
        c.metrics.engagementScore,
        formatPercentage(c.metrics.retentionRate),
        c.rank.byMembers,
        c.rank.byEvents,
        c.rank.byEngagement
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `chapter-comparison-${Date.now()}.csv`
      link.click()
      URL.revokeObjectURL(url)

      toast.success('Export Complete', {
        description: 'Chapter comparison exported to CSV'
      })

      onExport?.('csv', comparisonData)
    } catch (error) {
      toast.error('Export Failed', {
        description: 'Failed to export comparison data'
      })
    }
  }

  const handleExportPDF = () => {
    toast.info('PDF Export', {
      description: 'PDF export feature coming soon. Use CSV export for now.'
    })
    onExport?.('pdf', comparisonData)
  }

  const handleShare = async () => {
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('compare', selectedIds.join(','))

      await navigator.clipboard.writeText(url.toString())
      toast.success('Link Copied', {
        description: 'Shareable comparison link copied to clipboard'
      })
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const getHighlightClass = (value: number, values: number[], isHighBetter: boolean = true) => {
    const max = Math.max(...values)
    const min = Math.min(...values)

    if (value === max && isHighBetter) return 'font-bold text-green-600'
    if (value === min && !isHighBetter) return 'font-bold text-green-600'
    if (value === min && isHighBetter) return 'italic text-muted-foreground'
    if (value === max && !isHighBetter) return 'italic text-muted-foreground'

    return ''
  }

  if (comparisonData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Chapter Comparison</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Compare performance metrics across 2-5 chapters
            </p>
          </div>
        </div>

        <Card className="p-6">
          <ChapterComparisonSelector
            chapters={chapters}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </Card>

        <Card className="p-12 text-center">
          <ChartBar size={64} weight="duotone" className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select Chapters to Compare</h3>
          <p className="text-sm text-muted-foreground">
            Choose 2-5 chapters from the selector above to begin comparison
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chapter Comparison</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comparing {comparisonData.length} chapter{comparisonData.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
          >
            <Share size={16} weight="bold" className="mr-2" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
          >
            <FileCsv size={16} weight="bold" className="mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
          >
            <FilePdf size={16} weight="bold" className="mr-2" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCompactMode(!compactMode)}
          >
            {compactMode ? 'Expanded' : 'Compact'} Mode
          </Button>
        </div>
      </div>

      {/* Chapter Selector */}
      <Card className="p-6">
        <ChapterComparisonSelector
          chapters={chapters}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </Card>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Members</p>
          <p className="text-2xl font-bold tabular-nums">{aggregateStats.totalMembers.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Member Count</p>
          <p className="text-2xl font-bold tabular-nums">{aggregateStats.avgMemberCount.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Events</p>
          <p className="text-2xl font-bold tabular-nums">{aggregateStats.totalEvents}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Engagement</p>
          <p className="text-2xl font-bold tabular-nums">{aggregateStats.avgEngagement}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Growth Rate</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold tabular-nums">
              {formatGrowthRate(aggregateStats.avgGrowthRate)}
            </p>
            {getTrendIcon(getTrendDirection(aggregateStats.avgGrowthRate))}
          </div>
        </Card>
      </div>

      {/* Comparison Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Members" fill="#3b82f6" />
              <Bar dataKey="Events" fill="#10b981" />
              <Bar dataKey="Engagement Score" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Comparison Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="sticky left-0 bg-muted/50 z-10 min-w-[200px]">
                  Chapter
                </TableHead>
                <TableHead className="text-right">Members</TableHead>
                <TableHead className="text-right">Growth</TableHead>
                <TableHead className="text-right">Events</TableHead>
                <TableHead className="text-right">Engagement</TableHead>
                <TableHead className="text-right">Retention</TableHead>
                {!compactMode && (
                  <>
                    <TableHead className="text-center">Rank (Members)</TableHead>
                    <TableHead className="text-center">Rank (Events)</TableHead>
                    <TableHead className="text-center">Rank (Engagement)</TableHead>
                    <TableHead className="min-w-[150px]">Contact</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonData.map((comparison, index) => {
                const memberCounts = comparisonData.map(c => c.chapter.memberCount)
                const eventCounts = comparisonData.map(c => c.chapter.activeEventsCount)
                const engagementScores = comparisonData.map(c => c.metrics.engagementScore)

                return (
                  <TableRow key={comparison.chapter.id} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                    <TableCell className="sticky left-0 bg-inherit z-10">
                      <div className="flex flex-col gap-1">
                        <p className="font-medium">{comparison.chapter.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize text-xs">
                            {comparison.chapter.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {comparison.chapter.city || comparison.chapter.state}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={`text-right tabular-nums ${getHighlightClass(comparison.chapter.memberCount, memberCounts)}`}>
                      {comparison.chapter.memberCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {getTrendIcon(getTrendDirection(comparison.metrics.memberGrowthRate))}
                        <span className={`text-sm tabular-nums ${getTrendColor(getTrendDirection(comparison.metrics.memberGrowthRate))}`}>
                          {formatGrowthRate(comparison.metrics.memberGrowthRate)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={`text-right tabular-nums ${getHighlightClass(comparison.chapter.activeEventsCount, eventCounts)}`}>
                      {comparison.chapter.activeEventsCount}
                    </TableCell>
                    <TableCell className={`text-right tabular-nums ${getHighlightClass(comparison.metrics.engagementScore, engagementScores)}`}>
                      {comparison.metrics.engagementScore}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPercentage(comparison.metrics.retentionRate)}
                    </TableCell>
                    {!compactMode && (
                      <>
                        <TableCell className="text-center tabular-nums">
                          #{comparison.rank.byMembers}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          #{comparison.rank.byEvents}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          #{comparison.rank.byEngagement}
                        </TableCell>
                        <TableCell>
                          {comparison.chapter.contactEmail && (
                            <a
                              href={`mailto:${comparison.chapter.contactEmail}`}
                              className="text-sm text-primary hover:underline"
                            >
                              {comparison.chapter.contactEmail}
                            </a>
                          )}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  )
}
