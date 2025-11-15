import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
  Label,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkle, TrendUp, TrendDown, Minus, CalendarDots, EnvelopeSimple, Users } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface MemberGrowthDataPoint {
  period: string
  members: number
  growth: number
  milestone?: {
    type: 'campaign' | 'event' | 'initiative'
    title: string
    description: string
    impact: string
  }
}

interface ComparisonPeriod {
  label: string
  value: 'month' | 'year'
}

interface AIInsight {
  id: string
  type: 'positive' | 'negative' | 'neutral'
  title: string
  description: string
  metric?: string
  icon: React.ElementType
}

const comparisonPeriods: ComparisonPeriod[] = [
  { label: 'Month over Month', value: 'month' },
  { label: 'Year over Year', value: 'year' },
]

function generateMonthlyData(): MemberGrowthDataPoint[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const baseMembers = 18000
  
  return months.map((month, index) => {
    let growth = Math.random() * 400 + 100
    let milestone
    
    if (month === 'Mar') {
      growth = 780
      milestone = {
        type: 'campaign' as const,
        title: 'Spring Email Campaign',
        description: 'Targeted renewal campaign with special early-bird pricing',
        impact: '+45% conversion rate, 780 new renewals'
      }
    } else if (month === 'Jun') {
      growth = -120
      milestone = {
        type: 'event' as const,
        title: 'Summer Slowdown',
        description: 'Typical seasonal decrease in member activity',
        impact: '-8% engagement, 120 member lapse'
      }
    } else if (month === 'Sep') {
      growth = 650
      milestone = {
        type: 'event' as const,
        title: 'Fall Conference',
        description: 'Annual NABIP National Conference',
        impact: '650 new memberships, record attendance'
      }
    }
    
    const members = baseMembers + (index * 200) + (Math.random() * 100 - 50)
    
    return {
      period: month,
      members: Math.round(members),
      growth: Math.round(growth),
      milestone
    }
  })
}

function generateYearlyData(): MemberGrowthDataPoint[] {
  const years = ['2020', '2021', '2022', '2023', '2024']
  const baseMembers = 15000
  
  return years.map((year, index) => {
    let growth = Math.random() * 1200 + 800
    let milestone
    
    if (year === '2021') {
      growth = 2100
      milestone = {
        type: 'initiative' as const,
        title: 'Digital Transformation',
        description: 'Launch of new member portal and benefits platform',
        impact: '+14% member retention, 2,100 net growth'
      }
    } else if (year === '2023') {
      growth = 1850
      milestone = {
        type: 'initiative' as const,
        title: 'Medicare Advantage Focus',
        description: 'New educational programs and certifications',
        impact: '1,850 new members, +22% MA specialists'
      }
    }
    
    const members = baseMembers + (index * 1200) + (Math.random() * 200)
    
    return {
      period: year,
      members: Math.round(members),
      growth: Math.round(growth),
      milestone
    }
  })
}

async function generateAIInsights(data: MemberGrowthDataPoint[], comparisonType: 'month' | 'year'): Promise<AIInsight[]> {
  const insights: AIInsight[] = []
  
  const maxGrowth = Math.max(...data.map(d => d.growth))
  const minGrowth = Math.min(...data.map(d => d.growth))
  const avgGrowth = data.reduce((acc, d) => acc + d.growth, 0) / data.length
  
  const maxPeriod = data.find(d => d.growth === maxGrowth)
  const minPeriod = data.find(d => d.growth === minGrowth)
  
  if (maxPeriod?.milestone) {
    const percentIncrease = Math.round(((maxGrowth - avgGrowth) / avgGrowth) * 100)
    insights.push({
      id: 'peak-growth',
      type: 'positive',
      title: `Growth accelerated ${percentIncrease}% after ${maxPeriod.milestone.title}`,
      description: `${maxPeriod.period} saw peak growth of ${maxGrowth} members following the ${maxPeriod.milestone.title.toLowerCase()}. This represents our strongest performance this ${comparisonType === 'month' ? 'year' : 'period'}.`,
      metric: `+${maxGrowth} members`,
      icon: TrendUp
    })
  }
  
  const summerMonths = data.filter(d => ['Jun', 'Jul', 'Aug'].includes(d.period))
  if (summerMonths.length > 0 && comparisonType === 'month') {
    const summerAvg = summerMonths.reduce((acc, d) => acc + d.growth, 0) / summerMonths.length
    const percentBelow = Math.abs(Math.round(((summerAvg - avgGrowth) / avgGrowth) * 100))
    
    if (summerAvg < avgGrowth) {
      insights.push({
        id: 'seasonal-pattern',
        type: 'neutral',
        title: `Summer months consistently show ${percentBelow}% lower activity`,
        description: 'Member engagement and renewals historically decline during June-August. Consider launching targeted retention campaigns in May to minimize summer attrition.',
        metric: `${Math.round(summerAvg)} avg members/month`,
        icon: CalendarDots
      })
    }
  }
  
  if (minPeriod && minGrowth < 0) {
    insights.push({
      id: 'decline-alert',
      type: 'negative',
      title: `Member decline in ${minPeriod.period} requires attention`,
      description: `Lost ${Math.abs(minGrowth)} members in ${minPeriod.period}. ${minPeriod.milestone ? minPeriod.milestone.description : 'Review lapse reasons and implement win-back campaigns.'}`,
      metric: `${minGrowth} members`,
      icon: TrendDown
    })
  }
  
  const recentData = data.slice(-3)
  const recentTrend = recentData.every((d, i) => i === 0 || d.growth >= recentData[i - 1].growth)
  
  if (recentTrend) {
    const trendGrowth = Math.round(((recentData[recentData.length - 1].growth - recentData[0].growth) / recentData[0].growth) * 100)
    insights.push({
      id: 'recent-trend',
      type: 'positive',
      title: `Upward trajectory: ${trendGrowth}% growth acceleration`,
      description: `The last ${recentData.length} ${comparisonType === 'month' ? 'months' : 'years'} show consistent growth improvement. Momentum is building - continue current strategies and scale successful campaigns.`,
      metric: `${recentData[recentData.length - 1].growth} members`,
      icon: TrendUp
    })
  }
  
  const campaignPeriods = data.filter(d => d.milestone?.type === 'campaign')
  if (campaignPeriods.length > 0) {
    const campaignAvg = campaignPeriods.reduce((acc, d) => acc + d.growth, 0) / campaignPeriods.length
    const improvement = Math.round(((campaignAvg - avgGrowth) / avgGrowth) * 100)
    
    insights.push({
      id: 'campaign-effectiveness',
      type: 'positive',
      title: `Email campaigns drive ${improvement}% above-average growth`,
      description: 'Periods with targeted email campaigns consistently outperform baseline. Increase campaign frequency during traditionally slower periods to maintain growth.',
      metric: `${Math.round(campaignAvg)} avg members`,
      icon: EnvelopeSimple
    })
  }
  
  return insights
}

interface MemberGrowthChartProps {
  loading?: boolean
}

export function MemberGrowthChart({ loading }: MemberGrowthChartProps) {
  const [comparisonType, setComparisonType] = useState<'month' | 'year'>('month')
  const [showComparison, setShowComparison] = useState(false)
  const [currentData, setCurrentData] = useState<MemberGrowthDataPoint[]>([])
  const [previousData, setPreviousData] = useState<MemberGrowthDataPoint[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loadingInsights, setLoadingInsights] = useState(false)

  useEffect(() => {
    const loadData = () => {
      if (comparisonType === 'month') {
        setCurrentData(generateMonthlyData())
        setPreviousData(generateMonthlyData().map(d => ({
          ...d,
          members: d.members - 500 - Math.random() * 200,
          period: `${d.period} (Last Year)`
        })))
      } else {
        setCurrentData(generateYearlyData())
        setPreviousData(generateYearlyData().slice(0, -1).map(d => ({
          ...d,
          members: d.members - 1000 - Math.random() * 500,
          period: `${parseInt(d.period) - 5}`
        })))
      }
    }
    
    loadData()
  }, [comparisonType])

  useEffect(() => {
    const loadInsights = async () => {
      setLoadingInsights(true)
      try {
        const generatedInsights = await generateAIInsights(currentData, comparisonType)
        setInsights(generatedInsights)
      } catch (error) {
        console.error('Failed to generate insights:', error)
      } finally {
        setTimeout(() => setLoadingInsights(false), 800)
      }
    }
    
    if (currentData.length > 0) {
      loadInsights()
    }
  }, [currentData, comparisonType])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    const dataPoint = currentData.find(d => d.period === label)
    const hasComparison = showComparison && payload.length > 1

    return (
      <div className="bg-card border rounded-lg shadow-lg p-4 max-w-xs">
        <p className="text-sm font-semibold mb-2">{label}</p>
        
        {payload.map((entry: any, index: number) => {
          const isComparison = index === 1
          return (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {isComparison ? 'Previous' : 'Current'}
                </span>
              </div>
              <span className="text-sm font-semibold tabular-nums">
                {Math.round(entry.value).toLocaleString()}
              </span>
            </div>
          )
        })}

        {dataPoint && !hasComparison && (
          <>
            <div className="border-t my-2 pt-2">
              <div className="flex items-center gap-2 mb-1">
                {dataPoint.growth > 0 ? (
                  <TrendUp size={14} className="text-teal" weight="bold" />
                ) : dataPoint.growth < 0 ? (
                  <TrendDown size={14} className="text-destructive" weight="bold" />
                ) : (
                  <Minus size={14} className="text-muted-foreground" weight="bold" />
                )}
                <span className="text-xs text-muted-foreground">Growth:</span>
                <span className={`text-sm font-semibold tabular-nums ${
                  dataPoint.growth > 0 ? 'text-teal' : dataPoint.growth < 0 ? 'text-destructive' : ''
                }`}>
                  {dataPoint.growth > 0 ? '+' : ''}{dataPoint.growth}
                </span>
              </div>
            </div>

            {dataPoint.milestone && (
              <div className="border-t mt-2 pt-2">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {dataPoint.milestone.type}
                  </Badge>
                </div>
                <p className="text-xs font-semibold mb-1">{dataPoint.milestone.title}</p>
                <p className="text-xs text-muted-foreground mb-1">{dataPoint.milestone.description}</p>
                <p className="text-xs font-medium text-primary">{dataPoint.milestone.impact}</p>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    const dataPoint = currentData.find(d => d.period === payload.period)
    
    if (dataPoint?.milestone) {
      return (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={8}
            fill="oklch(0.75 0.15 85)"
            stroke="oklch(0.25 0.05 250)"
            strokeWidth={2}
            opacity={0.9}
          />
          <Sparkle
            x={cx - 6}
            y={cy - 6}
            size={12}
            weight="fill"
            color="oklch(0.25 0.05 250)"
          />
        </g>
      )
    }
    
    return <circle cx={cx} cy={cy} r={4} fill={props.fill} />
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-shimmer rounded w-full h-[400px]" />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">Member Growth Analysis</h2>
            <p className="text-sm text-muted-foreground">
              Interactive insights with milestone tracking and AI-powered pattern detection
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showComparison ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowComparison(!showComparison)}
            >
              Compare Periods
            </Button>
            <div className="flex rounded-lg border overflow-hidden">
              {comparisonPeriods.map((period) => (
                <Button
                  key={period.value}
                  variant={comparisonType === period.value ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none"
                  onClick={() => {
                    setComparisonType(period.value)
                    toast.success(`Switched to ${period.label}`)
                  }}
                >
                  {period.label.split(' ')[0]}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full h-[320px] mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={showComparison ? currentData.map((d, i) => ({
              ...d,
              previousMembers: previousData[i]?.members
            })) : currentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 250)" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12, fill: 'oklch(0.50 0.02 250)' }}
                stroke="oklch(0.90 0.01 250)"
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'oklch(0.50 0.02 250)' }}
                stroke="oklch(0.90 0.01 250)"
                label={{
                  value: 'Total Members',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12, fill: 'oklch(0.50 0.02 250)' }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="circle"
              />
              
              {showComparison && (
                <Line
                  type="monotone"
                  dataKey="previousMembers"
                  name={comparisonType === 'month' ? 'Last Year' : 'Previous Period'}
                  stroke="oklch(0.70 0.02 250)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              )}
              
              <Line
                type="monotone"
                dataKey="members"
                name="Total Members"
                stroke="oklch(0.25 0.05 250)"
                strokeWidth={3}
                dot={<CustomDot />}
                activeDot={{ r: 6 }}
              />
              
              {currentData.filter(d => d.milestone).map((point) => (
                <ReferenceDot
                  key={point.period}
                  x={point.period}
                  y={point.members}
                  r={0}
                  label={{
                    value: '★',
                    position: 'top',
                    fill: 'oklch(0.75 0.15 85)',
                    fontSize: 16,
                    offset: 10
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Current Period</span>
          </div>
          {showComparison && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-0.5 bg-muted-foreground" style={{ width: 16 }} />
              <span>Previous Period</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkle size={14} weight="fill" className="text-accent" />
            <span>Major Event/Campaign</span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkle size={20} weight="fill" className="text-accent" />
          <h3 className="text-base font-semibold">AI-Powered Growth Insights</h3>
          {loadingInsights && (
            <div className="ml-2 animate-spin">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {loadingInsights ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg bg-muted animate-shimmer h-24" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => {
              const Icon = insight.icon
              const bgColor = insight.type === 'positive' 
                ? 'bg-teal/10 border-teal/20' 
                : insight.type === 'negative'
                ? 'bg-destructive/10 border-destructive/20'
                : 'bg-muted/50 border-border'
              
              const iconColor = insight.type === 'positive'
                ? 'text-teal'
                : insight.type === 'negative'
                ? 'text-destructive'
                : 'text-muted-foreground'

              return (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg border ${bgColor} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${iconColor} bg-background/50 shrink-0`}>
                      <Icon size={20} weight="duotone" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-semibold leading-tight">{insight.title}</h4>
                        {insight.metric && (
                          <Badge variant="outline" className="shrink-0 tabular-nums">
                            {insight.metric}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loadingInsights && insights.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p>No significant patterns detected in the current period.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
