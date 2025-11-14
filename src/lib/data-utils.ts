import type { Member, Chapter, Event, Transaction, Campaign, DashboardStats, Course, Enrollment, Report, Credential } from './types'

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen']
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin']
const companies = ['ABC Insurance Group', 'Premier Benefits Co', 'HealthFirst Partners', 'National Coverage Inc', 'Elite Insurance Services', 'Professional Benefits LLC', 'SecureLife Insurance', 'Advantage Benefits Group', 'Trust Insurance Partners', 'Pinnacle Benefits']
const designations = ['CLU', 'ChFC', 'RHU', 'REBC', 'LUTCF', 'CFP', 'CIC']

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function generateMembers(count: number): Member[] {
  const members: Member[] = []
  const memberTypes: ('individual' | 'organizational' | 'student' | 'lifetime')[] = ['individual', 'organizational', 'student', 'lifetime']
  const statuses: ('active' | 'pending' | 'expired' | 'suspended' | 'grace_period')[] = ['active', 'active', 'active', 'active', 'pending', 'expired', 'grace_period']
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const joinedDate = new Date(Date.now() - Math.random() * 365 * 5 * 24 * 60 * 60 * 1000)
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const expiryDate = new Date(joinedDate.getTime() + 365 * 24 * 60 * 60 * 1000)
    
    const credentials: Credential[] = Math.random() > 0.6 ? [
      {
        id: generateId(),
        name: designations[Math.floor(Math.random() * designations.length)],
        issuer: 'NABIP',
        issuedDate: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000).toISOString(),
        expiryDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      }
    ] : []
    
    members.push({
      id: generateId(),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      firstName,
      lastName,
      memberType: memberTypes[Math.floor(Math.random() * memberTypes.length)],
      status,
      chapterId: `chapter-${Math.floor(Math.random() * 50) + 1}`,
      joinedDate: joinedDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      company: Math.random() > 0.3 ? companies[Math.floor(Math.random() * companies.length)] : undefined,
      jobTitle: Math.random() > 0.4 ? 'Benefits Consultant' : undefined,
      designations: Math.random() > 0.5 ? [designations[Math.floor(Math.random() * designations.length)]] : [],
      credentials,
      engagementScore: Math.floor(Math.random() * 100),
      preferences: {
        emailNotifications: true,
        smsNotifications: Math.random() > 0.5,
        newsletterSubscribed: Math.random() > 0.3,
        eventReminders: true,
        marketingEmails: Math.random() > 0.4
      },
      lastLoginDate: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined
    })
  }
  
  return members
}

export function generateChapters(): Chapter[] {
  const states = ['California', 'Texas', 'Florida', 'New York', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan']
  const chapters: Chapter[] = [
    {
      id: 'chapter-national',
      name: 'NABIP National',
      type: 'national',
      region: 'National',
      memberCount: 20000,
      activeEventsCount: 12
    }
  ]
  
  states.forEach((state, index) => {
    const stateChapter: Chapter = {
      id: `chapter-state-${index + 1}`,
      name: `NABIP ${state}`,
      type: 'state',
      parentChapterId: 'chapter-national',
      region: state,
      memberCount: Math.floor(Math.random() * 2000) + 500,
      activeEventsCount: Math.floor(Math.random() * 5) + 1
    }
    chapters.push(stateChapter)
    
    for (let i = 0; i < 3; i++) {
      chapters.push({
        id: `chapter-local-${index * 3 + i + 1}`,
        name: `${state} Local Chapter ${i + 1}`,
        type: 'local',
        parentChapterId: stateChapter.id,
        region: state,
        memberCount: Math.floor(Math.random() * 200) + 50,
        activeEventsCount: Math.floor(Math.random() * 3)
      })
    }
  })
  
  return chapters
}

export function generateEvents(count: number): Event[] {
  const events: Event[] = []
  const eventNames = [
    'Annual Leadership Conference',
    'Medicare & Medicaid Summit',
    'Professional Development Workshop',
    'Legislative Advocacy Day',
    'Benefits Technology Forum',
    'Compliance & Regulations Seminar',
    'Networking Breakfast',
    'Industry Trends Webinar',
    'Chapter President Meeting',
    'Certification Prep Course'
  ]
  
  for (let i = 0; i < count; i++) {
    const startDate = new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000)
    const capacity = Math.floor(Math.random() * 200) + 50
    const registered = Math.floor(Math.random() * capacity * 0.8)
    
    events.push({
      id: generateId(),
      name: eventNames[Math.floor(Math.random() * eventNames.length)],
      description: 'Join us for an engaging session with industry experts and networking opportunities.',
      startDate: startDate.toISOString(),
      endDate: new Date(startDate.getTime() + (Math.random() > 0.5 ? 4 : 8) * 60 * 60 * 1000).toISOString(),
      chapterId: `chapter-${Math.floor(Math.random() * 50) + 1}`,
      capacity,
      registeredCount: registered,
      status: Math.random() > 0.2 ? 'published' : 'draft',
      location: Math.random() > 0.3 ? 'Grand Hotel, Downtown' : 'Virtual',
      virtual: Math.random() > 0.6,
      ticketTypes: [
        {
          id: generateId(),
          name: 'Member',
          price: Math.floor(Math.random() * 100) + 50,
          capacity: Math.floor(capacity * 0.7),
          sold: Math.floor(registered * 0.7),
          memberOnly: true
        },
        {
          id: generateId(),
          name: 'Non-Member',
          price: Math.floor(Math.random() * 150) + 100,
          capacity: Math.floor(capacity * 0.3),
          sold: Math.floor(registered * 0.3),
          memberOnly: false
        }
      ]
    })
  }
  
  return events
}

export function generateTransactions(count: number): Transaction[] {
  const transactions: Transaction[] = []
  const types: ('membership_dues' | 'event_registration' | 'donation' | 'refund')[] = ['membership_dues', 'event_registration', 'donation', 'refund']
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const amount = type === 'refund' ? -(Math.floor(Math.random() * 200) + 50) : Math.floor(Math.random() * 500) + 50
    
    transactions.push({
      id: generateId(),
      memberId: `member-${Math.floor(Math.random() * 1000)}`,
      type,
      amount,
      status: Math.random() > 0.1 ? 'completed' : 'pending',
      description: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      referenceId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    })
  }
  
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function generateCampaigns(count: number): Campaign[] {
  const campaigns: Campaign[] = []
  const subjects = [
    'Don\'t Miss: Annual Conference Early Bird Pricing',
    'Important: Membership Renewal Reminder',
    'New: Industry Compliance Updates',
    'Invitation: Exclusive Member Networking Event',
    'Update: Chapter Leadership Elections',
    'Alert: Legislative Changes Affecting Benefits'
  ]
  
  for (let i = 0; i < count; i++) {
    const status: ('draft' | 'scheduled' | 'sent')[] = ['draft', 'scheduled', 'sent']
    const campaignStatus = status[Math.floor(Math.random() * status.length)]
    
    campaigns.push({
      id: generateId(),
      name: `Campaign ${i + 1}`,
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      content: '<p>Email content here...</p>',
      segmentQuery: 'status:active',
      recipientCount: Math.floor(Math.random() * 5000) + 1000,
      status: campaignStatus,
      scheduledDate: campaignStatus !== 'draft' ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      sentDate: campaignStatus === 'sent' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      openRate: campaignStatus === 'sent' ? Math.random() * 0.4 + 0.2 : 0,
      clickRate: campaignStatus === 'sent' ? Math.random() * 0.15 + 0.05 : 0,
      createdBy: 'admin'
    })
  }
  
  return campaigns
}

export function calculateDashboardStats(
  members: Member[],
  events: Event[],
  transactions: Transaction[]
): DashboardStats {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const activeMembers = members.filter(m => m.status === 'active').length
  const recentMembers = members.filter(m => new Date(m.joinedDate) > thirtyDaysAgo).length
  const memberGrowth = members.length > 0 ? (recentMembers / members.length) * 100 : 0
  
  const upcomingEvents = events.filter(e => 
    e.status === 'published' && new Date(e.startDate) > now
  ).length
  
  const completedTransactions = transactions.filter(t => t.status === 'completed')
  const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0)
  const recentRevenue = completedTransactions
    .filter(t => new Date(t.date) > thirtyDaysAgo)
    .reduce((sum, t) => sum + t.amount, 0)
  const revenueGrowth = totalRevenue > 0 ? (recentRevenue / totalRevenue) * 100 : 0
  
  const avgEngagementScore = members.length > 0 
    ? members.reduce((sum, m) => sum + m.engagementScore, 0) / members.length 
    : 0
  
  return {
    totalMembers: members.length,
    activeMembers,
    memberGrowth: Math.round(memberGrowth * 10) / 10,
    upcomingEvents,
    totalRevenue: Math.round(totalRevenue),
    revenueGrowth: Math.round(revenueGrowth * 10) / 10,
    emailsSent: Math.floor(Math.random() * 50000) + 10000,
    avgEngagementScore: Math.round(avgEngagementScore)
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatDate(dateString: string, includeTime = false): string {
  const date = new Date(dateString)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: 'numeric', minute: '2-digit' })
  }
  return date.toLocaleDateString('en-US', options)
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    active: 'bg-teal/10 text-teal border-teal/20',
    pending: 'bg-accent/10 text-accent-foreground border-accent/20',
    expired: 'bg-destructive/10 text-destructive border-destructive/20',
    suspended: 'bg-muted text-muted-foreground border-border',
    grace_period: 'bg-accent/10 text-accent-foreground border-accent/20',
    draft: 'bg-muted text-muted-foreground border-border',
    published: 'bg-teal/10 text-teal border-teal/20',
    completed: 'bg-primary/10 text-primary border-primary/20',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
    confirmed: 'bg-teal/10 text-teal border-teal/20',
    waitlisted: 'bg-accent/10 text-accent-foreground border-accent/20',
    failed: 'bg-destructive/10 text-destructive border-destructive/20',
    refunded: 'bg-muted text-muted-foreground border-border',
    processing: 'bg-accent/10 text-accent-foreground border-accent/20',
    sent: 'bg-teal/10 text-teal border-teal/20',
    scheduled: 'bg-accent/10 text-accent-foreground border-accent/20',
    in_progress: 'bg-accent/10 text-accent-foreground border-accent/20',
    enrolled: 'bg-primary/10 text-primary border-primary/20',
    dropped: 'bg-muted text-muted-foreground border-border',
    revoked: 'bg-destructive/10 text-destructive border-destructive/20'
  }
  
  return statusColors[status] || 'bg-muted text-muted-foreground border-border'
}

export function generateCourses(count: number): Course[] {
  const courses: Course[] = []
  const categories = [
    'Compliance & Regulations',
    'Sales & Marketing',
    'Benefits Administration',
    'Medicare & Medicaid',
    'Leadership Development',
    'Technology & Innovation'
  ]
  
  const courseNames = [
    'REBC Professional Designation',
    'Medicare Modernization Act',
    'ACA Compliance Essentials',
    'Advanced Sales Techniques',
    'Employee Benefits Fundamentals',
    'Healthcare Reform Updates',
    'Digital Marketing for Brokers',
    'Group Benefits Strategies',
    'Individual Health Insurance',
    'Voluntary Benefits Overview',
    'HIPAA Privacy & Security',
    'Broker Management Best Practices'
  ]
  
  for (let i = 0; i < count; i++) {
    const price = Math.random() > 0.3 ? Math.floor(Math.random() * 500) + 100 : 0
    
    courses.push({
      id: generateId(),
      name: courseNames[Math.floor(Math.random() * courseNames.length)],
      description: 'Comprehensive training program designed to enhance your professional skills and knowledge in the benefits industry.',
      category: categories[Math.floor(Math.random() * categories.length)],
      duration: Math.floor(Math.random() * 20) + 5,
      ceCredits: Math.random() > 0.4 ? Math.floor(Math.random() * 10) + 5 : undefined,
      instructor: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      enrollmentCount: Math.floor(Math.random() * 500) + 50,
      completionRate: Math.floor(Math.random() * 40) + 60,
      price,
      status: 'published',
      prerequisites: Math.random() > 0.7 ? ['Basic Benefits Knowledge'] : undefined,
      learningObjectives: [
        'Understand key concepts and regulations',
        'Apply best practices in real-world scenarios',
        'Develop strategic thinking skills',
        'Enhance client communication abilities'
      ]
    })
  }
  
  return courses
}

export function generateEnrollments(count: number, courseIds: string[]): Enrollment[] {
  const enrollments: Enrollment[] = []
  const statuses: ('enrolled' | 'in_progress' | 'completed' | 'dropped')[] = [
    'completed',
    'completed',
    'in_progress',
    'in_progress',
    'in_progress',
    'enrolled',
    'dropped'
  ]
  
  for (let i = 0; i < count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const enrolledDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
    const progress = status === 'completed' ? 100 : status === 'in_progress' ? Math.floor(Math.random() * 80) + 10 : 0
    
    enrollments.push({
      id: generateId(),
      memberId: `member-${Math.floor(Math.random() * 1000)}`,
      courseId: courseIds[Math.floor(Math.random() * courseIds.length)],
      enrolledDate: enrolledDate.toISOString(),
      startedDate: status !== 'enrolled' ? new Date(enrolledDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      completedDate: status === 'completed' ? new Date(enrolledDate.getTime() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      status,
      progress
    })
  }
  
  return enrollments
}

export function generateReports(count: number): Report[] {
  const reports: Report[] = []
  const categories: ('membership' | 'financial' | 'events' | 'engagement' | 'custom')[] = [
    'membership',
    'financial',
    'events',
    'engagement',
    'custom'
  ]
  
  const reportNames: Record<string, string[]> = {
    membership: [
      'Active Members Report',
      'Membership Growth Analysis',
      'Renewal Tracking Report',
      'Member Demographics',
      'Lapsed Members Report'
    ],
    financial: [
      'Revenue Summary',
      'Dues Collection Report',
      'Event Revenue Analysis',
      'Outstanding Invoices',
      'Payment Method Breakdown'
    ],
    events: [
      'Event Attendance Report',
      'Registration Analytics',
      'Event ROI Analysis',
      'Capacity Utilization',
      'Speaker Performance'
    ],
    engagement: [
      'Member Engagement Score',
      'Email Campaign Performance',
      'Website Analytics',
      'Event Participation Trends',
      'Member Activity Log'
    ],
    custom: [
      'Custom Analytics Dashboard',
      'Chapter Performance Comparison',
      'Quarterly Business Review',
      'Annual Metrics Report',
      'Executive Summary'
    ]
  }
  
  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)]
    const names = reportNames[category]
    const name = names[Math.floor(Math.random() * names.length)]
    const hasSchedule = Math.random() > 0.6
    
    reports.push({
      id: generateId(),
      name,
      description: `Comprehensive ${category} analysis providing insights into key metrics and trends.`,
      category,
      createdBy: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      createdDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastRunDate: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      schedule: hasSchedule ? {
        frequency: ['daily', 'weekly', 'monthly'][Math.floor(Math.random() * 3)] as 'daily' | 'weekly' | 'monthly',
        dayOfWeek: Math.floor(Math.random() * 7),
        time: `${Math.floor(Math.random() * 12) + 1}:00 AM`,
        recipients: ['admin@nabip.org']
      } : undefined,
      columns: [
        { field: 'name', label: 'Name', type: 'string' },
        { field: 'value', label: 'Value', type: 'number' },
        { field: 'date', label: 'Date', type: 'date' }
      ],
      isPublic: Math.random() > 0.5
    })
  }
  
  return reports
}
