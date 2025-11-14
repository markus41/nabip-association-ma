import { useEffect, useState } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  UserCircle,
  CalendarDots,
  EnvelopeSimple,
  CurrencyDollar,
  MagnifyingGlass,
  ChartBar,
  Buildings
} from '@phosphor-icons/react'

interface CommandPaletteProps {
  onNavigate: (section: string) => void
  onAIQuery?: (query: string) => void
}

export function CommandPalette({ onNavigate, onAIQuery }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = (action: () => void) => {
    setOpen(false)
    action()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleSelect(() => onNavigate('dashboard'))}>
            <ChartBar className="mr-2" size={18} />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => onNavigate('members'))}>
            <UserCircle className="mr-2" size={18} />
            <span>Members</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => onNavigate('events'))}>
            <CalendarDots className="mr-2" size={18} />
            <span>Events</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => onNavigate('communications'))}>
            <EnvelopeSimple className="mr-2" size={18} />
            <span>Communications</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => onNavigate('finance'))}>
            <CurrencyDollar className="mr-2" size={18} />
            <span>Finance</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => onNavigate('chapters'))}>
            <Buildings className="mr-2" size={18} />
            <span>Chapters</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => handleSelect(() => {
            onNavigate('members')
            setTimeout(() => {
              const addButton = document.querySelector('[data-action="add-member"]') as HTMLButtonElement
              addButton?.click()
            }, 100)
          })}>
            <UserCircle className="mr-2" size={18} />
            <span>Add New Member</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => {
            onNavigate('events')
            setTimeout(() => {
              const addButton = document.querySelector('[data-action="add-event"]') as HTMLButtonElement
              addButton?.click()
            }, 100)
          })}>
            <CalendarDots className="mr-2" size={18} />
            <span>Create Event</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => {
            onNavigate('communications')
            setTimeout(() => {
              const addButton = document.querySelector('[data-action="new-campaign"]') as HTMLButtonElement
              addButton?.click()
            }, 100)
          })}>
            <EnvelopeSimple className="mr-2" size={18} />
            <span>New Email Campaign</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Search">
          <CommandItem onSelect={() => handleSelect(() => onNavigate('members'))}>
            <MagnifyingGlass className="mr-2" size={18} />
            <span>Search Members</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => onNavigate('events'))}>
            <MagnifyingGlass className="mr-2" size={18} />
            <span>Search Events</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
