import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, Users, MagnifyingGlass, CheckCircle, Warning } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Event, Member } from '@/lib/types'
import { toast } from 'sonner'

interface QuickRegistrationWidgetProps {
  event: Event
  members?: Member[]
  onRegister: (memberId: string, ticketTypeId: string) => void
  similarEvents?: Event[]
}

export function QuickRegistrationWidget({ 
  event, 
  members = [], 
  onRegister,
  similarEvents = []
}: QuickRegistrationWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTicketType, setSelectedTicketType] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const availableSeats = event.capacity - event.registeredCount
  const availabilityPercentage = (availableSeats / event.capacity) * 100
  const isFull = availableSeats <= 0

  const getAvailabilityColor = () => {
    if (availabilityPercentage <= 10) return 'bg-red-50 border-red-200'
    if (availabilityPercentage <= 30) return 'bg-amber-50 border-amber-200'
    return 'bg-green-50 border-green-200'
  }

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members.slice(0, 5)
    
    const query = searchQuery.toLowerCase()
    return members
      .filter(m => 
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query)
      )
      .slice(0, 5)
  }, [members, searchQuery])

  const handleRegister = () => {
    if (selectedMember && selectedTicketType) {
      onRegister(selectedMember.id, selectedTicketType)
      setShowSuccess(true)
      
      setTimeout(() => {
        setShowSuccess(false)
        setIsOpen(false)
        setSelectedMember(null)
        setSelectedTicketType('')
        setSearchQuery('')
      }, 1500)
    }
  }

  const handleReset = () => {
    setSelectedMember(null)
    setSearchQuery('')
    setSelectedTicketType('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isFull ? 'outline' : 'default'}
          className="w-full"
          disabled={isFull}
        >
          <UserPlus size={18} className="mr-2" weight="bold" />
          {isFull ? 'Event Full' : 'Quick Register'}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Registration</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
              >
                <CheckCircle size={64} weight="fill" className="text-green-600" />
              </motion.div>
              <p className="text-sm text-muted-foreground mt-4">Registration successful!</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Card className={`p-4 ${getAvailabilityColor()}`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{event.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {event.virtual ? 'Virtual' : 'In-Person'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <motion.div
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.8, ease: 'easeInOut', repeat: Infinity }}
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        availabilityPercentage <= 10
                          ? 'bg-red-600 text-white'
                          : availabilityPercentage <= 30
                          ? 'bg-amber-600 text-white'
                          : 'bg-green-600 text-white'
                      }`}
                    >
                      {availableSeats} seats
                    </motion.div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {availabilityPercentage <= 10
                        ? '🔥 Almost full!'
                        : availabilityPercentage <= 30
                        ? '⏰ Limited seats remaining'
                        : '✓ Available'}
                    </p>
                  </div>
                </div>
              </Card>

              {event.waitlistCount && event.waitlistCount > 0 && (
                <Card className="p-4 bg-amber-50 border-amber-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Warning size={16} weight="fill" className="text-amber-600" />
                    <span className="text-amber-900">
                      {event.waitlistCount} {event.waitlistCount === 1 ? 'person' : 'people'} on waitlist
                    </span>
                  </div>
                </Card>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Member</label>
                <div className="relative">
                  <MagnifyingGlass 
                    size={16} 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                  />
                  <Input
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {searchQuery && (
                  <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => {
                            setSelectedMember(member)
                            setSearchQuery('')
                          }}
                          className="w-full p-3 text-left hover:bg-muted transition-colors flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-sm">{`${member.firstName} ${member.lastName}`}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {member.memberType}
                          </Badge>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No members found
                      </div>
                    )}
                  </div>
                )}

                {selectedMember && !searchQuery && (
                  <Card className="p-3 bg-primary/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{`${selectedMember.firstName} ${selectedMember.lastName}`}</p>
                        <p className="text-xs text-muted-foreground">{selectedMember.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMember(null)}
                      >
                        Change
                      </Button>
                    </div>
                  </Card>
                )}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: selectedMember ? 1 : 0.5 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium">Ticket Type</label>
                <Select 
                  value={selectedTicketType} 
                  onValueChange={setSelectedTicketType}
                  disabled={!selectedMember}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ticket type" />
                  </SelectTrigger>
                  <SelectContent>
                    {event.ticketTypes?.map((ticket) => (
                      <SelectItem key={ticket.id} value={ticket.id}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{ticket.name}</span>
                          <span className="ml-4 text-muted-foreground">
                            ${ticket.price}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={!selectedMember && !searchQuery}
                >
                  Reset
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleRegister}
                  disabled={!selectedMember || !selectedTicketType}
                >
                  Register Member
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
