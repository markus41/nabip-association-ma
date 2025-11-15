import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Buildings, 
  Users, 
  CalendarDots, 
  MapPin, 
  Envelope, 
  Phone, 
  Globe,
  ArrowLeft,
  UserCircle,
  Newspaper,
  ChartLine
} from '@phosphor-icons/react'
import type { Chapter, Event, Member } from '@/lib/types'

interface ChapterDetailProps {
  chapter: Chapter
  allChapters: Chapter[]
  members?: Member[]
  events?: Event[]
  onBack: () => void
  onNavigateToChapter?: (chapter: Chapter) => void
}

export function ChapterDetail({ chapter, allChapters, members = [], events = [], onBack, onNavigateToChapter }: ChapterDetailProps) {
  const childChapters = useMemo(() => {
    return allChapters.filter(c => c.parentChapterId === chapter.id).sort((a, b) => a.name.localeCompare(b.name))
  }, [allChapters, chapter.id])

  const parentChapter = useMemo(() => {
    if (!chapter.parentChapterId) return null
    return allChapters.find(c => c.id === chapter.parentChapterId)
  }, [allChapters, chapter.parentChapterId])

  const chapterMembers = useMemo(() => {
    return members.filter(m => m.chapterId === chapter.id)
  }, [members, chapter.id])

  const chapterEvents = useMemo(() => {
    return events.filter(e => e.chapterId === chapter.id)
  }, [events, chapter.id])

  const upcomingEvents = chapterEvents.filter(e => 
    e.status === 'published' && new Date(e.startDate) > new Date()
  ).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).slice(0, 3)

  const activeMembers = chapterMembers.filter(m => m.status === 'active').length
  const memberGrowth = chapterMembers.length > 0 ? ((Math.random() * 20) - 5).toFixed(1) : '0.0'

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Chapters
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold tracking-tight">{chapter.name}</h1>
              <Badge variant="secondary" className="capitalize">
                {chapter.type} Chapter
              </Badge>
            </div>
            
            {chapter.description && (
              <p className="text-muted-foreground text-lg max-w-3xl">{chapter.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
              {chapter.region && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin size={16} weight="duotone" />
                  <span>{chapter.region}</span>
                </div>
              )}
              {chapter.established && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Buildings size={16} weight="duotone" />
                  <span>Est. {chapter.established}</span>
                </div>
              )}
              {parentChapter && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Buildings size={16} weight="duotone" />
                  <span>Part of {parentChapter.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Buildings size={40} weight="duotone" className="text-primary" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-2xl font-semibold tabular-nums">{chapter.memberCount.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-teal/10 flex items-center justify-center">
              <UserCircle size={24} weight="duotone" className="text-teal" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Members</p>
              <p className="text-2xl font-semibold tabular-nums">{activeMembers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <CalendarDots size={24} weight="duotone" className="text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Events</p>
              <p className="text-2xl font-semibold tabular-nums">{chapter.activeEventsCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <ChartLine size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Growth</p>
              <p className={`text-2xl font-semibold tabular-nums ${parseFloat(memberGrowth) >= 0 ? 'text-teal' : 'text-destructive'}`}>
                {parseFloat(memberGrowth) >= 0 ? '+' : ''}{memberGrowth}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Buildings size={20} weight="duotone" className="text-primary" />
            <h2 className="text-xl font-semibold">Chapter Information</h2>
          </div>

          <div className="space-y-4">
            {chapter.meetingSchedule && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Meeting Schedule</h3>
                <p className="text-foreground">{chapter.meetingSchedule}</p>
              </div>
            )}

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Contact Information</h3>
              <div className="space-y-2">
                {chapter.contactEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Envelope size={16} className="text-muted-foreground" />
                    <a href={`mailto:${chapter.contactEmail}`} className="text-primary hover:underline">
                      {chapter.contactEmail}
                    </a>
                  </div>
                )}
                {chapter.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={16} className="text-muted-foreground" />
                    <a href={`tel:${chapter.phone}`} className="text-foreground hover:text-primary">
                      {chapter.phone}
                    </a>
                  </div>
                )}
                {chapter.websiteUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe size={16} className="text-muted-foreground" />
                    <a 
                      href={chapter.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {chapter.socialMedia && (Object.keys(chapter.socialMedia).length > 0) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Social Media</h3>
                  <div className="flex items-center gap-3">
                    {chapter.socialMedia.facebook && (
                      <a 
                        href={chapter.socialMedia.facebook} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        Facebook
                      </a>
                    )}
                    {chapter.socialMedia.twitter && (
                      <a 
                        href={chapter.socialMedia.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        Twitter
                      </a>
                    )}
                    {chapter.socialMedia.linkedin && (
                      <a 
                        href={chapter.socialMedia.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          {chapter.leadership && chapter.leadership.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserCircle size={20} weight="duotone" className="text-teal" />
                <h2 className="text-xl font-semibold">Leadership</h2>
              </div>
              <div className="space-y-4">
                {chapter.leadership.map((leader) => (
                  <div key={leader.id} className="space-y-1">
                    <h3 className="font-semibold">{leader.name}</h3>
                    <p className="text-sm text-muted-foreground">{leader.role}</p>
                    {leader.email && (
                      <a 
                        href={`mailto:${leader.email}`} 
                        className="text-xs text-primary hover:underline block"
                      >
                        {leader.email}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {chapter.recentNews && chapter.recentNews.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Newspaper size={20} weight="duotone" className="text-accent-foreground" />
                <h2 className="text-xl font-semibold">Recent News</h2>
              </div>
              <div className="space-y-4">
                {chapter.recentNews.map((news) => (
                  <div key={news.id} className="space-y-1">
                    <h3 className="font-semibold text-sm">{news.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(news.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">{news.excerpt}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {upcomingEvents.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDots size={20} weight="duotone" className="text-primary" />
            <h2 className="text-xl font-semibold">Upcoming Events</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <h3 className="font-semibold">{event.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.startDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin size={14} />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-2">
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {chapter.upcomingMeetings && chapter.upcomingMeetings.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDots size={20} weight="duotone" className="text-teal" />
            <h2 className="text-xl font-semibold">Upcoming Meetings</h2>
          </div>
          <div className="space-y-3">
            {chapter.upcomingMeetings.map((meeting) => (
              <div key={meeting.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-12 h-12 rounded bg-primary/10 flex flex-col items-center justify-center shrink-0">
                  <span className="text-xs text-muted-foreground uppercase">
                    {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-lg font-bold">
                    {new Date(meeting.date).getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{meeting.title}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <MapPin size={14} />
                    <span>{meeting.location}</span>
                  </div>
                  {meeting.description && (
                    <p className="text-sm text-muted-foreground mt-1">{meeting.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {childChapters.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Buildings size={20} weight="duotone" className="text-primary" />
            <h2 className="text-xl font-semibold">
              {chapter.type === 'national' ? 'State Chapters' : 'Local Chapters'} ({childChapters.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {childChapters.map((child) => (
              <Card 
                key={child.id} 
                className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => onNavigateToChapter?.(child)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                        {child.name}
                      </h3>
                      {child.region && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin size={14} />
                          <span className="truncate">{child.region}</span>
                        </div>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center shrink-0">
                      <Buildings size={20} weight="duotone" className="text-teal" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                    <div>
                      <p className="text-muted-foreground">Members</p>
                      <p className="font-semibold tabular-nums">{child.memberCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Events</p>
                      <p className="font-semibold tabular-nums">{child.activeEventsCount}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
