import { useState, useMemo, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Buildings,
  Users,
  CalendarDots,
  CurrencyDollar,
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  Clock,
  TrendUp,
  ChartBar,
  MapPin,
  Funnel,
} from '@phosphor-icons/react'
import type { Chapter, Member, Event, Transaction } from '@/lib/types'
import { toast } from 'sonner'

interface StateAdminViewProps {
  chapters: Chapter[]
  members: Member[]
  events: Event[]
  transactions: Transaction[]
  userState: string // The state this admin manages (e.g., "California", "Texas")
  loading?: boolean
}

interface PendingApproval {
  id: string
  type: 'chapter' | 'event' | 'member'
  chapterId: string
  chapterName: string
  title: string
  requestedBy: string
  requestedDate: string
  description: string
}

export function StateAdminView({
  chapters,
  members,
  events,
  transactions,
  userState,
  loading,
}: StateAdminViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChapterType, setSelectedChapterType] = useState<string>('all')
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null)
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [announcement, setAnnouncement] = useState('')
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)

  // Filter chapters by the admin's state
  const stateChapters = useMemo(() => {
    return chapters.filter(
      (c) => c.type === 'state' && c.state === userState ||
             (c.type === 'local' && c.state === userState)
    )
  }, [chapters, userState])

  // Filter members in this state
  const stateMembers = useMemo(() => {
    const stateChapterIds = stateChapters.map((c) => c.id)
    return members.filter((m) => stateChapterIds.includes(m.chapterId))
  }, [members, stateChapters])

  // Filter events in this state
  const stateEvents = useMemo(() => {
    const stateChapterIds = stateChapters.map((c) => c.id)
    return events.filter((e) => stateChapterIds.includes(e.chapterId))
  }, [events, stateChapters])

  // Filter transactions for this state
  const stateTransactions = useMemo(() => {
    const stateMemberIds = stateMembers.map((m) => m.id)
    return transactions.filter((t) => stateMemberIds.includes(t.memberId))
  }, [transactions, stateMembers])

  // Mock pending approvals (in a real app, this would come from the backend)
  const pendingApprovals = useMemo<PendingApproval[]>(() => {
    return [
      {
        id: '1',
        type: 'chapter',
        chapterId: stateChapters[0]?.id || '',
        chapterName: stateChapters[0]?.name || '',
        title: 'New Local Chapter Request',
        requestedBy: 'John Smith',
        requestedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Request to establish a new local chapter in Springfield',
      },
      {
        id: '2',
        type: 'event',
        chapterId: stateChapters[1]?.id || '',
        chapterName: stateChapters[1]?.name || '',
        title: 'State Conference Approval',
        requestedBy: 'Jane Doe',
        requestedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Annual state conference with 500+ expected attendees',
      },
    ].filter((a) => a.chapterId)
  }, [stateChapters])

  // Calculate state-wide statistics
  const stats = useMemo(() => {
    const totalRevenue = stateTransactions
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)

    const activeMembers = stateMembers.filter((m) => m.status === 'active').length
    const upcomingEvents = stateEvents.filter(
      (e) => e.status === 'published' && new Date(e.startDate) > new Date()
    ).length

    const stateChapter = stateChapters.find((c) => c.type === 'state')
    const localChapters = stateChapters.filter((c) => c.type === 'local')

    return {
      totalChapters: stateChapters.length,
      localChapters: localChapters.length,
      totalMembers: stateMembers.length,
      activeMembers,
      upcomingEvents,
      totalRevenue,
      avgMembersPerChapter: localChapters.length > 0
        ? Math.round(stateMembers.length / localChapters.length)
        : 0,
      stateChapterName: stateChapter?.name || userState,
    }
  }, [stateChapters, stateMembers, stateEvents, stateTransactions, userState])

  // Filter and sort chapters
  const filteredChapters = useMemo(() => {
    let filtered = stateChapters.filter((chapter) => {
      const matchesSearch =
        chapter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chapter.city?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType =
        selectedChapterType === 'all' || chapter.type === selectedChapterType

      return matchesSearch && matchesType
    })

    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any = a[sortColumn as keyof Chapter]
        let bValue: any = b[sortColumn as keyof Chapter]

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue?.toLowerCase() || ''
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [stateChapters, searchQuery, selectedChapterType, sortColumn, sortDirection])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleApprove = (approval: PendingApproval) => {
    toast.success('Approved', {
      description: `${approval.title} has been approved`,
    })
    setSelectedApproval(null)
    setAnnouncement(`${approval.title} has been approved`)
  }

  const handleReject = (approval: PendingApproval) => {
    toast.error('Rejected', {
      description: `${approval.title} has been rejected`,
    })
    setSelectedApproval(null)
    setAnnouncement(`${approval.title} has been rejected`)
  }

  const handleViewChapter = (chapterId: string) => {
    toast.info('Chapter Details', {
      description: 'Opening chapter detail view',
    })
  }

  // Focus management: focus search input on mount
  useEffect(() => {
    if (!loading) {
      searchInputRef.current?.focus()
    }
  }, [loading])

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading state admin view">
        <div className="flex items-center gap-2">
          <Clock size={20} className="animate-spin" />
          <span>Loading state administration data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Skip link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          State Administration
        </h1>
        <p className="text-muted-foreground mt-1">
          Managing {stats.stateChapterName} and {stats.localChapters} local chapters
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" role="list">
        <Card className="p-6" role="listitem">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center"
              aria-hidden="true"
            >
              <Buildings size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Total Chapters
              </p>
              <p className="text-3xl font-semibold tabular-nums">
                {stats.totalChapters}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6" role="listitem">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center"
              aria-hidden="true"
            >
              <Users size={24} weight="duotone" className="text-teal" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Active Members
              </p>
              <p className="text-3xl font-semibold tabular-nums">
                {stats.activeMembers}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6" role="listitem">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center"
              aria-hidden="true"
            >
              <CalendarDots size={24} weight="duotone" className="text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Upcoming Events
              </p>
              <p className="text-3xl font-semibold tabular-nums">
                {stats.upcomingEvents}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6" role="listitem">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center"
              aria-hidden="true"
            >
              <CurrencyDollar size={24} weight="duotone" className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Total Revenue
              </p>
              <p className="text-3xl font-semibold tabular-nums">
                ${stats.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Approvals Section */}
      {pendingApprovals.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} weight="duotone" className="text-orange-600" />
            <h2 className="text-xl font-semibold">Pending Approvals</h2>
            <Badge variant="secondary" className="ml-2">
              {pendingApprovals.length}
            </Badge>
          </div>

          <div className="space-y-3" role="list" aria-label="Pending approval requests">
            {pendingApprovals.map((approval) => (
              <div
                key={approval.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                role="listitem"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{approval.title}</h3>
                    <Badge variant="outline" className="capitalize">
                      {approval.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {approval.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      <MapPin size={12} className="inline mr-1" aria-hidden="true" />
                      {approval.chapterName}
                    </span>
                    <span>Requested by {approval.requestedBy}</span>
                    <span>
                      {new Date(approval.requestedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedApproval(approval)}
                    aria-label={`Review ${approval.title}`}
                  >
                    Review
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(approval)}
                    className="bg-green-600 hover:bg-green-700"
                    aria-label={`Approve ${approval.title}`}
                  >
                    <CheckCircle size={16} className="mr-1" aria-hidden="true" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(approval)}
                    aria-label={`Reject ${approval.title}`}
                  >
                    <XCircle size={16} className="mr-1" aria-hidden="true" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Chapters Table */}
      <Card className="p-6">
        <div id="main-content" tabIndex={-1}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Buildings size={20} weight="duotone" className="text-primary" />
              <h2 className="text-xl font-semibold">Chapters in {userState}</h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <MagnifyingGlass
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search chapters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                  aria-label="Search chapters by name or city"
                />
              </div>

              <Select
                value={selectedChapterType}
                onValueChange={setSelectedChapterType}
              >
                <SelectTrigger className="w-40" aria-label="Filter by chapter type">
                  <Funnel size={16} className="mr-2" aria-hidden="true" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="state">State</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredChapters.length === 0 ? (
            <div className="text-center py-12" role="status">
              <Buildings size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-1">No chapters found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'No chapters available in this state'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table ref={tableRef}>
                <caption className="sr-only">
                  List of {filteredChapters.length} chapters in {userState}
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
                        aria-sort={
                          sortColumn === 'name'
                            ? sortDirection === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                        }
                      >
                        Chapter Name
                        {sortColumn === 'name' && (
                          <span aria-hidden="true">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead scope="col">Type</TableHead>
                    <TableHead scope="col">
                      <button
                        onClick={() => handleSort('city')}
                        className="flex items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
                        aria-sort={
                          sortColumn === 'city'
                            ? sortDirection === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                        }
                      >
                        Location
                        {sortColumn === 'city' && (
                          <span aria-hidden="true">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead scope="col" className="text-right">
                      <button
                        onClick={() => handleSort('memberCount')}
                        className="flex items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded ml-auto"
                        aria-sort={
                          sortColumn === 'memberCount'
                            ? sortDirection === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                        }
                      >
                        Members
                        {sortColumn === 'memberCount' && (
                          <span aria-hidden="true">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead scope="col" className="text-right">
                      <button
                        onClick={() => handleSort('activeEventsCount')}
                        className="flex items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded ml-auto"
                        aria-sort={
                          sortColumn === 'activeEventsCount'
                            ? sortDirection === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                        }
                      >
                        Events
                        {sortColumn === 'activeEventsCount' && (
                          <span aria-hidden="true">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead scope="col">President</TableHead>
                    <TableHead scope="col" className="text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChapters.map((chapter) => (
                    <TableRow key={chapter.id}>
                      <TableCell className="font-medium">
                        {chapter.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {chapter.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {chapter.city && (
                          <div className="flex items-center gap-1">
                            <MapPin size={14} aria-hidden="true" />
                            <span>{chapter.city}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {chapter.memberCount}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {chapter.activeEventsCount}
                      </TableCell>
                      <TableCell>{chapter.president || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewChapter(chapter.id)}
                          aria-label={`View details for ${chapter.name}`}
                        >
                          <ChartBar size={16} className="mr-1" aria-hidden="true" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>

      {/* Cross-Chapter Analytics */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendUp size={20} weight="duotone" className="text-primary" />
          <h2 className="text-xl font-semibold">State-Wide Analytics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              Average Members per Chapter
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {stats.avgMembersPerChapter}
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              Member Retention Rate
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {Math.round((stats.activeMembers / stats.totalMembers) * 100)}%
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">
              Events per Chapter
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {stats.totalChapters > 0
                ? Math.round(stats.upcomingEvents / stats.totalChapters)
                : 0}
            </p>
          </div>
        </div>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <DialogContent aria-labelledby="approval-dialog-title" aria-describedby="approval-dialog-description">
          <DialogHeader>
            <DialogTitle id="approval-dialog-title">
              Review Approval Request
            </DialogTitle>
            <DialogDescription id="approval-dialog-description">
              Review the details below and approve or reject this request.
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Request Type</label>
                <Badge variant="outline" className="capitalize mt-1">
                  {selectedApproval.type}
                </Badge>
              </div>

              <div>
                <label className="text-sm font-medium">Title</label>
                <p className="text-sm mt-1">{selectedApproval.title}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Chapter</label>
                <p className="text-sm mt-1">{selectedApproval.chapterName}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm mt-1">{selectedApproval.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Requested By</label>
                <p className="text-sm mt-1">{selectedApproval.requestedBy}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Requested Date</label>
                <p className="text-sm mt-1">
                  {new Date(selectedApproval.requestedDate).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Button
                  onClick={() => handleApprove(selectedApproval)}
                  className="bg-green-600 hover:bg-green-700 flex-1"
                  aria-label={`Approve ${selectedApproval.title}`}
                >
                  <CheckCircle size={16} className="mr-2" aria-hidden="true" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleReject(selectedApproval)}
                  variant="destructive"
                  className="flex-1"
                  aria-label={`Reject ${selectedApproval.title}`}
                >
                  <XCircle size={16} className="mr-2" aria-hidden="true" />
                  Reject
                </Button>
                <DialogClose asChild>
                  <Button variant="outline" aria-label="Close dialog">
                    Cancel
                  </Button>
                </DialogClose>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
