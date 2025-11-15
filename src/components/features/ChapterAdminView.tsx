import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Buildings,
  Users,
  CalendarDots,
  CurrencyDollar,
  FileText,
  MapPin,
  Envelope,
  Phone,
  TrendUp,
  Warning
} from '@phosphor-icons/react'
import type { Chapter, Member, Event, Transaction, Report } from '@/lib/types'
import { toast } from 'sonner'

interface ChapterAdminViewProps {
  chapter: Chapter
  allMembers: Member[]
  allEvents: Event[]
  allTransactions: Transaction[]
  allReports?: Report[]
  loading?: boolean
}

export function ChapterAdminView({
  chapter,
  allMembers,
  allEvents,
  allTransactions,
  allReports = [],
  loading
}: ChapterAdminViewProps) {
  const [activeTab, setActiveTab] = useState('overview')

  // Filter data to only show chapter-specific items
  const chapterMembers = useMemo(() => {
    return allMembers.filter(m => m.chapterId === chapter.id)
  }, [allMembers, chapter.id])

  const chapterEvents = useMemo(() => {
    return allEvents.filter(e => e.chapterId === chapter.id)
  }, [allEvents, chapter.id])

  const chapterTransactions = useMemo(() => {
    const memberIds = chapterMembers.map(m => m.id)
    return allTransactions.filter(t => memberIds.includes(t.memberId))
  }, [allTransactions, chapterMembers])

  const chapterReports = useMemo(() => {
    return allReports.filter(r => r.category !== 'custom' || r.createdBy === 'chapter_admin')
  }, [allReports])

  // Calculate chapter-specific statistics
  const stats = useMemo(() => {
    const activeMembers = chapterMembers.filter(m => m.status === 'active').length
    const pendingMembers = chapterMembers.filter(m => m.status === 'pending').length
    const upcomingEvents = chapterEvents.filter(e =>
      e.status === 'published' && new Date(e.startDate) > new Date()
    ).length
    const completedEvents = chapterEvents.filter(e => e.status === 'completed').length

    const totalRevenue = chapterTransactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)

    const monthlyRevenue = chapterTransactions
      .filter(t => {
        const transactionDate = new Date(t.date)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return t.status === 'completed' && transactionDate >= thirtyDaysAgo
      })
      .reduce((sum, t) => sum + t.amount, 0)

    const avgEngagement = chapterMembers.length > 0
      ? chapterMembers.reduce((sum, m) => sum + m.engagementScore, 0) / chapterMembers.length
      : 0

    // Expiring memberships in next 30 days
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiringMembers = chapterMembers.filter(m => {
      const expiry = new Date(m.expiryDate)
      return m.status === 'active' && expiry > now && expiry <= thirtyDaysFromNow
    }).length

    return {
      totalMembers: chapterMembers.length,
      activeMembers,
      pendingMembers,
      upcomingEvents,
      completedEvents,
      totalRevenue,
      monthlyRevenue,
      avgEngagement,
      expiringMembers
    }
  }, [chapterMembers, chapterEvents, chapterTransactions])

  const handleAddMember = () => {
    toast.success('Add Member', {
      description: `Adding new member to ${chapter.name}`
    })
  }

  const handleAddEvent = () => {
    toast.success('Create Event', {
      description: `Creating new event for ${chapter.name}`
    })
  }

  const handleExportData = () => {
    toast.success('Export Data', {
      description: 'Preparing chapter data export...'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-shimmer rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-4">
                <div className="h-6 bg-muted animate-shimmer rounded w-3/4" />
                <div className="h-8 bg-muted animate-shimmer rounded w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Buildings size={28} weight="duotone" className="text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{chapter.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="secondary" className="capitalize">
                  {chapter.type} Chapter
                </Badge>
                {chapter.region && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin size={14} />
                    <span>{chapter.region}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {chapter.description && (
            <p className="text-muted-foreground mt-3 max-w-2xl">{chapter.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <FileText size={16} className="mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Contact Information */}
      {(chapter.contactEmail || chapter.phone) && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            {chapter.contactEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Envelope size={16} className="text-muted-foreground" />
                <a href={`mailto:${chapter.contactEmail}`} className="text-primary hover:underline">
                  {chapter.contactEmail}
                </a>
              </div>
            )}
            {chapter.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-muted-foreground" />
                <span>{chapter.phone}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Total Members</p>
              <p className="text-3xl font-semibold tabular-nums">{stats.totalMembers}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeMembers} active, {stats.pendingMembers} pending
              </p>
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
              <p className="text-3xl font-semibold tabular-nums">{stats.upcomingEvents}</p>
              <p className="text-xs text-muted-foreground mt-1">
                upcoming, {stats.completedEvents} completed
              </p>
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
              <p className="text-3xl font-semibold tabular-nums">${stats.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                ${stats.monthlyRevenue.toLocaleString()} this month
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center">
              <TrendUp size={24} weight="duotone" className="text-teal" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Engagement</p>
              <p className="text-3xl font-semibold tabular-nums">{Math.round(stats.avgEngagement)}%</p>
              <p className="text-xs text-muted-foreground mt-1">average member score</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alert for expiring memberships */}
      {stats.expiringMembers > 0 && (
        <Card className="p-4 border-amber-500/50 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <Warning size={24} weight="fill" className="text-amber-500" />
            <div>
              <p className="font-medium">Action Required</p>
              <p className="text-sm text-muted-foreground">
                {stats.expiringMembers} member{stats.expiringMembers !== 1 ? 's' : ''} expiring in the next 30 days
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members ({chapterMembers.length})</TabsTrigger>
          <TabsTrigger value="events">Events ({chapterEvents.length})</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
          <TabsTrigger value="reports">Reports ({chapterReports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Members */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Recent Members</h3>
                <Button size="sm" onClick={handleAddMember}>
                  <Users size={16} className="mr-2" />
                  Add Member
                </Button>
              </div>
              <div className="space-y-3">
                {chapterMembers.slice(0, 5).map(member => (
                  <div key={member.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{member.firstName} {member.lastName}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                      {member.status}
                    </Badge>
                  </div>
                ))}
                {chapterMembers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No members yet</p>
                )}
              </div>
            </Card>

            {/* Upcoming Events */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Upcoming Events</h3>
                <Button size="sm" onClick={handleAddEvent}>
                  <CalendarDots size={16} className="mr-2" />
                  Create Event
                </Button>
              </div>
              <div className="space-y-3">
                {chapterEvents
                  .filter(e => e.status === 'published' && new Date(e.startDate) > new Date())
                  .slice(0, 5)
                  .map(event => (
                    <div key={event.id} className="py-2 border-b last:border-0">
                      <p className="font-medium">{event.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.startDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {event.registeredCount}/{event.capacity} registered
                        </p>
                      </div>
                    </div>
                  ))}
                {chapterEvents.filter(e => e.status === 'published' && new Date(e.startDate) > new Date()).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No upcoming events</p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Chapter Members</h3>
                <Button onClick={handleAddMember}>
                  <Users size={16} className="mr-2" />
                  Add Member
                </Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Engagement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapterMembers.map(member => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell className="capitalize">{member.memberType.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(member.joinedDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${member.engagementScore}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{member.engagementScore}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {chapterMembers.length === 0 && (
              <div className="p-12 text-center">
                <Users size={48} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No members in this chapter yet</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Chapter Events</h3>
                <Button onClick={handleAddEvent}>
                  <CalendarDots size={16} className="mr-2" />
                  Create Event
                </Button>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Registrations</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapterEvents.map(event => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{new Date(event.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{event.virtual ? 'Virtual' : event.location}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {event.registeredCount}/{event.capacity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
                        {event.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {chapterEvents.length === 0 && (
              <div className="p-12 text-center">
                <CalendarDots size={48} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No events created yet</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="finances" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
              <p className="text-3xl font-semibold tabular-nums">${stats.totalRevenue.toLocaleString()}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">This Month</p>
              <p className="text-3xl font-semibold tabular-nums">${stats.monthlyRevenue.toLocaleString()}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Transactions</p>
              <p className="text-3xl font-semibold tabular-nums">{chapterTransactions.length}</p>
            </Card>
          </div>

          <Card>
            <div className="p-6 border-b">
              <h3 className="font-semibold">Recent Transactions</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapterTransactions.slice(0, 10).map(transaction => {
                  const member = chapterMembers.find(m => m.id === transaction.memberId)
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {member ? `${member.firstName} ${member.lastName}` : 'Unknown'}
                      </TableCell>
                      <TableCell className="capitalize">
                        {transaction.type.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="font-medium">${transaction.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {chapterTransactions.length === 0 && (
              <div className="p-12 text-center">
                <CurrencyDollar size={48} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <div className="p-6 border-b">
              <h3 className="font-semibold">Chapter Reports</h3>
              <p className="text-sm text-muted-foreground mt-1">
                View and generate reports for your chapter
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chapterReports.map(report => (
                  <Card key={report.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{report.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="capitalize">{report.category}</Badge>
                          {report.lastRunDate && (
                            <span className="text-xs text-muted-foreground">
                              Last run: {new Date(report.lastRunDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <FileText size={24} className="text-muted-foreground" />
                    </div>
                  </Card>
                ))}
              </div>
              {chapterReports.length === 0 && (
                <div className="p-12 text-center">
                  <FileText size={48} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No reports available</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
