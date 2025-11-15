import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  UserPlus,
  MagnifyingGlass,
  Users,
  CheckCircle,
  ListChecks,
  CalendarDots,
  Ticket
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import type { Event, Member } from '@/lib/types'

interface QuickRegistrationWidgetProps {
  event: Event
  members: Member[]
  onRegister: (memberId: string, ticketTypeId: string) => void
  similarEvents?: Event[]
}

export function QuickRegistrationWidget({
  event,
  members,
  onRegister,
  similarEvents = []
}: QuickRegistrationWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [selectedTicketType, setSelectedTicketType] = useState<string>('')
  const [registrationComplete, setRegistrationComplete] = useState(false)

  const isFull = event.registeredCount >= event.capacity
  const availableSeats = event.capacity - event.registeredCount
  const availabilityPercentage = (availableSeats / event.capacity) * 100

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return []
    const query = searchQuery.toLowerCase()
    return members
      .filter(m =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query)
      )
      .slice(0, 5)
  }, [members, searchQuery])

  const availableTickets = event.ticketTypes.filter(
    ticket => ticket.sold < ticket.capacity
  )

  const handleRegister = () => {
    if (!selectedMember || !selectedTicketType) return

    onRegister(selectedMember.id, selectedTicketType)
    setRegistrationComplete(true)

    setTimeout(() => {
      setIsOpen(false)
      setRegistrationComplete(false)
      setSearchQuery('')
      setSelectedMember(null)
      setSelectedTicketType('')
      toast.success('Registration Complete', {
        description: `${selectedMember.firstName} ${selectedMember.lastName} has been registered.`
      })
    }, 1500)
  }

  const getAvailabilityColor = () => {
    if (availabilityPercentage <= 10) return 'text-red-600 bg-red-50'
    if (availabilityPercentage <= 30) return 'text-amber-600 bg-amber-50'
    return 'text-green-600 bg-green-50'
  }

  return (
    <>
      <Button
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(true)
        }}
        disabled={isFull && !event.waitlistCount}
        className="w-full"
      >
        <UserPlus size={16} className="mr-2" />
        {isFull ? 'Join Waitlist' : 'Quick Register'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Quick Registration</DialogTitle>
            <DialogDescription>{event.name}</DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {registrationComplete ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 flex flex-col items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4"
                >
                  <CheckCircle size={40} weight="fill" className="text-green-600" />
                </motion.div>
                <p className="text-lg font-semibold">Registration Successful!</p>
                <p className="text-sm text-muted-foreground mt-1">Confirmation email sent</p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div
                  className={`p-4 rounded-lg ${getAvailabilityColor()} border ${
                    availabilityPercentage <= 10
                      ? 'border-red-200'
                      : availabilityPercentage <= 30
                      ? 'border-amber-200'
                      : 'border-green-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users size={20} weight="bold" />
                      <span className="font-semibold">Seat Availability</span>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {availableSeats} / {event.capacity}
                    </Badge>
                  </div>
                  <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(event.registeredCount / event.capacity) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full ${
                        availabilityPercentage <= 10
                          ? 'bg-red-600'
                          : availabilityPercentage <= 30
                          ? 'bg-amber-600'
                          : 'bg-green-600'
                      }`}
                    />
                  </div>
                  {availabilityPercentage <= 30 && (
                    <p className="text-xs font-medium mt-2">
                      {availabilityPercentage <= 10
                        ? '⚠️ Almost sold out! Register now.'
                        : '⏰ Limited seats remaining'}
                    </p>
                  )}
                </div>

                {isFull && event.waitlistCount !== undefined && (
                  <Card className="p-4 bg-amber-50 border-amber-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <ListChecks size={20} weight="bold" className="text-amber-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-amber-900">Event Full - Waitlist Available</p>
                        <p className="text-sm text-amber-700 mt-1">
                          {event.waitlistCount} {event.waitlistCount === 1 ? 'person is' : 'people are'}{' '}
                          currently waiting
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Member</label>
                  <div className="relative">
                    <MagnifyingGlass
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <Input
                      placeholder="Type name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {searchQuery && (
                    <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                      {filteredMembers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No members found
                        </div>
                      ) : (
                        filteredMembers.map((member) => (
                          <button
                            key={member.id}
                            onClick={() => {
                              setSelectedMember(member)
                              setSearchQuery(`${member.firstName} ${member.lastName}`)
                            }}
                            className="w-full p-3 text-left hover:bg-muted transition-colors flex items-center justify-between group"
                          >
                            <div>
                              <p className="font-medium text-sm">
                                {member.firstName} {member.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {member.memberType}
                            </Badge>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {selectedMember && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium">Select Ticket Type</label>
                    <Select value={selectedTicketType} onValueChange={setSelectedTicketType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose ticket type" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTickets.map((ticket) => (
                          <SelectItem key={ticket.id} value={ticket.id}>
                            <div className="flex items-center justify-between gap-4">
                              <span>{ticket.name}</span>
                              <span className="text-muted-foreground font-mono">
                                ${ticket.price.toFixed(2)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}

                {isFull && similarEvents.length > 0 && (
                  <Card className="p-4 bg-muted/50">
                    <div className="flex items-start gap-3 mb-3">
                      <Ticket size={20} weight="duotone" className="text-primary mt-1" />
                      <div>
                        <p className="font-semibold text-sm">Similar Events Available</p>
                        <p className="text-xs text-muted-foreground">Consider these alternatives</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {similarEvents.slice(0, 3).map((similarEvent) => (
                        <button
                          key={similarEvent.id}
                          className="w-full p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left group"
                        >
                          <div className="flex items-start gap-3">
                            <CalendarDots
                              size={20}
                              weight="duotone"
                              className="text-primary mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                                {similarEvent.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(similarEvent.startDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </Card>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRegister}
                    disabled={!selectedMember || !selectedTicketType}
                    className="flex-1"
                  >
                    <CheckCircle size={18} className="mr-2" />
                    Confirm Registration
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  )
}
