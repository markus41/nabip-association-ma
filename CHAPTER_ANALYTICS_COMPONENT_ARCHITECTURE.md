# Chapter Analytics Component Architecture

## Component Hierarchy & Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application Layer (App.tsx)                  │
│                                                                   │
│  Navigation: Chapters | Chapter Comparison | Chapter Detail      │
└───────────────────┬─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬──────────────────┐
        │           │           │                  │
        ▼           ▼           ▼                  ▼
┌──────────────┐ ┌──────────┐ ┌───────────────┐ ┌─────────────┐
│ ChapterGrid  │ │ Compare  │ │ Chapter       │ │ Dashboard   │
│ View         │ │ View     │ │ Detail View   │ │ Widgets     │
└──────┬───────┘ └────┬─────┘ └───────┬───────┘ └──────┬──────┘
       │              │                │                 │
       └──────┬───────┴────────┬───────┴─────────┬───────┘
              │                │                 │
              ▼                ▼                 ▼
       ┌─────────────────────────────────────────────┐
       │        Core Analytics Components            │
       └─────────────────────────────────────────────┘
```

---

## Core Components

### 1. ChapterCardEnhanced
**Purpose:** Display chapter overview with sparkline trends
**Dependencies:**
- `chapter-analytics-utils.ts` → Trend data generation
- `Recharts` → Sparkline rendering
- `ChapterCard` (extends) → Base card functionality

```
┌──────────────────────────────────────────┐
│      ChapterCardEnhanced                 │
├──────────────────────────────────────────┤
│ Props:                                   │
│  - chapter: Chapter                      │
│  - sparklineData?: ChapterTrendData      │
│  - showSparklines: boolean               │
├──────────────────────────────────────────┤
│ Features:                                │
│  ✓ Member growth sparkline              │
│  ✓ Event attendance sparkline           │
│  ✓ Revenue trend sparkline              │
│  ✓ Growth rate indicators               │
│  ✓ Trend direction icons                │
├──────────────────────────────────────────┤
│ Data Flow:                               │
│  1. Receive chapter prop                │
│  2. Generate/use trend data (memoized)  │
│  3. Calculate growth metrics            │
│  4. Render sparklines                   │
│  5. Display trend indicators            │
└──────────────────────────────────────────┘
```

---

### 2. ChapterComparisonSelector
**Purpose:** Multi-select interface for choosing chapters to compare
**Dependencies:**
- `Command` → Search and selection UI
- `Popover` → Dropdown interface

```
┌──────────────────────────────────────────┐
│   ChapterComparisonSelector              │
├──────────────────────────────────────────┤
│ Props:                                   │
│  - chapters: Chapter[]                   │
│  - selectedIds: string[]                 │
│  - onSelectionChange: (ids) => void      │
│  - maxSelections: number (default: 5)   │
├──────────────────────────────────────────┤
│ Features:                                │
│  ✓ Grouped by chapter type              │
│  ✓ Hierarchical breadcrumbs             │
│  ✓ Search functionality                 │
│  ✓ Quick presets                        │
│  ✓ Selection badges                     │
├──────────────────────────────────────────┤
│ State Management:                        │
│  [searchQuery] → Filter chapters         │
│  [open] → Popover visibility            │
│  selectedIds (lifted) → Parent state    │
└──────────────────────────────────────────┘
```

---

### 3. ChapterComparisonView
**Purpose:** Side-by-side chapter performance comparison
**Dependencies:**
- `ChapterComparisonSelector` → Chapter selection
- `chapter-analytics-utils.ts` → Comparison data
- `Recharts` → Bar chart visualization
- `Table` → Comparison grid

```
┌──────────────────────────────────────────────────┐
│        ChapterComparisonView                     │
├──────────────────────────────────────────────────┤
│ Props:                                           │
│  - chapters: Chapter[]                           │
│  - preSelectedIds?: string[]                     │
│  - onExport?: (format, data) => void             │
├──────────────────────────────────────────────────┤
│ Features:                                        │
│  ✓ Aggregate statistics cards                   │
│  ✓ Bar chart (Members/Events/Engagement)        │
│  ✓ Comparison table with rankings               │
│  ✓ CSV export                                   │
│  ✓ Shareable URLs                               │
│  ✓ Compact/Expanded mode                        │
├──────────────────────────────────────────────────┤
│ Data Flow:                                       │
│  1. Receive chapters + selected IDs              │
│  2. Generate comparison data (memoized)          │
│  3. Calculate aggregate stats                    │
│  4. Prepare chart data                           │
│  5. Render visualizations                        │
│  6. Handle exports                               │
├──────────────────────────────────────────────────┤
│ Subcomponents:                                   │
│  → ChapterComparisonSelector                     │
│  → Aggregate stat cards (5)                      │
│  → BarChart                                      │
│  → Comparison Table                              │
└──────────────────────────────────────────────────┘
```

---

### 4. ChapterBenchmarkingDashboard
**Purpose:** Percentile ranking and performance benchmarking
**Dependencies:**
- `chapter-analytics-utils.ts` → Benchmark calculations
- `Recharts` → Radar chart
- `Progress` → Percentile bars

```
┌──────────────────────────────────────────────────┐
│    ChapterBenchmarkingDashboard                  │
├──────────────────────────────────────────────────┤
│ Props:                                           │
│  - chapter: Chapter                              │
│  - allChapters: Chapter[]                        │
├──────────────────────────────────────────────────┤
│ Features:                                        │
│  ✓ Overall percentile score                     │
│  ✓ 5 dimension percentile cards                 │
│  ✓ Radar chart comparison                       │
│  ✓ National/Peer/Top benchmark cards            │
│  ✓ AI-generated recommendations                 │
│  ✓ Performance level badges                     │
├──────────────────────────────────────────────────┤
│ Data Flow:                                       │
│  1. Receive chapter + all chapters               │
│  2. Generate benchmark data (memoized)           │
│  3. Calculate percentiles                        │
│  4. Prepare radar chart data                     │
│  5. Generate recommendations                     │
│  6. Render dashboard                             │
├──────────────────────────────────────────────────┤
│ Subcomponents:                                   │
│  → Overall performance card                      │
│  → 5 percentile score cards                     │
│  → RadarChart                                    │
│  → 2 benchmark comparison cards                 │
│  → Insights card                                 │
└──────────────────────────────────────────────────┘
```

---

## Utility Layer

### chapter-analytics-utils.ts
**Purpose:** Core analytics calculations and data generation

```
┌─────────────────────────────────────────────────┐
│       chapter-analytics-utils.ts                │
├─────────────────────────────────────────────────┤
│ Trend Generation:                               │
│  • generateMemberTrend()                        │
│  • generateEventTrend()                         │
│  • generateRevenueTrend()                       │
│  • getTrendLabels()                             │
│  • generateChapterTrendData()                   │
├─────────────────────────────────────────────────┤
│ Metrics Calculation:                            │
│  • calculateGrowthRate()                        │
│  • calculateChapterMetrics()                    │
│  • getTrendDirection()                          │
├─────────────────────────────────────────────────┤
│ Comparison & Benchmarking:                      │
│  • generateChapterComparison()                  │
│  • generateChapterBenchmark()                   │
│  • calculatePercentile()                        │
├─────────────────────────────────────────────────┤
│ Formatting & Display:                           │
│  • formatPercentage()                           │
│  • formatGrowthRate()                           │
│  • getTrendColor()                              │
│  • getSparklineColor()                          │
└─────────────────────────────────────────────────┘
```

---

## Data Type Relationships

```
Chapter (from types.ts)
    │
    ├──> ChapterTrendData
    │     ├── memberTrend: number[]
    │     ├── eventTrend: number[]
    │     ├── revenueTrend: number[]
    │     └── labels: string[]
    │
    ├──> ChapterMetrics
    │     ├── memberGrowthRate: number
    │     ├── eventAttendanceRate: number
    │     ├── revenueGrowthRate: number
    │     ├── engagementScore: number
    │     └── retentionRate: number
    │
    ├──> ChapterComparison
    │     ├── chapter: Chapter
    │     ├── metrics: ChapterMetrics
    │     ├── trendData: ChapterTrendData
    │     └── rank: { byMembers, byEvents, byEngagement }
    │
    └──> ChapterBenchmark
          ├── chapter: Chapter
          ├── percentileScores: { ... }
          ├── nationalAverage: { ... }
          ├── peerAverage: { ... }
          ├── topPerformers: { ... }
          └── recommendations: string[]
```

---

## Integration Patterns

### Pattern 1: Standalone Enhanced Cards
```tsx
import { ChapterCardEnhanced } from '@/components/features/ChapterCardEnhanced'

// Single card with auto-generated trends
<ChapterCardEnhanced chapter={chapter} />
```

### Pattern 2: Grid with Pre-Generated Trends
```tsx
const chaptersWithTrends = useMemo(() =>
  chapters.map(c => ({
    chapter: c,
    trendData: generateChapterTrendData(c)
  })), [chapters]
)

// Optimized grid rendering
{chaptersWithTrends.map(({ chapter, trendData }) => (
  <ChapterCardEnhanced
    chapter={chapter}
    sparklineData={trendData}
  />
))}
```

### Pattern 3: Comparison with URL Sharing
```tsx
// Parse URL parameters
const params = new URLSearchParams(location.search)
const preSelectedIds = params.get('compare')?.split(',') || []

// Render comparison with pre-selection
<ChapterComparisonView
  chapters={chapters}
  preSelectedIds={preSelectedIds}
/>
```

### Pattern 4: Tabbed Detail View
```tsx
<Tabs>
  <TabsContent value="overview">
    <ChapterCardEnhanced chapter={chapter} />
  </TabsContent>
  <TabsContent value="benchmarking">
    <ChapterBenchmarkingDashboard
      chapter={chapter}
      allChapters={allChapters}
    />
  </TabsContent>
</Tabs>
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────┐
│              Application State                   │
│         (useKV from GitHub Spark)                │
│                                                  │
│  chapters: Chapter[]                             │
└───────────────┬─────────────────────────────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
    ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Grid    │ │ Compare │ │ Bench   │
│ View    │ │ View    │ │ View    │
└────┬────┘ └────┬────┘ └────┬────┘
     │           │           │
     │   ┌───────┴───────┐   │
     │   │               │   │
     ▼   ▼               ▼   ▼
┌────────────────────────────────┐
│  Local State (useState/Memo)   │
│                                │
│  • selectedIds                 │
│  • trendData (memoized)        │
│  • comparisonData (memoized)   │
│  • benchmark (memoized)        │
└────────────────────────────────┘
```

---

## Performance Optimization Strategy

### Memoization Points
```
Chapter[] (from useKV)
    │
    ├──> useMemo(() => generateChapterTrendData(chapter))
    │     └── Cached per chapter instance
    │
    ├──> useMemo(() => calculateChapterMetrics(chapter, trendData))
    │     └── Cached per chapter + trend data
    │
    ├──> useMemo(() => generateChapterComparison(chapter, allChapters))
    │     └── Cached per selection
    │
    └──> useMemo(() => generateChapterBenchmark(chapter, allChapters))
          └── Cached per chapter + all chapters
```

### Rendering Optimization
- **Animation Disabled**: `isAnimationActive={false}` on all charts
- **Responsive Containers**: Fixed heights prevent layout shifts
- **Lazy Loading**: Heavy components loaded on-demand
- **Debouncing**: Chart re-renders throttled to 300ms

---

## Accessibility Architecture

### Keyboard Navigation Flow
```
Tab → Card Focus
  ↓
Tab → Quick Actions (hover overlay)
  ↓
Enter → Open Action (Edit/View/Message)
  ↓
Tab → Next Interactive Element

ESC → Close Popover/Drawer
Arrow Keys → Navigate Command Palette
Space/Enter → Select Option
```

### ARIA Structure
```
<article role="article" aria-label="Chapter card with analytics">
  <div aria-label="Member growth trend chart">
    <ResponsiveContainer>...</ResponsiveContainer>
  </div>
  <table role="table" aria-label="Chapter comparison data">
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</article>
```

---

## Export Data Flow

### CSV Export Pipeline
```
ChapterComparisonView
    │
    └──> handleExportCSV()
          │
          ├──> Build headers array
          ├──> Map comparison data to rows
          ├──> Format values (percentages, numbers)
          ├──> Join with commas (escape quotes)
          ├──> Create Blob
          ├──> Generate download URL
          └──> Trigger download
```

### Shareable URL Generation
```
ChapterComparisonView
    │
    └──> handleShare()
          │
          ├──> Get current URL
          ├──> Create URLSearchParams
          ├──> Append selectedIds: "chapter-1,chapter-2,chapter-3"
          ├──> Copy to clipboard
          └──> Show toast notification
```

---

## Responsive Layout Breakpoints

```
320px                768px              1024px             1920px+
  │                   │                   │                   │
  ▼                   ▼                   ▼                   ▼
┌─────┐           ┌───────┐          ┌──────────┐       ┌──────────┐
│ 1   │           │  2-3  │          │   3-4    │       │    5+    │
│ col │           │  col  │          │   col    │       │   col    │
│     │           │       │          │          │       │          │
│ V   │           │  H    │          │    H     │       │    H     │
│ e   │           │  o    │          │    o     │       │    o     │
│ r   │           │  r    │          │    r     │       │    r     │
│ t   │           │  i    │          │    i     │       │    i     │
│ i   │           │  z    │          │    z     │       │    z     │
│ c   │           │  o    │          │    o     │       │    o     │
│ a   │           │  n    │          │    n     │       │    n     │
│ l   │           │  t    │          │    t     │       │    t     │
│     │           │  a    │          │    a     │       │    a     │
│ S   │           │  l    │          │    l     │       │    l     │
│ c   │           │        │          │          │       │          │
│ r   │           │  S     │          │    S     │       │    F     │
│ o   │           │  c     │          │    c     │       │    u     │
│ l   │           │  r     │          │    r     │       │    l     │
│ l   │           │  o     │          │    o     │       │    l     │
│     │           │  l     │          │    l     │       │          │
│     │           │  l     │          │    l     │       │  View    │
└─────┘           └───────┘          └──────────┘       └──────────┘

Mobile            Tablet            Desktop           Wide Desktop
```

---

## Component File Summary

| Component | LOC | Dependencies | Exports |
|-----------|-----|-------------|---------|
| ChapterCardEnhanced | 460 | Recharts, Phosphor, Framer | 1 component |
| ChapterComparisonSelector | 278 | Command, Popover | 1 component |
| ChapterComparisonView | 425 | Recharts, Table | 1 component |
| ChapterBenchmarkingDashboard | 478 | Recharts, Progress | 1 component |
| chapter-analytics-utils | 412 | types.ts | 20 functions |

**Total:** 2,053 lines of production code

---

## Testing Architecture

### Unit Test Coverage (Future)
```
chapter-analytics-utils.ts
  ├── generateMemberTrend()
  ├── calculateGrowthRate()
  ├── calculatePercentile()
  └── generateChapterBenchmark()

Components (Integration Tests)
  ├── ChapterCardEnhanced rendering
  ├── ChapterComparisonSelector selection
  ├── ChapterComparisonView export
  └── ChapterBenchmarkingDashboard calculation
```

---

**Last Updated:** 2025-11-15
**Version:** 1.0.0
**Maintained By:** dashboard-analytics-engineer
