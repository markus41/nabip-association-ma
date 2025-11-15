import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badg
import { Select, SelectContent, SelectItem, Sel
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, Users, ListChecks, Ticket, MagnifyingGlass, CheckCircle } from '@phosphor-icons/react'
  event: Event
  onRegister: (memberId: string, ticketTypeId: s

export function QuickRegistrationWidget(
  members,
  similarEvents = [
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMember, 
 

  const availabilityPercentage = (availab
  const 
    const 
      .filter
        m.email.toLo
      .slice(0, 5)

    if (availabilityPercentage <= 10) return 'bg-red
    return 'bg-green-50'

    if (selectedMember && selectedTicketType) {

        setIsOpen(false)
        setSelectedMember(null)
        setSearchQuery('')


    setSearchQuery('')
    setSelectedTicketType('')
  }
  return (
      <DialogTrigger asChild>
          variant={isFull ? 'outline' : 'defa
       
          disabled
          <UserPlus size={18


        <DialogHeader>
        </DialogHeader>
        <AnimatePresence
   

              exit={{ opacity: 0
            >
                initial={{ scale: 0 }}
                transition={{ type:
              >
              </motion.d
              <p className="text-sm te
          ) : (
              key="form"
              animate={{ o
              
     
   

                    : 'border
              >
                  <div clas
                    <span cla
                  <Badge variant="
   

          
                    transition={{ duration: 0.8, ea
                      availab
               
                        : 'bg-green-600'
                  /
                {availabili
                    {availabilityPercenta
                      : '⏰ Limited seats remaining'}
         

                <Card className="p-4 bg-amber-50 border-amber-200">
                 
                    </

                        {event.waitlistCou
                      
                  </div>
              )}

                <div className="relat
                    className="abso
                  />
                    placeho
                    onChange={(e) => setSearchQuer
                  />

                  <div className="border rounded-lg divide-y max-h-48 ov
             
                      </d
                      filteredMembers.
                          key={member.
                            setSelectedMember(member)
                          }}
               
                            <p className="font-medium text-sm">
                           
                          </div>
                            {member.memberType}
                        <
               
                )}

                <motion.div
                  animate={{ opacity: 
                >
                  <Select value={se
             
                  
                        <SelectItem key={ticket.id} value={ticket.id}>
                            <span className="f
                              {ticket.
                            <span className="ml-4 
                        </SelectItem>
                    </SelectContent>
                </m

                <Button
                  onClick={handleReset}
                  disabled={!selectedMember && !searc
                  Reset
                <Button
                  className="flex-1"
                >
                </Button>
            </motion.d
        </AnimatePresence>
    </Dialog>
}








































































































































