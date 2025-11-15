import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Buildings, Users, CalendarDots, MapPin } from '@phosphor-icons/react'
import type { Chapter } from '@/lib/types'

interface ChaptersViewProps {
  chapters: Chapter[]
  loading?: boolean
}

export function ChaptersView({ chapters, loading }: ChaptersViewProps) {
  const [selectedType, setSelectedType] = useState<string>('all')

  const hierarchicalChapters = useMemo(() => {
    const national = chapters.filter(c => c.type === 'national')
    const states = chapters.filter(c => c.type === 'state')
    const locals = chapters.filter(c => c.type === 'local')
    
    return {
      national,
      states,
      locals,
      total: chapters.length
    }
  }, [chapters])

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
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Chapters</h1>
        <p className="text-muted-foreground mt-1">
          Manage organizational hierarchy and chapter performance
        </p>
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
        ) : filteredChapters.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12">
              <div className="text-center">
                <Buildings size={48} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No chapters found</p>
              </div>
            </Card>
          </div>
        ) : (
          filteredChapters.map((chapter) => (
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
                          <span className="truncate">{chapter.region}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Buildings size={20} weight="duotone" className="text-primary" />
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

                {chapter.type !== 'national' && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Reports to:{' '}
                      <span className="font-medium">
                        {chapter.parentChapterId
                          ? chapters.find(c => c.id === chapter.parentChapterId)?.name || 'N/A'
                          : 'N/A'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
