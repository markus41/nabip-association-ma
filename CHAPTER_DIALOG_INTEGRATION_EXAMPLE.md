# Chapter Dialog Integration Example

## Quick Start Integration

This example shows how to integrate the Chapter Creation and Edit dialogs into the ChaptersView component.

---

## Step 1: Add State Management

Add state variables to manage dialog visibility and selected chapter:

```typescript
// In ChaptersView.tsx (or similar component)

import { useState } from 'react'
import { ChapterCreationDialog } from '@/components/features/ChapterCreationDialog'
import { ChapterEditDialog } from '@/components/features/ChapterEditDialog'
import type { Chapter } from '@/lib/types'

export function ChaptersView() {
  const [chapters, setChapters] = useKV<Chapter[]>('ams-chapters', [])

  // Dialog state management
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)

  // ... rest of component
}
```

---

## Step 2: Add Success Handlers

Create handlers for successful chapter creation and editing:

```typescript
/**
 * Handle successful chapter creation
 * Adds new chapter to state and shows success toast
 */
const handleCreateChapter = (newChapter: Chapter) => {
  setChapters([...chapters, newChapter])

  // Optional: Add analytics tracking
  // analytics.track('Chapter Created', { type: newChapter.type })
}

/**
 * Handle successful chapter update
 * Updates chapter in state and shows success toast
 */
const handleUpdateChapter = (updatedChapter: Chapter) => {
  setChapters(
    chapters.map(chapter =>
      chapter.id === updatedChapter.id ? updatedChapter : chapter
    )
  )

  // Close edit dialog
  setEditingChapter(null)

  // Optional: Add analytics tracking
  // analytics.track('Chapter Updated', { id: updatedChapter.id })
}
```

---

## Step 3: Add "Create Chapter" Button

Add a button to trigger the creation dialog:

```typescript
import { Buildings, Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

// In your component's JSX (e.g., in a toolbar or header)
<Button onClick={() => setShowCreateDialog(true)}>
  <Plus size={16} className="mr-2" />
  Create Chapter
</Button>
```

**Alternative with icon-only button:**

```typescript
<Button
  onClick={() => setShowCreateDialog(true)}
  size="icon"
  aria-label="Create new chapter"
>
  <Plus size={20} />
</Button>
```

---

## Step 4: Add "Edit" Trigger

Add edit functionality to your chapter list/table:

### Option A: Table Row Action

```typescript
import { PencilSimple } from '@phosphor-icons/react'

// In your table column definitions
{
  id: 'actions',
  cell: ({ row }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setEditingChapter(row.original)}
      aria-label={`Edit ${row.original.name}`}
    >
      <PencilSimple size={16} className="mr-2" />
      Edit
    </Button>
  )
}
```

### Option B: Context Menu

```typescript
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

<ContextMenu>
  <ContextMenuTrigger>
    {/* Your chapter card or row */}
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onClick={() => setEditingChapter(chapter)}>
      <PencilSimple size={16} className="mr-2" />
      Edit Chapter
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

---

## Step 5: Render Dialogs

Add both dialogs at the bottom of your component's JSX:

```typescript
return (
  <>
    {/* Your existing chapter view UI */}
    <div className="space-y-6">
      {/* Toolbar with Create button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Chapters</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus size={16} className="mr-2" />
          Create Chapter
        </Button>
      </div>

      {/* Your chapters list/grid/table */}
      {/* ... */}
    </div>

    {/* Chapter Creation Dialog */}
    <ChapterCreationDialog
      open={showCreateDialog}
      onOpenChange={setShowCreateDialog}
      onSuccess={handleCreateChapter}
      existingChapters={chapters}
    />

    {/* Chapter Edit Dialog (only renders when editingChapter is set) */}
    {editingChapter && (
      <ChapterEditDialog
        open={!!editingChapter}
        onOpenChange={(open) => {
          if (!open) setEditingChapter(null)
        }}
        chapter={editingChapter}
        onSuccess={handleUpdateChapter}
        existingChapters={chapters}
      />
    )}
  </>
)
```

---

## Complete Integration Example

Here's a complete minimal example combining all steps:

```typescript
import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { ChapterCreationDialog } from '@/components/features/ChapterCreationDialog'
import { ChapterEditDialog } from '@/components/features/ChapterEditDialog'
import { Plus, PencilSimple } from '@phosphor-icons/react'
import type { Chapter } from '@/lib/types'

export function ChaptersView() {
  // State management
  const [chapters, setChapters] = useKV<Chapter[]>('ams-chapters', [])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)

  // Success handlers
  const handleCreateChapter = (newChapter: Chapter) => {
    setChapters([...chapters, newChapter])
  }

  const handleUpdateChapter = (updatedChapter: Chapter) => {
    setChapters(
      chapters.map(c => c.id === updatedChapter.id ? updatedChapter : c)
    )
    setEditingChapter(null)
  }

  return (
    <>
      <div className="space-y-6 p-6">
        {/* Header with Create button */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Chapter Management</h1>
            <p className="text-muted-foreground">
              Manage your organization's chapter hierarchy
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus size={16} className="mr-2" />
            Create Chapter
          </Button>
        </div>

        {/* Chapters Grid/List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.map(chapter => (
            <div
              key={chapter.id}
              className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{chapter.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {chapter.type} Chapter
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingChapter(chapter)}
                  aria-label={`Edit ${chapter.name}`}
                >
                  <PencilSimple size={16} />
                </Button>
              </div>

              <div className="text-sm space-y-1">
                <p className="text-muted-foreground">
                  {chapter.memberCount} members
                </p>
                {chapter.contactEmail && (
                  <p className="text-muted-foreground">{chapter.contactEmail}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {chapters.length === 0 && (
          <div className="text-center py-12 border rounded-lg border-dashed">
            <Buildings size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Chapters Yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first chapter
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus size={16} className="mr-2" />
              Create First Chapter
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ChapterCreationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateChapter}
        existingChapters={chapters}
      />

      {editingChapter && (
        <ChapterEditDialog
          open={!!editingChapter}
          onOpenChange={(open) => !open && setEditingChapter(null)}
          chapter={editingChapter}
          onSuccess={handleUpdateChapter}
          existingChapters={chapters}
        />
      )}
    </>
  )
}
```

---

## Advanced Integration Patterns

### Pattern 1: URL-Based Dialog State

Open dialogs based on URL parameters (useful for deep linking):

```typescript
import { useSearchParams } from 'react-router-dom'

const [searchParams, setSearchParams] = useSearchParams()

// Open create dialog from URL
useEffect(() => {
  if (searchParams.get('action') === 'create') {
    setShowCreateDialog(true)
  }
}, [searchParams])

// Update URL when dialog opens
const handleOpenCreate = () => {
  setSearchParams({ action: 'create' })
  setShowCreateDialog(true)
}

// Clear URL when dialog closes
const handleCloseCreate = (open: boolean) => {
  if (!open) {
    setSearchParams({})
  }
  setShowCreateDialog(open)
}
```

### Pattern 2: Confirmation Dialog Before Edit

Show a confirmation before allowing edits to critical chapters:

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const [pendingEdit, setPendingEdit] = useState<Chapter | null>(null)

const handleEditClick = (chapter: Chapter) => {
  if (chapter.type === 'national') {
    // Show confirmation for national chapter edits
    setPendingEdit(chapter)
  } else {
    // Directly open edit dialog for other chapters
    setEditingChapter(chapter)
  }
}

// In JSX
<AlertDialog open={!!pendingEdit} onOpenChange={() => setPendingEdit(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Edit National Chapter?</AlertDialogTitle>
      <AlertDialogDescription>
        Changes to the national chapter may affect all state and local chapters.
        Please proceed with caution.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={() => {
        setEditingChapter(pendingEdit)
        setPendingEdit(null)
      }}>
        Continue to Edit
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Pattern 3: Optimistic Updates with Rollback

Update UI immediately, then rollback on error:

```typescript
const handleUpdateChapter = async (updatedChapter: Chapter) => {
  // Store original state for rollback
  const originalChapters = [...chapters]

  // Optimistic update (immediate UI feedback)
  setChapters(
    chapters.map(c => c.id === updatedChapter.id ? updatedChapter : c)
  )
  setEditingChapter(null)

  try {
    // Persist to server (if you have a backend)
    await api.updateChapter(updatedChapter)

    toast.success('Chapter updated successfully')
  } catch (error) {
    // Rollback on error
    setChapters(originalChapters)

    toast.error('Failed to update chapter', {
      description: 'Changes have been reverted. Please try again.'
    })

    // Reopen dialog to allow retry
    setEditingChapter(updatedChapter)
  }
}
```

---

## Keyboard Shortcuts

Add keyboard shortcuts to improve power user experience:

```typescript
import { useEffect } from 'react'

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd/Ctrl + K to open create dialog
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setShowCreateDialog(true)
    }

    // Escape to close dialogs
    if (e.key === 'Escape') {
      if (showCreateDialog) setShowCreateDialog(false)
      if (editingChapter) setEditingChapter(null)
    }
  }

  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}, [showCreateDialog, editingChapter])
```

**Announce shortcuts to users:**

```typescript
<div className="text-sm text-muted-foreground">
  Press <kbd className="px-2 py-1 bg-muted rounded">Cmd+K</kbd> to create a new chapter
</div>
```

---

## Filtering Integration

If you have chapter filtering UI, preserve filters when dialogs open/close:

```typescript
const [filters, setFilters] = useState({
  type: 'all' as 'all' | 'national' | 'state' | 'local',
  search: '',
})

// Filter chapters based on current filters
const filteredChapters = chapters.filter(chapter => {
  if (filters.type !== 'all' && chapter.type !== filters.type) {
    return false
  }
  if (filters.search && !chapter.name.toLowerCase().includes(filters.search.toLowerCase())) {
    return false
  }
  return true
})

// Use filteredChapters in your UI but pass all chapters to dialogs
<ChapterCreationDialog
  // ... other props
  existingChapters={chapters} // Not filteredChapters - need all for parent selection
/>
```

---

## Analytics Integration

Track chapter operations for insights:

```typescript
import { analytics } from '@/lib/analytics'

const handleCreateChapter = (newChapter: Chapter) => {
  setChapters([...chapters, newChapter])

  // Track creation event
  analytics.track('Chapter Created', {
    chapter_id: newChapter.id,
    chapter_type: newChapter.type,
    has_parent: !!newChapter.parentChapterId,
    timestamp: new Date().toISOString(),
  })
}

const handleUpdateChapter = (updatedChapter: Chapter) => {
  const originalChapter = chapters.find(c => c.id === updatedChapter.id)

  setChapters(
    chapters.map(c => c.id === updatedChapter.id ? updatedChapter : c)
  )
  setEditingChapter(null)

  // Track update event with changes
  analytics.track('Chapter Updated', {
    chapter_id: updatedChapter.id,
    chapter_type: updatedChapter.type,
    fields_changed: Object.keys(updatedChapter).filter(
      key => originalChapter?.[key] !== updatedChapter[key]
    ),
    timestamp: new Date().toISOString(),
  })
}
```

---

## Testing Integration

Example test suite for integration:

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChaptersView } from './ChaptersView'

describe('ChaptersView Integration', () => {
  it('opens create dialog when button clicked', async () => {
    render(<ChaptersView />)

    const createButton = screen.getByRole('button', { name: /create chapter/i })
    await userEvent.click(createButton)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/create new chapter/i)).toBeInTheDocument()
  })

  it('opens edit dialog when edit button clicked', async () => {
    render(<ChaptersView />)

    const editButton = screen.getByRole('button', { name: /edit california/i })
    await userEvent.click(editButton)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByDisplayValue('California State Chapter')).toBeInTheDocument()
  })

  it('creates chapter successfully', async () => {
    render(<ChaptersView />)

    // Open dialog
    await userEvent.click(screen.getByRole('button', { name: /create chapter/i }))

    // Fill form
    await userEvent.type(screen.getByLabelText(/chapter name/i), 'New Chapter')
    await userEvent.click(screen.getByRole('combobox', { name: /chapter type/i }))
    await userEvent.click(screen.getByText('Local Chapter'))

    // Submit
    await userEvent.click(screen.getByRole('button', { name: /create chapter/i }))

    // Verify chapter appears in list
    await waitFor(() => {
      expect(screen.getByText('New Chapter')).toBeInTheDocument()
    })
  })
})
```

---

## Troubleshooting Common Issues

### Issue: Dialog doesn't open

**Check**:
1. Verify state variable is updated: `console.log(showCreateDialog)`
2. Ensure dialog is rendered in JSX
3. Check for conflicting z-index styles

**Fix**:
```typescript
// Add debug logging
<Button onClick={() => {
  console.log('Opening create dialog')
  setShowCreateDialog(true)
}}>
  Create Chapter
</Button>
```

### Issue: Form data not clearing between opens

**Check**: `useEffect` dependency array in dialogs

**Fix**: Ensure both dialogs have proper reset logic (already implemented)

### Issue: Parent chapter list is empty

**Check**: `existingChapters` prop value

**Fix**: Verify chapters are loaded before rendering dialog:
```typescript
{chapters.length > 0 && (
  <ChapterCreationDialog
    existingChapters={chapters}
    // ...
  />
)}
```

---

## Next Steps

1. **Implement the integration** using the complete example above
2. **Test the dialogs** with various chapter types and scenarios
3. **Add analytics** to track usage patterns
4. **Customize styling** to match your design system (if needed)
5. **Deploy to production** after thorough testing

**Questions?** Refer to the main implementation guide at `CHAPTER_DIALOG_IMPLEMENTATION.md`

---

**Ready to integrate!** ✅
