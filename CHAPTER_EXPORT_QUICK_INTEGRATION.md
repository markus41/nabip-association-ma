# Quick Integration Guide - Chapter Export & Bulk Operations

**5-Minute Setup** for adding export and bulk operations to existing chapter views.

---

## Step 1: Add Export Button to Your View

Add an export button to any existing chapter view (e.g., `ChaptersView.tsx`, `ChapterAdminView.tsx`):

```typescript
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileArrowDown } from '@phosphor-icons/react'
import { ChapterExportDialog } from '@/components/features/ChapterExportDialog'

// In your component
export function ChaptersView() {
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // Your existing chapters data
  const chapters = useKV<Chapter[]>('chapters', [])

  return (
    <div>
      {/* Add this button to your header/toolbar */}
      <Button onClick={() => setExportDialogOpen(true)}>
        <FileArrowDown size={16} className="mr-2" />
        Export
      </Button>

      {/* Your existing content */}
      <ChapterTable chapters={chapters} />

      {/* Add this dialog */}
      <ChapterExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        chapters={chapters}
        onExportComplete={(fileName, count) => {
          console.log(`Exported ${count} chapters to ${fileName}`)
        }}
      />
    </div>
  )
}
```

**That's it!** The export button is now functional with full CSV/Excel/PDF support.

---

## Step 2: Add Bulk Operations (Optional)

If you want bulk edit/delete, add selection support:

```typescript
import { useState } from 'react'
import { BulkOperationsPanel } from '@/components/features/BulkOperationsPanel'
import { BulkEditDialog } from '@/components/features/BulkEditDialog'
import { bulkDeleteChapters } from '@/lib/bulk-operations'
import { exportChapters } from '@/lib/export'

export function ChaptersView() {
  const [chapters, setChapters] = useKV<Chapter[]>('chapters', [])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkEditOpen, setBulkEditOpen] = useState(false)

  const handleBulkDelete = async (ids: string[]) => {
    const result = await bulkDeleteChapters(chapters, ids)
    if (result.success) {
      setChapters(chapters.filter(c => !ids.includes(c.id)))
      setSelectedIds([])
    }
  }

  const handleBulkExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    const selected = chapters.filter(c => selectedIds.includes(c.id))
    exportChapters(selected, {
      format,
      columns: ['name', 'type', 'memberCount'],
      timestamp: true
    })
  }

  return (
    <div>
      {/* Your table with selection */}
      <ChapterTable
        chapters={chapters}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {/* Bulk operations panel (shows when items selected) */}
      <BulkOperationsPanel
        selectedChapters={chapters.filter(c => selectedIds.includes(c.id))}
        allChapters={chapters}
        onDeselectAll={() => setSelectedIds([])}
        onBulkEdit={() => setBulkEditOpen(true)}
        onBulkDelete={handleBulkDelete}
        onBulkExport={handleBulkExport}
      />

      {/* Bulk edit dialog */}
      <BulkEditDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        chapters={chapters}
        selectedChapterIds={selectedIds}
        onComplete={(result) => {
          console.log('Bulk edit complete:', result)
        }}
      />
    </div>
  )
}
```

---

## Step 3: Add Selection to Your Table

If your table doesn't support selection yet, add checkboxes:

```typescript
import { Checkbox } from '@/components/ui/checkbox'

interface ChapterTableProps {
  chapters: Chapter[]
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}

export function ChapterTable({
  chapters,
  selectedIds = [],
  onSelectionChange
}: ChapterTableProps) {
  const isAllSelected = selectedIds.length === chapters.length
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected

  const handleSelectAll = () => {
    onSelectionChange?.(isAllSelected ? [] : chapters.map(c => c.id))
  }

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange?.(selectedIds.filter(i => i !== id))
    } else {
      onSelectionChange?.([...selectedIds, id])
    }
  }

  return (
    <table>
      <thead>
        <tr>
          {/* Add select all checkbox */}
          {onSelectionChange && (
            <th className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all chapters"
              />
            </th>
          )}
          <th>Name</th>
          <th>Type</th>
          {/* ... other columns */}
        </tr>
      </thead>
      <tbody>
        {chapters.map(chapter => (
          <tr key={chapter.id}>
            {/* Add individual checkbox */}
            {onSelectionChange && (
              <td>
                <Checkbox
                  checked={selectedIds.includes(chapter.id)}
                  onCheckedChange={() => handleSelectOne(chapter.id)}
                  aria-label={`Select ${chapter.name}`}
                />
              </td>
            )}
            <td>{chapter.name}</td>
            <td>{chapter.type}</td>
            {/* ... other cells */}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

---

## Common Use Cases

### Export All Chapters
```typescript
<Button onClick={() => setExportDialogOpen(true)}>
  Export All Chapters
</Button>

<ChapterExportDialog
  open={exportDialogOpen}
  onOpenChange={setExportDialogOpen}
  chapters={allChapters} // All chapters
  defaultFormat="xlsx"
/>
```

### Export Selected Only
```typescript
<ChapterExportDialog
  open={exportDialogOpen}
  onOpenChange={setExportDialogOpen}
  chapters={allChapters}
  selectedChapterIds={selectedIds} // Pre-select these
  defaultFormat="csv"
/>
```

### Quick CSV Export (No Dialog)
```typescript
import { exportChaptersToCSV } from '@/lib/export/csv-exporter'
import { COLUMN_PRESETS } from '@/lib/export'

const handleQuickExport = () => {
  exportChaptersToCSV(chapters, {
    format: 'csv',
    columns: COLUMN_PRESETS.minimal,
    fileName: 'chapters',
    timestamp: true
  })
}

<Button onClick={handleQuickExport}>
  Quick CSV Export
</Button>
```

### Bulk Update Region
```typescript
import { bulkEditChapters } from '@/lib/bulk-operations'

const updateRegion = async () => {
  await bulkEditChapters(
    chapters,
    selectedIds,
    {
      fields: { region: 'Northeast' },
      strategy: 'replace',
      validateFirst: true
    }
  )
}
```

---

## Keyboard Shortcuts

Add these shortcuts for power users:

```typescript
import { useEffect } from 'react'

export function ChaptersView() {
  // ... your state

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + E = Export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault()
        setExportDialogOpen(true)
      }

      // Delete = Bulk delete
      if (e.key === 'Delete' && selectedIds.length > 0) {
        e.preventDefault()
        handleBulkDelete(selectedIds)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedIds])

  // ... rest of component
}
```

---

## Troubleshooting

### "Module not found" errors
Make sure you installed dependencies:
```bash
npm install xlsx jspdf jspdf-autotable file-saver
npm install --save-dev @types/file-saver
```

### Export not downloading
- Check browser popup blocker
- Open browser console for errors
- Verify chapters array is not empty

### Bulk operations not working
- Ensure chapters are passed correctly
- Check console for validation errors
- Verify selectedIds matches actual chapter IDs

### TypeScript errors
- Import types from `@/lib/export` and `@/lib/bulk-operations`
- Ensure Chapter type is imported from `@/lib/types`
- Check all required props are provided

---

## Testing Checklist

✓ Export button appears in header
✓ Export dialog opens on click
✓ Can select CSV, Excel, PDF formats
✓ Can choose columns
✓ Can apply filters
✓ Preview shows correct data
✓ Export downloads file
✓ Bulk panel appears when items selected
✓ Bulk edit dialog works
✓ Bulk delete confirms before deletion
✓ Selection persists across operations
✓ Keyboard shortcuts work (Ctrl+E, Delete)

---

## Next Steps

1. **Customize column presets** in `src/lib/export/types.ts`
2. **Add your custom filters** to export dialog
3. **Implement email notification** for bulk operations
4. **Add export scheduling** for recurring reports
5. **Persist column preferences** to localStorage

For complete documentation, see `CHAPTER_EXPORT_BULK_OPERATIONS_INTEGRATION.md`
