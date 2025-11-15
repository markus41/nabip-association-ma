/**
 * Chapter Creation Dialog - Streamline chapter onboarding workflows for scalable growth
 *
 * Establishes type-safe chapter registration interface with comprehensive validation
 * to ensure data quality and maintain proper hierarchy across the NABIP platform.
 *
 * Best for: National and state administrators establishing new chapter infrastructure
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
  CheckCircle,
  ArrowLeft,
  ArrowRight,
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
const chapterFormSchema = z
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
type ChapterFormData = z.infer<typeof chapterFormSchema>

interface ChapterCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (chapter: Chapter) => void
  existingChapters: Chapter[]
}

type FormStep = 'basic' | 'contact' | 'settings' | 'preview'

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

export function ChapterCreationDialog({
  open,
  onOpenChange,
  onSuccess,
  existingChapters,
}: ChapterCreationDialogProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('basic')

  /**
   * Initialize React Hook Form with Zod validation resolver
   * Validates on blur for optimal user experience (immediate feedback without overwhelming users)
   */
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm<ChapterFormData>({
    resolver: zodResolver(chapterFormSchema),
    mode: 'onBlur', // Validate on blur for better UX - provides immediate feedback after field completion
    defaultValues: {
      name: '',
      type: 'local',
      parentChapterId: '',
      state: '',
      city: '',
      region: '',
      contactEmail: '',
      phone: '',
      websiteUrl: '',
      president: '',
      established: '',
      description: '',
      meetingSchedule: '',
      facebookUrl: '',
      twitterUrl: '',
      linkedinUrl: '',
      enableSelfRegistration: true,
      requireApproval: false,
    },
  })

  // Watch fields for conditional rendering and validation
  const chapterType = watch('type')
  const phoneValue = watch('phone')

  /**
   * Reset form state when dialog closes to ensure clean slate for next chapter creation
   * Prevents form state persistence that could cause data entry errors
   */
  useEffect(() => {
    if (!open) {
      reset()
      setCurrentStep('basic')
    }
  }, [open, reset])

  /**
   * Get available parent chapters based on selected type
   * Enforces hierarchy: state chapters select from national, local chapters select from state
   */
  const getAvailableParentChapters = (): Chapter[] => {
    if (chapterType === 'state') {
      return existingChapters.filter((c) => c.type === 'national')
    }
    if (chapterType === 'local') {
      return existingChapters.filter((c) => c.type === 'state')
    }
    return []
  }

  /**
   * Handle multi-step navigation with validation
   * Only allows progression if current step fields are valid
   */
  const handleNext = async () => {
    let fieldsToValidate: (keyof ChapterFormData)[] = []

    if (currentStep === 'basic') {
      fieldsToValidate = ['name', 'type', 'parentChapterId', 'state', 'city', 'region']
    } else if (currentStep === 'contact') {
      fieldsToValidate = [
        'contactEmail',
        'phone',
        'websiteUrl',
        'president',
        'established',
        'description',
        'meetingSchedule',
      ]
    } else if (currentStep === 'settings') {
      fieldsToValidate = ['facebookUrl', 'twitterUrl', 'linkedinUrl']
    }

    const isValid = await trigger(fieldsToValidate)

    if (isValid) {
      if (currentStep === 'basic') setCurrentStep('contact')
      else if (currentStep === 'contact') setCurrentStep('settings')
      else if (currentStep === 'settings') setCurrentStep('preview')
    }
  }

  const handleBack = () => {
    if (currentStep === 'preview') setCurrentStep('settings')
    else if (currentStep === 'settings') setCurrentStep('contact')
    else if (currentStep === 'contact') setCurrentStep('basic')
  }

  /**
   * Handle form submission with comprehensive error handling
   * Establishes reliable chapter creation workflow with proper data transformation
   */
  const onSubmit = async (data: ChapterFormData) => {
    try {
      // Transform form data to Chapter object structure
      const newChapter: Chapter = {
        id: crypto.randomUUID(),
        name: data.name.trim(),
        type: data.type as ChapterType,
        parentChapterId: data.parentChapterId || undefined,
        state: data.state?.trim() || undefined,
        city: data.city?.trim() || undefined,
        region: data.region?.trim() || undefined,
        memberCount: 0,
        activeEventsCount: 0,
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

      // Invoke parent callback to create chapter
      onSuccess(newChapter)

      // Reset form and close dialog on success
      reset()
      setCurrentStep('basic')
      onOpenChange(false)

      // Provide success confirmation to user
      toast.success('Chapter Created Successfully', {
        description: `${newChapter.name} has been added to the AMS.`,
      })
    } catch (error) {
      // Handle unexpected errors with clear messaging
      toast.error('Chapter Creation Failed', {
        description:
          error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      })
    }
  }

  /**
   * Handle dialog cancellation with form reset
   * Ensures clean state when user abandons chapter creation
   */
  const handleCancel = () => {
    reset()
    setCurrentStep('basic')
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

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div
        className={`flex items-center gap-2 ${currentStep === 'basic' ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'basic' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        >
          1
        </div>
        <span className="text-sm font-medium hidden sm:inline">Basic Info</span>
      </div>
      <div className="w-12 h-px bg-border" />
      <div
        className={`flex items-center gap-2 ${currentStep === 'contact' ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'contact' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        >
          2
        </div>
        <span className="text-sm font-medium hidden sm:inline">Contact Details</span>
      </div>
      <div className="w-12 h-px bg-border" />
      <div
        className={`flex items-center gap-2 ${currentStep === 'settings' ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'settings' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        >
          3
        </div>
        <span className="text-sm font-medium hidden sm:inline">Settings</span>
      </div>
      <div className="w-12 h-px bg-border" />
      <div
        className={`flex items-center gap-2 ${currentStep === 'preview' ? 'text-primary' : 'text-muted-foreground'}`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        >
          4
        </div>
        <span className="text-sm font-medium hidden sm:inline">Preview</span>
      </div>
    </div>
  )

  const renderBasicInfoStep = () => (
    <div className="space-y-4">
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

      {/* Chapter Type */}
      <div className="space-y-2">
        <Label htmlFor="type">
          Chapter Type <span className="text-destructive" aria-label="required">*</span>
        </Label>
        <Select
          onValueChange={(value) =>
            setValue('type', value as ChapterFormData['type'], { shouldValidate: true })
          }
          defaultValue="local"
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
        <p className="text-xs text-muted-foreground">
          {chapterType === 'national' && 'Top-level chapter with no parent'}
          {chapterType === 'state' && 'Must select a National chapter as parent'}
          {chapterType === 'local' && 'Must select a State chapter as parent'}
        </p>
      </div>

      {/* Parent Chapter Selection (conditional) */}
      {chapterType !== 'national' && (
        <div className="space-y-2">
          <Label htmlFor="parentChapterId">
            Parent Chapter <span className="text-destructive" aria-label="required">*</span>
          </Label>
          <Select
            onValueChange={(value) => setValue('parentChapterId', value, { shouldValidate: true })}
          >
            <SelectTrigger
              id="parentChapterId"
              aria-invalid={!!errors.parentChapterId}
              aria-describedby={errors.parentChapterId ? 'parentChapterId-error' : undefined}
            >
              <SelectValue placeholder="Select parent chapter" />
            </SelectTrigger>
            <SelectContent>
              {getAvailableParentChapters().map((chapter) => (
                <SelectItem key={chapter.id} value={chapter.id}>
                  {chapter.name}
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

      {/* State Code (for state chapters) */}
      {chapterType === 'state' && (
        <div className="space-y-2">
          <Label htmlFor="state">
            State Code <span className="text-destructive" aria-label="required">*</span>
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

      {/* Region (optional) */}
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
  )

  const renderContactDetailsStep = () => (
    <div className="space-y-4">
      {/* Contact Email */}
      <div className="space-y-2">
        <Label htmlFor="contactEmail">
          Contact Email <span className="text-destructive" aria-label="required">*</span>
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
  )

  const renderSettingsStep = () => (
    <div className="space-y-4">
      {/* Social Media Links */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Social Media Links (Optional)</h3>

        {/* Facebook */}
        <div className="space-y-2">
          <Label htmlFor="facebookUrl">Facebook URL</Label>
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
          <Label htmlFor="twitterUrl">Twitter URL</Label>
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
          <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
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

      {/* Chapter Settings */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-medium">Chapter Settings</h3>

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
            onCheckedChange={(checked) =>
              setValue('enableSelfRegistration', checked, { shouldValidate: true })
            }
            defaultChecked
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
            onCheckedChange={(checked) =>
              setValue('requireApproval', checked, { shouldValidate: true })
            }
          />
        </div>
      </div>
    </div>
  )

  const renderPreviewStep = () => {
    const formData = watch()

    return (
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Basic Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Chapter Name:</span>
                <span className="text-sm font-medium">{formData.name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type:</span>
                <span className="text-sm font-medium capitalize">{formData.type}</span>
              </div>
              {formData.parentChapterId && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Parent Chapter:</span>
                  <span className="text-sm font-medium">
                    {existingChapters.find((c) => c.id === formData.parentChapterId)?.name || '—'}
                  </span>
                </div>
              )}
              {formData.state && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">State:</span>
                  <span className="text-sm font-medium">{formData.state}</span>
                </div>
              )}
              {formData.city && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">City:</span>
                  <span className="text-sm font-medium">{formData.city}</span>
                </div>
              )}
              {formData.region && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Region:</span>
                  <span className="text-sm font-medium">{formData.region}</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Contact Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="text-sm font-medium">{formData.contactEmail || '—'}</span>
              </div>
              {formData.phone && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Phone:</span>
                  <span className="text-sm font-medium">{formData.phone}</span>
                </div>
              )}
              {formData.websiteUrl && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Website:</span>
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {formData.websiteUrl}
                  </span>
                </div>
              )}
              {formData.president && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">President:</span>
                  <span className="text-sm font-medium">{formData.president}</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Settings</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Self Registration:</span>
                <span className="text-sm font-medium">
                  {formData.enableSelfRegistration ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Require Approval:</span>
                <span className="text-sm font-medium">
                  {formData.requireApproval ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Chapter</DialogTitle>
          <DialogDescription>
            Establish chapter infrastructure to streamline member engagement and organizational
            operations
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {currentStep === 'basic' && renderBasicInfoStep()}
          {currentStep === 'contact' && renderContactDetailsStep()}
          {currentStep === 'settings' && renderSettingsStep()}
          {currentStep === 'preview' && renderPreviewStep()}

          <div className="flex justify-between gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 'basic' ? handleCancel : handleBack}
              disabled={isSubmitting}
            >
              {currentStep === 'basic' ? (
                'Cancel'
              ) : (
                <>
                  <ArrowLeft size={16} className="mr-2" />
                  Back
                </>
              )}
            </Button>
            {currentStep === 'preview' ? (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  'Creating Chapter...'
                ) : (
                  <>
                    <CheckCircle size={16} className="mr-2" />
                    Create Chapter
                  </>
                )}
              </Button>
            ) : (
              <Button type="button" onClick={handleNext}>
                Next
                <ArrowRight size={16} className="ml-2" />
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
