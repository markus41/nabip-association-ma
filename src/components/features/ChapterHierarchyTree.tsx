import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import {
  Buildings,
  MapTrifold,
  Users,
  CalendarDots,
  MagnifyingGlass,
  CaretRight,
  CaretDown,
  X,
  ListDashes
} from '@phosphor-icons/react'
import type { Chapter } from '@/lib/types'

/**
 * Establishes interactive chapter hierarchy visualization for streamlined organizational management.
 * Implements accessible tree navigation with keyboard support and performance optimization.
 *
 * Best for: Navigating complex chapter hierarchies with 150+ chapters across 3 organizational tiers
 *
 * @param chapters - Array of all chapters to display in hierarchy
 * @param selectedChapterId - Currently selected chapter ID for visual highlighting
 * @param onSelectChapter - Callback when a chapter is clicked/selected
 * @param onEditChapter - Optional callback to edit chapter details
 * @param searchQuery - External search query for filtering (optional)
 * @param expandedByDefault - Whether to expand all nodes on initial render
 */
export interface ChapterHierarchyTreeProps {
  chapters: Chapter[]
  selectedChapterId?: string
  onSelectChapter: (chapterId: string) => void
  onEditChapter?: (chapter: Chapter) => void
  searchQuery?: string
  expandedByDefault?: boolean
}

interface TreeNode {
  chapter: Chapter
  children: TreeNode[]
  level: number
  path: Chapter[]
}

export function ChapterHierarchyTree({
  chapters,
  selectedChapterId,
  onSelectChapter,
  onEditChapter,
  searchQuery: externalSearchQuery,
  expandedByDefault = false
}: ChapterHierarchyTreeProps) {
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [compactMode, setCompactMode] = useState(false)
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
  const treeRef = useRef<HTMLDivElement>(null)

  const searchQuery = externalSearchQuery ?? internalSearchQuery

  /**
   * Build hierarchical tree structure from flat chapter array.
   * Supports 3-tier organization: National → State → Local
   */
  const treeData = useMemo(() => {
    const buildTree = (parentId: string | undefined, level: number, path: Chapter[]): TreeNode[] => {
      return chapters
        .filter(c => c.parentChapterId === parentId)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(chapter => ({
          chapter,
          level,
          path: [...path, chapter],
          children: buildTree(chapter.id, level + 1, [...path, chapter])
        }))
    }

    return buildTree(undefined, 0, [])
  }, [chapters])

  /**
   * Filter tree nodes based on search query.
   * Includes parent nodes if any descendant matches.
   */
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return treeData

    const query = searchQuery.toLowerCase()

    const filterNode = (node: TreeNode): TreeNode | null => {
      const matches =
        node.chapter.name.toLowerCase().includes(query) ||
        node.chapter.state?.toLowerCase().includes(query) ||
        node.chapter.city?.toLowerCase().includes(query) ||
        node.chapter.president?.toLowerCase().includes(query)

      const filteredChildren = node.children
        .map(child => filterNode(child))
        .filter((child): child is TreeNode => child !== null)

      if (matches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren
        }
      }

      return null
    }

    return treeData
      .map(node => filterNode(node))
      .filter((node): node is TreeNode => node !== null)
  }, [treeData, searchQuery])

  /**
   * Build breadcrumb trail for selected chapter.
   */
  const breadcrumbs = useMemo(() => {
    if (!selectedChapterId) return []

    const findPath = (nodes: TreeNode[]): Chapter[] | null => {
      for (const node of nodes) {
        if (node.chapter.id === selectedChapterId) {
          return node.path
        }
        const childPath = findPath(node.children)
        if (childPath) return childPath
      }
      return null
    }

    return findPath(treeData) || []
  }, [selectedChapterId, treeData])

  /**
   * Initialize expanded nodes on mount or when expandedByDefault changes.
   */
  useEffect(() => {
    if (expandedByDefault) {
      const allNodeIds = new Set<string>()
      const collectIds = (nodes: TreeNode[]) => {
        nodes.forEach(node => {
          if (node.children.length > 0) {
            allNodeIds.add(node.chapter.id)
            collectIds(node.children)
          }
        })
      }
      collectIds(treeData)
      setExpandedNodes(allNodeIds)
    }
  }, [expandedByDefault, treeData])

  /**
   * Auto-expand nodes when searching to show results.
   */
  useEffect(() => {
    if (searchQuery.trim()) {
      const nodesToExpand = new Set<string>()
      const collectExpandableNodes = (nodes: TreeNode[]) => {
        nodes.forEach(node => {
          if (node.children.length > 0) {
            nodesToExpand.add(node.chapter.id)
            collectExpandableNodes(node.children)
          }
        })
      }
      collectExpandableNodes(filteredTree)
      setExpandedNodes(nodesToExpand)
    }
  }, [searchQuery, filteredTree])

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  const handleNodeClick = useCallback((chapter: Chapter) => {
    onSelectChapter(chapter.id)
    setFocusedNodeId(chapter.id)
  }, [onSelectChapter])

  /**
   * Keyboard navigation handler for accessibility.
   * Supports: Arrow keys, Enter, Space, Home, End
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent, node: TreeNode) => {
    const allNodes: TreeNode[] = []
    const flattenNodes = (nodes: TreeNode[]) => {
      nodes.forEach(n => {
        allNodes.push(n)
        if (expandedNodes.has(n.chapter.id)) {
          flattenNodes(n.children)
        }
      })
    }
    flattenNodes(filteredTree)

    const currentIndex = allNodes.findIndex(n => n.chapter.id === focusedNodeId)

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (currentIndex < allNodes.length - 1) {
          const next = allNodes[currentIndex + 1]
          setFocusedNodeId(next.chapter.id)
          onSelectChapter(next.chapter.id)
        }
        break

      case 'ArrowUp':
        event.preventDefault()
        if (currentIndex > 0) {
          const prev = allNodes[currentIndex - 1]
          setFocusedNodeId(prev.chapter.id)
          onSelectChapter(prev.chapter.id)
        }
        break

      case 'ArrowRight':
        event.preventDefault()
        if (node.children.length > 0 && !expandedNodes.has(node.chapter.id)) {
          toggleNode(node.chapter.id)
        }
        break

      case 'ArrowLeft':
        event.preventDefault()
        if (expandedNodes.has(node.chapter.id)) {
          toggleNode(node.chapter.id)
        }
        break

      case 'Enter':
      case ' ':
        event.preventDefault()
        handleNodeClick(node.chapter)
        break

      case 'Home':
        event.preventDefault()
        if (allNodes.length > 0) {
          setFocusedNodeId(allNodes[0].chapter.id)
          onSelectChapter(allNodes[0].chapter.id)
        }
        break

      case 'End':
        event.preventDefault()
        if (allNodes.length > 0) {
          const last = allNodes[allNodes.length - 1]
          setFocusedNodeId(last.chapter.id)
          onSelectChapter(last.chapter.id)
        }
        break
    }
  }, [filteredTree, expandedNodes, focusedNodeId, onSelectChapter, toggleNode, handleNodeClick])

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

  const renderNode = (node: TreeNode) => {
    const isExpanded = expandedNodes.has(node.chapter.id)
    const isSelected = selectedChapterId === node.chapter.id
    const isFocused = focusedNodeId === node.chapter.id
    const hasChildren = node.children.length > 0

    return (
      <Collapsible
        key={node.chapter.id}
        open={isExpanded}
        onOpenChange={() => hasChildren && toggleNode(node.chapter.id)}
      >
        <div
          className={`group flex items-center gap-2 py-2 px-3 rounded-md transition-colors ${
            isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
          } ${isFocused ? 'ring-2 ring-primary ring-offset-2' : ''}`}
          style={{ paddingLeft: `${node.level * 24 + 12}px` }}
        >
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <button
                className="flex items-center justify-center w-5 h-5 rounded hover:bg-muted transition-colors"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <CaretDown size={14} weight="bold" />
                ) : (
                  <CaretRight size={14} weight="bold" />
                )}
              </button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-5" />
          )}

          <button
            className="flex-1 flex items-center gap-2 min-w-0 text-left focus:outline-none"
            onClick={() => handleNodeClick(node.chapter)}
            onKeyDown={(e) => handleKeyDown(e, node)}
            tabIndex={0}
            role="treeitem"
            aria-selected={isSelected}
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-level={node.level + 1}
          >
            {getChapterIcon(node.chapter.type)}

            <span className={`font-medium truncate ${compactMode ? 'text-sm' : ''}`}>
              {node.chapter.name}
            </span>

            {!compactMode && (
              <div className="flex items-center gap-2 ml-auto">
                <Badge
                  variant="secondary"
                  className="text-xs tabular-nums flex items-center gap-1"
                >
                  <Users size={12} weight="bold" />
                  {node.chapter.memberCount.toLocaleString()}
                </Badge>

                {node.chapter.activeEventsCount > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs tabular-nums flex items-center gap-1"
                  >
                    <CalendarDots size={12} weight="bold" />
                    {node.chapter.activeEventsCount}
                  </Badge>
                )}
              </div>
            )}
          </button>
        </div>

        {hasChildren && (
          <CollapsibleContent className="transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            {node.children.map(child => renderNode(child))}
          </CollapsibleContent>
        )}
      </Collapsible>
    )
  }

  const totalMembers = useMemo(
    () => chapters.reduce((sum, c) => sum + c.memberCount, 0),
    [chapters]
  )

  const totalEvents = useMemo(
    () => chapters.reduce((sum, c) => sum + c.activeEventsCount, 0),
    [chapters]
  )

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b bg-muted/30 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Chapter Hierarchy</h3>
          <div className="flex items-center gap-2">
            <Button
              variant={compactMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCompactMode(!compactMode)}
              aria-label="Toggle compact mode"
            >
              <ListDashes size={16} weight="bold" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (expandedNodes.size > 0) {
                  setExpandedNodes(new Set())
                } else {
                  const allNodeIds = new Set<string>()
                  const collectIds = (nodes: TreeNode[]) => {
                    nodes.forEach(node => {
                      if (node.children.length > 0) {
                        allNodeIds.add(node.chapter.id)
                        collectIds(node.children)
                      }
                    })
                  }
                  collectIds(treeData)
                  setExpandedNodes(allNodeIds)
                }
              }}
            >
              {expandedNodes.size > 0 ? 'Collapse All' : 'Expand All'}
            </Button>
          </div>
        </div>

        {!externalSearchQuery && (
          <div className="relative">
            <MagnifyingGlass
              size={16}
              weight="bold"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              placeholder="Search chapters by name, location, or president..."
              value={internalSearchQuery}
              onChange={(e) => setInternalSearchQuery(e.target.value)}
              className="pl-9 pr-9"
              aria-label="Search chapters"
            />
            {internalSearchQuery && (
              <button
                onClick={() => setInternalSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X size={16} weight="bold" />
              </button>
            )}
          </div>
        )}

        {breadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((chapter, index) => (
                <div key={chapter.id} className="flex items-center">
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      onClick={() => onSelectChapter(chapter.id)}
                      className="cursor-pointer hover:text-primary transition-colors"
                    >
                      {chapter.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users size={14} weight="bold" />
            <span className="font-medium tabular-nums">{totalMembers.toLocaleString()}</span>
            <span>members</span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarDots size={14} weight="bold" />
            <span className="font-medium tabular-nums">{totalEvents}</span>
            <span>events</span>
          </div>
          <div className="flex items-center gap-1">
            <Buildings size={14} weight="bold" />
            <span className="font-medium tabular-nums">{chapters.length}</span>
            <span>chapters</span>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[600px]" ref={treeRef}>
        <div
          className="p-2"
          role="tree"
          aria-label="Chapter hierarchy"
          aria-multiselectable="false"
        >
          {filteredTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Buildings size={48} className="text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">
                {searchQuery ? 'No chapters match your search' : 'No chapters available'}
              </p>
              {searchQuery && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setInternalSearchQuery('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            filteredTree.map(node => renderNode(node))
          )}
        </div>
      </ScrollArea>

      <div className="px-4 py-3 border-t bg-muted/30 text-sm text-muted-foreground">
        Showing {filteredTree.length} of {treeData.length} top-level chapters
      </div>
    </Card>
  )
}
