import type { Chapter } from './types'

/**
 * Establishes scalable trend data generation for chapter analytics visualization.
 * Supports member growth, event attendance, and revenue trend sparklines.
 */

export interface ChapterTrendData {
  memberTrend: number[]
  eventTrend: number[]
  revenueTrend: number[]
  labels: string[]
}

export interface ChapterMetrics {
  memberGrowthRate: number
  eventAttendanceRate: number
  revenueGrowthRate: number
  engagementScore: number
  retentionRate: number
}

export interface ChapterComparison {
  chapter: Chapter
  metrics: ChapterMetrics
  trendData: ChapterTrendData
  rank: {
    byMembers: number
    byEvents: number
    byEngagement: number
  }
}

export interface ChapterBenchmark {
  chapter: Chapter
  percentileScores: {
    memberEngagement: number
    eventFrequency: number
    revenueContribution: number
    memberGrowth: number
    retention: number
  }
  nationalAverage: {
    memberEngagement: number
    eventFrequency: number
    revenueContribution: number
    memberGrowth: number
    retention: number
  }
  peerAverage: {
    memberEngagement: number
    eventFrequency: number
    revenueContribution: number
    memberGrowth: number
    retention: number
  }
  topPerformers: {
    memberEngagement: number
    eventFrequency: number
    revenueContribution: number
    memberGrowth: number
    retention: number
  }
  recommendations: string[]
}

/**
 * Generates realistic 6-month trend data for member growth visualization.
 * Applies slight growth bias to simulate realistic membership patterns.
 *
 * @param currentCount - Current member count
 * @returns Array of 6 monthly member count values
 */
export function generateMemberTrend(currentCount: number): number[] {
  const trend: number[] = []
  const volatility = 0.05 // 5% month-to-month variation
  const growthBias = 0.6 // 60% chance of growth vs decline
  let value = currentCount * 0.85 // Start from 85% of current value

  for (let i = 0; i < 6; i++) {
    const change = (Math.random() - (1 - growthBias)) * volatility
    value *= (1 + change)
    trend.push(Math.round(value))
  }

  return trend
}

/**
 * Generates realistic 6-month trend data for event attendance patterns.
 * Accounts for seasonal variations in event scheduling.
 *
 * @param currentCount - Current active events count
 * @returns Array of 6 monthly event count values
 */
export function generateEventTrend(currentCount: number): number[] {
  const trend: number[] = []
  const volatility = 0.15 // Higher volatility for events
  const seasonalFactor = [0.8, 0.9, 1.1, 1.2, 1.0, 0.95] // Seasonal variation
  const baseValue = Math.max(currentCount * 0.7, 1) // Never go below 1

  for (let i = 0; i < 6; i++) {
    const randomFactor = 1 + (Math.random() - 0.5) * volatility
    const value = baseValue * seasonalFactor[i] * randomFactor
    trend.push(Math.round(Math.max(value, 0)))
  }

  return trend
}

/**
 * Generates realistic 6-month revenue trend data with growth patterns.
 * Simulates typical association revenue cycles.
 *
 * @param currentRevenue - Current revenue share or baseline
 * @returns Array of 6 monthly revenue values
 */
export function generateRevenueTrend(currentRevenue: number = 100): number[] {
  const trend: number[] = []
  const volatility = 0.08 // Moderate volatility for revenue
  const growthRate = 0.05 // 5% annual growth trend
  let value = currentRevenue * 0.9 // Start from 90% of current

  for (let i = 0; i < 6; i++) {
    const monthlyGrowth = growthRate / 12
    const randomFactor = 1 + (Math.random() - 0.5) * volatility
    value *= (1 + monthlyGrowth) * randomFactor
    trend.push(Math.round(value))
  }

  return trend
}

/**
 * Generates month labels for trend data visualization.
 * Returns last 6 months in "MMM" format.
 */
export function getTrendLabels(): string[] {
  const labels: string[] = []
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    labels.push(months[date.getMonth()])
  }

  return labels
}

/**
 * Generates complete trend data for a chapter including all metrics.
 *
 * @param chapter - Chapter to generate trends for
 * @returns Complete trend data object
 */
export function generateChapterTrendData(chapter: Chapter): ChapterTrendData {
  return {
    memberTrend: generateMemberTrend(chapter.memberCount),
    eventTrend: generateEventTrend(chapter.activeEventsCount),
    revenueTrend: generateRevenueTrend(chapter.revenueShare || 100),
    labels: getTrendLabels()
  }
}

/**
 * Calculates growth rate from trend data.
 *
 * @param trend - Array of values over time
 * @returns Growth rate as percentage (-100 to +infinity)
 */
export function calculateGrowthRate(trend: number[]): number {
  if (trend.length < 2) return 0

  const firstValue = trend[0]
  const lastValue = trend[trend.length - 1]

  if (firstValue === 0) return lastValue > 0 ? 100 : 0

  return ((lastValue - firstValue) / firstValue) * 100
}

/**
 * Calculates comprehensive metrics for a chapter based on trend data.
 *
 * @param chapter - Chapter to calculate metrics for
 * @param trendData - Trend data for the chapter
 * @returns Complete metrics object
 */
export function calculateChapterMetrics(
  chapter: Chapter,
  trendData: ChapterTrendData
): ChapterMetrics {
  const memberGrowthRate = calculateGrowthRate(trendData.memberTrend)
  const eventAttendanceRate = Math.min((chapter.activeEventsCount / Math.max(chapter.memberCount, 1)) * 100, 100)
  const revenueGrowthRate = calculateGrowthRate(trendData.revenueTrend)

  // Engagement score calculation (0-100)
  const engagementScore = Math.min(
    Math.round(
      (eventAttendanceRate * 0.4) +
      (Math.min(memberGrowthRate + 50, 100) * 0.3) +
      (Math.min(revenueGrowthRate + 50, 100) * 0.3)
    ),
    100
  )

  // Retention rate simulation (based on growth patterns)
  const retentionRate = Math.min(
    Math.max(85 + memberGrowthRate * 0.5, 70),
    98
  )

  return {
    memberGrowthRate,
    eventAttendanceRate,
    revenueGrowthRate,
    engagementScore,
    retentionRate
  }
}

/**
 * Determines trend direction indicator for visual feedback.
 *
 * @param value - Growth rate or trend value
 * @returns 'up' | 'down' | 'neutral'
 */
export function getTrendDirection(value: number): 'up' | 'down' | 'neutral' {
  if (value > 2) return 'up'
  if (value < -2) return 'down'
  return 'neutral'
}

/**
 * Gets color for trend visualization based on direction.
 *
 * @param direction - Trend direction
 * @returns Tailwind color class
 */
export function getTrendColor(direction: 'up' | 'down' | 'neutral'): string {
  switch (direction) {
    case 'up':
      return 'text-green-600'
    case 'down':
      return 'text-red-600'
    case 'neutral':
      return 'text-gray-500'
  }
}

/**
 * Gets stroke color for sparkline charts.
 *
 * @param direction - Trend direction
 * @returns Hex color code
 */
export function getSparklineColor(direction: 'up' | 'down' | 'neutral'): string {
  switch (direction) {
    case 'up':
      return '#16a34a' // green-600
    case 'down':
      return '#dc2626' // red-600
    case 'neutral':
      return '#6b7280' // gray-500
  }
}

/**
 * Generates complete comparison data for a chapter.
 *
 * @param chapter - Chapter to generate comparison for
 * @param allChapters - All chapters for ranking
 * @returns Complete comparison object
 */
export function generateChapterComparison(
  chapter: Chapter,
  allChapters: Chapter[]
): ChapterComparison {
  const trendData = generateChapterTrendData(chapter)
  const metrics = calculateChapterMetrics(chapter, trendData)

  // Calculate rankings
  const sortedByMembers = [...allChapters].sort((a, b) => b.memberCount - a.memberCount)
  const sortedByEvents = [...allChapters].sort((a, b) => b.activeEventsCount - a.activeEventsCount)

  // Calculate engagement scores for all chapters
  const chaptersWithEngagement = allChapters.map(ch => ({
    chapter: ch,
    score: calculateChapterMetrics(ch, generateChapterTrendData(ch)).engagementScore
  }))
  const sortedByEngagement = chaptersWithEngagement.sort((a, b) => b.score - a.score)

  return {
    chapter,
    metrics,
    trendData,
    rank: {
      byMembers: sortedByMembers.findIndex(c => c.id === chapter.id) + 1,
      byEvents: sortedByEvents.findIndex(c => c.id === chapter.id) + 1,
      byEngagement: sortedByEngagement.findIndex(c => c.chapter.id === chapter.id) + 1
    }
  }
}

/**
 * Calculates percentile score for a value within a dataset.
 *
 * @param value - Value to score
 * @param dataset - Array of values to compare against
 * @returns Percentile score (0-100)
 */
export function calculatePercentile(value: number, dataset: number[]): number {
  const sorted = [...dataset].sort((a, b) => a - b)
  const index = sorted.findIndex(v => v >= value)

  if (index === -1) return 100
  if (index === 0) return 0

  return Math.round((index / sorted.length) * 100)
}

/**
 * Generates benchmarking data for a chapter against peers and national averages.
 *
 * @param chapter - Chapter to benchmark
 * @param allChapters - All chapters for comparison
 * @returns Complete benchmark object with recommendations
 */
export function generateChapterBenchmark(
  chapter: Chapter,
  allChapters: Chapter[]
): ChapterBenchmark {
  const trendData = generateChapterTrendData(chapter)
  const metrics = calculateChapterMetrics(chapter, trendData)

  // Filter peer chapters (same type)
  const peerChapters = allChapters.filter(c => c.type === chapter.type)

  // Calculate all metrics for comparison
  const allMetrics = allChapters.map(c => calculateChapterMetrics(c, generateChapterTrendData(c)))
  const peerMetrics = peerChapters.map(c => calculateChapterMetrics(c, generateChapterTrendData(c)))

  // Calculate averages
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
  const p90 = (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b)
    return sorted[Math.floor(sorted.length * 0.9)]
  }

  const nationalAverage = {
    memberEngagement: avg(allMetrics.map(m => m.engagementScore)),
    eventFrequency: avg(allChapters.map(c => c.activeEventsCount)),
    revenueContribution: avg(allChapters.map(c => c.revenueShare || 100)),
    memberGrowth: avg(allMetrics.map(m => m.memberGrowthRate)),
    retention: avg(allMetrics.map(m => m.retentionRate))
  }

  const peerAverage = {
    memberEngagement: avg(peerMetrics.map(m => m.engagementScore)),
    eventFrequency: avg(peerChapters.map(c => c.activeEventsCount)),
    revenueContribution: avg(peerChapters.map(c => c.revenueShare || 100)),
    memberGrowth: avg(peerMetrics.map(m => m.memberGrowthRate)),
    retention: avg(peerMetrics.map(m => m.retentionRate))
  }

  const topPerformers = {
    memberEngagement: p90(allMetrics.map(m => m.engagementScore)),
    eventFrequency: p90(allChapters.map(c => c.activeEventsCount)),
    revenueContribution: p90(allChapters.map(c => c.revenueShare || 100)),
    memberGrowth: p90(allMetrics.map(m => m.memberGrowthRate)),
    retention: p90(allMetrics.map(m => m.retentionRate))
  }

  // Calculate percentile scores
  const percentileScores = {
    memberEngagement: calculatePercentile(metrics.engagementScore, allMetrics.map(m => m.engagementScore)),
    eventFrequency: calculatePercentile(chapter.activeEventsCount, allChapters.map(c => c.activeEventsCount)),
    revenueContribution: calculatePercentile(chapter.revenueShare || 100, allChapters.map(c => c.revenueShare || 100)),
    memberGrowth: calculatePercentile(metrics.memberGrowthRate, allMetrics.map(m => m.memberGrowthRate)),
    retention: calculatePercentile(metrics.retentionRate, allMetrics.map(m => m.retentionRate))
  }

  // Generate recommendations based on performance
  const recommendations: string[] = []

  if (percentileScores.memberEngagement < 50) {
    recommendations.push('Increase member engagement through targeted outreach and value-driven programming')
  }

  if (percentileScores.eventFrequency < 50) {
    recommendations.push('Expand event offerings with diverse formats (webinars, networking, CE courses)')
  }

  if (percentileScores.memberGrowth < 50) {
    recommendations.push('Implement member referral program and strategic recruitment initiatives')
  }

  if (percentileScores.retention < 50) {
    recommendations.push('Develop retention strategy focusing on member value and engagement touchpoints')
  }

  if (metrics.eventAttendanceRate < 10) {
    recommendations.push('Improve event attendance rates through enhanced promotion and member incentives')
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain strong performance through continued focus on member value and engagement')
  }

  return {
    chapter,
    percentileScores,
    nationalAverage,
    peerAverage,
    topPerformers,
    recommendations
  }
}

/**
 * Formats a number as a percentage with optional decimal places.
 *
 * @param value - Numeric value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Formats a growth rate with +/- indicator.
 *
 * @param value - Growth rate value
 * @returns Formatted string with sign
 */
export function formatGrowthRate(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${formatPercentage(value)}`
}
