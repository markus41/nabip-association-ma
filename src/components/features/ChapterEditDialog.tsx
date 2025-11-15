/**
 * Chapter Edit Dialog - Streamline chapter management workflows for sustainable operations
 *
 * Establishes type-safe chapter editing interface with comprehensive validation
 * to ensure data quality and maintain proper hierarchy across the NABIP platform.
 *
 * Best for: Chapter administrators managing organizational updates and configuration changes
 */

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Buildings,
  EnvelopeSimple,
  Phone,
  Globe,
  MapPin,
  CalendarDots,
  FacebookLogo,
  TwitterLogo,
  LinkedinLogo,
  User,
  Warning,
} from '@phosphor-icons/react'
import type { Chapter, ChapterType } from '@/lib/types'

/**
 * Validation Schema - Establish data quality rules for reliable chapter records
 *
 * Implements comprehensive business rules including:
 * - Chapter name validation (3-100 characters for data integrity)
 * - Email format validation with actionable error messaging
 * - URL validation requiring protocol (http:// or https://)
 * - US phone format validation using E.164 standard
 * - Hierarchy enforcement (state chapters need national parent, local chapters need state parent)
 */
const chapterEditFormSchema = z
  .object({
    // Basic Information
    name: z
      .string()
      .min(1, 'Chapter name is required to establish identity')
      .min(3, 'Chapter name must be at least 3 characters for data quality')
      .max(100, 'Chapter name cannot exceed 100 characters'),
    type: z.enum(['national', 'state', 'local'], {
      required_error: 'Chapter type is required to establish hierarchy',
    }),
    parentChapterId: z.string().optional(),

    // Geographic Information (conditional based on type)
    state: z.string().max(2, 'State code must be 2 characters (e.g., CA, NY)').optional(),
    city: z.string().max(100, 'City name cannot exceed 100 characters').optional(),
    region: z.string().max(100, 'Region name cannot exceed 100 characters').optional(),

    // Contact Details
    contactEmail: z
      .string()
      .min(1, 'Contact email is required for chapter communications')
      .email('Please enter a valid email address (e.g., chapter@nabip.org)'),
    phone: z
      .string()
      .regex(
        /^\(\d{3}\) \d{3}-\d{4}$/,
        'Phone must be in format (###) ###-#### for consistent data quality'
      )
      .optional()
      .or(z.literal('')),
    websiteUrl: z
      .string()
      .url('Website must be a valid URL including protocol (https://example.com)')
      .optional()
      .or(z.literal('')),

    // Leadership
    president: z.string().max(100, 'President name cannot exceed 100 characters').optional(),
    established: z.string().optional(),

    // Description
    description: z
      .string()
      .max(1000, 'Description cannot exceed 1000 characters for optimal readability')
      .optional(),
    meetingSchedule: z.string().max(200, 'Meeting schedule cannot exceed 200 characters').optional(),

    // Social Media
    facebookUrl: z
      .string()
      .url('Facebook URL must be valid (https://facebook.com/...)')
      .optional()
      .or(z.literal('')),
    twitterUrl: z
      .string()
      .url('Twitter URL must be valid (https://twitter.com/...)')
      .optional()
      .or(z.literal('')),
    linkedinUrl: z
      .string()
      .url('LinkedIn URL must be valid (https://linkedin.com/...)')
      .optional()
      .or(z.literal('')),

    // Settings
    enableSelfRegistration: z.boolean(),
    requireApproval: z.boolean(),
  })
  .refine(
    (data) => {
      // State chapters must have a parent (national chapter)
      if (data.type === 'state' && !data.parentChapterId) {
        return false
      }
      return true
    },
    {
      message: 'State chapters must have a National parent chapter selected',
      path: ['parentChapterId'],
    }
  )
  .refine(
    (data) => {
      // Local chapters must have a parent (state chapter)
      if (data.type === 'local' && !data.parentChapterId) {
        return false
      }
      return true
    },
    {
      message: 'Local chapters must have a State parent chapter selected',
      path: ['parentChapterId'],
    }
  )
  .refine(
    (data) => {
      // State chapters must have state code
      if (data.type === 'state' && !data.state) {
        return false
      }
      return true
    },
    {
      message: 'State chapters must specify a state code (e.g., CA, NY)',
      path: ['state'],
    }
  )
  .refine(
    (data) => {
      // Local chapters must have city
      if (data.type === 'local' && !data.city) {
        return false
      }
      return true
    },
    {
      message: 'Local chapters must specify a city name',
      path: ['city'],
    }
  )

/**
 * Infer TypeScript type from Zod schema for type-safe form handling
 * This ensures validation rules and TypeScript types stay in sync
 */
type ChapterEditFormData = z.infer<typeof chapterEditFormSchema>

interface ChapterEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chapter: Chapter
  onSuccess: (chapter: Chapter) => void
  existingChapters: Chapter[]
}

/**
 * Format phone number input to US standard format (###) ###-####
 * Provides immediate visual feedback to improve data entry experience
 */
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')

  // Apply formatting based on digit count
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

export function ChapterEditDialog({
  open,
  onOpenChange,
  chapter,
  onSuccess,
  existingChapters,
}: ChapterEditDialogProps) {
  const [showUnsavedChangesWarning, setShowUnsavedChangesWarning] = useState(false)

  /**
   * Check if chapter has child chapters
   * Chapters with children cannot have their type or parent changed to maintain hierarchy integrity
   */
  const hasChildChapters = existingChapters.some((c) => c.parentChapterId === chapter.id)

  /**
   * Initialize React Hook Form with Zod validation resolver
   * Validates on blur for optimal user experience (immediate feedback without overwhelming users)
   */
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<ChapterEditFormData>({
    resolver: zodResolver(chapterEditFormSchema),
    mode: 'onBlur', // Validate on blur for better UX - provides immediate feedback after field completion
    defaultValues: {
      name: chapter.name,
      type: chapter.type,
      parentChapterId: chapter.parentChapterId || '',
      state: chapter.state || '',
      city: chapter.city || '',
      region: chapter.region || '',
      contactEmail: chapter.contactEmail || '',
      phone: chapter.phone || '',
      websiteUrl: chapter.websiteUrl || '',
      president: chapter.president || '',
      established: chapter.established || '',
      description: chapter.description || '',
      meetingSchedule: chapter.meetingSchedule || '',
      facebookUrl: chapter.socialMedia?.facebook || '',
      twitterUrl: chapter.socialMedia?.twitter || '',
      linkedinUrl: chapter.socialMedia?.linkedin || '',
      enableSelfRegistration: chapter.settings?.enableSelfRegistration ?? true,
      requireApproval: chapter.settings?.requireApproval ?? false,
    },
  })

  // Watch fields for conditional rendering and validation
  const chapterType = watch('type')
  const phoneValue = watch('phone')

  /**
   * Reset form to original chapter data when dialog opens
   * Ensures clean state for each edit session
   */
  useEffect(() => {
    if (open) {
      reset({
        name: chapter.name,
        type: chapter.type,
        parentChapterId: chapter.parentChapterId || '',
        state: chapter.state || '',
        city: chapter.city || '',
        region: chapter.region || '',
        contactEmail: chapter.contactEmail || '',
        phone: chapter.phone || '',
        websiteUrl: chapter.websiteUrl || '',
        president: chapter.president || '',
        established: chapter.established || '',
        description: chapter.description || '',
        meetingSchedule: chapter.meetingSchedule || '',
        facebookUrl: chapter.socialMedia?.facebook || '',
        twitterUrl: chapter.socialMedia?.twitter || '',
        linkedinUrl: chapter.socialMedia?.linkedin || '',
        enableSelfRegistration: chapter.settings?.enableSelfRegistration ?? true,
        requireApproval: chapter.settings?.requireApproval ?? false,
      })
    }
  }, [open, chapter, reset])

  /**
   * Get available parent chapters based on selected type
   * Enforces hierarchy: state chapters select from national, local chapters select from state
   */
  const getAvailableParentChapters = (): Chapter[] => {
    if (chapterType === 'state') {
      return existingChapters.filter((c) => c.type === 'national')
    }
    if (chapterType === 'local') {
      return existingChapters.filter((c) => c.type === 'state' && c.id !== chapter.id)
    }
    return []
  }

  /**
   * Handle form submission with comprehensive error handling
   * Establishes reliable chapter update workflow with proper data transformation
   */
  const onSubmit = async (data: ChapterEditFormData) => {
    try {
      // Transform form data to updated Chapter object
      const updatedChapter: Chapter = {
        ...chapter,
        name: data.name.trim(),
        type: data.type as ChapterType,
        parentChapterId: data.parentChapterId || undefined,
        state: data.state?.trim() || undefined,
        city: data.city?.trim() || undefined,
        region: data.region?.trim() || undefined,
        contactEmail: data.contactEmail.trim().toLowerCase(),
        phone: data.phone || undefined,
        websiteUrl: data.websiteUrl || undefined,
        president: data.president?.trim() || undefined,
        established: data.established || undefined,
        description: data.description?.trim() || undefined,
        meetingSchedule: data.meetingSchedule?.trim() || undefined,
        socialMedia: {
          facebook: data.facebookUrl || undefined,
          twitter: data.twitterUrl || undefined,
          linkedin: data.linkedinUrl || undefined,
        },
        settings: {
          enableSelfRegistration: data.enableSelfRegistration,
          requireApproval: data.requireApproval,
        },
      }

      // Invoke parent callback to update chapter
      onSuccess(updatedChapter)

      // Reset form and close dialog on success
      reset()
      onOpenChange(false)

      // Provide success confirmation to user
      toast.success('Chapter Updated Successfully', {
        description: `${updatedChapter.name} has been updated in the AMS.`,
      })
    } catch (error) {
      // Handle unexpected errors with clear messaging
      toast.error('Chapter Update Failed', {
        description:
          error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      })
    }
  }

  /**
   * Handle dialog cancellation with unsaved changes warning
   * Ensures user doesn't lose work accidentally
   */
  const handleCancel = () => {
    if (isDirty) {
      setShowUnsavedChangesWarning(true)
    } else {
      reset()
      onOpenChange(false)
    }
  }

  /**
   * Confirm cancellation and discard changes
   */
  const handleConfirmCancel = () => {
    setShowUnsavedChangesWarning(false)
    reset()
    onOpenChange(false)
  }

  /**
   * Handle phone input with real-time formatting
   * Provides immediate visual feedback to guide users toward correct format
   */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setValue('phone', formatted, { shouldValidate: false })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Chapter</DialogTitle>
            <DialogDescription>
              Update chapter information to maintain accurate organizational records
            </DialogDescription>
          </DialogHeader>

          {hasChildChapters && (
            <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning rounded-lg">
              <Warning className="text-warning mt-0.5" size={20} aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-warning">Hierarchy Restrictions</p>
                <p className="text-xs text-muted-foreground">
                  This chapter has {existingChapters.filter((c) => c.parentChapterId === chapter.id).length} child chapter(s). Type and parent changes are disabled to maintain hierarchy integrity.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium border-b pb-2">Basic Information</h3>

                {/* Chapter Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Chapter Name <span className="text-destructive" aria-label="required">*</span>
                  </Label>
                  <div className="relative">
                    <Buildings
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                      aria-hidden="true"
                    />
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="e.g., California State Chapter"
                      className="pl-10"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                    />
                  </div>
                  {errors.name && (
                    <p id="name-error" className="text-sm text-destructive" role="alert">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Chapter Type (disabled if has children) */}
                <div className="space-y-2">
                  <Label htmlFor="type">
                    Chapter Type <span className="text-destructive" aria-label="required">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setValue('type', value as ChapterEditFormData['type'], {
                        shouldValidate: true,
                      })
                    }
                    value={chapterType}
                    disabled={hasChildChapters}
                  >
                    <SelectTrigger
                      id="type"
                      aria-invalid={!!errors.type}
                      aria-describedby={errors.type ? 'type-error' : undefined}
                    >
                      <SelectValue placeholder="Select chapter type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national">National Chapter</SelectItem>
                      <SelectItem value="state">State Chapter</SelectItem>
                      <SelectItem value="local">Local Chapter</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p id="type-error" className="text-sm text-destructive" role="alert">
                      {errors.type.message}
                    </p>
                  )}
                </div>

                {/* Parent Chapter Selection (disabled if has children) */}
                {chapterType !== 'national' && (
                  <div className="space-y-2">
                    <Label htmlFor="parentChapterId">
                      Parent Chapter{' '}
                      <span className="text-destructive" aria-label="required">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        setValue('parentChapterId', value, { shouldValidate: true })
                      }
                      value={watch('parentChapterId')}
                      disabled={hasChildChapters}
                    >
                      <SelectTrigger
                        id="parentChapterId"
                        aria-invalid={!!errors.parentChapterId}
                        aria-describedby={
                          errors.parentChapterId ? 'parentChapterId-error' : undefined
                        }
                      >
                        <SelectValue placeholder="Select parent chapter" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableParentChapters().map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.parentChapterId && (
                      <p id="parentChapterId-error" className="text-sm text-destructive" role="alert">
                        {errors.parentChapterId.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Geographic Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* State Code (for state chapters) */}
                  {chapterType === 'state' && (
                    <div className="space-y-2">
                      <Label htmlFor="state">
                        State Code{' '}
                        <span className="text-destructive" aria-label="required">*</span>
                      </Label>
                      <div className="relative">
                        <MapPin
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={18}
                          aria-hidden="true"
                        />
                        <Input
                          id="state"
                          {...register('state')}
                          placeholder="e.g., CA"
                          className="pl-10 uppercase"
                          maxLength={2}
                          aria-invalid={!!errors.state}
                          aria-describedby={errors.state ? 'state-error' : undefined}
                        />
                      </div>
                      {errors.state && (
                        <p id="state-error" className="text-sm text-destructive" role="alert">
                          {errors.state.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* City (for local chapters) */}
                  {chapterType === 'local' && (
                    <div className="space-y-2">
                      <Label htmlFor="city">
                        City <span className="text-destructive" aria-label="required">*</span>
                      </Label>
                      <div className="relative">
                        <MapPin
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={18}
                          aria-hidden="true"
                        />
                        <Input
                          id="city"
                          {...register('city')}
                          placeholder="e.g., San Francisco"
                          className="pl-10"
                          aria-invalid={!!errors.city}
                          aria-describedby={errors.city ? 'city-error' : undefined}
                        />
                      </div>
                      {errors.city && (
                        <p id="city-error" className="text-sm text-destructive" role="alert">
                          {errors.city.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Region */}
                  <div className="space-y-2">
                    <Label htmlFor="region">Region (Optional)</Label>
                    <Input
                      id="region"
                      {...register('region')}
                      placeholder="e.g., West Coast"
                      aria-invalid={!!errors.region}
                      aria-describedby={errors.region ? 'region-error' : undefined}
                    />
                    {errors.region && (
                      <p id="region-error" className="text-sm text-destructive" role="alert">
                        {errors.region.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-medium border-b pb-2">Contact Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Contact Email */}
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">
                      Contact Email{' '}
                      <span className="text-destructive" aria-label="required">*</span>
                    </Label>
                    <div className="relative">
                      <EnvelopeSimple
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={18}
                        aria-hidden="true"
                      />
                      <Input
                        id="contactEmail"
                        type="email"
                        {...register('contactEmail')}
                        placeholder="chapter@nabip.org"
                        className="pl-10"
                        aria-invalid={!!errors.contactEmail}
                        aria-describedby={errors.contactEmail ? 'contactEmail-error' : undefined}
                        autoComplete="email"
                      />
                    </div>
                    {errors.contactEmail && (
                      <p id="contactEmail-error" className="text-sm text-destructive" role="alert">
                        {errors.contactEmail.message}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={18}
                        aria-hidden="true"
                      />
                      <Input
                        id="phone"
                        type="tel"
                        {...register('phone')}
                        onChange={handlePhoneChange}
                        value={phoneValue}
                        placeholder="(555) 123-4567"
                        className="pl-10"
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                        autoComplete="tel"
                        maxLength={14}
                      />
                    </div>
                    {errors.phone && (
                      <p id="phone-error" className="text-sm text-destructive" role="alert">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Website URL */}
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
                  <div className="relative">
                    <Globe
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                      aria-hidden="true"
                    />
                    <Input
                      id="websiteUrl"
                      type="url"
                      {...register('websiteUrl')}
                      placeholder="https://chapter.nabip.org"
                      className="pl-10"
                      aria-invalid={!!errors.websiteUrl}
                      aria-describedby={errors.websiteUrl ? 'websiteUrl-error' : undefined}
                      autoComplete="url"
                    />
                  </div>
                  {errors.websiteUrl && (
                    <p id="websiteUrl-error" className="text-sm text-destructive" role="alert">
                      {errors.websiteUrl.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* President */}
                  <div className="space-y-2">
                    <Label htmlFor="president">Chapter President (Optional)</Label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={18}
                        aria-hidden="true"
                      />
                      <Input
                        id="president"
                        {...register('president')}
                        placeholder="e.g., Jane Smith"
                        className="pl-10"
                        aria-invalid={!!errors.president}
                        aria-describedby={errors.president ? 'president-error' : undefined}
                      />
                    </div>
                    {errors.president && (
                      <p id="president-error" className="text-sm text-destructive" role="alert">
                        {errors.president.message}
                      </p>
                    )}
                  </div>

                  {/* Established Date */}
                  <div className="space-y-2">
                    <Label htmlFor="established">Established Date (Optional)</Label>
                    <div className="relative">
                      <CalendarDots
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={18}
                        aria-hidden="true"
                      />
                      <Input
                        id="established"
                        type="date"
                        {...register('established')}
                        className="pl-10"
                        aria-invalid={!!errors.established}
                        aria-describedby={errors.established ? 'established-error' : undefined}
                      />
                    </div>
                    {errors.established && (
                      <p id="established-error" className="text-sm text-destructive" role="alert">
                        {errors.established.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Brief description of the chapter's mission and activities..."
                    rows={4}
                    aria-invalid={!!errors.description}
                    aria-describedby={errors.description ? 'description-error' : undefined}
                  />
                  {errors.description && (
                    <p id="description-error" className="text-sm text-destructive" role="alert">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Meeting Schedule */}
                <div className="space-y-2">
                  <Label htmlFor="meetingSchedule">Meeting Schedule (Optional)</Label>
                  <Input
                    id="meetingSchedule"
                    {...register('meetingSchedule')}
                    placeholder="e.g., First Tuesday of each month"
                    aria-invalid={!!errors.meetingSchedule}
                    aria-describedby={errors.meetingSchedule ? 'meetingSchedule-error' : undefined}
                  />
                  {errors.meetingSchedule && (
                    <p id="meetingSchedule-error" className="text-sm text-destructive" role="alert">
                      {errors.meetingSchedule.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Social Media Section */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-medium border-b pb-2">Social Media Links</h3>

                {/* Facebook */}
                <div className="space-y-2">
                  <Label htmlFor="facebookUrl">Facebook URL (Optional)</Label>
                  <div className="relative">
                    <FacebookLogo
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                      aria-hidden="true"
                    />
                    <Input
                      id="facebookUrl"
                      type="url"
                      {...register('facebookUrl')}
                      placeholder="https://facebook.com/chapter"
                      className="pl-10"
                      aria-invalid={!!errors.facebookUrl}
                      aria-describedby={errors.facebookUrl ? 'facebookUrl-error' : undefined}
                    />
                  </div>
                  {errors.facebookUrl && (
                    <p id="facebookUrl-error" className="text-sm text-destructive" role="alert">
                      {errors.facebookUrl.message}
                    </p>
                  )}
                </div>

                {/* Twitter */}
                <div className="space-y-2">
                  <Label htmlFor="twitterUrl">Twitter URL (Optional)</Label>
                  <div className="relative">
                    <TwitterLogo
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                      aria-hidden="true"
                    />
                    <Input
                      id="twitterUrl"
                      type="url"
                      {...register('twitterUrl')}
                      placeholder="https://twitter.com/chapter"
                      className="pl-10"
                      aria-invalid={!!errors.twitterUrl}
                      aria-describedby={errors.twitterUrl ? 'twitterUrl-error' : undefined}
                    />
                  </div>
                  {errors.twitterUrl && (
                    <p id="twitterUrl-error" className="text-sm text-destructive" role="alert">
                      {errors.twitterUrl.message}
                    </p>
                  )}
                </div>

                {/* LinkedIn */}
                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl">LinkedIn URL (Optional)</Label>
                  <div className="relative">
                    <LinkedinLogo
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                      aria-hidden="true"
                    />
                    <Input
                      id="linkedinUrl"
                      type="url"
                      {...register('linkedinUrl')}
                      placeholder="https://linkedin.com/company/chapter"
                      className="pl-10"
                      aria-invalid={!!errors.linkedinUrl}
                      aria-describedby={errors.linkedinUrl ? 'linkedinUrl-error' : undefined}
                    />
                  </div>
                  {errors.linkedinUrl && (
                    <p id="linkedinUrl-error" className="text-sm text-destructive" role="alert">
                      {errors.linkedinUrl.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Chapter Settings Section */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-medium border-b pb-2">Chapter Settings</h3>

                {/* Enable Self Registration */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableSelfRegistration">Enable Self Registration</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow members to register directly with this chapter
                    </p>
                  </div>
                  <Switch
                    id="enableSelfRegistration"
                    checked={watch('enableSelfRegistration')}
                    onCheckedChange={(checked) =>
                      setValue('enableSelfRegistration', checked, { shouldValidate: true })
                    }
                  />
                </div>

                {/* Require Approval */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requireApproval">Require Admin Approval</Label>
                    <p className="text-xs text-muted-foreground">
                      New member registrations require administrator approval
                    </p>
                  </div>
                  <Switch
                    id="requireApproval"
                    checked={watch('requireApproval')}
                    onCheckedChange={(checked) =>
                      setValue('requireApproval', checked, { shouldValidate: true })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Warning Dialog */}
      <AlertDialog open={showUnsavedChangesWarning} onOpenChange={setShowUnsavedChangesWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedChangesWarning(false)}>
              Continue Editing
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
