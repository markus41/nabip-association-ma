import { useState, useEffect, lazy, Suspense } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { CommandPalette } from '@/components/features/CommandPalette'

// Lazy load heavy view components for code splitting
const DashboardView = lazy(() => import('@/components/features/DashboardView'))
const MembersView = lazy(() => import('@/components/features/MembersView'))
const EventsView = lazy(() => import('@/components/features/EventsView'))
const EventCreationDialog = lazy(() => import('@/components/features/EventCreationDialog'))
const EmailCampaignsView = lazy(() => import('@/components/features/EmailCampaignsView'))
const FinanceView = lazy(() => import('@/components/features/FinanceView'))
const ChaptersView = lazy(() => import('@/components/features/ChaptersView'))
const ChapterAdminView = lazy(() => import('@/components/features/ChapterAdminView'))
const LearningView = lazy(() => import('@/components/features/LearningView'))
const MemberPortal = lazy(() => import('@/components/features/MemberPortal'))
const ReportsView = lazy(() => import('@/components/features/ReportsView'))
const AddMemberDialog = lazy(() => import('@/components/features/AddMemberDialog'))
import {
  ChartBar,
  UserCircle,
  CalendarDots,
  EnvelopeSimple,
  CurrencyDollar,
  Buildings,
  Command,
  GraduationCap,
  FileText,
  House
} from '@phosphor-icons/react'
import {
  generateMembers,
  generateChapters,
  generateEvents,
  generateTransactions,
  generateCampaigns,
  generateCourses,
  generateEnrollments,
  generateReports,
  calculateDashboardStats
} from '@/lib/data-utils'
import type { Member, Chapter, Event, Transaction, DashboardStats, Course, Enrollment, Report } from '@/lib/types'
import type { EmailCampaign, EmailTemplate } from '@/lib/email-types'
import { emailTemplates } from '@/lib/email-templates'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '@/lib/auth/AuthContext'
import type { RoleName } from '@/lib/rbac'
// import { RoleSwitcher } from '@/components/features/RoleSwitcher'

type View = 'dashboard' | 'members' | 'events' | 'communications' | 'finance' | 'chapters' | 'chapter-admin' | 'learning' | 'reports' | 'portal'

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [showEventCreationDialog, setShowEventCreationDialog] = useState(false)
  const { user } = useAuth()
  
  const [members, setMembers] = useKV<Member[]>('ams-members', [])
  const [chapters, setChapters] = useKV<Chapter[]>('ams-chapters', [])
  const [events, setEvents] = useKV<Event[]>('ams-events', [])
  const [transactions, setTransactions] = useKV<Transaction[]>('ams-transactions', [])
  const [emailCampaigns, setEmailCampaigns] = useKV<EmailCampaign[]>('ams-email-campaigns', [])
  const [templates] = useKV<EmailTemplate[]>('ams-email-templates', emailTemplates)
  const [courses, setCourses] = useKV<Course[]>('ams-courses', [])
  const [enrollments, setEnrollments] = useKV<Enrollment[]>('ams-enrollments', [])
  const [reports, setReports] = useKV<Report[]>('ams-reports', [])
  
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    memberGrowth: 0,
    upcomingEvents: 0,
    totalRevenue: 0,
    revenueGrowth: 0,
    emailsSent: 0,
    avgEngagementScore: 0,
    pendingRenewals: 0,
    expiringSoon: 0
  })

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true)
      
      if (!members || members.length === 0) {
        const newMembers = generateMembers(100)
        setMembers(newMembers)
      }
      
      if (!chapters || chapters.length === 0) {
        const newChapters = generateChapters()
        setChapters(newChapters)
      }
      
      if (!events || events.length === 0) {
        const newEvents = generateEvents(20)
        setEvents(newEvents)
      }
      
      if (!transactions || transactions.length === 0) {
        const newTransactions = generateTransactions(50)
        setTransactions(newTransactions)
      }
      
      // Email campaigns initialization removed - will be created via wizard
      
      if (!courses || courses.length === 0) {
        const newCourses = generateCourses(12)
        setCourses(newCourses)
        
        const courseIds = newCourses.map(c => c.id)
        const newEnrollments = generateEnrollments(30, courseIds)
        setEnrollments(newEnrollments)
      }
      
      if (!reports || reports.length === 0) {
        const newReports = generateReports(20)
        setReports(newReports)
      }
      
      setTimeout(() => setIsLoading(false), 500)
    }
    
    initializeData()
  }, [])

  // Redirect chapter admins to their view by default
  useEffect(() => {
    if (user && user.role === 'chapter_admin') {
      setCurrentView('chapter-admin')
    } else if (user && user.role !== 'chapter_admin' && currentView === 'chapter-admin') {
      setCurrentView('dashboard')
    }
  }, [user])

  useEffect(() => {
    if (members && members.length > 0 && events && events.length > 0 && transactions && transactions.length > 0) {
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      const pendingRenewals = members.filter(m => {
        const expiry = new Date(m.expiryDate)
        return m.status === 'active' && expiry > now && expiry <= thirtyDaysFromNow
      }).length
      
      const expiringSoon = members.filter(m => {
        const expiry = new Date(m.expiryDate)
        return m.status === 'grace_period' || (m.status === 'active' && expiry <= now)
      }).length
      
      const newStats = calculateDashboardStats(members, events, transactions)
      setStats({
        ...newStats,
        pendingRenewals,
        expiringSoon
      })
    }
  }, [members, events, transactions])

  const handleNavigate = (view: string) => {
    setCurrentView(view as View)
  }

  const handleAddMember = () => {
    setShowAddMemberDialog(true)
  }

  const handleMemberAdded = (newMember: Member) => {
    setMembers([...members, newMember])
  }

  const handleAddEvent = () => {
    setShowEventCreationDialog(true)
  }

  const handleCreateEvent = (eventData: Omit<Event, 'id' | 'registeredCount' | 'waitlistCount'>) => {
    const newEvent: Event = {
      ...eventData,
      id: uuidv4(),
      registeredCount: 0,
      waitlistCount: 0,
    }
    
    setEvents([...(events || []), newEvent])
    
    toast.success('Event Created', {
      description: `${newEvent.name} has been created successfully.`
    })
  }

  /**
   * Establish comprehensive campaign creation workflow to streamline
   * member communications across NABIP's hierarchical structure.
   *
   * Validates required fields, generates unique IDs, initializes metrics,
   * and persists to useKV state with proper error handling.
   */
  const handleCreateCampaign = (campaignData: Partial<EmailCampaign>) => {
    try {
      // Validation: Ensure required fields are present
      if (!campaignData.name || !campaignData.subject || !campaignData.templateId) {
        toast.error('Campaign Creation Failed', {
          description: 'Please complete all required fields: name, subject, and template.',
        })
        return
      }

      // Generate unique campaign ID and timestamp
      const now = new Date().toISOString()
      const campaignId = `camp-${uuidv4()}`

      // Initialize comprehensive campaign metrics for tracking
      const defaultMetrics = {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        spamReports: 0,
        unsubscribed: 0,
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        clickToOpenRate: 0,
        bounceRate: 0,
        unsubscribeRate: 0,
        uniqueOpens: 0,
        uniqueClicks: 0,
        totalOpens: 0,
        totalClicks: 0,
      }

      // Construct complete campaign object with all required fields
      const newCampaign: EmailCampaign = {
        id: campaignId,
        name: campaignData.name,
        templateId: campaignData.templateId,
        subject: campaignData.subject,
        previewText: campaignData.previewText || '',
        fromName: campaignData.fromName || 'NABIP',
        fromEmail: campaignData.fromEmail || 'noreply@nabip.org',
        replyTo: campaignData.replyTo || 'support@nabip.org',

        // Segmentation configuration
        segmentRules: campaignData.segmentRules || [],
        estimatedRecipients: campaignData.estimatedRecipients || 0,
        actualRecipients: undefined,

        // Scheduling details
        scheduleType: campaignData.scheduleType || 'immediate',
        scheduledAt: campaignData.scheduledAt,
        timezone: campaignData.timezone,
        recurringConfig: undefined,

        // A/B Testing configuration
        abTestEnabled: campaignData.abTestEnabled || false,
        abTestConfig: campaignData.abTestConfig,
        winningVariant: undefined,

        // Campaign status and timing
        status: campaignData.status || 'draft',
        sentAt: campaignData.status === 'sending' ? now : undefined,
        completedAt: undefined,

        // Performance tracking
        metrics: defaultMetrics,

        // Metadata for audit trail
        createdAt: now,
        updatedAt: now,
        createdBy: 'current-user', // TODO: Replace with actual user ID from auth
        tags: campaignData.tags || [],
        notes: campaignData.notes,
      }

      // Persist campaign to state
      setEmailCampaigns([...(emailCampaigns || []), newCampaign])

      // Success feedback with campaign details
      toast.success('Campaign Created Successfully', {
        description: `${newCampaign.name} ${
          newCampaign.status === 'scheduled'
            ? `scheduled for ${new Date(newCampaign.scheduledAt!).toLocaleDateString()}`
            : newCampaign.status === 'sending'
            ? 'is now sending'
            : 'saved as draft'
        }`,
      })

      // Log creation event for debugging and analytics
      console.log('[Campaign Created]', {
        id: campaignId,
        name: newCampaign.name,
        status: newCampaign.status,
        recipients: newCampaign.estimatedRecipients,
        template: newCampaign.templateId,
        timestamp: now,
      })
    } catch (error) {
      // Comprehensive error handling with user-friendly messaging
      console.error('[Campaign Creation Error]', error)
      toast.error('Campaign Creation Failed', {
        description: 'An unexpected error occurred. Please try again or contact support.',
      })
    }
  }

  // Navigation items based on user role
  const navItems = user?.role === 'chapter_admin'
    ? [
        { id: 'chapter-admin', label: 'My Chapter', icon: Buildings, roles: ['chapter_admin'] as RoleName[] },
        { id: 'members', label: 'Members', icon: UserCircle, roles: ['chapter_admin'] as RoleName[] },
        { id: 'events', label: 'Events', icon: CalendarDots, roles: ['chapter_admin'] as RoleName[] },
        { id: 'communications', label: 'Communications', icon: EnvelopeSimple, roles: ['chapter_admin'] as RoleName[] },
        { id: 'reports', label: 'Reports', icon: FileText, roles: ['chapter_admin'] as RoleName[] },
        { id: 'portal', label: 'My Portal', icon: House, roles: ['chapter_admin', 'member'] as RoleName[] }
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: ChartBar, roles: ['national_admin', 'state_admin'] as RoleName[] },
        { id: 'members', label: 'Members', icon: UserCircle, roles: ['national_admin', 'state_admin'] as RoleName[] },
        { id: 'events', label: 'Events', icon: CalendarDots, roles: ['national_admin', 'state_admin'] as RoleName[] },
        { id: 'communications', label: 'Communications', icon: EnvelopeSimple, roles: ['national_admin', 'state_admin'] as RoleName[] },
        { id: 'finance', label: 'Finance', icon: CurrencyDollar, roles: ['national_admin', 'state_admin'] as RoleName[] },
        { id: 'chapters', label: 'Chapters', icon: Buildings, roles: ['national_admin', 'state_admin'] as RoleName[] },
        { id: 'learning', label: 'Learning', icon: GraduationCap, roles: ['national_admin', 'state_admin'] as RoleName[] },
        { id: 'reports', label: 'Reports', icon: FileText, roles: ['national_admin', 'state_admin'] as RoleName[] },
        { id: 'portal', label: 'My Portal', icon: House, roles: ['national_admin', 'state_admin', 'member'] as RoleName[] }
      ]

  const upcomingEvents = (events || [])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Buildings size={24} weight="duotone" className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">NABIP AMS</h1>
              <p className="text-xs text-muted-foreground">Association Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* <RoleSwitcher /> */}
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex items-center gap-2"
              onClick={() => {
                const event = new KeyboardEvent('keydown', {
                  key: 'k',
                  metaKey: true,
                  bubbles: true
                })
                document.dispatchEvent(event)
              }}
            >
              <Command size={14} weight="bold" />
              <span className="text-muted-foreground">⌘K</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-73px)]">
        <aside className="hidden lg:block w-64 border-r h-[calc(100vh-73px)] sticky top-[73px] overflow-y-auto">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as View)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              stats={stats}
              upcomingEvents={upcomingEvents}
              recentTransactions={(transactions || []).slice(0, 8)}
              loading={isLoading}
            />
          )}
          {currentView === 'members' && (
            <MembersView
              members={members || []}
              onAddMember={handleAddMember}
              loading={isLoading}
            />
          )}
          {currentView === 'events' && (
            <EventsView
              events={events || []}
              members={members || []}
              onAddEvent={handleAddEvent}
              loading={isLoading}
            />
          )}
          {currentView === 'communications' && (
            <EmailCampaignsView
              campaigns={emailCampaigns || []}
              templates={templates || []}
              members={members || []}
              onCreateCampaign={handleCreateCampaign}
              loading={isLoading}
            />
          )}
          {currentView === 'finance' && (
            <FinanceView transactions={transactions || []} loading={isLoading} />
          )}
          {currentView === 'chapters' && (
            <ChaptersView chapters={chapters || []} members={members || []} events={events || []} loading={isLoading} />
          )}
          {currentView === 'chapter-admin' && (
            <ChapterAdminView
              chapters={chapters || []}
              members={members || []}
              events={events || []}
              transactions={transactions || []}
              onAddMember={handleAddMember}
              onAddEvent={handleAddEvent}
              loading={isLoading}
            />
          )}
          {currentView === 'learning' && (
            <LearningView
              courses={courses || []}
              enrollments={enrollments || []}
              loading={isLoading}
              onAddCourse={(courseData) => {
                const newCourse: Course = {
                  id: `course_${Date.now()}`,
                  ...courseData,
                }
                setCourses([...(courses || []), newCourse])
              }}
            />
          )}
          {currentView === 'reports' && (
            <ReportsView
              reports={reports || []}
              onUpdateReports={setReports}
              loading={isLoading}
              members={members || []}
              events={events || []}
              transactions={transactions || []}
              chapters={chapters || []}
            />
          )}
          {currentView === 'portal' && (
            <MemberPortal memberId="current-member-id" />
          )}
        </main>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 safe-area-bottom">
        <nav className="flex items-center justify-around p-2">
          {navItems.slice(0, 6).map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as View)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <CommandPalette onNavigate={handleNavigate} />
      <AddMemberDialog
        open={showAddMemberDialog}
        onOpenChange={setShowAddMemberDialog}
        onAddMember={handleMemberAdded}
        chapters={chapters || []}
      />
      <EventCreationDialog
        open={showEventCreationDialog}
        onOpenChange={setShowEventCreationDialog}
        onCreateEvent={handleCreateEvent}
        chapters={(chapters || []).map(c => ({ id: c.id, name: c.name }))}
      />
      <Toaster />
    </div>
  )
}

export default App