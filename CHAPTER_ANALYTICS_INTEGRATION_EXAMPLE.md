# Chapter Analytics Integration Examples

Complete integration examples showing how to use the chapter analytics components in the NABIP AMS.

## Example 1: Enhanced Chapter Grid with Sparklines

Replace the existing chapter grid with sparkline-enhanced cards:

```tsx
import { useState, useMemo } from 'react'
import { useKV } from '@github/spark'
import { ChapterCardEnhanced } from '@/components/features/ChapterCardEnhanced'
import { generateChapterTrendData } from '@/lib/chapter-analytics-utils'
import type { Chapter } from '@/lib/types'

export function ChapterGridView() {
  const [chapters] = useKV<Chapter[]>('chapters', [])
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)

  // Pre-generate trend data for performance (memoized)
  const chaptersWithTrends = useMemo(() => {
    return chapters.map(chapter => ({
      chapter,
      trendData: generateChapterTrendData(chapter)
    }))
  }, [chapters])

  const handleViewDetails = (chapter: Chapter) => {
    setSelectedChapterId(chapter.id)
    // Navigate to details view or open modal
  }

  const handleViewAnalytics = (chapterId: string) => {
    // Open analytics drawer or navigate to benchmarking
    console.log('View analytics for:', chapterId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Chapters</h2>
        <p className="text-sm text-muted-foreground">
          {chapters.length} total chapters
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {chaptersWithTrends.map(({ chapter, trendData }) => (
          <ChapterCardEnhanced
            key={chapter.id}
            chapter={chapter}
            sparklineData={trendData}
            showSparklines={true}
            onViewDetails={handleViewDetails}
            onViewAnalytics={handleViewAnalytics}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## Example 2: Chapter Comparison Feature

Dedicated comparison view with navigation:

```tsx
import { useState, useEffect } from 'react'
import { useKV } from '@github/spark'
import { Button } from '@/components/ui/button'
import { ChapterComparisonView } from '@/components/features/ChapterComparisonView'
import { ArrowLeft } from '@phosphor-icons/react'
import type { Chapter } from '@/lib/types'

export function ChapterComparisonFeature() {
  const [chapters] = useKV<Chapter[]>('chapters', [])
  const [preSelectedIds, setPreSelectedIds] = useState<string[]>([])

  // Parse URL parameters for shareable links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const compareParam = params.get('compare')

    if (compareParam) {
      const ids = compareParam.split(',')
      setPreSelectedIds(ids)
    }
  }, [])

  const handleExport = (format: 'pdf' | 'csv', data: any) => {
    console.log(`Exporting ${format}:`, data)
    // Additional export handling (e.g., send to analytics service)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={16} weight="bold" className="mr-2" />
          Back
        </Button>
      </div>

      <ChapterComparisonView
        chapters={chapters}
        preSelectedIds={preSelectedIds}
        onExport={handleExport}
      />
    </div>
  )
}
```

---

## Example 3: Chapter Detail View with Benchmarking

Comprehensive chapter detail page with benchmarking dashboard:

```tsx
import { useState } from 'react'
import { useKV } from '@github/spark'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChapterCardEnhanced } from '@/components/features/ChapterCardEnhanced'
import { ChapterBenchmarkingDashboard } from '@/components/features/ChapterBenchmarkingDashboard'
import { ArrowLeft, ChartLine, Info } from '@phosphor-icons/react'
import type { Chapter } from '@/lib/types'

interface ChapterDetailViewProps {
  chapterId: string
  onBack: () => void
}

export function ChapterDetailView({ chapterId, onBack }: ChapterDetailViewProps) {
  const [chapters] = useKV<Chapter[]>('chapters', [])
  const [activeTab, setActiveTab] = useState('overview')

  const chapter = chapters.find(c => c.id === chapterId)

  if (!chapter) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground">Chapter not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={16} weight="bold" className="mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{chapter.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {chapter.city || chapter.state}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <Info size={16} weight="bold" className="mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="benchmarking">
            <ChartLine size={16} weight="bold" className="mr-2" />
            Performance Benchmarking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ChapterCardEnhanced
                chapter={chapter}
                showSparklines={true}
                showQuickActions={false}
              />
            </div>

            <div className="lg:col-span-2">
              {/* Additional chapter information */}
              <div className="space-y-4">
                {chapter.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">About</h3>
                    <p className="text-sm text-muted-foreground">
                      {chapter.description}
                    </p>
                  </div>
                )}

                {chapter.meetingSchedule && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Meeting Schedule</h3>
                    <p className="text-sm text-muted-foreground">
                      {chapter.meetingSchedule}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="benchmarking">
          <ChapterBenchmarkingDashboard
            chapter={chapter}
            allChapters={chapters}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## Example 4: Dashboard Widget with Top Chapters

Add a top chapters widget to the main dashboard:

```tsx
import { useMemo } from 'react'
import { useKV } from '@github/spark'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, TrendUp, Users, CalendarDots } from '@phosphor-icons/react'
import {
  generateChapterMetrics,
  generateChapterTrendData,
  getTrendDirection,
  getTrendColor,
  formatGrowthRate
} from '@/lib/chapter-analytics-utils'
import type { Chapter } from '@/lib/types'

interface TopChaptersWidgetProps {
  onViewAll: () => void
  onViewChapter: (chapterId: string) => void
}

export function TopChaptersWidget({ onViewAll, onViewChapter }: TopChaptersWidgetProps) {
  const [chapters] = useKV<Chapter[]>('chapters', [])

  const topChapters = useMemo(() => {
    return chapters
      .map(chapter => {
        const trendData = generateChapterTrendData(chapter)
        const metrics = generateChapterMetrics(chapter, trendData)
        return { chapter, metrics }
      })
      .sort((a, b) => b.metrics.engagementScore - a.metrics.engagementScore)
      .slice(0, 5)
  }, [chapters])

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Top Performing Chapters</h3>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          View All
          <ArrowRight size={16} weight="bold" className="ml-2" />
        </Button>
      </div>

      <div className="space-y-3">
        {topChapters.map(({ chapter, metrics }, index) => {
          const memberDirection = getTrendDirection(metrics.memberGrowthRate)
          const memberColor = getTrendColor(memberDirection)

          return (
            <div
              key={chapter.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onViewChapter(chapter.id)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Badge variant="outline" className="shrink-0">
                  #{index + 1}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{chapter.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users size={12} weight="bold" />
                      {chapter.memberCount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDots size={12} weight="bold" />
                      {chapter.activeEventsCount} events
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1">
                  <TrendUp size={14} weight="bold" className="text-primary" />
                  <span className="text-sm font-medium">
                    {metrics.engagementScore}
                  </span>
                </div>
                <span className={`text-xs ${memberColor}`}>
                  {formatGrowthRate(metrics.memberGrowthRate)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
```

---

## Example 5: Analytics Drawer with Quick Stats

Slide-out analytics drawer accessible from chapter cards:

```tsx
import { useState } from 'react'
import { useKV } from '@github/spark'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ChartLine, X } from '@phosphor-icons/react'
import {
  generateChapterTrendData,
  generateChapterMetrics,
  formatGrowthRate,
  formatPercentage
} from '@/lib/chapter-analytics-utils'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { Chapter } from '@/lib/types'

interface ChapterAnalyticsDrawerProps {
  chapterId: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ChapterAnalyticsDrawer({
  chapterId,
  trigger,
  open,
  onOpenChange
}: ChapterAnalyticsDrawerProps) {
  const [chapters] = useKV<Chapter[]>('chapters', [])
  const chapter = chapters.find(c => c.id === chapterId)

  if (!chapter) return null

  const trendData = generateChapterTrendData(chapter)
  const metrics = generateChapterMetrics(chapter, trendData)

  const memberChartData = trendData.memberTrend.map((value, index) => ({
    month: trendData.labels[index],
    members: value
  }))

  const eventChartData = trendData.eventTrend.map((value, index) => ({
    month: trendData.labels[index],
    events: value
  }))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <ChartLine size={16} weight="bold" className="mr-2" />
            Quick Stats
          </Button>
        )}
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{chapter.name}</SheetTitle>
          <SheetDescription>
            Performance analytics and trends
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Member Growth</p>
              <p className="text-2xl font-bold">
                {formatGrowthRate(metrics.memberGrowthRate)}
              </p>
            </Card>

            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Engagement</p>
              <p className="text-2xl font-bold">
                {metrics.engagementScore}
              </p>
            </Card>

            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Retention</p>
              <p className="text-2xl font-bold">
                {formatPercentage(metrics.retentionRate)}
              </p>
            </Card>

            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Event Rate</p>
              <p className="text-2xl font-bold">
                {formatPercentage(metrics.eventAttendanceRate)}
              </p>
            </Card>
          </div>

          <Separator />

          {/* Member Trend Chart */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Member Growth Trend</h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={memberChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="members"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Event Trend Chart */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Event Activity Trend</h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eventChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="events"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <Separator />

          {/* Chapter Info */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Members:</span>
              <span className="font-medium">{chapter.memberCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active Events:</span>
              <span className="font-medium">{chapter.activeEventsCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Chapter Type:</span>
              <Badge variant="outline" className="capitalize">
                {chapter.type}
              </Badge>
            </div>
          </div>

          <Button className="w-full" onClick={() => {
            // Navigate to full benchmarking dashboard
            console.log('View full benchmarking for:', chapterId)
          }}>
            View Full Performance Report
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

---

## Example 6: Complete App.tsx Integration

Full integration into main application navigation:

```tsx
// Add to App.tsx navigation items
const navItems = [
  // ... existing items
  {
    id: 'chapter-comparison',
    label: 'Chapter Comparison',
    icon: <ChartLine size={20} weight="duotone" />,
    view: 'chapter-comparison'
  }
]

// Add to view rendering
{currentView === 'chapters' && (
  <ChapterGridView />
)}

{currentView === 'chapter-comparison' && (
  <ChapterComparisonFeature />
)}

{currentView === 'chapter-detail' && selectedChapterId && (
  <ChapterDetailView
    chapterId={selectedChapterId}
    onBack={() => setCurrentView('chapters')}
  />
)}
```

---

## Performance Tips

### 1. Memoize Trend Data for Lists
```tsx
const chaptersWithTrends = useMemo(() => {
  return chapters.map(chapter => ({
    chapter,
    trendData: generateChapterTrendData(chapter)
  }))
}, [chapters])
```

### 2. Lazy Load Heavy Components
```tsx
import { lazy, Suspense } from 'react'

const ChapterBenchmarkingDashboard = lazy(() =>
  import('@/components/features/ChapterBenchmarkingDashboard').then(m => ({
    default: m.ChapterBenchmarkingDashboard
  }))
)

<Suspense fallback={<LoadingSpinner />}>
  <ChapterBenchmarkingDashboard chapter={chapter} allChapters={allChapters} />
</Suspense>
```

### 3. Debounce Chart Updates
```tsx
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

const debouncedChapters = useDebouncedValue(chapters, 300)
```

---

## Additional Resources

- **Full Documentation**: `CHAPTER_ANALYTICS_DOCUMENTATION.md`
- **Component Source**: `src/components/features/Chapter*.tsx`
- **Utilities**: `src/lib/chapter-analytics-utils.ts`
- **Type Definitions**: `src/lib/types.ts`

---

**Last Updated:** 2025-11-15
**Examples Version:** 1.0.0
