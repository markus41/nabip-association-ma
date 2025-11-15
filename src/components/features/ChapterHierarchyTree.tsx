import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Buildings, Users, CalendarDots, CaretRight, CaretDown } from '@phosphor-icons/react'
import type { Chapter } from '@/lib/types'
import { useState } from 'react'

interface ChapterHierarchyTreeProps {
  chapters: Chapter[]
  onSelectChapter?: (chapter: Chapter) => void
  loading?: boolean
}

interface TreeNode {
  chapter: Chapter
  children: TreeNode[]
  level: number
}

function ChapterTreeNode({
  node,
  onSelectChapter,
  onToggleExpand,
  isExpanded
}: {
  node: TreeNode
  onSelectChapter?: (chapter: Chapter) => void
  onToggleExpand: (id: string) => void
  isExpanded: boolean
}) {
  const hasChildren = node.children.length > 0

  return (
    <div className="space-y-1">
      <div
        className="group flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
        style={{ paddingLeft: `${node.level * 24 + 12}px` }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) {
              onToggleExpand(node.chapter.id)
            }
          }}
          className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded transition-colors ${
            hasChildren ? 'hover:bg-muted' : 'invisible'
          }`}
        >
          {hasChildren && (
            isExpanded ? (
              <CaretDown size={16} weight="bold" />
            ) : (
              <CaretRight size={16} weight="bold" />
            )
          )}
        </button>

        {/* Chapter Icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          node.chapter.type === 'national'
            ? 'bg-primary/10'
            : node.chapter.type === 'state'
            ? 'bg-teal/10'
            : 'bg-accent/10'
        }`}>
          <Buildings
            size={20}
            weight="duotone"
            className={
              node.chapter.type === 'national'
                ? 'text-primary'
                : node.chapter.type === 'state'
                ? 'text-teal'
                : 'text-accent-foreground'
            }
          />
        </div>

        {/* Chapter Info */}
        <div
          className="flex-1 min-w-0"
          onClick={() => onSelectChapter?.(node.chapter)}
        >
          <div className="flex items-center gap-2">
            <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
              {node.chapter.name}
            </h4>
            <Badge variant="outline" className="text-xs capitalize flex-shrink-0">
              {node.chapter.type}
            </Badge>
          </div>
          {node.chapter.region && (
            <p className="text-sm text-muted-foreground truncate">{node.chapter.region}</p>
          )}
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-sm">
            <Users size={14} className="text-muted-foreground" />
            <span className="tabular-nums font-medium">
              {node.chapter.memberCount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <CalendarDots size={14} className="text-muted-foreground" />
            <span className="tabular-nums font-medium">
              {node.chapter.activeEventsCount}
            </span>
          </div>
        </div>

        {/* Child count badge */}
        {hasChildren && (
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            {node.children.length} {node.children.length === 1 ? 'child' : 'children'}
          </Badge>
        )}
      </div>

      {/* Render children */}
      {isExpanded && hasChildren && (
        <div className="space-y-1">
          {node.children.map((child) => (
            <ChapterTreeNodeWrapper
              key={child.chapter.id}
              node={child}
              onSelectChapter={onSelectChapter}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ChapterTreeNodeWrapper({
  node,
  onSelectChapter,
  onToggleExpand
}: {
  node: TreeNode
  onSelectChapter?: (chapter: Chapter) => void
  onToggleExpand: (id: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleToggleExpand = (id: string) => {
    setIsExpanded(!isExpanded)
    onToggleExpand(id)
  }

  return (
    <ChapterTreeNode
      node={node}
      onSelectChapter={onSelectChapter}
      onToggleExpand={handleToggleExpand}
      isExpanded={isExpanded}
    />
  )
}

export function ChapterHierarchyTree({
  chapters,
  onSelectChapter,
  loading
}: ChapterHierarchyTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const hierarchyTree = useMemo(() => {
    if (!chapters || chapters.length === 0) return []

    const buildTree = (parentId: string | undefined, level: number): TreeNode[] => {
      const children = chapters
        .filter((c) => c.parentChapterId === parentId)
        .sort((a, b) => a.name.localeCompare(b.name))

      return children.map((chapter) => ({
        chapter,
        children: buildTree(chapter.id, level + 1),
        level
      }))
    }

    return buildTree(undefined, 0)
  }, [chapters])

  const stats = useMemo(() => {
    const totalMembers = chapters.reduce((sum, c) => sum + c.memberCount, 0)
    const totalEvents = chapters.reduce((sum, c) => sum + c.activeEventsCount, 0)
    const national = chapters.filter((c) => c.type === 'national').length
    const state = chapters.filter((c) => c.type === 'state').length
    const local = chapters.filter((c) => c.type === 'local').length

    return { totalMembers, totalEvents, national, state, local }
  }, [chapters])

  const handleToggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => {
    const allIds = new Set(chapters.map((c) => c.id))
    setExpandedNodes(allIds)
  }

  const collapseAll = () => {
    setExpandedNodes(new Set())
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

  if (hierarchyTree.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Buildings size={48} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No chapters found</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Chapter Hierarchy</h3>
            <p className="text-sm text-muted-foreground">
              Visual tree of organizational structure
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={expandAll}>
              Expand All
            </Button>
            <Button size="sm" variant="outline" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="p-4 border-b bg-muted/10 grid grid-cols-5 gap-4">
        <div className="text-center">
          <p className="text-2xl font-semibold tabular-nums">{chapters.length}</p>
          <p className="text-xs text-muted-foreground uppercase">Total Chapters</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold tabular-nums">{stats.national}</p>
          <p className="text-xs text-muted-foreground uppercase">National</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold tabular-nums">{stats.state}</p>
          <p className="text-xs text-muted-foreground uppercase">State</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold tabular-nums">{stats.local}</p>
          <p className="text-xs text-muted-foreground uppercase">Local</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold tabular-nums">{stats.totalMembers.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground uppercase">Total Members</p>
        </div>
      </div>

      {/* Tree View */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        <div className="space-y-1">
          {hierarchyTree.map((node) => (
            <ChapterTreeNodeWrapper
              key={node.chapter.id}
              node={node}
              onSelectChapter={onSelectChapter}
              onToggleExpand={handleToggleExpand}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}
