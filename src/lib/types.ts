export type MembershipType = 'individual' | 'organizational' | 'student' | 'lifetime'
export type MemberStatus = 'active' | 'pending' | 'expired' | 'suspended' | 'grace_period'
export type ChapterType = 'national' | 'state' | 'local'
export type EventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'checked-in' | 'waitlisted'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'processing'
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent'
export type TransactionType = 'membership_dues' | 'event_registration' | 'donation' | 'refund' | 'late_fee'
export type CredentialStatus = 'active' | 'expired' | 'in_progress' | 'revoked'

export interface Member {
  id: string
  email: string
  firstName: string
  lastName: string
  memberType: MembershipType
  status: MemberStatus
  chapterId: string
  joinedDate: string
  expiryDate: string
  renewalReminderSent?: boolean
  gracePerioEndDate?: string
  phone?: string
  company?: string
  jobTitle?: string
  address?: Address
  designations?: string[]
  credentials?: Credential[]
  avatarUrl?: string
  engagementScore: number
  preferences?: MemberPreferences
  customFields?: Record<string, any>
  lastLoginDate?: string
}

export interface Address {
  street: string
  city: string
  state: string
  zip: string
  country: string
}

export interface MemberPreferences {
  emailNotifications: boolean
  smsNotifications: boolean
  newsletterSubscribed: boolean
  eventReminders: boolean
  marketingEmails: boolean
}

export interface Credential {
  id: string
  name: string
  issuer: string
  issuedDate: string
  expiryDate?: string
  status: CredentialStatus
  certificateUrl?: string
}

export interface Chapter {
  id: string
  name: string
  type: ChapterType
  parentChapterId?: string
  state?: string
  city?: string
  region?: string
  memberCount: number
  activeEventsCount: number
  revenueShare?: number
  websiteUrl?: string
  contactEmail?: string
  phone?: string
  president?: string
  established?: string
  settings?: ChapterSettings
  description?: string
  meetingSchedule?: string
  socialMedia?: {
    facebook?: string
    twitter?: string
    linkedin?: string
  }
  leadership?: ChapterLeader[]
  recentNews?: ChapterNews[]
  upcomingMeetings?: ChapterMeeting[]
}

export interface ChapterLeader {
  id: string
  name: string
  role: string
  email?: string
  phone?: string
  bio?: string
  imageUrl?: string
}

export interface ChapterNews {
  id: string
  title: string
  date: string
  excerpt: string
  content?: string
}

export interface ChapterMeeting {
  id: string
  title: string
  date: string
  location: string
  description?: string
}

export interface ChapterSettings {
  enableSelfRegistration: boolean
  requireApproval: boolean
  customBranding?: {
    logoUrl?: string
    primaryColor?: string
  }
}

export interface Event {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  chapterId: string
  capacity: number
  registeredCount: number
  waitlistCount?: number
  status: EventStatus
  location: string
  virtual: boolean
  ticketTypes: TicketType[]
  customQuestions?: EventQuestion[]
  sessions?: EventSession[]
  discountCodes?: DiscountCode[]
  imageUrl?: string
  requiresApproval?: boolean
  ceCredits?: number
  tags?: string[]
}

export interface EventQuestion {
  id: string
  question: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox'
  required: boolean
  options?: string[]
  appliesTo?: string[]
}

export interface EventSession {
  id: string
  name: string
  description: string
  startTime: string
  endTime: string
  location: string
  capacity: number
  registeredCount: number
  speakerId?: string
}

export interface DiscountCode {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  maxUses?: number
  usedCount: number
  validFrom: string
  validUntil: string
  applicableTicketTypes?: string[]
  applicableMemberTypes?: MembershipType[]
  active: boolean
}

export interface TicketType {
  id: string
  name: string
  description?: string
  price: number
  capacity: number
  sold: number
  memberOnly: boolean
  earlyBird?: boolean
  earlyBirdEndDate?: string
  includesAccess?: string[]
}

export interface Registration {
  id: string
  eventId: string
  memberId: string
  ticketTypeId: string
  status: RegistrationStatus
  paymentStatus: PaymentStatus
  amount: number
  discountApplied?: number
  discountCode?: string
  registeredDate: string
  checkInDate?: string
  selectedSessions?: string[]
  customResponses?: Record<string, any>
  guestInfo?: GuestInfo[]
  qrCode?: string
}

export interface GuestInfo {
  name: string
  email: string
  ticketTypeId: string
}

export interface Campaign {
  id: string
  name: string
  subject: string
  content: string
  segmentQuery: string
  recipientCount: number
  status: CampaignStatus
  scheduledDate?: string
  sentDate?: string
  openRate: number
  clickRate: number
  bounceRate?: number
  unsubscribeRate?: number
  createdBy: string
  templateId?: string
  abTestVariant?: string
}

export interface CampaignTemplate {
  id: string
  name: string
  content: string
  thumbnailUrl?: string
  category: string
}

export interface Transaction {
  id: string
  memberId: string
  type: TransactionType
  amount: number
  status: PaymentStatus
  description: string
  date: string
  referenceId?: string
  paymentMethod?: 'credit_card' | 'ach' | 'check' | 'wire'
  invoiceUrl?: string
  notes?: string
}

export interface Invoice {
  id: string
  memberId: string
  transactionId: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  amount: number
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled'
  lineItems: LineItem[]
  pdfUrl?: string
}

export interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface DashboardStats {
  totalMembers: number
  activeMembers: number
  memberGrowth: number
  upcomingEvents: number
  totalRevenue: number
  revenueGrowth: number
  emailsSent: number
  avgEngagementScore: number
  pendingRenewals?: number
  expiringSoon?: number
}

export interface CommandItem {
  id: string
  label: string
  keywords: string[]
  action: () => void
  icon?: string
}

export interface Course {
  id: string
  name: string
  description: string
  category: string
  duration: number
  ceCredits?: number
  instructor?: string
  enrollmentCount: number
  completionRate: number
  price: number
  status: 'draft' | 'published' | 'archived'
  prerequisites?: string[]
  learningObjectives?: string[]
  thumbnailUrl?: string
}

export interface Enrollment {
  id: string
  memberId: string
  courseId: string
  enrolledDate: string
  startedDate?: string
  completedDate?: string
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped'
  progress: number
  certificateUrl?: string
}

export interface Report {
  id: string
  name: string
  description: string
  category: 'membership' | 'financial' | 'events' | 'engagement' | 'custom'
  createdBy: string
  createdDate: string
  lastRunDate?: string
  schedule?: ReportSchedule
  filters?: Record<string, any>
  columns?: ReportColumn[]
  isPublic: boolean
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly'
  dayOfWeek?: number
  dayOfMonth?: number
  time: string
  recipients: string[]
}

export interface ReportColumn {
  field: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean'
  format?: string
  aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max'
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  entity: string
  entityId: string
  changes?: Record<string, any>
  timestamp: string
  ipAddress?: string
}

// ============================================================================
// ECOMMERCE TYPES
// ============================================================================

export type ProductCategory = 'membership' | 'course' | 'event_ticket' | 'merchandise' | 'publication'
export type ProductStatus = 'draft' | 'published' | 'archived'
export type PriceType = 'one_time' | 'recurring'
export type BillingInterval = 'day' | 'week' | 'month' | 'year'
export type CartStatus = 'active' | 'abandoned' | 'converted' | 'expired'
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'partially_refunded'
export type PaymentStatusType = 'unpaid' | 'authorized' | 'paid' | 'partially_refunded' | 'refunded' | 'failed'
export type FulfillmentStatus = 'pending' | 'processing' | 'fulfilled' | 'cancelled'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'unpaid' | 'incomplete' | 'incomplete_expired'
export type DiscountType = 'percentage' | 'fixed_amount'
export type RefundReason = 'requested_by_customer' | 'duplicate' | 'fraudulent' | 'other'
export type WebhookProcessingStatus = 'pending' | 'processing' | 'processed' | 'failed' | 'skipped'

export interface Product {
  id: string
  name: string
  description?: string
  category?: ProductCategory
  tags?: string[]
  stripeProductId?: string
  active: boolean
  featured?: boolean
  trackInventory: boolean
  inventoryQuantity: number
  lowStockThreshold?: number
  allowBackorder: boolean
  isDigital: boolean
  downloadUrl?: string
  accessDurationDays?: number
  imageUrl?: string
  thumbnailUrl?: string
  galleryUrls?: string[]
  slug?: string
  metaTitle?: string
  metaDescription?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface Price {
  id: string
  productId: string
  stripePriceId?: string
  unitAmount: number
  currency: string
  type: PriceType
  billingInterval?: BillingInterval
  billingIntervalCount?: number
  trialPeriodDays?: number
  memberTier?: MembershipType
  isMemberOnly: boolean
  active: boolean
  nickname?: string
  description?: string
  compareAtPrice?: number
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface Cart {
  id: string
  memberId?: string
  sessionId?: string
  status: CartStatus
  couponCode?: string
  discountAmount: number
  expiresAt: string
  convertedToOrderId?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  lastActivityAt: string
  items?: CartItem[]
}

export interface CartItem {
  id: string
  cartId: string
  productId: string
  priceId: string
  quantity: number
  unitPrice: number
  customOptions?: Record<string, any>
  createdAt: string
  updatedAt: string
  product?: Product
  price?: Price
}

export interface Order {
  id: string
  orderNumber: string
  memberId?: string
  email: string
  subtotal: number
  discountAmount: number
  taxAmount: number
  shippingAmount: number
  totalAmount: number
  currency: string
  status: OrderStatus
  paymentStatus: PaymentStatusType
  paymentMethod?: string
  stripePaymentIntentId?: string
  stripeCheckoutSessionId?: string
  shippingAddress?: Address
  billingAddress?: Address
  shippingMethod?: string
  trackingNumber?: string
  shippedAt?: string
  deliveredAt?: string
  couponCode?: string
  confirmationSentAt?: string
  fulfillmentEmailSentAt?: string
  refundedAmount: number
  refundedAt?: string
  refundReason?: string
  customerNotes?: string
  internalNotes?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  completedAt?: string
  cancelledAt?: string
  items?: OrderItem[]
  payments?: Payment[]
}

export interface OrderItem {
  id: string
  orderId: string
  productId?: string
  priceId?: string
  productName: string
  productDescription?: string
  sku?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  discountAmount: number
  taxAmount: number
  customOptions?: Record<string, any>
  isDigital: boolean
  downloadUrl?: string
  accessGrantedAt?: string
  accessExpiresAt?: string
  downloadCount: number
  fulfillmentStatus: FulfillmentStatus
  fulfilledAt?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  product?: Product
}

export interface Payment {
  id: string
  orderId: string
  amount: number
  currency: string
  status: PaymentStatusType
  paymentMethod?: string
  paymentMethodDetails?: Record<string, any>
  stripePaymentIntentId?: string
  stripeChargeId?: string
  processorResponse?: Record<string, any>
  failureReason?: string
  failureCode?: string
  refundedAmount: number
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  succeededAt?: string
  failedAt?: string
}

export interface Refund {
  id: string
  paymentId: string
  orderId: string
  amount: number
  currency: string
  status: PaymentStatusType
  reason?: RefundReason
  reasonDescription?: string
  stripeRefundId?: string
  processorResponse?: Record<string, any>
  failureReason?: string
  processedBy?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  succeededAt?: string
  failedAt?: string
}

export interface Subscription {
  id: string
  memberId: string
  productId: string
  priceId: string
  status: SubscriptionStatus
  stripeSubscriptionId?: string
  stripeCustomerId?: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  trialStart?: string
  trialEnd?: string
  cancelAt?: string
  cancelAtPeriodEnd: boolean
  cancelledAt?: string
  cancellationReason?: string
  billingInterval: BillingInterval
  billingIntervalCount: number
  unitAmount: number
  currency: string
  latestInvoiceId?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  startedAt: string
  product?: Product
  price?: Price
}

export interface Coupon {
  id: string
  code: string
  name: string
  description?: string
  discountType: DiscountType
  discountValue: number
  currency?: string
  maxRedemptions?: number
  maxRedemptionsPerCustomer: number
  redemptionCount: number
  appliesTo: 'all' | 'products' | 'prices'
  applicableProductIds?: string[]
  applicablePriceIds?: string[]
  minimumPurchaseAmount?: number
  memberTier?: MembershipType
  memberOnly: boolean
  validFrom: string
  validUntil?: string
  stripeCouponId?: string
  stripePromotionCodeId?: string
  active: boolean
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface CouponRedemption {
  id: string
  couponId: string
  memberId?: string
  orderId?: string
  discountAmount: number
  sessionId?: string
  metadata?: Record<string, any>
  createdAt: string
  coupon?: Coupon
}

export interface WebhookEvent {
  id: string
  stripeEventId: string
  eventType: string
  eventData: Record<string, any>
  processingStatus: WebhookProcessingStatus
  errorMessage?: string
  retryCount: number
  relatedOrderId?: string
  relatedSubscriptionId?: string
  relatedInvoiceId?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  processedAt?: string
}

export interface StripeCustomer {
  id: string
  memberId: string
  stripeCustomerId: string
  defaultPaymentMethodId?: string
  invoiceSettings?: Record<string, any>
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// Enhanced shopping cart for UI
export interface CartWithDetails extends Cart {
  items: (CartItem & {
    product: Product
    price: Price
  })[]
  subtotal: number
  total: number
}

// Checkout session data
export interface CheckoutSession {
  cartId: string
  memberId?: string
  email: string
  shippingAddress?: Address
  billingAddress?: Address
  couponCode?: string
  stripeSessionId?: string
}

// ============================================================================
// ADVANCED ANALYTICS TYPES
// ============================================================================

export type AnalyticsEventType =
  | 'page_view'
  | 'button_click'
  | 'form_submission'
  | 'event_registration'
  | 'event_check_in'
  | 'email_open'
  | 'email_click'
  | 'course_enrollment'
  | 'course_completion'
  | 'login'
  | 'logout'
  | 'member_update'
  | 'payment_completed'
  | 'search'
  | 'filter_applied'
  | 'export_data'
  | 'custom'

export type PredictionType =
  | 'churn_risk'
  | 'engagement_forecast'
  | 'event_attendance'
  | 'renewal_likelihood'
  | 'lifetime_value'
  | 'next_action'

export type CohortDefinitionType =
  | 'join_date'
  | 'chapter'
  | 'membership_tier'
  | 'engagement_level'
  | 'activity_pattern'
  | 'custom'

export interface AnalyticsEvent {
  id: string
  eventType: AnalyticsEventType
  memberId?: string
  sessionId?: string
  metadata: Record<string, any>
  timestamp: string
  page?: string
  referrer?: string
  userAgent?: string
  ipAddress?: string
}

export interface MemberMetric {
  id: string
  memberId: string
  engagementScore: number
  activityCount: number
  lastActivityDate: string
  eventsAttended: number
  emailsOpened: number
  emailsClicked: number
  coursesCompleted: number
  loginCount: number
  daysSinceLastLogin: number
  churnRisk: number
  lifetimeValue: number
  lastCalculated: string
  trends?: {
    engagementTrend: 'increasing' | 'stable' | 'decreasing'
    weeklyActiveRate: number
    monthlyActiveRate: number
  }
}

export interface CohortDefinition {
  type: CohortDefinitionType
  criteria: Record<string, any>
  label: string
  description?: string
}

export interface Cohort {
  id: string
  name: string
  description?: string
  definition: CohortDefinition
  memberIds: string[]
  memberCount: number
  metrics?: CohortMetrics
  createdDate: string
  createdBy: string
  lastUpdated: string
}

export interface CohortMetrics {
  avgEngagementScore: number
  retentionRate: number
  churnRate: number
  avgLifetimeValue: number
  activeMembers: number
  eventAttendanceRate: number
  courseCompletionRate: number
  emailEngagementRate: number
}

export interface RetentionAnalysis {
  cohortId: string
  cohortName: string
  periods: RetentionPeriod[]
  overallRetentionRate: number
}

export interface RetentionPeriod {
  period: number
  periodLabel: string
  startingMembers: number
  retainedMembers: number
  retentionRate: number
  churnedMembers: number
}

export interface Prediction {
  id: string
  memberId: string
  predictionType: PredictionType
  confidence: number
  predictedValue: any
  predictedDate?: string
  factors?: PredictionFactor[]
  recommendedActions?: string[]
  createdAt: string
  expiresAt?: string
  modelVersion?: string
}

export interface PredictionFactor {
  factor: string
  weight: number
  value: any
  impact: 'positive' | 'negative' | 'neutral'
}

export interface ChurnPrediction extends Prediction {
  predictionType: 'churn_risk'
  predictedValue: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  predictedChurnDate?: string
  preventionStrategies?: string[]
}

export interface MemberSimilarity {
  memberId: string
  similarMemberIds: string[]
  similarityScores: Record<string, number>
  basedOn: string[]
  lastCalculated: string
}

export interface MemberEmbedding {
  memberId: string
  vector: number[]
  metadata: {
    interests?: string[]
    activityLevel: string
    membershipTier: MembershipType
    chapterType: ChapterType
    engagementSegment: string
  }
  createdAt: string
  updatedAt: string
}

export interface MemberJourney {
  memberId: string
  stages: JourneyStage[]
  currentStage: string
  daysInCurrentStage: number
  predictedNextStage?: string
  predictedTransitionDate?: string
}

export interface JourneyStage {
  stage: string
  enteredDate: string
  exitedDate?: string
  durationDays?: number
  activities: string[]
  milestones: string[]
}

export interface ConversionFunnel {
  name: string
  description?: string
  stages: FunnelStage[]
  conversionRate: number
  dropoffRate: number
  avgTimeToConvert: number
}

export interface FunnelStage {
  name: string
  order: number
  memberCount: number
  conversionRate: number
  avgTimeToNextStage?: number
  dropoffReasons?: string[]
}

export interface AnalyticsDashboardConfig {
  widgets: AnalyticsWidget[]
  dateRange: {
    start: string
    end: string
  }
  refreshInterval?: number
}

export interface AnalyticsWidget {
  id: string
  type: 'chart' | 'metric' | 'table' | 'heatmap' | 'journey' | 'funnel'
  title: string
  dataSource: string
  config: Record<string, any>
  position: {
    x: number
    y: number
    width: number
    height: number
  }
}
