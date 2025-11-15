import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarBlank, Plus, Trash } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Event, TicketType } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

interface EventCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateEvent: (event: Omit<Event, 'id' | 'registeredCount' | 'waitlistCount'>) => void
  chapters: Array<{ id: string; name: string }>
}

interface EventFormData {
  name: string
  description: string
  startDate: Date | undefined
  endDate: Date | undefined
  chapterId: string
  capacity: number
  location: string
  virtual: boolean
  ceCredits: number
  imageUrl: string
}

export function EventCreationDialog({
  open,
  onOpenChange,
  onCreateEvent,
  chapters,
}: EventCreationDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EventFormData>({
    defaultValues: {
      name: '',
      description: '',
      chapterId: '',
      capacity: 100,
      location: '',
      virtual: false,
      ceCredits: 0,
      imageUrl: '',
    },
  })

  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [ticketTypes, setTicketTypes] = useState<Omit<TicketType, 'sold'>[]>([
    {
      id: uuidv4(),
      name: 'General Admission',
      description: 'Standard ticket',
      price: 0,
      capacity: 100,
      memberOnly: false,
      sold: 0,
    },
  ])

  const isVirtual = watch('virtual')

  const handleAddTicketType = () => {
    setTicketTypes([
      ...ticketTypes,
      {
        id: uuidv4(),
        name: '',
        description: '',
        price: 0,
        capacity: 50,
        memberOnly: false,
        sold: 0,
      },
    ])
  }

  const handleRemoveTicketType = (id: string) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((t) => t.id !== id))
    }
  }

  const handleUpdateTicketType = (id: string, field: keyof TicketType, value: any) => {
    setTicketTypes(
      ticketTypes.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    )
  }

  const onSubmit = (data: EventFormData) => {
    if (!startDate || !endDate) {
      return
    }

    const newEvent: Omit<Event, 'id' | 'registeredCount' | 'waitlistCount'> = {
      name: data.name,
      description: data.description,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      chapterId: data.chapterId || chapters[0]?.id || 'default',
      capacity: data.capacity,
      location: data.location,
      virtual: data.virtual,
      status: 'draft',
      ticketTypes: ticketTypes.map((t) => ({ ...t, sold: 0 })),
      ceCredits: data.ceCredits || undefined,
      imageUrl: data.imageUrl || undefined,
    }

    onCreateEvent(newEvent)
    reset()
    setStartDate(undefined)
    setEndDate(undefined)
    setTicketTypes([
      {
        id: uuidv4(),
        name: 'General Admission',
        description: 'Standard ticket',
        price: 0,
        capacity: 100,
        memberOnly: false,
        sold: 0,
      },
    ])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Add a new event to your calendar. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Event name is required' })}
                placeholder="Enter event name"
                className="mt-1"
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register('description', { required: 'Description is required' })}
                placeholder="Describe your event"
                className="mt-1 min-h-24"
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal mt-1',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarBlank className="mr-2" size={16} />
                      {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal mt-1',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarBlank className="mr-2" size={16} />
                      {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={(date) => startDate ? date < startDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="chapterId">Chapter</Label>
                <Select
                  onValueChange={(value) => setValue('chapterId', value)}
                  defaultValue={chapters[0]?.id}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map((chapter) => (
                      <SelectItem key={chapter.id} value={chapter.id}>
                        {chapter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  {...register('capacity', {
                    required: 'Capacity is required',
                    min: { value: 1, message: 'Capacity must be at least 1' },
                  })}
                  placeholder="100"
                  className="mt-1"
                />
                {errors.capacity && (
                  <p className="text-sm text-destructive mt-1">{errors.capacity.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                {...register('location', { required: 'Location is required' })}
                placeholder={isVirtual ? 'Virtual Event URL' : 'Event venue address'}
                className="mt-1"
              />
              {errors.location && (
                <p className="text-sm text-destructive mt-1">{errors.location.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="virtual"
                onCheckedChange={(checked) => setValue('virtual', checked)}
              />
              <Label htmlFor="virtual">Virtual Event</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ceCredits">CE Credits</Label>
                <Input
                  id="ceCredits"
                  type="number"
                  {...register('ceCredits')}
                  placeholder="0"
                  className="mt-1"
                  min="0"
                  step="0.5"
                />
              </div>

              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  {...register('imageUrl')}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Ticket Types */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Ticket Types</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTicketType}
              >
                <Plus className="mr-2" size={16} />
                Add Ticket Type
              </Button>
            </div>

            <div className="space-y-4">
              {ticketTypes.map((ticket, index) => (
                <div key={ticket.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Ticket Type {index + 1}</h4>
                    {ticketTypes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTicketType(ticket.id)}
                      >
                        <Trash size={16} />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={ticket.name}
                        onChange={(e) =>
                          handleUpdateTicketType(ticket.id, 'name', e.target.value)
                        }
                        placeholder="Ticket name"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Price *</Label>
                      <Input
                        type="number"
                        value={ticket.price}
                        onChange={(e) =>
                          handleUpdateTicketType(
                            ticket.id,
                            'price',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0.00"
                        className="mt-1"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <Label>Capacity *</Label>
                      <Input
                        type="number"
                        value={ticket.capacity}
                        onChange={(e) =>
                          handleUpdateTicketType(
                            ticket.id,
                            'capacity',
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="50"
                        className="mt-1"
                        min="1"
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={ticket.memberOnly}
                          onCheckedChange={(checked) =>
                            handleUpdateTicketType(ticket.id, 'memberOnly', checked)
                          }
                        />
                        <Label>Members Only</Label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Input
                      value={ticket.description || ''}
                      onChange={(e) =>
                        handleUpdateTicketType(ticket.id, 'description', e.target.value)
                      }
                      placeholder="Optional description"
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Event</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
