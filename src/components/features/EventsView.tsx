import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Plus,
  MagnifyingGlass,
  MapPin,
  Ticket,
  Eye,
  EnvelopeSimple,
  Medal,
  CheckCircle,
  Video,
  Link as LinkIcon,
  Clock,
  CalendarBlank,
  WarningCircle,
  Users
} from '@phosphor-icons/react'
import type { Event, Member } from '@/lib/types'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/data-utils'
import { toast } from 'sonner'
import { QuickRegistrationWidget } from './QuickRegistrationWidget'

interface EventsViewProps {
  events: Event[]
  members?: Member[]
  onAddEvent: () => void
  loading?: boolean
}

export function EventsView({ events, members = [], onAddEvent, loading }: EventsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch =
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || event.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [events, searchQuery, statusFilter])

  const getSimilarEvents = (event: Event): Event[] => {
    return events
      .filter(e => 
        e.id !== event.id && 
        e.status === 'published' &&
        new Date(e.startDate) > new Date() &&
        e.registeredCount < e.capacity &&
        (e.virtual === event.virtual || Math.abs(new Date(e.startDate).getTime() - new Date(event.startDate).getTime()) < 7 * 24 * 60 * 60 * 1000)
      )
      .slice(0, 3)
  }

  const handleRegisterMember = (eventId: string, memberId: string, ticketTypeId: string) => {
    toast.success('Registration Confirmed', {
      description: 'Member has been successfully registered for the event.'
    })
  }

  const stats = useMemo(() => {
    const totalEvents = events.length
    const upcomingEvents = events.filter(
      e => e.status === 'published' && new Date(e.startDate) > new Date()
    ).length
    const draftEvents = events.filter(e => e.status === 'draft').length
    const totalRegistrations = events.reduce((sum, e) => sum + e.registeredCount, 0)

    return { totalEvents, upcomingEvents, draftEvents, totalRegistrations }
  }, [events])

  const handleRegister = (event: Event) => {
    toast.success('Registration Started', {
      description: 'You will receive a confirmation email shortly.'
    })
  }

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event)
  }

  const handleCopyLink = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation()
    const link = `${window.location.origin}/events/${event.id}`
    navigator.clipboard.writeText(link)
    toast.success('Link Copied', {
      description: 'Share this link with potential attendees.'
    })
  }

  const handleEmailAttendees = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation()
    toast.success('Email Composer', {
      description: 'Opening email tool to contact attendees...'
    })
  }

  const getDaysUntil = (dateString: string): number => {
    const now = new Date()
    const date = new Date(dateString)
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getSmartTags = (event: Event) => {
    const tags: Array<{ label: string; variant: 'default' | 'destructive' | 'warning' }> = []

    const earlyBirdTicket = event.ticketTypes.find(t => t.earlyBird)
    if (earlyBirdTicket?.earlyBirdEndDate) {
      const daysUntil = getDaysUntil(earlyBirdTicket.earlyBirdEndDate)
      if (daysUntil > 0 && daysUntil <= 7) {
        tags.push({ label: `Early Bird Ends in ${daysUntil} Days`, variant: 'warning' })
      }
    }

    if (event.ceCredits && event.ceCredits > 0) {
      tags.push({ label: `${event.ceCredits} CE Credits`, variant: 'default' })
    }

    const capacityPercentage = (event.registeredCount / event.capacity) * 100
    if (capacityPercentage >= 90) {
      tags.push({ label: 'Almost Full', variant: 'destructive' })
    }

    return tags
  }

  const getMemberPrice = (event: Event): number => {
    const memberTicket = event.ticketTypes.find(t => t.memberOnly)
    return memberTicket ? memberTicket.price : event.ticketTypes[0]?.price || 0
  }

  const getNonMemberPrice = (event: Event): number => {
    const nonMemberTicket = event.ticketTypes.find(t => !t.memberOnly)
    return nonMemberTicket ? nonMemberTicket.price : event.ticketTypes[0]?.price || 0
  }

  const getEventTypeColor = (event: Event): string => {
    if (event.virtual && event.location.toLowerCase().includes('virtual')) {
      return 'blue'
    }
    if (event.virtual) {
      return 'purple'
    }
    return 'green'
  }

  const renderProgressRing = (percentage: number) => {
    const radius = 20
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference
    const color = percentage >= 90 ? '#ef4444' : percentage >= 75 ? '#f59e0b' : '#10b981'

    return (
      <svg width="48" height="48" className="transform -rotate-90">
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="oklch(0.90 0.01 250)"
          strokeWidth="4"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <text
          x="24"
          y="24"
          textAnchor="middle"
          dy=".3em"
          className="text-xs font-semibold fill-foreground"
          transform="rotate(90 24 24)"
        >
          {Math.round(percentage)}%
        </text>
      </svg>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Management</h1>
          <p className="text-muted-foreground mt-1">Manage events, registrations, and attendance</p>
        </div>
        <Button onClick={onAddEvent}>
          <Plus className="mr-2" size={18} weight="bold" />
          Create Event
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Events</p>
              <p className="text-3xl font-bold tracking-tight">
                {loading ? '...' : stats.totalEvents}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarBlank size={20} weight="duotone" className="text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
              <p className="text-3xl font-bold tracking-tight">
                {loading ? '...' : stats.upcomingEvents}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
              <Ticket size={20} weight="duotone" className="text-teal" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Drafts</p>
              <p className="text-3xl font-bold tracking-tight">
                {loading ? '...' : stats.draftEvents}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Eye size={20} weight="duotone" className="text-muted-foreground" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Registrations</p>
              <p className="text-3xl font-bold tracking-tight">
                {loading ? '...' : stats.totalRegistrations}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Users size={20} weight="duotone" className="text-accent-foreground" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlass
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx} className="p-6">
              <div className="space-y-4">
                <div className="h-6 bg-muted animate-shimmer rounded" />
                <div className="h-4 bg-muted animate-shimmer rounded w-2/3" />
                <div className="h-4 bg-muted animate-shimmer rounded w-1/2" />
              </div>
            </Card>
          ))
        ) : filteredEvents.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12">
              <div className="text-center">
                <p className="text-muted-foreground">No events found</p>
              </div>
            </Card>
          </div>
        ) : (
          filteredEvents.map(event => {
            const eventDate = new Date(event.startDate)
            const capacityPercentage = (event.registeredCount / event.capacity) * 100
            const eventTypeColor = getEventTypeColor(event)
            const memberPrice = getMemberPrice(event)
            const nonMemberPrice = getNonMemberPrice(event)
            const hasMemberDiscount = memberPrice < nonMemberPrice
            const month = eventDate.toLocaleString('default', { month: 'short' })
            const day = eventDate.getDate()
            const smartTags = getSmartTags(event)
            const isFull = event.registeredCount >= event.capacity

            const bgColor =
              eventTypeColor === 'blue'
                ? 'hover:bg-blue-50'
                : eventTypeColor === 'purple'
                ? 'hover:bg-purple-50'
                : 'hover:bg-green-50'

            return (
              <Card
                key={event.id}
                className={`group relative overflow-hidden transition-all cursor-pointer ${bgColor}`}
                onClick={() => handleViewDetails(event)}
              >
                <div
                  className={`absolute top-0 left-0 w-1 h-full ${
                    eventTypeColor === 'blue'
                      ? 'bg-blue-500'
                      : eventTypeColor === 'purple'
                      ? 'bg-purple-500'
                      : 'bg-green-500'
                  }`}
                />

                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <div
                        className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center ${
                          eventTypeColor === 'blue'
                            ? 'bg-blue-100'
                            : eventTypeColor === 'purple'
                            ? 'bg-purple-100'
                            : 'bg-green-100'
                        }`}
                      >
                        <div
                          className={`text-xs font-semibold uppercase ${
                            eventTypeColor === 'blue'
                              ? 'text-blue-600'
                              : eventTypeColor === 'purple'
                              ? 'text-purple-600'
                              : 'text-green-600'
                          }`}
                        >
                          {month}
                        </div>
                        <div
                          className={`text-xl font-bold ${
                            eventTypeColor === 'blue'
                              ? 'text-blue-700'
                              : eventTypeColor === 'purple'
                              ? 'text-purple-700'
                              : 'text-green-700'
                          }`}
                        >
                          {day}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg leading-tight mb-1 line-clamp-2">
                          {event.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {event.virtual && !event.location.toLowerCase().includes('virtual') ? (
                            <>
                              <Video size={14} weight="fill" className="text-blue-600" />
                              <span>Virtual + In-Person</span>
                            </>
                          ) : event.virtual ? (
                            <>
                              <Video size={14} weight="fill" className="text-blue-600" />
                              <span>Virtual Event</span>
                            </>
                          ) : (
                            <>
                              <MapPin size={14} />
                              <span className="truncate">{event.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {renderProgressRing(capacityPercentage)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock size={14} />
                    <span>{formatDate(event.startDate)}</span>
                  </div>

                  {smartTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {smartTags.map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant={tag.variant === 'warning' ? 'default' : tag.variant}
                          className={`text-xs ${
                            tag.variant === 'warning' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : ''
                          }`}
                        >
                          {tag.variant === 'destructive' && <WarningCircle size={12} weight="fill" className="mr-1" />}
                          {tag.label}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{formatCurrency(memberPrice)}</span>
                        <span className="text-sm text-muted-foreground">member</span>
                      </div>
                      {hasMemberDiscount && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-muted-foreground line-through">
                            {formatCurrency(nonMemberPrice)}
                          </span>
                          <Badge variant="default" className="bg-green-100 text-green-700 text-xs">
                            Save {formatCurrency(nonMemberPrice - memberPrice)}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-muted-foreground mb-1">Capacity</div>
                      <div className="text-sm font-semibold">
                        {isFull ? (
                          <span className="text-destructive">Full</span>
                        ) : (
                          <span>
                            {event.registeredCount} / {event.capacity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="grid grid-cols-2 gap-2">
                    <TooltipProvider>
                      <div className="col-span-2">
                        <QuickRegistrationWidget
                          event={event}
                          members={members}
                          onRegister={(memberId, ticketTypeId) => handleRegisterMember(event.id, memberId, ticketTypeId)}
                          similarEvents={getSimilarEvents(event)}
                        />
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleCopyLink(event, e)}
                          >
                            <LinkIcon size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy registration link</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleEmailAttendees(event, e)}
                          >
                            <EnvelopeSimple size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Email attendees</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.name}</DialogTitle>
            <DialogDescription>Event details and registration information</DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {selectedEvent.virtual ? (
                  <>
                    <Video size={18} className="text-blue-600" weight="fill" />
                    <span>Virtual Event</span>
                  </>
                ) : (
                  <>
                    <MapPin size={18} />
                    <span>{selectedEvent.location}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <CalendarBlank size={18} />
                <span>
                  {formatDate(selectedEvent.startDate)} - {formatDate(selectedEvent.endDate)}
                </span>
              </div>

              <div className="text-sm text-muted-foreground">{selectedEvent.description}</div>

              <div>
                <h4 className="font-semibold mb-2">Registration Status</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.registeredCount} / {selectedEvent.capacity} registered
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Ticket Types</h4>
                {selectedEvent.ticketTypes.map(ticket => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{ticket.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.sold} / {ticket.capacity} sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(ticket.price)}</p>
                      {ticket.memberOnly && (
                        <Badge variant="default" className="text-xs">
                          Members Only
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleRegister(selectedEvent)}
                  disabled={selectedEvent.registeredCount >= selectedEvent.capacity}
                >
                  {selectedEvent.registeredCount >= selectedEvent.capacity ? 'Event Full' : 'Register Now'}
                </Button>
                <Button variant="outline" className="flex-1">
                  Share Event
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
