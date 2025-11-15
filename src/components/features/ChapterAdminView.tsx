import { useMemo } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Buildings,
  Users,
  CalendarDots,
  CurrencyDollar,
  FileText,
  EnvelopeSimple,
  TrendUp,
  ChartBar,
  Plus,
} from '@phosphor-icons/react'
import type { Chapter, Member, Event, Transaction } from '@/lib/types'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ChapterAdminViewProps {
  chapters: Chapter[]
  members: Member[]
  events: Event[]
  transactions: Transaction[]
  onAddMember?: () => void
  onAddEvent?: () => void
  loading?: boolean
}

export function ChapterAdminView({
  chapters,
  members,
  events,
  transactions,
  onAddMember,
  onAddEvent,
  loading,
}: ChapterAdminViewProps) {
  const { user } = useAuth()

  // Get the chapter admin's chapter
  const myChapter = useMemo(() => {
    if (!user?.chapterId) return null
    return chapters.find((c) => c.id === user.chapterId) || null
  }, [chapters, user])

  // Filter data to only show this chapter's data
  const chapterMembers = useMemo(() => {
    if (!user?.chapterId) return []
    return members.filter((m) => m.chapterId === user.chapterId)
  }, [members, user])

  const chapterEvents = useMemo(() => {
    if (!user?.chapterId) return []
    return events.filter((e) => e.chapterId === user.chapterId)
  }, [events, user])

  const chapterTransactions = useMemo(() => {
    if (!user?.chapterId) return []
    const memberIds = new Set(chapterMembers.map((m) => m.id))
    return transactions.filter((t) => memberIds.has(t.memberId))
  }, [transactions, chapterMembers])

  // Calculate chapter-specific stats
  const stats = useMemo(() => {
    const activeMembers = chapterMembers.filter((m) => m.status === 'active').length
    const upcomingEvents = chapterEvents.filter(
      (e) => e.status === 'published' && new Date(e.startDate) > new Date()
    ).length
    const totalRevenue = chapterTransactions
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)
    const avgEngagement =
      chapterMembers.length > 0
        ? chapterMembers.reduce((sum, m) => sum + m.engagementScore, 0) / chapterMembers.length
        : 0

    return {
      totalMembers: chapterMembers.length,
      activeMembers,
      upcomingEvents,
      totalRevenue,
      avgEngagement: Math.round(avgEngagement),
    }
  }, [chapterMembers, chapterEvents, chapterTransactions])

  const handleContactMember = (member: Member) => {
    toast.success('Email Opened', {
      description: `Composing email to ${member.firstName} ${member.lastName}`,
    })
  }

  const handleViewEvent = (event: Event) => {
    toast.info('Event Details', {
      description: `Loading details for ${event.name}`,
    })
  }

  if (!user?.chapterId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 max-w-md text-center">
          <Buildings size={48} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Chapter Assigned</h2>
          <p className="text-muted-foreground">
            You don't have a chapter assigned to your account. Please contact your administrator.
          </p>
        </Card>
      </div>
    )
  }

  if (!myChapter) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 max-w-md text-center">
          <Buildings size={48} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Chapter Not Found</h2>
          <p className="text-muted-foreground">
            The chapter assigned to your account could not be found. Please contact your administrator.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Buildings size={32} weight="duotone" className="text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">{myChapter.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="capitalize">
              {myChapter.type} Chapter
            </Badge>
            {myChapter.city && myChapter.state && (
              <span className="text-muted-foreground">
                {myChapter.city}, {myChapter.state}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Members</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-semibold tabular-nums">
                  {loading ? '...' : stats.totalMembers}
                </p>
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <TrendUp size={12} weight="bold" />
                  {stats.activeMembers} active
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center">
              <CalendarDots size={24} weight="duotone" className="text-teal" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Events</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-semibold tabular-nums">
                  {loading ? '...' : chapterEvents.length}
                </p>
                <span className="text-xs text-muted-foreground">
                  {stats.upcomingEvents} upcoming
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <CurrencyDollar size={24} weight="duotone" className="text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Revenue</p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : `$${stats.totalRevenue.toLocaleString()}`}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <ChartBar size={24} weight="duotone" className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Engagement</p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : `${stats.avgEngagement}%`}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Members Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={20} weight="duotone" className="text-primary" />
            <h2 className="text-lg font-semibold">Chapter Members</h2>
          </div>
          <Button size="sm" onClick={onAddMember}>
            <Plus size={16} className="mr-2" />
            Add Member
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-shimmer rounded" />
            ))}
          </div>
        ) : chapterMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No members in this chapter yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapterMembers.slice(0, 10).map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={member.status === 'active' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(member.joinedDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${member.engagementScore}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {member.engagementScore}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleContactMember(member)}
                      >
                        <EnvelopeSimple size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {chapterMembers.length > 10 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All {chapterMembers.length} Members
            </Button>
          </div>
        )}
      </Card>

      {/* Events Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDots size={20} weight="duotone" className="text-teal" />
            <h2 className="text-lg font-semibold">Chapter Events</h2>
          </div>
          <Button size="sm" onClick={onAddEvent}>
            <Plus size={16} className="mr-2" />
            Create Event
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-shimmer rounded" />
            ))}
          </div>
        ) : chapterEvents.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDots size={48} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No events scheduled for this chapter yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chapterEvents.slice(0, 4).map((event) => (
              <Card
                key={event.id}
                className="p-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleViewEvent(event)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold leading-tight">{event.name}</h3>
                    <Badge
                      variant={event.status === 'published' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {event.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{format(new Date(event.startDate), 'MMM d, yyyy')}</span>
                    <span>•</span>
                    <span>
                      {event.registeredCount}/{event.capacity} registered
                    </span>
                  </div>
                  {event.location && (
                    <p className="text-sm text-muted-foreground truncate">{event.location}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
        {chapterEvents.length > 4 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All {chapterEvents.length} Events
            </Button>
          </div>
        )}
      </Card>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CurrencyDollar size={20} weight="duotone" className="text-accent-foreground" />
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-shimmer rounded" />
              ))}
            </div>
          ) : chapterTransactions.length === 0 ? (
            <div className="text-center py-8">
              <CurrencyDollar size={48} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chapterTransactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-sm">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(transaction.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${transaction.amount.toFixed(2)}</p>
                    <Badge
                      variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs capitalize"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={20} weight="duotone" className="text-orange-600" />
            <h2 className="text-lg font-semibold">Chapter Reports</h2>
          </div>

          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <FileText size={16} className="mr-2" />
              Member Growth Report
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <ChartBar size={16} className="mr-2" />
              Engagement Analytics
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <CurrencyDollar size={16} className="mr-2" />
              Financial Summary
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <CalendarDots size={16} className="mr-2" />
              Event Performance
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default ChapterAdminView
