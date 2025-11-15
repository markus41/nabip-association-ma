export type MembershipType = 'individual' | 'organizational' | 'student' | 'lifetime'
export type MemberStatus = 'active' | 'pending' | 'expired' | 'suspended' | 'grace_period'
export type ChapterType = 'national' | 'state' | 'local'
export type EventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'checked-in' | 'waitlisted'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'processing'
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent'
export type TransactionType = 'membership_dues' | 'event_registration' | 'donation' | 'refund' | 'late_fee'
export type CredentialStatus = 'active' | 'expired' | 'in_progress' | 'revoked'
export type UserRole = 'member' | 'chapter_admin' | 'state_admin' | 'national_admin'

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
  role?: UserRole
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

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  chapterId?: string
  stateId?: string
  avatarUrl?: string
  lastLoginDate?: string
}
