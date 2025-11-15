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
  CalendarDots, 
  Plus, 
  MagnifyingGlass, 
  MapPin,
  Users,
  Ticket,
  Video
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            const isNearCapacity = capacityPercentage >= 80
            const isFull = event.registeredCount >= event.capacity

            return (
              <Card
                key={event.id}
                className="p-6 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                      {event.name}
                    </h3>
                    <Badge variant="outline" className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDots size={16} className="shrink-0" />
                      <span>{formatDate(event.startDate, true)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.virtual ? (
                        <>
                          <Video size={16} className="shrink-0" />
                          <span>Virtual Event</span>
                        </>
                      ) : (
                        <>
                          <MapPin size={16} className="shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="shrink-0" />
                      <span>
                        {event.registeredCount} / {event.capacity} registered
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className={`font-medium ${isNearCapacity ? 'text-accent' : ''}`}>
                        {Math.round(capacityPercentage)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isFull ? 'bg-destructive' : isNearCapacity ? 'bg-accent' : 'bg-teal'
                        }`}
                        style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {event.ticketTypes.length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-1 text-sm">
                        <Ticket size={16} className="text-muted-foreground" />
                        <span className="text-muted-foreground">From</span>
                        <span className="font-semibold">
                          {formatCurrency(Math.min(...event.ticketTypes.map(t => t.price)))}
                        </span>
                      </div>
                    </div>
                  )}
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
