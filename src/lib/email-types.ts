/**
 * Comprehensive email campaign type definitions to establish scalable
 * multi-channel communication platform supporting SendGrid integration.
 *
 * Designed for: Organizations requiring reliable email delivery with detailed analytics
 * Best for: Marketing campaigns, transactional emails, and member engagement tracking
 */

export type EmailTemplateType =
  | 'welcome'
  | 'renewal_reminder'
  | 'event_invitation'
  | 'newsletter'
  | 'payment_receipt'
  | 'course_enrollment'
  | 'custom'

export type EmailEventType =
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'spam_report'
  | 'unsubscribed'
  | 'deferred'
  | 'dropped'

export type CampaignScheduleType = 'immediate' | 'scheduled' | 'recurring'

export type ABTestVariant = 'A' | 'B'

export type SegmentOperator = 'and' | 'or'

export type SegmentConditionType =
  | 'status'
  | 'memberType'
  | 'chapter'
  | 'engagementScore'
  | 'joinedDate'
  | 'expiryDate'
  | 'tag'
  | 'customField'

/**
 * Enhanced email template with SendGrid dynamic template support
 */
export interface EmailTemplate {
  id: string
  name: string
  type: EmailTemplateType
  subject: string
  previewText?: string
  htmlContent: string
  plainTextContent?: string
  sendgridTemplateId?: string
  thumbnailUrl?: string
  category: string
  mergeFields: TemplateMergeField[]
  createdAt: string
  updatedAt: string
  createdBy: string
  isActive: boolean
}

/**
 * Template merge field definitions for personalization
 */
export interface TemplateMergeField {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'url' | 'boolean'
  defaultValue?: string
  required: boolean
  description?: string
}

/**
 * Enhanced campaign with A/B testing and advanced scheduling
 */
export interface EmailCampaign {
  id: string
  name: string
  templateId: string
  subject: string
  previewText?: string
  fromName: string
  fromEmail: string
  replyTo?: string

  // Segmentation
  segmentRules: SegmentRule[]
  estimatedRecipients: number
  actualRecipients?: number

  // Scheduling
  scheduleType: CampaignScheduleType
  scheduledAt?: string
  timezone?: string
  recurringConfig?: RecurringConfig

  // A/B Testing
  abTestEnabled: boolean
  abTestConfig?: ABTestConfig
  winningVariant?: ABTestVariant

  // Status & Analytics
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'
  sentAt?: string
  completedAt?: string

  // Performance Metrics
  metrics: CampaignMetrics

  // Metadata
  createdAt: string
  updatedAt: string
  createdBy: string
  tags?: string[]
  notes?: string
}

/**
 * Audience segmentation rule structure
 */
export interface SegmentRule {
  id: string
  field: SegmentConditionType
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: string | number | string[]
  logicalOperator?: SegmentOperator
}

/**
 * Recurring campaign configuration
 */
export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly'
  interval: number
  daysOfWeek?: number[]
  dayOfMonth?: number
  time: string
  endDate?: string
}

/**
 * A/B test configuration
 */
export interface ABTestConfig {
  subjectA: string
  subjectB: string
  sampleSize: number
  testDuration: number
  winnerMetric: 'open_rate' | 'click_rate' | 'conversion_rate'
  sendWinnerAt?: string
}

/**
 * Comprehensive campaign performance metrics
 */
export interface CampaignMetrics {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  spamReports: number
  unsubscribed: number

  // Calculated rates
  deliveryRate: number
  openRate: number
  clickRate: number
  clickToOpenRate: number
  bounceRate: number
  unsubscribeRate: number

  // Engagement
  uniqueOpens: number
  uniqueClicks: number
  totalOpens: number
  totalClicks: number

  // Links
  topLinks?: LinkClick[]

  // Geographic & Device
  topCountries?: CountryMetric[]
  topDevices?: DeviceMetric[]

  // Timing
  firstOpenAt?: string
  lastOpenAt?: string
  firstClickAt?: string
  lastClickAt?: string
}

export interface LinkClick {
  url: string
  clicks: number
  uniqueClicks: number
}

export interface CountryMetric {
  country: string
  opens: number
  clicks: number
}

export interface DeviceMetric {
  device: string
  opens: number
  clicks: number
}

/**
 * Individual email send record with delivery tracking
 */
export interface EmailSend {
  id: string
  campaignId: string
  memberId: string
  emailAddress: string

  // SendGrid tracking
  sendgridMessageId?: string
  status: 'pending' | 'queued' | 'sent' | 'delivered' | 'bounced' | 'dropped'

  // Engagement events
  deliveredAt?: string
  openedAt?: string
  firstClickedAt?: string
  bouncedAt?: string
  unsubscribedAt?: string

  // Engagement counts
  openCount: number
  clickCount: number

  // Metadata
  sentAt: string
  variant?: ABTestVariant
  errorMessage?: string
}

/**
 * Email event from SendGrid webhook
 */
export interface EmailEvent {
  id: string
  sendId: string
  campaignId: string
  memberId: string
  emailAddress: string

  eventType: EmailEventType
  timestamp: string

  // Event-specific data
  url?: string
  userAgent?: string
  ipAddress?: string
  reason?: string
  bounceType?: 'soft' | 'hard' | 'blocked'

  // SendGrid metadata
  sendgridEventId: string
  sendgridMessageId: string
}

/**
 * Unsubscribe record with preference management
 */
export interface Unsubscribe {
  id: string
  memberId: string
  emailAddress: string

  // Scope
  campaignId?: string
  unsubscribeAll: boolean

  // Preferences
  preferences: UnsubscribePreferences

  // Metadata
  unsubscribedAt: string
  reason?: string
  feedback?: string
  ipAddress?: string
}

/**
 * Granular email preference controls
 */
export interface UnsubscribePreferences {
  newsletters: boolean
  eventAnnouncements: boolean
  renewalReminders: boolean
  courseUpdates: boolean
  marketingEmails: boolean
  transactionalEmails: boolean
}

/**
 * Email list for segmentation
 */
export interface EmailList {
  id: string
  name: string
  description?: string

  // Members
  memberIds: string[]
  memberCount: number

  // Automation
  autoUpdate: boolean
  updateRules?: SegmentRule[]

  // Metadata
  createdAt: string
  updatedAt: string
  createdBy: string
  tags?: string[]
}

/**
 * Email sending configuration
 */
export interface SendGridConfig {
  apiKey: string
  fromEmail: string
  fromName: string
  replyToEmail?: string
  webhookUrl?: string
  webhookSigningKey?: string

  // Rate limiting
  maxSendsPerSecond?: number
  batchSize?: number

  // Tracking
  trackOpens: boolean
  trackClicks: boolean

  // Features
  enableIpPool?: string
  enableUnsubscribeGroups: boolean
}

/**
 * Campaign draft for wizard workflow
 */
export interface CampaignDraft {
  // Step 1: Template Selection
  templateId?: string
  customSubject?: string
  customPreviewText?: string

  // Step 2: Audience
  segmentRules: SegmentRule[]
  excludedMemberIds?: string[]

  // Step 3: Settings
  fromName: string
  fromEmail: string
  replyTo?: string

  // Step 4: Schedule
  scheduleType: CampaignScheduleType
  scheduledAt?: string
  timezone?: string

  // Step 5: A/B Testing (optional)
  abTestEnabled: boolean
  abTestConfig?: ABTestConfig
}

/**
 * Email validation result
 */
export interface EmailValidation {
  valid: boolean
  email: string
  didYouMean?: string
  reason?: string
}

/**
 * Campaign test send request
 */
export interface TestSendRequest {
  campaignId: string
  testEmails: string[]
  variant?: ABTestVariant
}
