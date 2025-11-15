import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  GraduationCap,
  BookOpen,
  Certificate,
  Clock,
  Users,
  TrendUp,
  MagnifyingGlass,
  Plus
} from '@phosphor-icons/react'
import type { Course, Enrollment } from '@/lib/types'
import { formatCurrency } from '@/lib/data-utils'
import { toast } from 'sonner'
import { CreateCourseModal } from './CreateCourseModal'

interface LearningViewProps {
  courses: Course[]
  enrollments: Enrollment[]
  loading?: boolean
}

export function LearningView({ courses, enrollments, loading }: LearningViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch =
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter

      return matchesSearch && matchesCategory && course.status === 'published'
    })
  }, [courses, searchQuery, categoryFilter])

  const stats = useMemo(() => {
    const completed = enrollments.filter(e => e.status === 'completed').length
    const inProgress = enrollments.filter(e => e.status === 'in_progress').length
    const totalCeCredits = enrollments
      .filter(e => e.status === 'completed')
      .reduce((sum, enrollment) => {
        const course = courses.find(c => c.id === enrollment.courseId)
        return sum + (course?.ceCredits || 0)
      }, 0)

    return {
      enrolled: enrollments.length,
      completed,
      inProgress,
      totalCeCredits
    }
  }, [enrollments, courses])

  const handleEnroll = (course: Course) => {
    toast.success(`Enrolled in ${course.name}`, {
      description: 'You can now access the course materials.'
    })
  }

  const categories = Array.from(new Set(courses.map(c => c.category)))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Learning Management</h1>
          <p className="text-muted-foreground mt-1">
            Professional development and continuing education
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2" size={18} weight="bold" />
          Create Course
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen size={20} weight="duotone" className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Enrolled Courses
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : stats.enrolled}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendUp size={20} weight="duotone" className="text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                In Progress
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : stats.inProgress}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
              <Certificate size={20} weight="duotone" className="text-teal" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Completed
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : stats.completed}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <GraduationCap size={20} weight="duotone" className="text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                CE Credits
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : stats.totalCeCredits}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlass
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={20} weight="duotone" className="text-primary" />
            <h3 className="font-semibold">Popular Courses</h3>
          </div>
          <div className="space-y-3">
            {courses.slice(0, 3).map((course, idx) => (
              <div
                key={course.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setSelectedCourse(course)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{course.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{course.enrollmentCount} enrolled</span>
                      <span>•</span>
                      <span>{course.duration}h</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {course.category}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap size={20} weight="duotone" className="text-accent-foreground" />
            <h3 className="font-semibold">Learning Stats</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <span className="text-sm font-semibold">{stats.enrolled > 0 ? Math.round((stats.completed / stats.enrolled) * 100) : 0}%</span>
              </div>
              <Progress value={stats.enrolled > 0 ? (stats.completed / stats.enrolled) * 100 : 0} />
            </div>
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-1">Avg Course Duration</p>
              <p className="text-2xl font-bold">
                {courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + c.duration, 0) / courses.length) : 0}h
              </p>
            </div>
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-1">Available Courses</p>
              <p className="text-2xl font-bold">{courses.filter(c => c.status === 'published').length}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-4">
                <div className="h-6 bg-muted animate-shimmer rounded w-3/4" />
                <div className="h-4 bg-muted animate-shimmer rounded w-full" />
                <div className="h-4 bg-muted animate-shimmer rounded w-1/2" />
              </div>
            </Card>
          ))
        ) : filteredCourses.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12">
              <div className="text-center">
                <BookOpen size={48} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No courses found</p>
              </div>
            </Card>
          </div>
        ) : (
          filteredCourses.map((course) => {
            const enrollment = enrollments.find(e => e.courseId === course.id)

            return (
              <Card
                key={course.id}
                className="p-6 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setSelectedCourse(course)}
              >
                <div className="space-y-4">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {course.category}
                    </Badge>
                    <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {course.name}
                    </h3>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="shrink-0" />
                      <span>{course.duration} hours</span>
                    </div>
                    {course.ceCredits && (
                      <div className="flex items-center gap-2">
                        <Certificate size={16} className="shrink-0" />
                        <span>{course.ceCredits} CE Credits</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users size={16} className="shrink-0" />
                      <span>{course.enrollmentCount} enrolled</span>
                    </div>
                  </div>

                  {enrollment ? (
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{enrollment.progress}%</span>
                      </div>
                      <Progress value={enrollment.progress} />
                      <Badge
                        variant="outline"
                        className="w-full justify-center capitalize"
                      >
                        {enrollment.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ) : (
                    <div className="pt-4 border-t flex items-center justify-between">
                      <span className="font-semibold">
                        {course.price === 0 ? 'Free' : formatCurrency(course.price)}
                      </span>
                      <Badge variant="outline" className="bg-teal/10 text-teal border-teal/20">
                        Available
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCourse?.name}</DialogTitle>
            <DialogDescription>Course details and enrollment</DialogDescription>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-6">
              <div>
                <Badge variant="outline" className="mb-3">
                  {selectedCourse.category}
                </Badge>
                <p className="text-muted-foreground">{selectedCourse.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={16} className="text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Duration
                    </p>
                  </div>
                  <p className="text-lg font-semibold">{selectedCourse.duration} hours</p>
                </div>

                {selectedCourse.ceCredits && (
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Certificate size={16} className="text-muted-foreground" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        CE Credits
                      </p>
                    </div>
                    <p className="text-lg font-semibold">{selectedCourse.ceCredits}</p>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={16} className="text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Enrolled
                    </p>
                  </div>
                  <p className="text-lg font-semibold">{selectedCourse.enrollmentCount}</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendUp size={16} className="text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Completion Rate
                    </p>
                  </div>
                  <p className="text-lg font-semibold">{selectedCourse.completionRate}%</p>
                </div>
              </div>

              {selectedCourse.learningObjectives && selectedCourse.learningObjectives.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Learning Objectives</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {selectedCourse.learningObjectives.map((objective, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-teal mt-1">•</span>
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0 && (
                <div className="p-4 rounded-lg bg-muted/30">
                  <h4 className="font-semibold mb-2">Prerequisites</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedCourse.prerequisites.join(', ')}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleEnroll(selectedCourse)}
                >
                  {selectedCourse.price === 0
                    ? 'Enroll Now'
                    : `Enroll for ${formatCurrency(selectedCourse.price)}`}
                </Button>
                <Button variant="outline" className="flex-1">
                  Course Preview
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CreateCourseModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  )
}
