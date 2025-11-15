import { useState, useEffect, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash, Check, X, PencilSimple, CaretRight, CaretDown, Users, CalendarDots, ChartBar, EnvelopeSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Chapter, ChapterType } from '@/lib/types'

interface ChaptersGridProps {
  chapters: Chapter[]
  loading?: boolean
}

interface EditableChapter extends Chapter {
  isNew?: boolean
  isEditing?: boolean
  level?: number
  hasChildren?: boolean
  isExpanded?: boolean
}

export function ChaptersGrid({ chapters: initialChapters, loading }: ChaptersGridProps) {
  const [chapters, setChapters] = useKV<Chapter[]>('ams-chapters', initialChapters)
  const [editableChapters, setEditableChapters] = useState<EditableChapter[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['chapter-national']))
  const [viewMode, setViewMode] = useState<'hierarchy' | 'flat'>('hierarchy')

  const hierarchicalChapters = useMemo(() => {
    if (!chapters) return []
    
    const buildHierarchy = (parentId: string | undefined, level: number): EditableChapter[] => {
      const children = chapters
        .filter(c => c.parentChapterId === parentId)
        .sort((a, b) => a.name.localeCompare(b.name))
      
      const result: EditableChapter[] = []
      
      for (const chapter of children) {
        const hasChildren = chapters.some(c => c.parentChapterId === chapter.id)
        const isExpanded = expandedIds.has(chapter.id)
        
        result.push({
          ...chapter,
          level,
          hasChildren,
          isExpanded,
          isEditing: false
        })
        
        if (isExpanded && hasChildren) {
          result.push(...buildHierarchy(chapter.id, level + 1))
        }
      }
      
      return result
    }
    
    return buildHierarchy(undefined, 0)
  }, [chapters, expandedIds])

  useEffect(() => {
    if (chapters) {
      if (viewMode === 'hierarchy') {
        setEditableChapters(hierarchicalChapters)
      } else {
        setEditableChapters(
          chapters
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(c => ({ ...c, isEditing: false, level: 0 }))
        )
      }
    }
  }, [chapters, hierarchicalChapters, viewMode])

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleAddNew = () => {
    const newChapter: EditableChapter = {
      id: `temp-${Date.now()}`,
      name: '',
      type: 'local',
      memberCount: 0,
      activeEventsCount: 0,
      state: '',
      city: '',
      region: '',
      isNew: true,
      isEditing: true,
      level: 0
    }
    setEditableChapters([newChapter, ...editableChapters])
    setEditingId(newChapter.id)
  }

  const handleEdit = (id: string) => {
    setEditingId(id)
    setEditableChapters(editableChapters.map(c => 
      c.id === id ? { ...c, isEditing: true } : c
    ))
  }

  const handleCancel = (id: string) => {
    const chapter = editableChapters.find(c => c.id === id)
    if (chapter?.isNew) {
      setEditableChapters(editableChapters.filter(c => c.id !== id))
    } else {
      setEditableChapters(editableChapters.map(c => {
        if (c.id === id) {
          const original = chapters?.find(ch => ch.id === id)
          return original ? { ...original, isEditing: false, level: c.level } : c
        }
        return c
      }))
    }
    setEditingId(null)
  }

  const handleSave = (id: string) => {
    const chapter = editableChapters.find(c => c.id === id)
    if (!chapter) return

    if (!chapter.name.trim()) {
      toast.error('Chapter name is required')
      return
    }

    const { isNew, isEditing, level, hasChildren, isExpanded, ...chapterData } = chapter
    
    if (isNew) {
      const newChapter = {
        ...chapterData,
        id: `chapter-${Date.now()}`
      }
      setChapters((current) => [newChapter, ...(current || [])])
      toast.success('Chapter added successfully')
    } else {
      setChapters((current) =>
        (current || []).map(c => c.id === id ? chapterData : c)
      )
      toast.success('Chapter updated successfully')
    }

    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    const hasChildren = chapters?.some(c => c.parentChapterId === id)
    if (hasChildren) {
      toast.error('Cannot delete chapter with child chapters')
      return
    }
    
    if (confirm('Are you sure you want to delete this chapter?')) {
      setChapters((current) => (current || []).filter(c => c.id !== id))
      toast.success('Chapter deleted successfully')
    }
  }

  const handleFieldChange = (id: string, field: keyof Chapter, value: any) => {
    setEditableChapters(editableChapters.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ))
  }

  const handleViewMembers = (chapter: Chapter) => {
    toast.info('View Members', {
      description: `Loading members for ${chapter.name}...`
    })
    // TODO: Navigate to members view filtered by this chapter
  }

  const handleViewEvents = (chapter: Chapter) => {
    toast.info('View Events', {
      description: `Loading events for ${chapter.name}...`
    })
    // TODO: Navigate to events view filtered by this chapter
  }

  const handleViewFinancials = (chapter: Chapter) => {
    toast.info('View Financials', {
      description: `Loading financial report for ${chapter.name}...`
    })
    // TODO: Navigate to finance view filtered by this chapter
  }

  const handleMessageLeaders = (chapter: Chapter) => {
    toast.success('Message Leaders', {
      description: `Opening message dialog for ${chapter.name} leaders...`
    })
    // TODO: Open message composition dialog
  }

  const availableParentChapters = useMemo(() => {
    if (!chapters) return []
    return chapters.filter(c => c.type !== 'local')
  }, [chapters])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-muted animate-shimmer rounded w-1/4" />
          <div className="h-64 bg-muted animate-shimmer rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={handleAddNew} size="sm" className="gap-2">
            <Plus size={16} weight="bold" />
            Add Chapter
          </Button>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant={viewMode === 'hierarchy' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('hierarchy')}
            >
              Hierarchy
            </Button>
            <Button
              variant={viewMode === 'flat' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('flat')}
            >
              All
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {editableChapters.length} visible of {chapters?.length || 0} total
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 text-left text-sm font-semibold min-w-[280px]">Chapter Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Parent Chapter</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">State</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">City</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Members</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Events</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Contact</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Website</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {editableChapters.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                  No chapters found. Click "Add Chapter" to create one.
                </td>
              </tr>
            ) : (
              editableChapters.map((chapter) => {
                const parentChapter = chapter.parentChapterId 
                  ? chapters?.find(c => c.id === chapter.parentChapterId)
                  : null
                
                return (
                  <tr
                    key={chapter.id}
                    className={`border-b hover:bg-muted/20 transition-colors ${
                      chapter.isEditing ? 'bg-accent/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {viewMode === 'hierarchy' && (
                          <div style={{ paddingLeft: `${(chapter.level || 0) * 24}px` }} className="flex items-center gap-1">
                            {chapter.hasChildren && (
                              <button
                                onClick={() => toggleExpand(chapter.id)}
                                className="p-0.5 hover:bg-muted rounded transition-colors"
                              >
                                {chapter.isExpanded ? (
                                  <CaretDown size={14} weight="bold" />
                                ) : (
                                  <CaretRight size={14} weight="bold" />
                                )}
                              </button>
                            )}
                            {!chapter.hasChildren && <div className="w-[18px]" />}
                          </div>
                        )}
                        {chapter.isEditing ? (
                          <Input
                            value={chapter.name}
                            onChange={(e) => handleFieldChange(chapter.id, 'name', e.target.value)}
                            placeholder="Chapter name"
                            className="h-8 min-w-[200px]"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{chapter.name}</span>
                            {chapter.type === 'national' && (
                              <Badge variant="secondary" className="text-xs">National</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {chapter.isEditing ? (
                        <Select
                          value={chapter.type}
                          onValueChange={(value) => handleFieldChange(chapter.id, 'type', value as ChapterType)}
                        >
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="national">National</SelectItem>
                            <SelectItem value="state">State</SelectItem>
                            <SelectItem value="local">Local</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="capitalize text-sm">{chapter.type}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {chapter.isEditing ? (
                        <Select
                          value={chapter.parentChapterId || 'none'}
                          onValueChange={(value) => handleFieldChange(chapter.id, 'parentChapterId', value === 'none' ? undefined : value)}
                        >
                          <SelectTrigger className="h-8 w-48">
                            <SelectValue placeholder="No parent" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No parent</SelectItem>
                            {availableParentChapters.map(pc => (
                              <SelectItem key={pc.id} value={pc.id}>
                                {pc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {parentChapter?.name || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {chapter.isEditing ? (
                        <Input
                          value={chapter.state || ''}
                          onChange={(e) => handleFieldChange(chapter.id, 'state', e.target.value)}
                          placeholder="State"
                          className="h-8 w-32"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">{chapter.state || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {chapter.isEditing ? (
                        <Input
                          value={chapter.city || ''}
                          onChange={(e) => handleFieldChange(chapter.id, 'city', e.target.value)}
                          placeholder="City"
                          className="h-8 w-32"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">{chapter.city || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {chapter.isEditing ? (
                        <Input
                          type="number"
                          value={chapter.memberCount}
                          onChange={(e) => handleFieldChange(chapter.id, 'memberCount', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="h-8 w-24"
                        />
                      ) : (
                        <span className="text-sm tabular-nums">{chapter.memberCount.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {chapter.isEditing ? (
                        <Input
                          type="number"
                          value={chapter.activeEventsCount}
                          onChange={(e) => handleFieldChange(chapter.id, 'activeEventsCount', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="h-8 w-20"
                        />
                      ) : (
                        <span className="text-sm tabular-nums">{chapter.activeEventsCount}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {chapter.isEditing ? (
                        <Input
                          type="email"
                          value={chapter.contactEmail || ''}
                          onChange={(e) => handleFieldChange(chapter.id, 'contactEmail', e.target.value)}
                          placeholder="email@example.com"
                          className="h-8 min-w-[180px]"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground truncate max-w-[180px] block">
                          {chapter.contactEmail || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {chapter.isEditing ? (
                        <Input
                          type="url"
                          value={chapter.websiteUrl || ''}
                          onChange={(e) => handleFieldChange(chapter.id, 'websiteUrl', e.target.value)}
                          placeholder="https://example.com"
                          className="h-8 min-w-[180px]"
                        />
                      ) : chapter.websiteUrl ? (
                        <a
                          href={chapter.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Visit
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {chapter.isEditing ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleSave(chapter.id)}
                            >
                              <Check size={16} className="text-teal" weight="bold" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleCancel(chapter.id)}
                            >
                              <X size={16} className="text-destructive" weight="bold" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEdit(chapter.id)}
                              disabled={editingId !== null}
                            >
                              <PencilSimple size={16} weight="bold" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-destructive/10"
                              onClick={() => handleDelete(chapter.id)}
                              disabled={editingId !== null}
                            >
                              <Trash size={16} className="text-destructive" weight="bold" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t bg-muted/30 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {chapters && (
            <div className="flex items-center gap-4">
              <span>
                <span className="font-medium">{chapters.filter(c => c.type === 'national').length}</span> National
              </span>
              <span>•</span>
              <span>
                <span className="font-medium">{chapters.filter(c => c.type === 'state').length}</span> State
              </span>
              <span>•</span>
              <span>
                <span className="font-medium">{chapters.filter(c => c.type === 'local').length}</span> Local
              </span>
            </div>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-medium">{chapters?.length || 0}</span> chapters
        </div>
      </div>
    </Card>
  )
}
