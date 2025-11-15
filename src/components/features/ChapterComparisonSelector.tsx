import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Check, CaretDown, X, Buildings, MapTrifold, Users as UsersIcon } from '@phosphor-icons/react'
import type { Chapter } from '@/lib/types'

/**
 * Establishes multi-select chapter comparison interface with quick presets.
 * Implements grouped selection by chapter hierarchy and smart filtering.
 *
 * Best for: Selecting 2-5 chapters for side-by-side performance comparison
 *
 * @param chapters - Available chapters to select from
 * @param selectedIds - Currently selected chapter IDs
 * @param onSelectionChange - Callback when selection changes
 * @param maxSelections - Maximum chapters that can be selected (default: 5)
 * @param minSelections - Minimum chapters required (default: 2)
 * @param disabled - Whether selector is disabled
 */
export interface ChapterComparisonSelectorProps {
  chapters: Chapter[]
  selectedIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
  maxSelections?: number
  minSelections?: number
  disabled?: boolean
}

interface QuickPreset {
  id: string
  label: string
  icon: React.ReactNode
  filter: (chapters: Chapter[]) => Chapter[]
}

export function ChapterComparisonSelector({
  chapters,
  selectedIds,
  onSelectionChange,
  maxSelections = 5,
  minSelections = 2,
  disabled = false
}: ChapterComparisonSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const selectedChapters = useMemo(() => {
    return chapters.filter(c => selectedIds.includes(c.id))
  }, [chapters, selectedIds])

  const canAddMore = selectedIds.length < maxSelections
  const hasMinimum = selectedIds.length >= minSelections

  // Group chapters by type
  const groupedChapters = useMemo(() => {
    const national = chapters.filter(c => c.type === 'national')
    const state = chapters.filter(c => c.type === 'state').sort((a, b) => a.name.localeCompare(b.name))
    const local = chapters.filter(c => c.type === 'local').sort((a, b) => a.name.localeCompare(b.name))

    return { national, state, local }
  }, [chapters])

  // Quick preset filters
  const quickPresets: QuickPreset[] = useMemo(() => {
    return [
      {
        id: 'top-members',
        label: 'Top 5 by Members',
        icon: <UsersIcon size={16} weight="bold" />,
        filter: (chs: Chapter[]) => [...chs]
          .sort((a, b) => b.memberCount - a.memberCount)
          .slice(0, 5)
      },
      {
        id: 'top-events',
        label: 'Top 5 by Events',
        icon: <UsersIcon size={16} weight="bold" />,
        filter: (chs: Chapter[]) => [...chs]
          .sort((a, b) => b.activeEventsCount - a.activeEventsCount)
          .slice(0, 5)
      },
      {
        id: 'all-state',
        label: 'All State Chapters',
        icon: <MapTrifold size={16} weight="bold" />,
        filter: (chs: Chapter[]) => chs.filter(c => c.type === 'state').slice(0, maxSelections)
      },
      {
        id: 'national-state',
        label: 'National + Top States',
        icon: <Buildings size={16} weight="bold" />,
        filter: (chs: Chapter[]) => {
          const national = chs.filter(c => c.type === 'national')
          const topStates = chs
            .filter(c => c.type === 'state')
            .sort((a, b) => b.memberCount - a.memberCount)
            .slice(0, Math.min(4, maxSelections - national.length))
          return [...national, ...topStates]
        }
      }
    ]
  }, [maxSelections])

  const handleToggleChapter = (chapterId: string) => {
    if (selectedIds.includes(chapterId)) {
      onSelectionChange(selectedIds.filter(id => id !== chapterId))
    } else if (canAddMore) {
      onSelectionChange([...selectedIds, chapterId])
    }
  }

  const handleApplyPreset = (preset: QuickPreset) => {
    const presetChapters = preset.filter(chapters)
    const presetIds = presetChapters.map(c => c.id)
    onSelectionChange(presetIds)
    setOpen(false)
  }

  const handleClearSelection = () => {
    onSelectionChange([])
  }

  const getChapterBreadcrumb = (chapter: Chapter): string => {
    if (chapter.type === 'national') return 'National'
    if (chapter.type === 'state') return `${chapter.state}`
    if (chapter.type === 'local') {
      const parent = chapters.find(c => c.id === chapter.parentChapterId)
      return `${parent?.state} > ${chapter.city}`
    }
    return chapter.name
  }

  const getChapterIcon = (type: Chapter['type']) => {
    switch (type) {
      case 'national':
        return <Buildings size={14} weight="duotone" className="text-primary" />
      case 'state':
        return <MapTrifold size={14} weight="duotone" className="text-teal" />
      case 'local':
        return <UsersIcon size={14} weight="duotone" className="text-accent-foreground" />
    }
  }

  // Filter chapters based on search
  const filteredChapters = useMemo(() => {
    if (!searchQuery) return groupedChapters

    const query = searchQuery.toLowerCase()
    const filterGroup = (chs: Chapter[]) =>
      chs.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.state?.toLowerCase().includes(query) ||
        c.city?.toLowerCase().includes(query)
      )

    return {
      national: filterGroup(groupedChapters.national),
      state: filterGroup(groupedChapters.state),
      local: filterGroup(groupedChapters.local)
    }
  }, [groupedChapters, searchQuery])

  return (
    <div className="space-y-3">
      {/* Selected Chapters Display */}
      {selectedChapters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedChapters.map(chapter => (
            <Badge
              key={chapter.id}
              variant="secondary"
              className="flex items-center gap-2 px-3 py-1.5"
            >
              {getChapterIcon(chapter.type)}
              <span className="text-xs">{chapter.name}</span>
              <button
                onClick={() => handleToggleChapter(chapter.id)}
                className="hover:bg-background/50 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${chapter.name}`}
              >
                <X size={12} weight="bold" />
              </button>
            </Badge>
          ))}
          {selectedChapters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="h-7 text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
      )}

      {/* Selection Status */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedIds.length} of {maxSelections} selected
          {!hasMinimum && (
            <span className="text-orange-600 ml-2">
              (Select at least {minSelections})
            </span>
          )}
        </p>
      </div>

      {/* Multi-Select Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select chapters to compare"
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate">
              {selectedChapters.length > 0
                ? `${selectedChapters.length} chapter${selectedChapters.length > 1 ? 's' : ''} selected`
                : 'Select chapters to compare...'}
            </span>
            <CaretDown size={16} className="ml-2 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search chapters..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No chapters found.</CommandEmpty>

              {/* Quick Presets */}
              <CommandGroup heading="Quick Presets">
                {quickPresets.map(preset => (
                  <CommandItem
                    key={preset.id}
                    onSelect={() => handleApplyPreset(preset)}
                    className="flex items-center gap-2"
                  >
                    {preset.icon}
                    <span>{preset.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandSeparator />

              {/* National Chapters */}
              {filteredChapters.national.length > 0 && (
                <CommandGroup heading="National">
                  {filteredChapters.national.map(chapter => {
                    const isSelected = selectedIds.includes(chapter.id)
                    const isDisabled = !isSelected && !canAddMore

                    return (
                      <CommandItem
                        key={chapter.id}
                        onSelect={() => !isDisabled && handleToggleChapter(chapter.id)}
                        disabled={isDisabled}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getChapterIcon(chapter.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{chapter.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {chapter.memberCount.toLocaleString()} members
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check size={16} weight="bold" className="text-primary shrink-0" />
                        )}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}

              {/* State Chapters */}
              {filteredChapters.state.length > 0 && (
                <CommandGroup heading="State Chapters">
                  {filteredChapters.state.map(chapter => {
                    const isSelected = selectedIds.includes(chapter.id)
                    const isDisabled = !isSelected && !canAddMore

                    return (
                      <CommandItem
                        key={chapter.id}
                        onSelect={() => !isDisabled && handleToggleChapter(chapter.id)}
                        disabled={isDisabled}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getChapterIcon(chapter.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{chapter.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {chapter.state} • {chapter.memberCount.toLocaleString()} members
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check size={16} weight="bold" className="text-primary shrink-0" />
                        )}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}

              {/* Local Chapters */}
              {filteredChapters.local.length > 0 && (
                <CommandGroup heading="Local Chapters">
                  {filteredChapters.local.map(chapter => {
                    const isSelected = selectedIds.includes(chapter.id)
                    const isDisabled = !isSelected && !canAddMore

                    return (
                      <CommandItem
                        key={chapter.id}
                        onSelect={() => !isDisabled && handleToggleChapter(chapter.id)}
                        disabled={isDisabled}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getChapterIcon(chapter.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{chapter.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {getChapterBreadcrumb(chapter)} • {chapter.memberCount.toLocaleString()} members
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check size={16} weight="bold" className="text-primary shrink-0" />
                        )}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selection Limit Warning */}
      {!canAddMore && (
        <p className="text-xs text-orange-600">
          Maximum {maxSelections} chapters can be compared at once
        </p>
      )}
    </div>
  )
}
