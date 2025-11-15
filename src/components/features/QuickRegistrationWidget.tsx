import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
  Select,
  SelectItem,
  Select
import {
  DialogContent,
  DialogHeade
} from '@/compon
  UserPlus,
  Users,
  ListCh
  Ticket
import { motion,
import type { Event,
interface Quick
  members: Mem
  similarEvents?: Event[]

  event,
  onRegister,
}: Quick
  const [searc
  const [sele

  const 

    if (!searchQuery) return []
    return members
        `${m.firstName} ${m.lastName}`.toLowerCa

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
      <Button

          setIsOpen(true)
        disabled={isFull && !event.waitlist
   


        <DialogContent className="max-w-lg">

          </DialogHeader>
          <AnimatePresence mode="

                initia
                exit={
              >
                  initia
                  transition=
                >
                </motion.div>
                <p className="text-sm text-muted-foreground mt-1">Confirmation email sent</p>
        
            
   

                <div
                    availabilityPercentage <= 10
                      : availabilityPercentage <= 30
                      : 'border-green-2
   

          
      
             
                 
                      ini
                      transit
                        a
          
                          : 'bg-green-600'
                    />
       
                      {availabilityPercentage <
                        : '⏰ Limited seats remaining'
               

                  <Card className="p-4 bg-amber-50 bo
                      <div className="w-10 h
                      </
                        <p className="font-semibold text-amber-900">Event Ful
                          {event.waitlistCount} {event.waitlist
                        <

                )}
                <div className="space
                  <div cl
                      classNa
                    />
                      placeholder="Type name or em
                      onChange={(e) =
                    />

                    <div cl
                        <div className="
                        </div>
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

















































































