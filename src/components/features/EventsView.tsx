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
  CalendarDots, 
  Plus, 
  MagnifyingGlass, 
  MapPin,
  Users,
  Ticket,
  Video,
  Eye,
  Link as LinkIcon,
  EnvelopeSimple,
  Clock,
  Medal,
  CalendarBlank,
  CheckCircle,
  WarningCircle
} from '@phosphor-icons/react'
import type { Event } from '@/lib/types'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/data-utils'
import { toast } from 'sonner'

interface EventsViewProps {
  events: Event[]
  onAddEvent: () => void
  loading?: boolean
}

export function EventsView({ events, onAddEvent, loading }: EventsViewProps) {
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
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  }, [events, searchQuery, statusFilter])

  const stats = useMemo(() => {
    const upcoming = events.filter(e => e.status === 'published' && new Date(e.startDate) > new Date()).length
    const totalRegistrations = events.reduce((sum, e) => sum + e.registeredCount, 0)
    const totalCapacity = events.reduce((sum, e) => sum + e.capacity, 0)
    const virtualEvents = events.filter(e => e.virtual).length

    return {
      upcoming,
      totalRegistrations,
      capacityUtilization: totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0,
      virtualEvents
    }
  }, [events])

  const handleRegister = (event: Event) => {
    toast.success(`Registered for ${event.name}`, {
      description: 'You will receive a confirmation email shortly.'
    })
  }

  const handleViewDetails = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEvent(event)
  }

  const handleCopyLink = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const link = `${window.location.origin}/events/${eventId}`
    navigator.clipboard.writeText(link)
    toast.success('Registration link copied!', {
      description: 'Share this link with potential attendees.'
    })
  }

  const handleEmailAttendees = (eventName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    toast.success(`Email Attendees`, {
      description: `Compose email to all ${eventName} attendees.`
    })
  }

  const getEventTypeColor = (event: Event) => {
    if (event.virtual && !event.location.includes('Hybrid')) return 'blue'
    if (!event.virtual) return 'green'
    return 'purple'
  }

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getSmartTags = (event: Event) => {
    const tags: Array<{ label: string; variant: 'default' | 'success' | 'warning' | 'destructive' }> = []
    
    if (event.ceCredits && event.ceCredits > 0) {
      tags.push({ label: `${event.ceCredits} CE Credits`, variant: 'success' })
    }

    const earlyBirdTicket = event.ticketTypes.find(t => t.earlyBird && t.earlyBirdEndDate)
    if (earlyBirdTicket && earlyBirdTicket.earlyBirdEndDate) {
      const daysUntil = getDaysUntil(earlyBirdTicket.earlyBirdEndDate)
      if (daysUntil > 0 && daysUntil <= 7) {
        tags.push({ label: `Early Bird Ends in ${daysUntil} Day${daysUntil !== 1 ? 's' : ''}`, variant: 'warning' })
      }
    }

    const capacityPercentage = (event.registeredCount / event.capacity) * 100
    if (capacityPercentage >= 90) {
      tags.push({ label: 'Almost Full', variant: 'destructive' })
    }

    return tags
  }

  const getMemberPrice = (event: Event) => {
    const memberTicket = event.ticketTypes.find(t => t.memberOnly || t.name.toLowerCase().includes('member'))
    return memberTicket ? memberTicket.price : event.ticketTypes[0]?.price || 0
  }

  const getNonMemberPrice = (event: Event) => {
    const nonMemberTicket = event.ticketTypes.find(t => !t.memberOnly && t.name.toLowerCase().includes('non-member'))
    return nonMemberTicket ? nonMemberTicket.price : event.ticketTypes[event.ticketTypes.length - 1]?.price || 0
  }

  const renderProgressRing = (percentage: number) => {
    const radius = 20
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference
    const color = percentage >= 90 ? '#ef4444' : percentage >= 75 ? '#f59e0b' : '#10b981'

    return (
      <svg width="48" height="48" className="shrink-0">
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
          transform="rotate(-90 24 24)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text
          x="24"
          y="24"
          textAnchor="middle"
          dy=".3em"
          className="text-xs font-semibold fill-foreground"
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
          <h1 className="text-3xl font-semibold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-1">
            Manage and register for events
          </p>
        </div>
        <Button onClick={onAddEvent} data-action="add-event">
          <Plus className="mr-2" size={18} weight="bold" />
          Create Event
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDots size={20} weight="duotone" className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Upcoming Events
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : stats.upcoming}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
              <Users size={20} weight="duotone" className="text-teal" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Total Registrations
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : stats.totalRegistrations}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Ticket size={20} weight="duotone" className="text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Capacity Utilization
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : `${stats.capacityUtilization}%`}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Video size={20} weight="duotone" className="text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Virtual Events
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : stats.virtualEvents}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlass
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              placeholder="Search events by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-4">
                <div className="h-6 bg-muted animate-shimmer rounded w-3/4" />
                <div className="h-4 bg-muted animate-shimmer rounded w-full" />
                <div className="h-4 bg-muted animate-shimmer rounded w-1/2" />
              </div>
            </Card>
          ))
        ) : filteredEvents.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12">
              <div className="text-center">
                <CalendarDots size={48} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No events found</p>
              </div>
            </Card>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const capacityPercentage = (event.registeredCount / event.capacity) * 100
            const isFull = event.registeredCount >= event.capacity
            const eventTypeColor = getEventTypeColor(event)
            const smartTags = getSmartTags(event)
            const memberPrice = getMemberPrice(event)
            const nonMemberPrice = getNonMemberPrice(event)
            const hasMemberDiscount = memberPrice < nonMemberPrice
            const eventDate = new Date(event.startDate)
            const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase()
            const day = eventDate.getDate()

            const cardBorderColor = eventTypeColor === 'blue' 
              ? 'hover:border-blue-500/50' 
              : eventTypeColor === 'green' 
              ? 'hover:border-green-500/50' 
              : 'hover:border-purple-500/50'

            const cardBgAccent = eventTypeColor === 'blue'
              ? 'bg-blue-50'
              : eventTypeColor === 'green'
              ? 'bg-green-50'
              : 'bg-purple-50'

            return (
              <Card
                key={event.id}
                className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl border-2 ${cardBorderColor}`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  eventTypeColor === 'blue' ? 'bg-blue-500' : 
                  eventTypeColor === 'green' ? 'bg-green-500' : 
                  'bg-purple-500'
                }`} />
                
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-16 h-16 rounded-lg ${cardBgAccent} flex flex-col items-center justify-center border-2 ${
                      eventTypeColor === 'blue' ? 'border-blue-200' : 
                      eventTypeColor === 'green' ? 'border-green-200' : 
                      'border-purple-200'
                    }`}>
                      <div className={`text-xs font-bold ${
                        eventTypeColor === 'blue' ? 'text-blue-600' : 
                        eventTypeColor === 'green' ? 'text-green-600' : 
                        'text-purple-600'
                      }`}>
                        {month}
                      </div>
                      <div className={`text-2xl font-bold ${
                        eventTypeColor === 'blue' ? 'text-blue-700' : 
                        eventTypeColor === 'green' ? 'text-green-700' : 
                        'text-purple-700'
                      }`}>
                        {day}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                          {event.name}
                        </h3>
                        {renderProgressRing(capacityPercentage)}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {event.virtual && !event.location.includes('Hybrid') ? (
                          <>
                            <Video size={14} weight="fill" className="text-blue-500" />
                            <span>Webinar</span>
                          </>
                        ) : event.location.includes('Hybrid') ? (
                          <>
                            <Video size={14} weight="fill" className="text-purple-500" />
                            <MapPin size={14} weight="fill" className="text-purple-500" />
                            <span>Hybrid</span>
                          </>
                        ) : (
                          <>
                            <MapPin size={14} weight="fill" className="text-green-500" />
                            <span className="truncate">In-Person</span>
                          </>
                        )}
                        <span className="text-muted-foreground/50">•</span>
                        <Clock size={14} />
                        <span>{formatDate(event.startDate, true)}</span>
                      </div>
                    </div>
                  </div>

                  {smartTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {smartTags.map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant={tag.variant === 'success' ? 'default' : 'outline'}
                          className={`text-xs ${
                            tag.variant === 'success' 
                              ? 'bg-green-100 text-green-700 border-green-300' 
                              : tag.variant === 'warning'
                              ? 'bg-amber-100 text-amber-700 border-amber-300'
                              : tag.variant === 'destructive'
                              ? 'bg-red-100 text-red-700 border-red-300'
                              : ''
                          }`}
                        >
                          {tag.variant === 'success' && <Medal size={12} weight="fill" className="mr-1" />}
                          {tag.variant === 'warning' && <Clock size={12} weight="fill" className="mr-1" />}
                          {tag.variant === 'destructive' && <WarningCircle size={12} weight="fill" className="mr-1" />}
                          {tag.label}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t space-y-3">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          {hasMemberDiscount ? 'Member Price' : 'Starting at'}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-foreground">
                            {formatCurrency(memberPrice)}
                          </span>
                          {hasMemberDiscount && (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatCurrency(nonMemberPrice)}
                            </span>
                          )}
                        </div>
                        {hasMemberDiscount && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle size={14} weight="fill" className="text-green-600" />
                            <span className="text-xs font-medium text-green-600">
                              Save {formatCurrency(nonMemberPrice - memberPrice)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {event.registeredCount} / {event.capacity}
                        </div>
                        <div className="text-xs font-medium">
                          {isFull ? (
                            <span className="text-red-600">Full</span>
                          ) : capacityPercentage >= 75 ? (
                            <span className="text-amber-600">{Math.round(capacityPercentage)}% Full</span>
                          ) : (
                            <span className="text-green-600">Available</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
                      <div className="h-px bg-border" />
                      <TooltipProvider>
                        <div className="flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={(e) => handleViewDetails(event, e)}
                              >
                                <Eye size={16} className="mr-1.5" />
                                Details
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View full event details</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleCopyLink(event.id, e)}
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
                                onClick={(e) => handleEmailAttendees(event.name, e)}
                              >
                                <EnvelopeSimple size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Email attendees</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </div>
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
            <DialogDescription>Event details and registration</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDots size={18} className="text-muted-foreground" />
                  <span>{formatDate(selectedEvent.startDate, true)} - {formatDate(selectedEvent.endDate, true)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {selectedEvent.virtual ? (
                    <>
                      <Video size={18} className="text-muted-foreground" />
                      <span>Virtual Event</span>
                    </>
                  ) : (
                    <>
                      <MapPin size={18} className="text-muted-foreground" />
                      <span>{selectedEvent.location}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users size={18} className="text-muted-foreground" />
                  <span>{selectedEvent.registeredCount} / {selectedEvent.capacity} registered</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Ticket Types</h4>
                {selectedEvent.ticketTypes.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{ticket.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {ticket.sold} / {ticket.capacity} sold
                        {ticket.memberOnly && ' • Members only'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(ticket.price)}</p>
                      {ticket.sold >= ticket.capacity && (
                        <Badge variant="outline" className="mt-1">Sold Out</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  disabled={selectedEvent.registeredCount >= selectedEvent.capacity}
                  onClick={() => handleRegister(selectedEvent)}
                >
                  {selectedEvent.registeredCount >= selectedEvent.capacity ? 'Event Full' : 'Register Now'}
                </Button>
                <Button variant="outline" className="flex-1">Share Event</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
