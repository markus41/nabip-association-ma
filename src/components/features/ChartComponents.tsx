import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'

interface ChartConfig {
  dataKey: string
  name?: string
  color?: string
}

interface BaseChartProps {
  data: any[]
  title?: string
  description?: string
  height?: number
  loading?: boolean
}

interface LineChartProps extends BaseChartProps {
  lines: ChartConfig[]
  xAxisKey: string
}

interface BarChartProps extends BaseChartProps {
  bars: ChartConfig[]
  xAxisKey: string
  stacked?: boolean
}

interface AreaChartProps extends BaseChartProps {
  areas: ChartConfig[]
  xAxisKey: string
  stacked?: boolean
}

interface PieChartProps extends BaseChartProps {
  dataKey: string
  nameKey: string
  colors?: string[]
}

const defaultColors = [
  'oklch(0.25 0.05 250)',
  'oklch(0.60 0.12 200)',
  'oklch(0.75 0.15 85)',
  'oklch(0.55 0.22 25)',
  'oklch(0.70 0.15 150)',
  'oklch(0.65 0.18 300)',
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold tabular-nums">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function CustomLineChart({
  data,
  lines,
  xAxisKey,
  title,
  description,
  height = 300,
  loading,
}: LineChartProps) {
  if (loading) {
    return (
      <Card className="p-6">
        {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        <div className="animate-shimmer rounded" style={{ height }} />
      </Card>
    )
  }

  return (
    <Card className="p-6">
      {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 250)" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12, fill: 'oklch(0.50 0.02 250)' }}
            stroke="oklch(0.90 0.01 250)"
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'oklch(0.50 0.02 250)' }}
            stroke="oklch(0.90 0.01 250)"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            iconType="circle"
          />
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name || line.dataKey}
              stroke={line.color || defaultColors[index % defaultColors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function CustomBarChart({
  data,
  bars,
  xAxisKey,
  title,
  description,
  height = 300,
  stacked = false,
  loading,
}: BarChartProps) {
  if (loading) {
    return (
      <Card className="p-6">
        {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        <div className="animate-shimmer rounded" style={{ height }} />
      </Card>
    )
  }

  return (
    <Card className="p-6">
      {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 250)" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12, fill: 'oklch(0.50 0.02 250)' }}
            stroke="oklch(0.90 0.01 250)"
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'oklch(0.50 0.02 250)' }}
            stroke="oklch(0.90 0.01 250)"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            iconType="square"
          />
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name || bar.dataKey}
              fill={bar.color || defaultColors[index % defaultColors.length]}
              stackId={stacked ? 'stack' : undefined}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function CustomAreaChart({
  data,
  areas,
  xAxisKey,
  title,
  description,
  height = 300,
  stacked = false,
  loading,
}: AreaChartProps) {
  if (loading) {
    return (
      <Card className="p-6">
        {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        <div className="animate-shimmer rounded" style={{ height }} />
      </Card>
    )
  }

  return (
    <Card className="p-6">
      {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 250)" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12, fill: 'oklch(0.50 0.02 250)' }}
            stroke="oklch(0.90 0.01 250)"
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'oklch(0.50 0.02 250)' }}
            stroke="oklch(0.90 0.01 250)"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            iconType="square"
          />
          {areas.map((area, index) => (
            <Area
              key={area.dataKey}
              type="monotone"
              dataKey={area.dataKey}
              name={area.name || area.dataKey}
              fill={area.color || defaultColors[index % defaultColors.length]}
              stroke={area.color || defaultColors[index % defaultColors.length]}
              stackId={stacked ? 'stack' : undefined}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

export function CustomPieChart({
  data,
  dataKey,
  nameKey,
  colors = defaultColors,
  title,
  description,
  height = 300,
  loading,
}: PieChartProps) {
  if (loading) {
    return (
      <Card className="p-6">
        {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        <div className="animate-shimmer rounded" style={{ height }} />
      </Card>
    )
  }

  return (
    <Card className="p-6">
      {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={(entry) => `${entry[nameKey]}: ${entry[dataKey]}`}
            labelLine={{ stroke: 'oklch(0.50 0.02 250)', strokeWidth: 1 }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}
