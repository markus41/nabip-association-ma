import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Buildings, Users, CalendarDots, MapPin, Plus, Table as TableIcon } from '@phosphor-icons/react'
import { ChaptersGrid } from './ChaptersGrid'
import type { Chapter } from '@/lib/types'

interface ChaptersViewProps {
  chapters: Chapter[]
  loading?: boolean
}

export function ChaptersView({ chapters, loading }: ChaptersViewProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards')
  const [selectedType, setSelectedType] = useState<string>('all')

  const hierarchicalChapters = useMemo(() => {
    const national = chapters.filter(c => c.type === 'national')
    const states = chapters.filter(c => c.type === 'state').sort((a, b) => a.name.localeCompare(b.name))
    const locals = chapters.filter(c => c.type === 'local')
    
    return {
      national,
      states,
      locals,
      total: chapters.length
    }
  }, [chapters])

  const getChildChapters = (parentId: string) => {
    return chapters.filter(c => c.parentChapterId === parentId).sort((a, b) => a.name.localeCompare(b.name))
  }

  const filteredChapters = useMemo(() => {
    if (selectedType === 'all') return chapters
    return chapters.filter(c => c.type === selectedType)
  }, [chapters, selectedType])

  const stats = useMemo(() => {
    const totalMembers = chapters.reduce((sum, c) => sum + c.memberCount, 0)
    const totalEvents = chapters.reduce((sum, c) => sum + c.activeEventsCount, 0)
    const avgMembersPerChapter = chapters.length > 0 ? Math.round(totalMembers / chapters.length) : 0
    
    const topChapter = [...chapters].sort((a, b) => b.memberCount - a.memberCount)[0]
    const fastestGrowing = [...chapters].sort((a, b) => {
      const growthA = (a.memberCount / 100) * Math.random()
      const growthB = (b.memberCount / 100) * Math.random()
      return growthB - growthA
    })[0]
    
    return {
      totalMembers,
      totalEvents,
      avgMembersPerChapter,
      topChapter,
      fastestGrowing
    }
  }, [chapters])

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
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <TableIcon size={16} className="mr-2" />
            Grid
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Buildings size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Total Chapters
              </p>
              <p className="text-3xl font-semibold tabular-nums">
                {loading ? '...' : hierarchicalChapters.total}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center">
              <Users size={24} weight="duotone" className="text-teal" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Total Members
              </p>
              <p className="text-3xl font-semibold tabular-nums">
                {loading ? '...' : stats.totalMembers.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <CalendarDots size={24} weight="duotone" className="text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Active Events
              </p>
              <p className="text-3xl font-semibold tabular-nums">
                {loading ? '...' : stats.totalEvents}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {viewMode === 'cards' && (
        <Card className="p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedType === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              All Chapters
            </button>
            <button
              onClick={() => setSelectedType('national')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedType === 'national'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              National ({hierarchicalChapters.national.length})
            </button>
            <button
              onClick={() => setSelectedType('state')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedType === 'state'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              State ({hierarchicalChapters.states.length})
            </button>
            <button
              onClick={() => setSelectedType('local')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedType === 'local'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              Local ({hierarchicalChapters.locals.length})
            </button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Buildings size={20} weight="duotone" className="text-primary" />
            <h3 className="font-semibold">Top Performing Chapter</h3>
          </div>
          {stats.topChapter && (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-lg">{stats.topChapter.name}</h4>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {stats.topChapter.type}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums">
                    {stats.topChapter.memberCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">members</p>
                </div>
              </div>
              {stats.topChapter.region && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin size={14} />
                  <span>{stats.topChapter.region}</span>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDots size={20} weight="duotone" className="text-teal" />
            <h3 className="font-semibold">Chapter Activity</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Members per Chapter</span>
              <span className="text-xl font-bold tabular-nums">{stats.avgMembersPerChapter}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Active Events</span>
              <span className="text-xl font-bold tabular-nums">{stats.totalEvents}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-sm text-muted-foreground">Engagement Rate</span>
              <span className="text-xl font-bold tabular-nums text-teal">87%</span>
            </div>
          </div>
        </Card>
      </div>

      {viewMode === 'grid' ? (
        <ChaptersGrid chapters={chapters} loading={loading} />
      ) : (
        <>
          {selectedType === 'all' || selectedType === 'national' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">National Organization</h2>
                <div className="grid grid-cols-1 gap-6">
                  {loading ? (
                    <Card className="p-6">
                      <div className="space-y-4">
                        <div className="h-6 bg-muted animate-shimmer rounded w-3/4" />
                        <div className="h-4 bg-muted animate-shimmer rounded w-1/2" />
                        <div className="h-4 bg-muted animate-shimmer rounded w-full" />
                      </div>
                    </Card>
                  ) : (
                    hierarchicalChapters.national.map((chapter) => (
                      <Card
                        key={chapter.id}
                        className="p-6 hover:shadow-lg transition-all cursor-pointer group"
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-xl leading-tight group-hover:text-primary transition-colors">
                                {chapter.name}
                              </h3>
                              <div className="flex items-center gap-3 mt-3">
                                <Badge variant="secondary" className="capitalize">
                                  {chapter.type}
                                </Badge>
                                {chapter.established && (
                                  <span className="text-sm text-muted-foreground">
                                    Est. {chapter.established}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Buildings size={28} weight="duotone" className="text-primary" />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Members</p>
                              <p className="text-2xl font-semibold tabular-nums">
                                {chapter.memberCount.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">State Chapters</p>
                              <p className="text-2xl font-semibold tabular-nums">
                                {getChildChapters(chapter.id).length}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Events</p>
                              <p className="text-2xl font-semibold tabular-nums">
                                {chapter.activeEventsCount}
                              </p>
                            </div>
                          </div>

                          {(chapter.websiteUrl || chapter.contactEmail) && (
                            <div className="pt-3 border-t flex items-center gap-4 text-sm">
                              {chapter.websiteUrl && (
                                <a
                                  href={chapter.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Visit Website
                                </a>
                              )}
                              {chapter.contactEmail && (
                                <a
                                  href={`mailto:${chapter.contactEmail}`}
                                  className="text-muted-foreground hover:text-foreground"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {chapter.contactEmail}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {selectedType === 'all' || selectedType === 'state' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">State Chapters</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading ? (
                    Array.from({ length: 9 }).map((_, i) => (
                      <Card key={i} className="p-6">
                        <div className="space-y-4">
                          <div className="h-6 bg-muted animate-shimmer rounded w-3/4" />
                          <div className="h-4 bg-muted animate-shimmer rounded w-1/2" />
                          <div className="h-4 bg-muted animate-shimmer rounded w-full" />
                        </div>
                      </Card>
                    ))
                  ) : hierarchicalChapters.states.length === 0 ? (
                    <div className="col-span-full">
                      <Card className="p-12">
                        <div className="text-center">
                          <Buildings size={48} className="mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">No state chapters found</p>
                        </div>
                      </Card>
                    </div>
                  ) : (
                    hierarchicalChapters.states.map((chapter) => {
                      const localChapters = getChildChapters(chapter.id)
                      return (
                        <Card
                          key={chapter.id}
                          className="p-6 hover:shadow-lg transition-all cursor-pointer group"
                        >
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg leading-tight truncate group-hover:text-primary transition-colors">
                                  {chapter.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="capitalize">
                                    {chapter.type}
                                  </Badge>
                                  {chapter.state && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <MapPin size={14} />
                                      <span className="truncate">{chapter.state}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center shrink-0">
                                <Buildings size={20} weight="duotone" className="text-teal" />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Members</p>
                                <p className="text-2xl font-semibold tabular-nums">
                                  {chapter.memberCount.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Local</p>
                                <p className="text-2xl font-semibold tabular-nums">
                                  {localChapters.length}
                                </p>
                              </div>
                            </div>

                            {chapter.president && (
                              <div className="pt-3 border-t">
                                <p className="text-xs text-muted-foreground">
                                  President: <span className="font-medium text-foreground">{chapter.president}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </Card>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {selectedType === 'all' || selectedType === 'local' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Local Chapters</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading ? (
                    Array.from({ length: 9 }).map((_, i) => (
                      <Card key={i} className="p-6">
                        <div className="space-y-4">
                          <div className="h-6 bg-muted animate-shimmer rounded w-3/4" />
                          <div className="h-4 bg-muted animate-shimmer rounded w-1/2" />
                          <div className="h-4 bg-muted animate-shimmer rounded w-full" />
                        </div>
                      </Card>
                    ))
                  ) : hierarchicalChapters.locals.length === 0 ? (
                    <div className="col-span-full">
                      <Card className="p-12">
                        <div className="text-center">
                          <Buildings size={48} className="mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">No local chapters found</p>
                        </div>
                      </Card>
                    </div>
                  ) : (
                    filteredChapters
                      .filter(c => c.type === 'local')
                      .map((chapter) => {
                        const parentChapter = chapters.find(c => c.id === chapter.parentChapterId)
                        return (
                          <Card
                            key={chapter.id}
                            className="p-6 hover:shadow-lg transition-all cursor-pointer group"
                          >
                            <div className="space-y-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-lg leading-tight truncate group-hover:text-primary transition-colors">
                                    {chapter.name}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className="capitalize">
                                      {chapter.type}
                                    </Badge>
                                    {chapter.region && (
                                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <MapPin size={14} />
                                        <span className="truncate text-xs">{chapter.region}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                                  <Buildings size={20} weight="duotone" className="text-accent-foreground" />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Members</p>
                                  <p className="text-2xl font-semibold tabular-nums">
                                    {chapter.memberCount.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Events</p>
                                  <p className="text-2xl font-semibold tabular-nums">
                                    {chapter.activeEventsCount}
                                  </p>
                                </div>
                              </div>

                              {parentChapter && (
                                <div className="pt-3 border-t">
                                  <p className="text-xs text-muted-foreground">
                                    Part of: <span className="font-medium text-foreground">{parentChapter.name}</span>
                                  </p>
                                </div>
                              )}
                            </div>
                          </Card>
                        )
                      })
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
