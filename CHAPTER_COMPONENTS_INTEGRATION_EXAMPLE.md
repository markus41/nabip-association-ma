# Chapter Components Integration Example

Quick-start guide for integrating the new chapter hierarchy components into ChaptersView.

## Step 1: Import Components

Add these imports to `src/components/features/ChaptersView.tsx`:

```typescript
import { ChapterHierarchyTree } from './ChapterHierarchyTree'
import { ChapterHierarchyTable } from './ChapterHierarchyTable'
import { ChapterCard } from './ChapterCard'
```

## Step 2: Add View Mode State

Update the view mode state to include new options:

```typescript
// Change from:
const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards')

// To:
const [viewMode, setViewMode] = useState<'cards' | 'tree' | 'table' | 'grid'>('cards')
```

## Step 3: Add View Toggle Buttons

Update the view mode toggle section:

```typescript
<div className="flex items-center gap-2">
  <Button
    variant={viewMode === 'cards' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setViewMode('cards')}
  >
    <Buildings size={16} className="mr-2" />
    Cards
  </Button>
  <Button
    variant={viewMode === 'tree' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setViewMode('tree')}
  >
    <Tree size={16} className="mr-2" />
    Tree
  </Button>
  <Button
    variant={viewMode === 'table' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setViewMode('table')}
  >
    <TableIcon size={16} className="mr-2" />
    Table
  </Button>
  <Button
    variant={viewMode === 'grid' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setViewMode('grid')}
  >
    <Grid size={16} className="mr-2" />
    Grid
  </Button>
</div>
```

## Step 4: Add Conditional Rendering

Replace the existing chapter display logic with:

```typescript
{viewMode === 'tree' && (
  <ChapterHierarchyTree
    chapters={chapters}
    selectedChapterId={selectedChapter?.id}
    onSelectChapter={(id) => {
      const chapter = chapters.find(c => c.id === id)
      if (chapter) setSelectedChapter(chapter)
    }}
    expandedByDefault={false}
  />
)}

{viewMode === 'table' && (
  <ChapterHierarchyTable
    chapters={chapters}
    onSelectChapter={setSelectedChapter}
    onEditChapter={(chapter) => {
      // Open edit dialog
      toast.info('Edit Chapter', { description: chapter.name })
    }}
    onBulkAction={(action, ids) => {
      toast.info(`Bulk ${action}`, {
        description: `Applied to ${ids.length} chapters`
      })
    }}
  />
)}

{viewMode === 'cards' && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {filteredChapters.map(chapter => (
      <ChapterCard
        key={chapter.id}
        chapter={chapter}
        onEdit={(c) => toast.info('Edit', { description: c.name })}
        onViewDetails={setSelectedChapter}
        onMessageLeaders={handleEmailLeader}
        onViewMembers={(id) => toast.info('View Members', { description: id })}
        onViewAnalytics={(id) => toast.info('Analytics', { description: id })}
        showQuickActions={true}
        showContactDetails={true}
      />
    ))}
  </div>
)}

{viewMode === 'grid' && (
  <ChaptersGrid chapters={chapters} loading={loading} />
)}
```

## Step 5: Update Imports for Icons

Add the Tree icon import if not already present:

```typescript
import {
  Buildings,
  Users,
  CalendarDots,
  MapPin,
  Plus,
  Table as TableIcon,
  Tree,  // Add this
  Grid   // Add this
} from '@phosphor-icons/react'
```

## Complete Example

Here's a complete minimal implementation:

```typescript
import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Buildings, Table as TableIcon, Tree, Grid } from '@phosphor-icons/react'
import { ChapterHierarchyTree } from './ChapterHierarchyTree'
import { ChapterHierarchyTable } from './ChapterHierarchyTable'
import { ChapterCard } from './ChapterCard'
import { ChaptersGrid } from './ChaptersGrid'
import type { Chapter } from '@/lib/types'
import { toast } from 'sonner'

interface ChaptersViewProps {
  chapters: Chapter[]
  loading?: boolean
}

export function ChaptersView({ chapters, loading }: ChaptersViewProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'tree' | 'table' | 'grid'>('cards')
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Chapters</h1>
          <p className="text-muted-foreground mt-1">
            Manage organizational hierarchy and chapter performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            <Buildings size={16} className="mr-2" />
            Cards
          </Button>
          <Button
            variant={viewMode === 'tree' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('tree')}
          >
            <Tree size={16} className="mr-2" />
            Tree
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <TableIcon size={16} className="mr-2" />
            Table
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid size={16} className="mr-2" />
            Grid
          </Button>
        </div>
      </div>

      {viewMode === 'tree' && (
        <ChapterHierarchyTree
          chapters={chapters}
          selectedChapterId={selectedChapter?.id}
          onSelectChapter={(id) => {
            const chapter = chapters.find(c => c.id === id)
            if (chapter) setSelectedChapter(chapter)
          }}
        />
      )}

      {viewMode === 'table' && (
        <ChapterHierarchyTable
          chapters={chapters}
          onSelectChapter={setSelectedChapter}
          onBulkAction={(action, ids) => {
            toast.info(`Bulk ${action}`, {
              description: `Applied to ${ids.length} chapters`
            })
          }}
        />
      )}

      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chapters.map(chapter => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              onViewDetails={setSelectedChapter}
              showQuickActions={true}
              showContactDetails={true}
            />
          ))}
        </div>
      )}

      {viewMode === 'grid' && (
        <ChaptersGrid chapters={chapters} loading={loading} />
      )}
    </div>
  )
}
```

## Testing the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Chapters view in your application

3. Test each view mode:
   - **Cards**: Hover over cards to see quick actions
   - **Tree**: Use keyboard navigation (arrow keys, Enter)
   - **Table**: Try sorting, selecting, and CSV export
   - **Grid**: Existing inline editing functionality

4. Verify accessibility:
   - Tab through all interactive elements
   - Use screen reader to verify announcements
   - Test with keyboard only (no mouse)

## Troubleshooting

**Issue**: Components not showing
- Verify imports are correct
- Check console for errors
- Ensure chapter data is available

**Issue**: Styles look wrong
- Verify Tailwind CSS is configured
- Check for CSS class conflicts
- Ensure Shadcn/ui components are installed

**Issue**: TypeScript errors
- Run `npm run build` to check for errors
- Verify all types are imported from '@/lib/types'
- Check tsconfig.json path aliases

## Next Steps

After integration, consider:

1. **Add to Navigation**: Update `App.tsx` navItems to include direct links to different views
2. **Persist View Mode**: Save user's preferred view mode to localStorage
3. **Add Filters**: Implement chapter type filters for Cards and Tree views
4. **Connect Actions**: Wire up Edit, Message, and Analytics callbacks to real functionality
5. **Performance**: Monitor render times with 150+ chapters and add virtualization if needed

## Support

For questions or issues, refer to:
- Full documentation: `CHAPTER_HIERARCHY_COMPONENTS.md`
- Component source code in `src/components/features/`
- TypeScript types in `src/lib/types.ts`
