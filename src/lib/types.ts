export type MembershipType = 'individual' | 'organizational' | 'student' | 'lifetime'
export type MemberStatus = 'active' | 'pending' | 'expired' | 'suspended'
export type ChapterType = 'national' | 'state' | 'local'
export type EventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'checked-in'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent'
export type TransactionType = 'membership_dues' | 'event_registration' | 'donation' | 'refund'

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
  phone?: string
  company?: string
  designations?: string[]
  avatarUrl?: string
  engagementScore: number
}

export interface Chapter {
  id: string
  name: string
  type: ChapterType
  parentChapterId?: string
  region?: string
  memberCount: number
  activeEventsCount: number
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
  status: EventStatus
  location: string
  virtual: boolean
  ticketTypes: TicketType[]
  imageUrl?: string
}

export interface TicketType {
  id: string
  name: string
  price: number
  capacity: number
  sold: number
  memberOnly: boolean
}

export interface Registration {
  id: string
  eventId: string
  memberId: string
  ticketTypeId: string
  status: RegistrationStatus
  paymentStatus: PaymentStatus
  amount: number
  registeredDate: string
  checkInDate?: string
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
  createdBy: string
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
}

export interface CommandItem {
  id: string
  label: string
  keywords: string[]
  action: () => void
  icon?: string
}
