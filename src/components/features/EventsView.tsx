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
  SelectValue,
import {
  TooltipContent,
  Toolti
import { 
  Plus, 
  MapPin,
  Ticket,
  Eye,
  Envelop
  Medal,
  CheckC
} from '@phosphor-i
import { 

  events:
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
      
  const handleRegister = (event: Event) => 
      description: 'You will receive a confirmation email shortly.'
  }

    setSelectedEvent(event)

    e.stopPropagation()
    navigator.clipboard.writeText(link)
      description: 'Share this link with potential attendees.'

  const hand
    toast.succe
    })

    if (event.virtu
    r


    const diffTime = date.getTime() - now.ge
    return diffDays

    co
   

    const 
      const daysUntil = getDays
        tags.push({ label: `Early Bird Ends in ${daysUnti
    }
    const capacityPercentage = (event.registeredCount / event.capacity) * 1
      tags.push({ label: 'Almost Full', variant: 'de

  }
  const getMem
    return memberTicket ? memberTicket.price : event.ticketTy

    const nonMemberTic
  }
  const rend

    const color = percentage >= 90 ? '#ef4444' : percentage >
    return (
        <circle
          cy="24"
          fill="none"
          strokeWi
        <circle
          cy="24"
          fill="none"
          strokeWi
          strokeDashoffset={offset}
          transform="rotate(-90 24 24)"
        />
          x="24"
          textAn
          class

      </svg>
  }
  return (
      <div className="flex items-center justify-between">
          <h1 clas
            Manag
        </div>
          <Plus className="mr-2" si
        </Button>

        <Card className="p-6">
            <div c
            </div>
              <p
              <

            </div>
        </Card>
        <Card className="p-6">
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-
            </div>
              <p 
              </p>
                {loading ? '...' : s
            </div>
        </Card>
        <Card className="p-6">
            <div c
            </div>
              <p
              <

            </div>
        </Card>
        <Card className="p-6">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justi
            </div>
              <p 
              </p>
                {loading ? '..
            </div>
        </Card>

        <div class
            <Magni
              si
            <In
            

          </div>
            <SelectTrigger className="w-[160px]">
            </SelectTrigger>
              <SelectItem va
              <SelectItem value="draft">Draft</SelectItem>
              <SelectIt
          </Se
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-co
          Array.from({ length: 6 
              <div className="space-y-4">
                <div className=
              
          ))
          <div className="col-span-full">
              <div className="text-center">
                <p className="text-muted-foregroun
            </Card>
        ) : (
            const capacityPercentage = (event.registeredCount
            const eventTypeColor = getEventTypeColor(event)
            const memberPrice = getMemberPrice(event)
            const hasMemberDiscount = memberPrice < nonMemberP
            const month = eventDate.toLocaleString('default', { mo

              ? 'ho
              


              ? 'bg-green-50'

              <Card
                className={`group relative
                <div className={`absolute
                  eventTypeColor === 'green' ? 'bg-green-500' : 
                }`} />
                <div className="p-6 space-y-4">
                    
                   
            
                        eventTypeColor === 
                        'text-purple-600'
                        {month}
                      <div className={`text
                        eventTypeColor === 'green' ? 'text-green-700' : 
                      }`}>
                    

                
             
                        {renderProgressRi
                      
                        {event.virtual && !event.location.i
                            <Video size={14} weight="fill" classNa

                    
                   
                          </>
                          <>
                            <span className="truncate">
               
                        <Clock size={14} />
                      </div>
                  </div>
                  {smartTags.lengt
                      {sm
                          key={idx}
                          className=
                            
                        

                          }`}
                          {tag.variant === 'success' && <Meda
                          {tag.variant === 'destructive' && <WarningC
                        </Badge>
                    </div>

                    <div className="flex
                        <d
                        </div>
                          <span className="text-2xl 
                          <
                           
                          
                        </div>
                          <div className="flex items-center gap-1 mt-1">
                           
                        
                        )}

                        <div className="text-xs text-muted-for
                        </di
                          {isFull ? (
                          ) :
                          
                        


                      <div className="h-px bg-border" />
                        <div className="flex gap-2">
                            <TooltipTrigger asChild>
                                variant="outline"
                             
                          
                                Details
                          
                          </Tooltip>
                          <Tooltip>
                           
                                size="sm"
                        
                          
                        

                            <TooltipTrigger asChild>
                                variant="outline"
                                onClick={(e) => handleEmailAttendees(ev
                                <EnvelopeSimple size={16} />
                            </TooltipTrigger>
                          </Tooltip>
                      </TooltipProvider>
                  </div>
              </Card>
          })
      </div>
      <Dialog open={!!
          <DialogHead
            <
          {s
          
            

                  {selectedEvent.virtual ? (
                      <Video size={18} classN
                    </>
                    <>
                      <span>{selectedEvent.location}</span>
                  )}
                <div classNam
                  <span>{selectedEvent.
              </div>
              <div>
              </div>
              <div className="space-y-3">
                {selec
                    key={ticket.id}
                  >
                      
                        {ticket.sold} / {ticket.capacity} sold
                      </p>
                    <di
                      {
                      
                  </div>
              </div>
              <div clas
                  cl
                  onCl
                  {selectedEvent.registeredCount >= selectedEvent
                <Button variant="outline" className="flex-1">Share Even
            </div>
        </DialogConten
    </div>














































