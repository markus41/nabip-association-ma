import { useState, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Buildings,
  MapTrifold,
  Users,
  CaretUp,
  CaretDown,
  CaretRight,
  CaretDown as CaretDownExpand,
  MagnifyingGlass,
  DownloadSimple,
  Funnel,
  X
} from '@phosphor-icons/react'
import type { Chapter } from '@/lib/types'
import { toast } from 'sonner'

/**
 * Establishes sortable table view for chapter management with advanced filtering capabilities.
 * Implements hierarchical grouping with inline expand/collapse and multi-select operations.
 *
 * Best for: Bulk operations and detailed chapter comparison across organizational tiers
 *
 * @param chapters - Array of all chapters to display
 * @param onSelectChapter - Callback when a chapter row is clicked
 * @param onEditChapter - Optional callback to edit chapter details
 * @param onBulkAction - Optional callback for bulk operations with selected chapters
 */
export interface ChapterHierarchyTableProps {
  chapters: Chapter[]
  onSelectChapter?: (chapter: Chapter) => void
  onEditChapter?: (chapter: Chapter) => void
  onBulkAction?: (action: string, chapterIds: string[]) => void
}

type SortField = 'name' | 'type' | 'memberCount' | 'activeEventsCount' | 'state'
type SortDirection = 'asc' | 'desc'

interface ExpandedRow {
  chapterId: string
  children: Chapter[]
}

export function ChapterHierarchyTable({
  chapters,
  onSelectChapter,
  onEditChapter,
  onBulkAction
}: ChapterHierarchyTableProps) {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedRows, setExpandedRows] = useState<Map<string, ExpandedRow>>(new Map())
  const [filterType, setFilterType] = useState<'all' | Chapter['type']>('all')

  /**
   * Toggle sort direction or change sort field.
   */
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }, [sortField])

  /**
   * Build map of parent chapters to their children.
   */
  const childrenMap = useMemo(() => {
    const map = new Map<string, Chapter[]>()
    chapters.forEach(chapter => {
      if (chapter.parentChapterId) {
        const existing = map.get(chapter.parentChapterId) || []
        map.set(chapter.parentChapterId, [...existing, chapter])
      }
    })
    return map
  }, [chapters])

  /**
   * Filter and sort chapters based on current criteria.
   */
  const filteredAndSortedChapters = useMemo(() => {
    let filtered = chapters

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(c => c.type === filterType)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.state?.toLowerCase().includes(query) ||
          c.city?.toLowerCase().includes(query) ||
          c.president?.toLowerCase().includes(query) ||
          c.contactEmail?.toLowerCase().includes(query)
      )
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'memberCount':
          comparison = a.memberCount - b.memberCount
          break
        case 'activeEventsCount':
          comparison = a.activeEventsCount - b.activeEventsCount
          break
        case 'state':
          comparison = (a.state || '').localeCompare(b.state || '')
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [chapters, filterType, searchQuery, sortField, sortDirection])

  /**
   * Toggle row expansion to show child chapters.
   */
  const toggleRowExpansion = useCallback((chapterId: string) => {
    setExpandedRows(prev => {
      const next = new Map(prev)
      if (next.has(chapterId)) {
        next.delete(chapterId)
      } else {
        const children = childrenMap.get(chapterId) || []
        next.set(chapterId, { chapterId, children })
      }
      return next
    })
  }, [childrenMap])

  /**
   * Handle multi-select checkbox toggles.
   */
  const toggleSelection = useCallback((chapterId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(chapterId)) {
        next.delete(chapterId)
      } else {
        next.add(chapterId)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredAndSortedChapters.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredAndSortedChapters.map(c => c.id)))
    }
  }, [selectedIds.size, filteredAndSortedChapters])

  /**
   * Export table data as CSV.
   */
  const handleExport = useCallback(() => {
    const headers = ['Name', 'Type', 'Parent Chapter', 'State', 'City', 'Members', 'Events', 'Contact Email', 'Phone']

    const rows = filteredAndSortedChapters.map(chapter => {
      const parent = chapter.parentChapterId
        ? chapters.find(c => c.id === chapter.parentChapterId)
        : null

      return [
        chapter.name,
        chapter.type,
        parent?.name || '',
        chapter.state || '',
        chapter.city || '',
        chapter.memberCount,
        chapter.activeEventsCount,
        chapter.contactEmail || '',
        chapter.phone || ''
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `chapters-export-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Export Complete', {
      description: `Exported ${filteredAndSortedChapters.length} chapters to CSV`
    })
  }, [filteredAndSortedChapters, chapters])

  /**
   * Handle bulk actions on selected chapters.
   */
  const handleBulkActionClick = useCallback((action: string) => {
    if (selectedIds.size === 0) {
      toast.error('No chapters selected')
      return
    }

    if (onBulkAction) {
      onBulkAction(action, Array.from(selectedIds))
    } else {
      toast.info(`Bulk ${action}`, {
        description: `Action would apply to ${selectedIds.size} selected chapters`
      })
    }
  }, [selectedIds, onBulkAction])

  const getChapterIcon = (type: Chapter['type']) => {
    switch (type) {
      case 'national':
        return <Buildings size={16} weight="duotone" className="text-primary" />
      case 'state':
        return <MapTrifold size={16} weight="duotone" className="text-teal" />
      case 'local':
        return <Users size={16} weight="duotone" className="text-accent-foreground" />
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <CaretUp size={14} weight="bold" className="ml-1" />
    ) : (
      <CaretDown size={14} weight="bold" className="ml-1" />
    )
  }

  const renderRow = (chapter: Chapter, isChild = false) => {
    const isExpanded = expandedRows.has(chapter.id)
    const hasChildren = (childrenMap.get(chapter.id)?.length || 0) > 0
    const isSelected = selectedIds.has(chapter.id)
    const parentChapter = chapter.parentChapterId
      ? chapters.find(c => c.id === chapter.parentChapterId)
      : null

    return (
      <>
        <TableRow
          key={chapter.id}
          className={`${isSelected ? 'bg-primary/5' : ''} ${isChild ? 'bg-muted/30' : ''} hover:bg-muted/50 cursor-pointer transition-colors`}
          onClick={() => onSelectChapter?.(chapter)}
        >
          <TableCell className="w-12">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleSelection(chapter.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select ${chapter.name}`}
            />
          </TableCell>

          <TableCell>
            <div className="flex items-center gap-2">
              {hasChildren && !isChild && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleRowExpansion(chapter.id)
                  }}
                  className="p-0.5 hover:bg-muted rounded transition-colors"
                  aria-label={isExpanded ? 'Collapse children' : 'Expand children'}
                >
                  {isExpanded ? (
                    <CaretDownExpand size={14} weight="bold" />
                  ) : (
                    <CaretRight size={14} weight="bold" />
                  )}
                </button>
              )}
              {!hasChildren && !isChild && <div className="w-[18px]" />}
              {isChild && <div className="w-6" />}

              {getChapterIcon(chapter.type)}
              <span className="font-medium">{chapter.name}</span>
            </div>
          </TableCell>

          <TableCell>
            <Badge variant="outline" className="capitalize">
              {chapter.type}
            </Badge>
          </TableCell>

          <TableCell className="text-sm text-muted-foreground">
            {parentChapter?.name || '-'}
          </TableCell>

          <TableCell className="text-sm">{chapter.state || '-'}</TableCell>

          <TableCell className="text-sm">{chapter.city || '-'}</TableCell>

          <TableCell className="text-right tabular-nums font-medium">
            {chapter.memberCount.toLocaleString()}
          </TableCell>

          <TableCell className="text-right tabular-nums">
            {chapter.activeEventsCount}
          </TableCell>

          <TableCell className="text-sm">
            {chapter.contactEmail ? (
              <a
                href={`mailto:${chapter.contactEmail}`}
                className="text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {chapter.contactEmail}
              </a>
            ) : (
              '-'
            )}
          </TableCell>

          <TableCell>
            <div className="flex items-center gap-1">
              {onEditChapter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditChapter(chapter)
                  }}
                >
                  Edit
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>

        {isExpanded && expandedRows.get(chapter.id)?.children.map(child => (
          renderRow(child, true)
        ))}
      </>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b bg-muted/30 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Chapter Table</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2"
            >
              <DownloadSimple size={16} weight="bold" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass
              size={16}
              weight="bold"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              placeholder="Search by name, location, contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X size={16} weight="bold" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={filterType === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              All
            </Button>
            <Button
              variant={filterType === 'national' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('national')}
            >
              National
            </Button>
            <Button
              variant={filterType === 'state' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('state')}
            >
              State
            </Button>
            <Button
              variant={filterType === 'local' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('local')}
            >
              Local
            </Button>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
            <span className="text-sm font-medium">
              {selectedIds.size} chapter{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkActionClick('export')}
            >
              Export Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkActionClick('email')}
            >
              Email Leaders
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedIds.size === filteredAndSortedChapters.length &&
                    filteredAndSortedChapters.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all chapters"
                />
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center font-semibold hover:text-primary transition-colors"
                >
                  Name
                  <SortIcon field="name" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('type')}
                  className="flex items-center font-semibold hover:text-primary transition-colors"
                >
                  Type
                  <SortIcon field="type" />
                </button>
              </TableHead>
              <TableHead>Parent Chapter</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('state')}
                  className="flex items-center font-semibold hover:text-primary transition-colors"
                >
                  State
                  <SortIcon field="state" />
                </button>
              </TableHead>
              <TableHead>City</TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort('memberCount')}
                  className="flex items-center justify-end font-semibold hover:text-primary transition-colors ml-auto"
                >
                  Members
                  <SortIcon field="memberCount" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort('activeEventsCount')}
                  className="flex items-center justify-end font-semibold hover:text-primary transition-colors ml-auto"
                >
                  Events
                  <SortIcon field="activeEventsCount" />
                </button>
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedChapters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12">
                  <Buildings size={48} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground font-medium">
                    {searchQuery || filterType !== 'all'
                      ? 'No chapters match your filters'
                      : 'No chapters available'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedChapters.map(chapter => renderRow(chapter))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="px-4 py-3 border-t bg-muted/30 flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {filteredAndSortedChapters.length} of {chapters.length} chapters
        </div>
        {selectedIds.size > 0 && (
          <div>
            {selectedIds.size} selected
          </div>
        )}
      </div>
    </Card>
  )
}
