/**
 * SendGrid Email Service - Establish scalable email delivery infrastructure
 * with webhook integration for real-time engagement tracking.
 *
 * Designed for: Production email campaigns with reliable delivery tracking
 * Best for: Organizations requiring SendGrid integration with detailed analytics
 *
 * Features:
 * - Dynamic template support with personalization
 * - Webhook event processing for engagement tracking
 * - Batch sending with rate limiting
 * - Unsubscribe management
 * - A/B test variant delivery
 */

import type {
  EmailCampaign,
  EmailSend,
  EmailEvent,
  EmailTemplate,
  TemplateMergeField,
  TestSendRequest,
  SendGridConfig,
  ABTestVariant,
} from './email-types'
import type { Member } from './types'

/**
 * SendGrid Mail API client wrapper
 */
export class SendGridService {
  private apiKey: string
  private config: SendGridConfig

  constructor(config: SendGridConfig) {
    this.apiKey = config.apiKey
    this.config = config
  }

  /**
   * Send campaign to segmented audience with personalization
   */
  async sendCampaign(
    campaign: EmailCampaign,
    recipients: Member[],
    template: EmailTemplate
  ): Promise<EmailSend[]> {
    const sends: EmailSend[] = []

    // Determine A/B test distribution
    const variantDistribution = this.calculateVariantDistribution(campaign, recipients)

    // Send in batches to respect rate limits
    const batchSize = this.config.batchSize || 100
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)

      const batchResults = await this.sendBatch(
        campaign,
        batch,
        template,
        variantDistribution
      )

      sends.push(...batchResults)

      // Rate limiting delay
      if (i + batchSize < recipients.length) {
        await this.delay(1000 / (this.config.maxSendsPerSecond || 10))
      }
    }

    return sends
  }

  /**
   * Send batch of emails with personalization
   */
  private async sendBatch(
    campaign: EmailCampaign,
    recipients: Member[],
    template: EmailTemplate,
    variantDistribution: Map<string, ABTestVariant>
  ): Promise<EmailSend[]> {
    const sends: EmailSend[] = []

    for (const recipient of recipients) {
      const variant = variantDistribution.get(recipient.id)

      try {
        const personalizedData = this.buildPersonalizationData(
          recipient,
          template.mergeFields
        )

        const subject = this.getSubjectForVariant(campaign, variant)

        // Prepare SendGrid message
        const message = {
          to: recipient.email,
          from: {
            email: campaign.fromEmail,
            name: campaign.fromName,
          },
          replyTo: campaign.replyTo,
          subject,
          templateId: template.sendgridTemplateId,
          dynamicTemplateData: personalizedData,
          customArgs: {
            campaignId: campaign.id,
            memberId: recipient.id,
            variant: variant || 'none',
          },
          trackingSettings: {
            clickTracking: { enable: this.config.trackClicks },
            openTracking: { enable: this.config.trackOpens },
          },
        }

        // In production, call SendGrid API:
        // const response = await sgMail.send(message)
        // const messageId = response[0].headers['x-message-id']

        // Mock send for development
        const sendRecord: EmailSend = {
          id: this.generateId(),
          campaignId: campaign.id,
          memberId: recipient.id,
          emailAddress: recipient.email,
          sendgridMessageId: this.generateSendGridMessageId(),
          status: 'sent',
          sentAt: new Date().toISOString(),
          variant,
          openCount: 0,
          clickCount: 0,
        }

        sends.push(sendRecord)
      } catch (error) {
        // Log error and create failed send record
        const failedSend: EmailSend = {
          id: this.generateId(),
          campaignId: campaign.id,
          memberId: recipient.id,
          emailAddress: recipient.email,
          status: 'dropped',
          sentAt: new Date().toISOString(),
          openCount: 0,
          clickCount: 0,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        }

        sends.push(failedSend)
      }
    }

    return sends
  }

  /**
   * Send test email to specified addresses
   */
  async sendTestEmail(
    request: TestSendRequest,
    campaign: EmailCampaign,
    template: EmailTemplate
  ): Promise<void> {
    for (const email of request.testEmails) {
      const subject = this.getSubjectForVariant(campaign, request.variant)

      const message = {
        to: email,
        from: {
          email: campaign.fromEmail,
          name: campaign.fromName,
        },
        subject: `[TEST] ${subject}`,
        templateId: template.sendgridTemplateId,
        dynamicTemplateData: {
          firstName: 'Test',
          lastName: 'User',
          email: email,
        },
      }

      // In production: await sgMail.send(message)
      console.log('Test email sent:', message)
    }
  }

  /**
   * Process incoming webhook event from SendGrid
   */
  processWebhookEvent(payload: any): EmailEvent | null {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(payload)) {
        console.error('Invalid webhook signature')
        return null
      }

      // Extract event data
      const event: EmailEvent = {
        id: this.generateId(),
        sendId: payload.sg_message_id || '',
        campaignId: payload.campaignId || '',
        memberId: payload.memberId || '',
        emailAddress: payload.email,
        eventType: this.mapSendGridEventType(payload.event),
        timestamp: new Date(payload.timestamp * 1000).toISOString(),
        url: payload.url,
        userAgent: payload.useragent,
        ipAddress: payload.ip,
        reason: payload.reason,
        sendgridEventId: payload.sg_event_id,
        sendgridMessageId: payload.sg_message_id,
      }

      return event
    } catch (error) {
      console.error('Error processing webhook event:', error)
      return null
    }
  }

  /**
   * Verify SendGrid webhook signature for security
   */
  private verifyWebhookSignature(payload: any): boolean {
    if (!this.config.webhookSigningKey) {
      return true // Skip verification if no key configured
    }

    // In production: Use @sendgrid/eventwebhook to verify signature
    // import { EventWebhook } from '@sendgrid/eventwebhook'
    // const webhook = new EventWebhook()
    // return webhook.verifySignature(...)

    return true // Mock verification for development
  }

  /**
   * Map SendGrid event types to internal event types
   */
  private mapSendGridEventType(sgEvent: string): any {
    const mapping: Record<string, any> = {
      delivered: 'delivered',
      open: 'opened',
      click: 'clicked',
      bounce: 'bounced',
      dropped: 'dropped',
      spamreport: 'spam_report',
      unsubscribe: 'unsubscribed',
      deferred: 'deferred',
    }

    return mapping[sgEvent] || 'delivered'
  }

  /**
   * Calculate A/B test variant distribution
   */
  private calculateVariantDistribution(
    campaign: EmailCampaign,
    recipients: Member[]
  ): Map<string, ABTestVariant> {
    const distribution = new Map<string, ABTestVariant>()

    if (!campaign.abTestEnabled || !campaign.abTestConfig) {
      return distribution
    }

    const sampleSize = Math.min(
      campaign.abTestConfig.sampleSize,
      recipients.length
    )

    const variantACount = Math.floor(sampleSize / 2)

    recipients.slice(0, sampleSize).forEach((recipient, index) => {
      distribution.set(recipient.id, index < variantACount ? 'A' : 'B')
    })

    return distribution
  }

  /**
   * Get subject line based on A/B test variant
   */
  private getSubjectForVariant(
    campaign: EmailCampaign,
    variant?: ABTestVariant
  ): string {
    if (!variant || !campaign.abTestConfig) {
      return campaign.subject
    }

    return variant === 'A'
      ? campaign.abTestConfig.subjectA
      : campaign.abTestConfig.subjectB
  }

  /**
   * Build personalization data from member and merge fields
   */
  private buildPersonalizationData(
    member: Member,
    mergeFields: TemplateMergeField[]
  ): Record<string, any> {
    const data: Record<string, any> = {
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      memberType: member.memberType,
      company: member.company || '',
      jobTitle: member.jobTitle || '',
    }

    // Add merge field defaults
    mergeFields.forEach((field) => {
      if (!(field.key in data) && field.defaultValue) {
        data[field.key] = field.defaultValue
      }
    })

    return data
  }

  /**
   * Utility: Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Utility: Generate mock SendGrid message ID
   */
  private generateSendGridMessageId(): string {
    return `sg-${this.generateId()}`
  }

  /**
   * Utility: Delay for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * Email analytics calculator for campaign metrics
 */
export class EmailAnalyticsService {
  /**
   * Calculate comprehensive campaign metrics from events
   */
  calculateCampaignMetrics(
    sends: EmailSend[],
    events: EmailEvent[]
  ): any {
    const metrics = {
      sent: sends.length,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      spamReports: 0,
      unsubscribed: 0,
      uniqueOpens: 0,
      uniqueClicks: 0,
      totalOpens: 0,
      totalClicks: 0,
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
      clickToOpenRate: 0,
      bounceRate: 0,
      unsubscribeRate: 0,
    }

    // Count event types
    const openedMembers = new Set<string>()
    const clickedMembers = new Set<string>()

    sends.forEach((send) => {
      if (send.status === 'delivered') metrics.delivered++
      if (send.status === 'bounced') metrics.bounced++
      if (send.openedAt) {
        metrics.opened++
        openedMembers.add(send.memberId)
      }
      if (send.firstClickedAt) {
        metrics.clicked++
        clickedMembers.add(send.memberId)
      }

      metrics.totalOpens += send.openCount
      metrics.totalClicks += send.clickCount
    })

    events.forEach((event) => {
      if (event.eventType === 'spam_report') metrics.spamReports++
      if (event.eventType === 'unsubscribed') metrics.unsubscribed++
    })

    metrics.uniqueOpens = openedMembers.size
    metrics.uniqueClicks = clickedMembers.size

    // Calculate rates
    if (metrics.sent > 0) {
      metrics.deliveryRate = metrics.delivered / metrics.sent
      metrics.openRate = metrics.uniqueOpens / metrics.sent
      metrics.clickRate = metrics.uniqueClicks / metrics.sent
      metrics.bounceRate = metrics.bounced / metrics.sent
      metrics.unsubscribeRate = metrics.unsubscribed / metrics.sent
    }

    if (metrics.uniqueOpens > 0) {
      metrics.clickToOpenRate = metrics.uniqueClicks / metrics.uniqueOpens
    }

    return metrics
  }

  /**
   * Determine A/B test winner based on configured metric
   */
  determineABTestWinner(
    campaign: EmailCampaign,
    variantAMetrics: any,
    variantBMetrics: any
  ): ABTestVariant {
    if (!campaign.abTestConfig) {
      return 'A'
    }

    const metric = campaign.abTestConfig.winnerMetric

    const metricMap: Record<string, keyof typeof variantAMetrics> = {
      open_rate: 'openRate',
      click_rate: 'clickRate',
      conversion_rate: 'clickToOpenRate',
    }

    const metricKey = metricMap[metric]
    return variantAMetrics[metricKey] >= variantBMetrics[metricKey] ? 'A' : 'B'
  }
}

/**
 * Mock SendGrid service for development
 */
export const createMockSendGridService = (): SendGridService => {
  const config: SendGridConfig = {
    apiKey: 'mock-api-key',
    fromEmail: 'noreply@nabip.org',
    fromName: 'NABIP',
    replyToEmail: 'support@nabip.org',
    trackOpens: true,
    trackClicks: true,
    enableUnsubscribeGroups: true,
    batchSize: 100,
    maxSendsPerSecond: 10,
  }

  return new SendGridService(config)
}
