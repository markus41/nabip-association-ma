import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { CommandPalette } from '@/components/features/CommandPalette'
import { DashboardView } from '@/components/features/DashboardView'
import { MembersView } from '@/components/features/MembersView'
import { EventsView } from '@/components/features/EventsView'
import { CommunicationsView } from '@/components/features/CommunicationsView'
import { FinanceView } from '@/components/features/FinanceView'
import { ChaptersView } from '@/components/features/ChaptersView'
import { LearningView } from '@/components/features/LearningView'
import { MemberPortal } from '@/components/features/MemberPortal'
import { ReportsView } from '@/components/features/ReportsView'
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
import type { Member, Chapter, Event, Transaction, Campaign, DashboardStats, Course, Enrollment, Report } from '@/lib/types'
import { toast } from 'sonner'

type View = 'dashboard' | 'members' | 'events' | 'communications' | 'finance' | 'chapters' | 'learning' | 'reports' | 'portal'

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [isLoading, setIsLoading] = useState(true)
  
  const [members, setMembers] = useKV<Member[]>('ams-members', [])
  const [chapters, setChapters] = useKV<Chapter[]>('ams-chapters', [])
  const [events, setEvents] = useKV<Event[]>('ams-events', [])
  const [transactions, setTransactions] = useKV<Transaction[]>('ams-transactions', [])
  const [campaigns, setCampaigns] = useKV<Campaign[]>('ams-campaigns', [])
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
      
      if (!campaigns || campaigns.length === 0) {
        const newCampaigns = generateCampaigns(15)
        setCampaigns(newCampaigns)
      }
      
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
    toast.success('Add Member', {
      description: 'Member creation dialog would open here.'
    })
  }

  const handleAddEvent = () => {
    toast.success('Create Event', {
      description: 'Event creation wizard would open here.'
    })
  }

  const handleNewCampaign = () => {
    toast.success('New Campaign', {
      description: 'Campaign builder would open here.'
    })
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ChartBar },
    { id: 'members', label: 'Members', icon: UserCircle },
    { id: 'events', label: 'Events', icon: CalendarDots },
    { id: 'communications', label: 'Communications', icon: EnvelopeSimple },
    { id: 'finance', label: 'Finance', icon: CurrencyDollar },
    { id: 'chapters', label: 'Chapters', icon: Buildings },
    { id: 'learning', label: 'Learning', icon: GraduationCap },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'portal', label: 'My Portal', icon: House }
  ]

  const upcomingEvents = (events || [])
    .filter(e => e.status === 'published' && new Date(e.startDate) > new Date())
    .slice(0, 5)

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
              onAddEvent={handleAddEvent}
              loading={isLoading}
            />
          )}
          {currentView === 'communications' && (
            <CommunicationsView
              campaigns={campaigns || []}
              onNewCampaign={handleNewCampaign}
              loading={isLoading}
            />
          )}
          {currentView === 'finance' && (
            <FinanceView transactions={transactions || []} loading={isLoading} />
          )}
          {currentView === 'chapters' && (
            <ChaptersView chapters={chapters || []} loading={isLoading} />
          )}
          {currentView === 'learning' && (
            <LearningView
              courses={courses || []}
              enrollments={enrollments || []}
              loading={isLoading}
            />
          )}
          {currentView === 'reports' && (
            <ReportsView reports={reports || []} loading={isLoading} />
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
      <Toaster />
    </div>
  )
}

export default App