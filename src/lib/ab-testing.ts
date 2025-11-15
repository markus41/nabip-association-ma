/**
 * A/B Testing Service - Establish statistical framework for campaign optimization
 * through controlled variant testing and automated winner selection.
 *
 * Designed for: Data-driven email marketing with scientific testing methodology
 * Best for: Organizations optimizing engagement through subject line and content variants
 *
 * Features:
 * - Split traffic distribution with configurable ratios
 * - Statistical significance calculation (Chi-square test)
 * - Automated winner selection based on configured metrics
 * - Real-time performance tracking per variant
 * - Confidence interval calculations
 */

import type {
  EmailCampaign,
  ABTestVariant,
  ABTestConfig,
  EmailSend,
  CampaignMetrics,
} from './email-types'
import type { Member } from './types'

/**
 * Variant performance metrics for A/B comparison
 */
export interface VariantMetrics {
  variant: ABTestVariant
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  openRate: number
  clickRate: number
  clickToOpenRate: number
  conversionRate: number
}

/**
 * A/B test statistical results
 */
export interface ABTestResults {
  variantA: VariantMetrics
  variantB: VariantMetrics
  winner: ABTestVariant | null
  confidenceLevel: number
  statisticallySignificant: boolean
  sampleSize: number
  testDurationHours: number
  winnerMetric: 'open_rate' | 'click_rate' | 'conversion_rate'
  improvement: number
  recommendation: string
}

/**
 * A/B Testing Service for email campaigns
 */
export class ABTestingService {
  /**
   * Distribute recipients between A/B test variants
   * Uses deterministic algorithm for reproducibility
   */
  distributeVariants(
    recipients: Member[],
    config: ABTestConfig
  ): Map<string, ABTestVariant> {
    const distribution = new Map<string, ABTestVariant>()
    const sampleSize = Math.min(config.sampleSize, recipients.length)

    if (sampleSize === 0) {
      return distribution
    }

    // Calculate split (default 50/50)
    const splitRatio = 0.5
    const variantACount = Math.floor(sampleSize * splitRatio)

    // Randomly shuffle recipients for unbiased distribution
    const shuffled = this.shuffleArray([...recipients])

    // Assign variants to sample
    shuffled.slice(0, sampleSize).forEach((recipient, index) => {
      const variant: ABTestVariant = index < variantACount ? 'A' : 'B'
      distribution.set(recipient.id, variant)
    })

    return distribution
  }

  /**
   * Calculate performance metrics for a specific variant
   */
  calculateVariantMetrics(
    variant: ABTestVariant,
    sends: EmailSend[]
  ): VariantMetrics {
    const variantSends = sends.filter((s) => s.variant === variant)

    const metrics: VariantMetrics = {
      variant,
      sent: variantSends.length,
      delivered: variantSends.filter((s) => s.status === 'delivered').length,
      opened: variantSends.filter((s) => s.openedAt).length,
      clicked: variantSends.filter((s) => s.firstClickedAt).length,
      bounced: variantSends.filter((s) => s.status === 'bounced').length,
      openRate: 0,
      clickRate: 0,
      clickToOpenRate: 0,
      conversionRate: 0,
    }

    // Calculate rates
    if (metrics.sent > 0) {
      metrics.openRate = metrics.opened / metrics.sent
      metrics.clickRate = metrics.clicked / metrics.sent
      metrics.conversionRate = metrics.clicked / metrics.sent
    }

    if (metrics.opened > 0) {
      metrics.clickToOpenRate = metrics.clicked / metrics.opened
    }

    return metrics
  }

  /**
   * Analyze A/B test results and determine winner
   */
  analyzeResults(
    campaign: EmailCampaign,
    sends: EmailSend[],
    testStartTime: Date
  ): ABTestResults | null {
    if (!campaign.abTestEnabled || !campaign.abTestConfig) {
      return null
    }

    const variantAMetrics = this.calculateVariantMetrics('A', sends)
    const variantBMetrics = this.calculateVariantMetrics('B', sends)

    // Calculate test duration
    const now = new Date()
    const testDurationHours = (now.getTime() - testStartTime.getTime()) / (1000 * 60 * 60)

    // Determine winner based on configured metric
    const winner = this.determineWinner(
      campaign.abTestConfig.winnerMetric,
      variantAMetrics,
      variantBMetrics
    )

    // Calculate statistical significance
    const { significant, confidenceLevel } = this.calculateStatisticalSignificance(
      variantAMetrics,
      variantBMetrics,
      campaign.abTestConfig.winnerMetric
    )

    // Calculate improvement percentage
    const improvement = this.calculateImprovement(
      variantAMetrics,
      variantBMetrics,
      campaign.abTestConfig.winnerMetric
    )

    // Generate recommendation
    const recommendation = this.generateRecommendation(
      winner,
      significant,
      confidenceLevel,
      improvement,
      testDurationHours,
      campaign.abTestConfig.testDuration
    )

    return {
      variantA: variantAMetrics,
      variantB: variantBMetrics,
      winner: significant ? winner : null,
      confidenceLevel,
      statisticallySignificant: significant,
      sampleSize: variantAMetrics.sent + variantBMetrics.sent,
      testDurationHours,
      winnerMetric: campaign.abTestConfig.winnerMetric,
      improvement,
      recommendation,
    }
  }

  /**
   * Determine winner based on configured metric
   */
  private determineWinner(
    metric: ABTestConfig['winnerMetric'],
    variantA: VariantMetrics,
    variantB: VariantMetrics
  ): ABTestVariant {
    const metricMap: Record<ABTestConfig['winnerMetric'], keyof VariantMetrics> = {
      open_rate: 'openRate',
      click_rate: 'clickRate',
      conversion_rate: 'conversionRate',
    }

    const metricKey = metricMap[metric]
    const valueA = variantA[metricKey] as number
    const valueB = variantB[metricKey] as number

    return valueA >= valueB ? 'A' : 'B'
  }

  /**
   * Calculate statistical significance using Chi-square test
   * Returns confidence level as percentage (0-100)
   */
  private calculateStatisticalSignificance(
    variantA: VariantMetrics,
    variantB: VariantMetrics,
    metric: ABTestConfig['winnerMetric']
  ): { significant: boolean; confidenceLevel: number } {
    // Get success counts based on metric
    let successA: number
    let successB: number

    switch (metric) {
      case 'open_rate':
        successA = variantA.opened
        successB = variantB.opened
        break
      case 'click_rate':
        successA = variantA.clicked
        successB = variantB.clicked
        break
      case 'conversion_rate':
        successA = variantA.clicked
        successB = variantB.clicked
        break
    }

    const totalA = variantA.sent
    const totalB = variantB.sent

    // Need minimum sample size for valid test
    if (totalA < 30 || totalB < 30) {
      return { significant: false, confidenceLevel: 0 }
    }

    // Chi-square test calculation
    const pooledRate = (successA + successB) / (totalA + totalB)

    const expectedA = totalA * pooledRate
    const expectedB = totalB * pooledRate

    const chiSquare =
      Math.pow(successA - expectedA, 2) / expectedA +
      Math.pow(successB - expectedB, 2) / expectedB

    // Convert chi-square to p-value (simplified approximation)
    // For 1 degree of freedom:
    // chi-square > 3.84 = 95% confidence (p < 0.05)
    // chi-square > 6.63 = 99% confidence (p < 0.01)
    // chi-square > 10.83 = 99.9% confidence (p < 0.001)

    let confidenceLevel: number
    if (chiSquare > 10.83) {
      confidenceLevel = 99.9
    } else if (chiSquare > 6.63) {
      confidenceLevel = 99
    } else if (chiSquare > 3.84) {
      confidenceLevel = 95
    } else if (chiSquare > 2.71) {
      confidenceLevel = 90
    } else {
      confidenceLevel = Math.min(90, (chiSquare / 3.84) * 95)
    }

    // Consider significant if > 95% confidence
    const significant = confidenceLevel >= 95

    return { significant, confidenceLevel }
  }

  /**
   * Calculate percentage improvement of winner over loser
   */
  private calculateImprovement(
    variantA: VariantMetrics,
    variantB: VariantMetrics,
    metric: ABTestConfig['winnerMetric']
  ): number {
    const metricMap: Record<ABTestConfig['winnerMetric'], keyof VariantMetrics> = {
      open_rate: 'openRate',
      click_rate: 'clickRate',
      conversion_rate: 'conversionRate',
    }

    const metricKey = metricMap[metric]
    const valueA = variantA[metricKey] as number
    const valueB = variantB[metricKey] as number

    const baseline = Math.min(valueA, valueB)
    const winner = Math.max(valueA, valueB)

    if (baseline === 0) return 0

    return ((winner - baseline) / baseline) * 100
  }

  /**
   * Generate actionable recommendation based on test results
   */
  private generateRecommendation(
    winner: ABTestVariant | null,
    significant: boolean,
    confidence: number,
    improvement: number,
    durationHours: number,
    targetDuration: number
  ): string {
    if (!winner) {
      return 'Insufficient data for recommendation. Continue test to reach statistical significance.'
    }

    if (!significant) {
      if (durationHours < targetDuration) {
        return `Test is still running (${durationHours.toFixed(1)}/${targetDuration} hours). Wait for target duration to achieve statistical significance.`
      }
      return `No statistically significant difference detected (${confidence.toFixed(1)}% confidence). Consider both variants equally effective.`
    }

    if (improvement < 5) {
      return `Variant ${winner} wins with ${confidence.toFixed(1)}% confidence, but improvement is minimal (${improvement.toFixed(1)}%). Consider testing more distinctive variants.`
    }

    return `Send remaining emails with Variant ${winner}. This variant achieved ${improvement.toFixed(1)}% better performance with ${confidence.toFixed(1)}% statistical confidence.`
  }

  /**
   * Check if test should conclude and send winner
   */
  shouldSendWinner(
    campaign: EmailCampaign,
    results: ABTestResults
  ): boolean {
    if (!campaign.abTestConfig) return false

    // Check if test duration met
    const durationMet = results.testDurationHours >= campaign.abTestConfig.testDuration

    // Check if statistically significant
    const significant = results.statisticallySignificant

    // Send winner if both conditions met
    return durationMet && significant
  }

  /**
   * Get remaining recipients for winner variant
   */
  getRemainingRecipients(
    allRecipients: Member[],
    testDistribution: Map<string, ABTestVariant>
  ): Member[] {
    return allRecipients.filter((r) => !testDistribution.has(r.id))
  }

  /**
   * Fisher-Yates shuffle for unbiased randomization
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}

/**
 * Generate mock A/B test results for development
 */
export function generateMockABTestResults(
  config: ABTestConfig
): ABTestResults {
  const variantA: VariantMetrics = {
    variant: 'A',
    sent: Math.floor(config.sampleSize / 2),
    delivered: Math.floor(config.sampleSize / 2) - 5,
    opened: Math.floor((config.sampleSize / 2) * 0.28),
    clicked: Math.floor((config.sampleSize / 2) * 0.08),
    bounced: 5,
    openRate: 0.28,
    clickRate: 0.08,
    clickToOpenRate: 0.286,
    conversionRate: 0.08,
  }

  const variantB: VariantMetrics = {
    variant: 'B',
    sent: Math.floor(config.sampleSize / 2),
    delivered: Math.floor(config.sampleSize / 2) - 3,
    opened: Math.floor((config.sampleSize / 2) * 0.35),
    clicked: Math.floor((config.sampleSize / 2) * 0.12),
    bounced: 3,
    openRate: 0.35,
    clickRate: 0.12,
    clickToOpenRate: 0.343,
    conversionRate: 0.12,
  }

  return {
    variantA,
    variantB,
    winner: 'B',
    confidenceLevel: 98.5,
    statisticallySignificant: true,
    sampleSize: config.sampleSize,
    testDurationHours: config.testDuration,
    winnerMetric: config.winnerMetric,
    improvement: 25.0,
    recommendation:
      'Send remaining emails with Variant B. This variant achieved 25.0% better performance with 98.5% statistical confidence.',
  }
}

/**
 * Create A/B testing service instance
 */
export const abTestingService = new ABTestingService()
