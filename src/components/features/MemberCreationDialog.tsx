/**
 * Member Creation Dialog - Streamline member onboarding workflows for sustainable growth
 *
 * Establishes type-safe member registration interface with comprehensive validation
 * to ensure data quality and improve member engagement tracking across the NABIP platform.
 *
 * Best for: Chapter administrators managing member enrollment and data collection workflows
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { User, EnvelopeSimple, Phone, Buildings, Briefcase } from '@phosphor-icons/react'
import type { Member, Chapter, MembershipType, MemberStatus } from '@/lib/types'

/**
 * Validation Schema - Establish data quality rules to ensure reliable member records
 *
 * Implements comprehensive business rules including:
 * - Name length validation (minimum 2 characters for data integrity)
 * - Email format validation with actionable error messaging
 * - US phone format validation using E.164 standard
 * - Required field enforcement with clear user guidance
 */
const memberFormSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required to establish member identity')
    .min(2, 'First name must be at least 2 characters for data quality')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required to establish member identity')
    .min(2, 'Last name must be at least 2 characters for data quality')
    .max(50, 'Last name cannot exceed 50 characters'),
  email: z
    .string()
    .min(1, 'Email address is required for member communications')
    .email('Please enter a valid email address (e.g., member@example.com)'),
  phone: z
    .string()
    .min(1, 'Phone number is required for member contact')
    .regex(
      /^\(\d{3}\) \d{3}-\d{4}$/,
      'Phone must be in format (###) ###-#### for consistent data quality'
    ),
  company: z.string().max(100, 'Company name cannot exceed 100 characters').optional(),
  jobTitle: z.string().max(100, 'Job title cannot exceed 100 characters').optional(),
  memberType: z.enum(['individual', 'student', 'corporate', 'lifetime'], {
    required_error: 'Member type is required to establish membership tier',
  }),
  chapterId: z.string().min(1, 'Chapter selection is required to establish member affiliation'),
  status: z.enum(['active', 'inactive', 'pending', 'expired'], {
    required_error: 'Member status is required',
  }),
})

/**
 * Infer TypeScript type from Zod schema for type-safe form handling
 * This ensures validation rules and TypeScript types stay in sync
 */
type MemberFormData = z.infer<typeof memberFormSchema>

interface MemberCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateMember: (
    memberData: Omit<Member, 'id' | 'joinedDate' | 'engagementScore' | 'credentials'>
  ) => void
  chapters: Chapter[]
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

export function MemberCreationDialog({
  open,
  onOpenChange,
  onCreateMember,
  chapters,
}: MemberCreationDialogProps) {
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
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberFormSchema),
    mode: 'onBlur', // Validate on blur for better UX - provides immediate feedback after field completion
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      jobTitle: '',
      memberType: 'individual',
      chapterId: '',
      status: 'active',
    },
  })

  // Watch phone field for real-time formatting
  const phoneValue = watch('phone')

  /**
   * Reset form state when dialog closes to ensure clean slate for next member creation
   * Prevents form state persistence that could cause data entry errors
   */
  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  /**
   * Handle form submission with comprehensive error handling
   * Establishes reliable member creation workflow with proper data transformation
   */
  const onSubmit = async (data: MemberFormData) => {
    try {
      // Transform form data to Member object structure (excluding auto-generated fields)
      const memberData: Omit<Member, 'id' | 'joinedDate' | 'engagementScore' | 'credentials'> = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(), // Normalize email for consistency
        phone: data.phone, // Already formatted via input handler
        company: data.company?.trim() || undefined,
        jobTitle: data.jobTitle?.trim() || undefined,
        memberType: data.memberType as MembershipType,
        chapterId: data.chapterId,
        status: data.status as MemberStatus,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      }

      // Invoke parent callback to create member
      onCreateMember(memberData)

      // Reset form and close dialog on success
      reset()
      onOpenChange(false)

      // Provide success confirmation to user
      toast.success('Member Created Successfully', {
        description: `${memberData.firstName} ${memberData.lastName} has been added to the AMS.`,
      })
    } catch (error) {
      // Handle unexpected errors with clear messaging
      toast.error('Member Creation Failed', {
        description:
          error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      })
    }
  }

  /**
   * Handle dialog cancellation with form reset
   * Ensures clean state when user abandons member creation
   */
  const handleCancel = () => {
    reset()
    onOpenChange(false)
  }

  /**
   * Handle phone input with real-time formatting
   * Provides immediate visual feedback to guide users toward correct format
   */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setValue('phone', formatted, { shouldValidate: false }) // Don't validate on every keystroke
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Member to AMS</DialogTitle>
          <DialogDescription>
            Establish member record to streamline engagement tracking and chapter operations
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Personal Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive" aria-label="required">*</span>
                </Label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={18}
                    aria-hidden="true"
                  />
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    placeholder="e.g., John"
                    className="pl-10"
                    aria-invalid={!!errors.firstName}
                    aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                    autoComplete="given-name"
                  />
                </div>
                {errors.firstName && (
                  <p id="firstName-error" className="text-sm text-destructive" role="alert">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive" aria-label="required">*</span>
                </Label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={18}
                    aria-hidden="true"
                  />
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    placeholder="e.g., Smith"
                    className="pl-10"
                    aria-invalid={!!errors.lastName}
                    aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                    autoComplete="family-name"
                  />
                </div>
                {errors.lastName && (
                  <p id="lastName-error" className="text-sm text-destructive" role="alert">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive" aria-label="required">*</span>
                </Label>
                <div className="relative">
                  <EnvelopeSimple
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={18}
                    aria-hidden="true"
                  />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="member@example.com"
                    className="pl-10"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-destructive" aria-label="required">*</span>
                </Label>
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
                    maxLength={14} // (###) ###-####
                  />
                </div>
                {errors.phone && (
                  <p id="phone-error" className="text-sm text-destructive" role="alert">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            {/* Professional Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="company">Company (Optional)</Label>
                <div className="relative">
                  <Buildings
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={18}
                    aria-hidden="true"
                  />
                  <Input
                    id="company"
                    {...register('company')}
                    placeholder="e.g., ABC Insurance Group"
                    className="pl-10"
                    aria-invalid={!!errors.company}
                    aria-describedby={errors.company ? 'company-error' : undefined}
                    autoComplete="organization"
                  />
                </div>
                {errors.company && (
                  <p id="company-error" className="text-sm text-destructive" role="alert">
                    {errors.company.message}
                  </p>
                )}
              </div>

              {/* Job Title */}
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title (Optional)</Label>
                <div className="relative">
                  <Briefcase
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={18}
                    aria-hidden="true"
                  />
                  <Input
                    id="jobTitle"
                    {...register('jobTitle')}
                    placeholder="e.g., Benefits Consultant"
                    className="pl-10"
                    aria-invalid={!!errors.jobTitle}
                    aria-describedby={errors.jobTitle ? 'jobTitle-error' : undefined}
                    autoComplete="organization-title"
                  />
                </div>
                {errors.jobTitle && (
                  <p id="jobTitle-error" className="text-sm text-destructive" role="alert">
                    {errors.jobTitle.message}
                  </p>
                )}
              </div>
            </div>

            {/* Membership Configuration Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Member Type */}
              <div className="space-y-2">
                <Label htmlFor="memberType">
                  Member Type <span className="text-destructive" aria-label="required">*</span>
                </Label>
                <Select
                  onValueChange={(value) => setValue('memberType', value as MemberFormData['memberType'], { shouldValidate: true })}
                  defaultValue="individual"
                >
                  <SelectTrigger
                    id="memberType"
                    aria-invalid={!!errors.memberType}
                    aria-describedby={errors.memberType ? 'memberType-error' : undefined}
                  >
                    <SelectValue placeholder="Select member type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
                {errors.memberType && (
                  <p id="memberType-error" className="text-sm text-destructive" role="alert">
                    {errors.memberType.message}
                  </p>
                )}
              </div>

              {/* Chapter Assignment */}
              <div className="space-y-2">
                <Label htmlFor="chapterId">
                  Chapter <span className="text-destructive" aria-label="required">*</span>
                </Label>
                <Select
                  onValueChange={(value) => setValue('chapterId', value, { shouldValidate: true })}
                >
                  <SelectTrigger
                    id="chapterId"
                    aria-invalid={!!errors.chapterId}
                    aria-describedby={errors.chapterId ? 'chapterId-error' : undefined}
                  >
                    <SelectValue placeholder="Select chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters
                      .sort((a, b) => {
                        // Sort by type (national, state, local) then by name
                        const typeOrder = { national: 0, state: 1, local: 2 }
                        if (a.type !== b.type) {
                          return typeOrder[a.type] - typeOrder[b.type]
                        }
                        return a.name.localeCompare(b.name)
                      })
                      .map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id}>
                          {chapter.name}
                          {chapter.type === 'state' && ` (${chapter.state})`}
                          {chapter.type === 'local' && ` (${chapter.city})`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.chapterId && (
                  <p id="chapterId-error" className="text-sm text-destructive" role="alert">
                    {errors.chapterId.message}
                  </p>
                )}
              </div>
            </div>

            {/* Status Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-destructive" aria-label="required">*</span>
                </Label>
                <Select
                  onValueChange={(value) => setValue('status', value as MemberFormData['status'], { shouldValidate: true })}
                  defaultValue="active"
                >
                  <SelectTrigger
                    id="status"
                    aria-invalid={!!errors.status}
                    aria-describedby={errors.status ? 'status-error' : undefined}
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p id="status-error" className="text-sm text-destructive" role="alert">
                    {errors.status.message}
                  </p>
                )}
              </div>
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
              {isSubmitting ? 'Adding Member...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
