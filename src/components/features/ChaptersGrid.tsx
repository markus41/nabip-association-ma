import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash, Check, X, PencilSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Chapter, ChapterType } from '@/lib/types'

interface ChaptersGridProps {
  chapters: Chapter[]
  loading?: boolean
}

interface EditableChapter extends Chapter {
  isNew?: boolean
  isEditing?: boolean
}

export function ChaptersGrid({ chapters: initialChapters, loading }: ChaptersGridProps) {
  const [chapters, setChapters] = useKV<Chapter[]>('ams-chapters', initialChapters)
  const [editableChapters, setEditableChapters] = useState<EditableChapter[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    if (chapters) {
      setEditableChapters(chapters.map(c => ({ ...c, isEditing: false })))
    }
  }, [chapters])

  const handleAddNew = () => {
    const newChapter: EditableChapter = {
      id: `temp-${Date.now()}`,
      name: '',
      type: 'local',
      memberCount: 0,
      activeEventsCount: 0,
      region: '',
      isNew: true,
      isEditing: true
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
          return original ? { ...original, isEditing: false } : c
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

    const { isNew, isEditing, ...chapterData } = chapter
    
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

    setEditableChapters(editableChapters.map(c =>
      c.id === id ? { ...chapterData, isEditing: false } : c
    ))
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this chapter?')) {
      setChapters((current) => (current || []).filter(c => c.id !== id))
      setEditableChapters(editableChapters.filter(c => c.id !== id))
      toast.success('Chapter deleted successfully')
    }
  }

  const handleFieldChange = (id: string, field: keyof Chapter, value: any) => {
    setEditableChapters(editableChapters.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ))
  }

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
      <div className="p-4 border-b bg-muted/30">
        <Button onClick={handleAddNew} size="sm" className="gap-2">
          <Plus size={16} weight="bold" />
          Add Chapter
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Region</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Members</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Events</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Contact Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Website</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {editableChapters.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  No chapters found. Click "Add Chapter" to create one.
                </td>
              </tr>
            ) : (
              editableChapters.map((chapter) => (
                <tr
                  key={chapter.id}
                  className={`border-b hover:bg-muted/20 transition-colors ${
                    chapter.isEditing ? 'bg-accent/5' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    {chapter.isEditing ? (
                      <Input
                        value={chapter.name}
                        onChange={(e) => handleFieldChange(chapter.id, 'name', e.target.value)}
                        placeholder="Chapter name"
                        className="h-8"
                      />
                    ) : (
                      <span className="font-medium">{chapter.name}</span>
                    )}
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
                      <Input
                        value={chapter.region || ''}
                        onChange={(e) => handleFieldChange(chapter.id, 'region', e.target.value)}
                        placeholder="Region"
                        className="h-8"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">{chapter.region || '-'}</span>
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
                        className="h-8 w-24"
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
                        className="h-8"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">{chapter.contactEmail || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {chapter.isEditing ? (
                      <Input
                        type="url"
                        value={chapter.websiteUrl || ''}
                        onChange={(e) => handleFieldChange(chapter.id, 'websiteUrl', e.target.value)}
                        placeholder="https://example.com"
                        className="h-8"
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
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t bg-muted/30 text-sm text-muted-foreground">
        Showing {editableChapters.length} chapter{editableChapters.length !== 1 ? 's' : ''}
      </div>
    </Card>
  )
}
