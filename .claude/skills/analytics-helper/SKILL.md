---
name: analytics-helper
description: Assists with building reports, dashboards, and data visualizations using Recharts and D3.js for the NABIP AMS. Use when creating member growth charts, revenue analytics, event performance metrics, email engagement tracking, or custom report builders with aggregations and scheduled exports.
---

# Analytics Helper

Drive measurable insights through interactive data visualizations designed for association management decision-making.

## When to Use

Activate this skill when:
- Creating charts with Recharts (line, area, bar, pie)
- Building custom report builders with field selection
- Implementing dashboard KPIs and metrics
- Designing aggregation queries (SUM, AVG, COUNT, MIN, MAX)
- Adding scheduled report generation (daily, weekly, monthly)
- Exporting data to CSV, Excel, or PDF formats
- Working with time-series analysis for trends

## Key Metrics to Track

### Member Analytics
- **Total Members**: Count by status (active, pending, inactive)
- **Growth Rate**: Month-over-month % change
- **Retention Rate**: % of members who renewed
- **Engagement Distribution**: Score ranges (0-25, 26-50, 51-75, 76-100)
- **Tier Distribution**: National vs State vs Local percentages
- **Geographic Distribution**: Members per state/region

### Financial Analytics
- **Total Revenue**: By source (dues, events, donations)
- **Revenue Trends**: Monthly/quarterly comparisons
- **Average Transaction Value**: Per revenue source
- **Payment Status**: Completed vs pending vs failed
- **Revenue per Chapter**: Hierarchical rollup

### Event Analytics
- **Attendance Rate**: Registered vs attended
- **Capacity Utilization**: % of available seats filled
- **Revenue per Event**: Total income vs costs
- **Event Type Performance**: Conference, webinar, workshop comparison
- **Virtual vs In-Person**: Attendance and revenue comparison

### Communication Analytics
- **Email Open Rate**: % of emails opened
- **Click-through Rate**: % of links clicked
- **Unsubscribe Rate**: % who opted out
- **Campaign Performance**: A/B test results
- **Segmentation Effectiveness**: Engagement by audience segment

## Chart Components with Recharts

### Member Growth Trend (Line Chart)

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface MemberGrowthData {
  month: string
  active: number
  pending: number
  inactive: number
}

export function MemberGrowthChart({ data }: { data: MemberGrowthData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Growth Trend</CardTitle>
        <CardDescription>Track membership changes over time to identify growth patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="text-sm"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              className="text-sm"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="active"
              stroke="oklch(0.60 0.12 200)"
              strokeWidth={2}
              name="Active Members"
              dot={{ fill: "oklch(0.60 0.12 200)", r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="pending"
              stroke="oklch(0.75 0.15 85)"
              strokeWidth={2}
              name="Pending"
              dot={{ fill: "oklch(0.75 0.15 85)", r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="inactive"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Inactive"
              dot={{ fill: "hsl(var(--muted-foreground))", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

### Revenue by Source (Area Chart)

```typescript
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface RevenueData {
  month: string
  dues: number
  events: number
  donations: number
}

export function RevenueAreaChart({ data }: { data: RevenueData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Breakdown</CardTitle>
        <CardDescription>Visualize income streams to optimize revenue strategy</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorDues" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.60 0.12 200)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="oklch(0.60 0.12 200)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.75 0.15 85)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="oklch(0.75 0.15 85)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.25 0.05 250)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="oklch(0.25 0.05 250)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
            <Area
              type="monotone"
              dataKey="dues"
              stackId="1"
              stroke="oklch(0.60 0.12 200)"
              fill="url(#colorDues)"
              name="Membership Dues"
            />
            <Area
              type="monotone"
              dataKey="events"
              stackId="1"
              stroke="oklch(0.75 0.15 85)"
              fill="url(#colorEvents)"
              name="Event Revenue"
            />
            <Area
              type="monotone"
              dataKey="donations"
              stackId="1"
              stroke="oklch(0.25 0.05 250)"
              fill="url(#colorDonations)"
              name="Donations"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

### Engagement Distribution (Bar Chart)

```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface EngagementData {
  range: string
  count: number
}

export function EngagementDistributionChart({ data }: { data: EngagementData[] }) {
  const colors = [
    "hsl(var(--destructive))",
    "hsl(var(--warning))",
    "oklch(0.75 0.15 85)",
    "oklch(0.60 0.12 200)"
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Engagement Distribution</CardTitle>
        <CardDescription>Identify engagement levels to target low-scoring members</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

## Custom Report Builder

### Report Configuration Interface

```typescript
interface ReportField {
  table: "members" | "chapters" | "events" | "transactions"
  field: string
  label: string
  type: "string" | "number" | "date" | "boolean"
  aggregation?: "sum" | "avg" | "count" | "min" | "max"
}

interface ReportConfig {
  name: string
  description: string
  fields: ReportField[]
  filters?: Record<string, any>
  groupBy?: string[]
  orderBy?: { field: string; direction: "asc" | "desc" }[]
  schedule?: {
    frequency: "daily" | "weekly" | "monthly"
    dayOfWeek?: number
    dayOfMonth?: number
    time: string
    recipients: string[]
    format: "csv" | "excel" | "pdf"
  }
}

// Example: Generate SQL from report config
function generateReportQuery(config: ReportConfig): string {
  const selectFields = config.fields.map(field => {
    if (field.aggregation) {
      return `${field.aggregation.toUpperCase()}(${field.table}.${field.field}) as ${field.label}`
    }
    return `${field.table}.${field.field} as ${field.label}`
  })

  const groupByFields = config.groupBy
    ? `GROUP BY ${config.groupBy.join(", ")}`
    : ""

  const orderByFields = config.orderBy
    ? `ORDER BY ${config.orderBy.map(o => `${o.field} ${o.direction.toUpperCase()}`).join(", ")}`
    : ""

  return `
    SELECT ${selectFields.join(", ")}
    FROM ${config.fields[0].table}
    ${groupByFields}
    ${orderByFields}
  `.trim()
}
```

### Scheduled Report Generation

```typescript
import { format } from "date-fns"
import * as XLSX from "xlsx"

async function executeScheduledReports() {
  const reports = await db
    .select()
    .from(reportConfigs)
    .where(isNotNull(reportConfigs.schedule))

  for (const reportConfig of reports) {
    const shouldRun = checkSchedule(reportConfig.schedule)

    if (shouldRun) {
      // Execute report query
      const results = await executeReportQuery(reportConfig)

      // Export based on format
      const exportFile = await exportReport(
        results,
        reportConfig.schedule.format,
        reportConfig.name
      )

      // Send to recipients
      await sendReportEmail(
        reportConfig.schedule.recipients,
        reportConfig.name,
        exportFile
      )

      // Log execution
      await createAuditLog({
        action: "scheduled_report_executed",
        reportName: reportConfig.name,
        timestamp: new Date()
      })
    }
  }
}

async function exportReport(data: any[], format: "csv" | "excel" | "pdf", reportName: string) {
  if (format === "csv") {
    return exportToCSV(data, reportName)
  } else if (format === "excel") {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Report")
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    return buffer
  } else {
    return exportToPDF(data, reportName)
  }
}
```

## Dashboard KPIs

### Real-time Metrics Component

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar, Mail } from "lucide-react"

interface KPI {
  title: string
  value: string | number
  change?: number
  changeType?: "positive" | "negative"
  icon: React.ReactNode
}

export function KPIDashboard({ metrics }: { metrics: KPI[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((kpi, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            {kpi.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            {kpi.change !== undefined && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {kpi.changeType === "positive" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={kpi.changeType === "positive" ? "text-green-500" : "text-red-500"}>
                  {Math.abs(kpi.change)}%
                </span>
                {" from last month"}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Usage example
const dashboardMetrics: KPI[] = [
  {
    title: "Total Members",
    value: "20,247",
    change: 12.5,
    changeType: "positive",
    icon: <Users className="h-4 w-4 text-muted-foreground" />
  },
  {
    title: "Monthly Revenue",
    value: "$147,250",
    change: 8.3,
    changeType: "positive",
    icon: <DollarSign className="h-4 w-4 text-muted-foreground" />
  },
  {
    title: "Upcoming Events",
    value: 12,
    icon: <Calendar className="h-4 w-4 text-muted-foreground" />
  },
  {
    title: "Email Engagement",
    value: "34.2%",
    change: -2.1,
    changeType: "negative",
    icon: <Mail className="h-4 w-4 text-muted-foreground" />
  }
]
```

## Performance Optimization Tips

✅ **Use aggregations at database level** (not in-memory)
✅ **Implement pagination** for large datasets (100+ rows)
✅ **Cache expensive queries** (use React Query or SWR)
✅ **Debounce filter inputs** (300ms delay)
✅ **Lazy load chart libraries** (code splitting)
✅ **Virtualize long lists** (react-window/react-virtual)

## Integration with Other Skills

- Combine with `supabase-schema-validator` for optimized queries
- Use with `component-generator` for dashboard UI
- Works with `member-workflow` for engagement analytics

---

**Best for**: Developers building interactive dashboards, custom reports, and data-driven insights for NABIP association leadership and chapter administrators.
