/**
 * Course Creation Dialog - Streamline course creation workflows for learning management
 *
 * Establishes structured course authoring interface with comprehensive validation
 * to ensure data quality across the NABIP learning platform.
 *
 * Best for: Administrators managing professional development and CE credit programs
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Course } from '@/lib/types'

interface CourseCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateCourse: (course: Omit<Course, 'id'>) => void
}

interface CourseFormData {
  name: string
  description: string
  category: string
  duration: string
  ceCredits: string
  instructor: string
  price: string
  status: 'draft' | 'published' | 'archived'
  learningObjectives: string
  prerequisites: string
}

const initialFormData: CourseFormData = {
  name: '',
  description: '',
  category: '',
  duration: '',
  ceCredits: '',
  instructor: '',
  price: '0',
  status: 'draft',
  learningObjectives: '',
  prerequisites: '',
}

const courseCategories = [
  'Compliance & Ethics',
  'Sales & Marketing',
  'Product Knowledge',
  'Technology',
  'Leadership & Management',
  'Customer Service',
  'Legal & Regulatory',
  'Industry Trends',
]

export function CourseCreationDialog({
  open,
  onOpenChange,
  onCreateCourse,
}: CourseCreationDialogProps) {
  const [formData, setFormData] = useState<CourseFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof CourseFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Validate form data to ensure reliable course creation
   * Implements comprehensive business rules for data quality
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CourseFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Course name is required'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Course name must be at least 3 characters'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Course description is required'
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    const duration = parseFloat(formData.duration)
    if (!formData.duration || isNaN(duration) || duration <= 0) {
      newErrors.duration = 'Duration must be a positive number'
    } else if (duration > 1000) {
      newErrors.duration = 'Duration cannot exceed 1000 hours'
    }

    if (formData.ceCredits) {
      const ceCredits = parseFloat(formData.ceCredits)
      if (isNaN(ceCredits) || ceCredits < 0) {
        newErrors.ceCredits = 'CE credits must be a positive number or zero'
      } else if (ceCredits > 100) {
        newErrors.ceCredits = 'CE credits cannot exceed 100'
      }
    }

    const price = parseFloat(formData.price)
    if (isNaN(price) || price < 0) {
      newErrors.price = 'Price must be a positive number or zero'
    } else if (price > 10000) {
      newErrors.price = 'Price cannot exceed $10,000'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle form submission with comprehensive error handling
   * Establishes reliable course creation workflow
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Validation Failed', {
        description: 'Please correct the errors before submitting.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Transform form data to Course object
      const courseData: Omit<Course, 'id'> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        duration: parseFloat(formData.duration),
        ceCredits: formData.ceCredits ? parseFloat(formData.ceCredits) : undefined,
        instructor: formData.instructor.trim() || undefined,
        price: parseFloat(formData.price),
        status: formData.status,
        enrollmentCount: 0,
        completionRate: 0,
        learningObjectives: formData.learningObjectives
          ? formData.learningObjectives
              .split('\n')
              .map(obj => obj.trim())
              .filter(obj => obj.length > 0)
          : undefined,
        prerequisites: formData.prerequisites
          ? formData.prerequisites
              .split(',')
              .map(pre => pre.trim())
              .filter(pre => pre.length > 0)
          : undefined,
      }

      onCreateCourse(courseData)

      // Reset form and close dialog
      setFormData(initialFormData)
      setErrors({})
      onOpenChange(false)

      toast.success('Course Created Successfully', {
        description: `"${courseData.name}" has been added to the course catalog.`,
      })
    } catch (error) {
      toast.error('Course Creation Failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData(initialFormData)
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
          <DialogDescription>
            Establish new learning content for NABIP professional development programs
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Course Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Course Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Advanced Medicare Sales Strategies"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-destructive">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide a comprehensive overview of the course content and objectives"
                rows={4}
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? 'description-error' : undefined}
              />
              {errors.description && (
                <p id="description-error" className="text-sm text-destructive">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category" aria-invalid={!!errors.category}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as 'draft' | 'published' | 'archived' })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">
                  Duration (hours) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="duration"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="8"
                  aria-invalid={!!errors.duration}
                />
                {errors.duration && (
                  <p className="text-sm text-destructive">{errors.duration}</p>
                )}
              </div>

              {/* CE Credits */}
              <div className="space-y-2">
                <Label htmlFor="ceCredits">CE Credits</Label>
                <Input
                  id="ceCredits"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.ceCredits}
                  onChange={(e) => setFormData({ ...formData, ceCredits: e.target.value })}
                  placeholder="8"
                  aria-invalid={!!errors.ceCredits}
                />
                {errors.ceCredits && (
                  <p className="text-sm text-destructive">{errors.ceCredits}</p>
                )}
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  aria-invalid={!!errors.price}
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price}</p>
                )}
              </div>
            </div>

            {/* Instructor */}
            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor Name</Label>
              <Input
                id="instructor"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                placeholder="e.g., Dr. Jane Smith, CFP"
              />
            </div>

            {/* Learning Objectives */}
            <div className="space-y-2">
              <Label htmlFor="learningObjectives">
                Learning Objectives
                <span className="ml-2 text-xs text-muted-foreground">(one per line)</span>
              </Label>
              <Textarea
                id="learningObjectives"
                value={formData.learningObjectives}
                onChange={(e) =>
                  setFormData({ ...formData, learningObjectives: e.target.value })
                }
                placeholder="Understand Medicare Advantage enrollment periods&#10;Master sales compliance requirements&#10;Apply effective communication strategies"
                rows={4}
              />
            </div>

            {/* Prerequisites */}
            <div className="space-y-2">
              <Label htmlFor="prerequisites">
                Prerequisites
                <span className="ml-2 text-xs text-muted-foreground">(comma-separated)</span>
              </Label>
              <Input
                id="prerequisites"
                value={formData.prerequisites}
                onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                placeholder="e.g., Basic Medicare Knowledge, Active State License"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Course...' : 'Create Course'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
