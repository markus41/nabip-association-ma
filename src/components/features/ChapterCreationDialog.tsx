import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Buildings } from '@phosphor-icons/react'
import type { Chapter, ChapterType } from '@/lib/types'
import { toast } from 'sonner'

interface ChapterCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateChapter: (chapter: Omit<Chapter, 'id'>) => void
  availableParentChapters: Chapter[]
}

export function ChapterCreationDialog({
  open,
  onOpenChange,
  onCreateChapter,
  availableParentChapters
}: ChapterCreationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<Chapter>>({
    name: '',
    type: 'local',
    memberCount: 0,
    activeEventsCount: 0,
    state: '',
    city: '',
    region: '',
    contactEmail: '',
    phone: '',
    websiteUrl: '',
    description: '',
    president: '',
    established: new Date().getFullYear().toString(),
    parentChapterId: undefined
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'Chapter name is required'
    }

    if (!formData.type) {
      newErrors.type = 'Chapter type is required'
    }

    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email address'
    }

    if (formData.websiteUrl && !/^https?:\/\/.+/.test(formData.websiteUrl)) {
      newErrors.websiteUrl = 'Invalid URL (must start with http:// or https://)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare chapter data
      const newChapter: Omit<Chapter, 'id'> = {
        name: formData.name!.trim(),
        type: formData.type as ChapterType,
        memberCount: formData.memberCount || 0,
        activeEventsCount: formData.activeEventsCount || 0,
        state: formData.state?.trim(),
        city: formData.city?.trim(),
        region: formData.region?.trim(),
        contactEmail: formData.contactEmail?.trim(),
        phone: formData.phone?.trim(),
        websiteUrl: formData.websiteUrl?.trim(),
        description: formData.description?.trim(),
        president: formData.president?.trim(),
        established: formData.established?.trim(),
        parentChapterId: formData.parentChapterId || undefined
      }

      // Call the callback
      onCreateChapter(newChapter)

      // Reset form
      setFormData({
        name: '',
        type: 'local',
        memberCount: 0,
        activeEventsCount: 0,
        state: '',
        city: '',
        region: '',
        contactEmail: '',
        phone: '',
        websiteUrl: '',
        description: '',
        president: '',
        established: new Date().getFullYear().toString(),
        parentChapterId: undefined
      })
      setErrors({})

      // Close dialog
      onOpenChange(false)
      
      toast.success('Chapter created successfully')
    } catch (error) {
      toast.error('Failed to create chapter')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFieldChange = (field: keyof Chapter, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Buildings size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <DialogTitle>Create New Chapter</DialogTitle>
              <DialogDescription>
                Add a new chapter to the organizational hierarchy
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Basic Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">
                  Chapter Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="e.g., California State Chapter"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  Chapter Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleFieldChange('type', value as ChapterType)}
                >
                  <SelectTrigger id="type" className={errors.type ? 'border-destructive' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national">National</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-destructive">{errors.type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentChapter">Parent Chapter</Label>
                <Select
                  value={formData.parentChapterId || 'none'}
                  onValueChange={(value) => handleFieldChange('parentChapterId', value === 'none' ? undefined : value)}
                >
                  <SelectTrigger id="parentChapter">
                    <SelectValue placeholder="No parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No parent</SelectItem>
                    {availableParentChapters.map(chapter => (
                      <SelectItem key={chapter.id} value={chapter.id}>
                        {chapter.name} ({chapter.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="president">President/Leader</Label>
                <Input
                  id="president"
                  value={formData.president}
                  onChange={(e) => handleFieldChange('president', e.target.value)}
                  placeholder="e.g., John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="established">Established Year</Label>
                <Input
                  id="established"
                  value={formData.established}
                  onChange={(e) => handleFieldChange('established', e.target.value)}
                  placeholder="e.g., 2020"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="Brief description of the chapter..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Location
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  placeholder="e.g., California"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  placeholder="e.g., San Francisco"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => handleFieldChange('region', e.target.value)}
                  placeholder="e.g., Northern California"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Contact Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
                  placeholder="contact@chapter.org"
                  className={errors.contactEmail ? 'border-destructive' : ''}
                />
                {errors.contactEmail && (
                  <p className="text-sm text-destructive">{errors.contactEmail}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="websiteUrl">Website</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => handleFieldChange('websiteUrl', e.target.value)}
                  placeholder="https://chapter.org"
                  className={errors.websiteUrl ? 'border-destructive' : ''}
                />
                {errors.websiteUrl && (
                  <p className="text-sm text-destructive">{errors.websiteUrl}</p>
                )}
              </div>
            </div>
          </div>

          {/* Initial Metrics */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Initial Metrics (Optional)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="memberCount">Member Count</Label>
                <Input
                  id="memberCount"
                  type="number"
                  min="0"
                  value={formData.memberCount}
                  onChange={(e) => handleFieldChange('memberCount', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activeEventsCount">Active Events</Label>
                <Input
                  id="activeEventsCount"
                  type="number"
                  min="0"
                  value={formData.activeEventsCount}
                  onChange={(e) => handleFieldChange('activeEventsCount', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Chapter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
