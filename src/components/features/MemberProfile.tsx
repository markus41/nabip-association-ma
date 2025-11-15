import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  UserCircle,
  EnvelopeSimple,
  Phone,
  Buildings,
  MapPin,
  Certificate,
  Briefcase,
  Eye,
  EyeSlash,
  Sparkle,
  CheckCircle,
  Upload,
  Plus,
  Trash
} from '@phosphor-icons/react'
import type { Member, Credential } from '@/lib/types'
import { formatDate } from '@/lib/data-utils'
import { toast } from 'sonner'

interface MemberProfileProps {
  memberId: string
}

type PrivacySetting = 'everyone' | 'members' | 'chapter' | 'hidden'
type ExpertiseArea = 'medicare' | 'group_benefits' | 'self_funded' | 'individual_health' | 'dental_vision' | 'life_insurance' | 'disability' | 'ancillary'

const expertiseOptions: { value: ExpertiseArea; label: string }[] = [
  { value: 'medicare', label: 'Medicare' },
  { value: 'group_benefits', label: 'Group Benefits' },
  { value: 'self_funded', label: 'Self-Funded Plans' },
  { value: 'individual_health', label: 'Individual Health Insurance' },
  { value: 'dental_vision', label: 'Dental & Vision' },
  { value: 'life_insurance', label: 'Life Insurance' },
  { value: 'disability', label: 'Disability Insurance' },
  { value: 'ancillary', label: 'Ancillary Benefits' }
]

export function MemberProfile({ memberId }: MemberProfileProps) {
  const [currentMember, setCurrentMember] = useKV<Member | null>('current-member', null)
  const [isEditing, setIsEditing] = useState(false)
  const [expertise, setExpertise] = useState<ExpertiseArea[]>([])
  const [privacy, setPrivacy] = useState<{
    email: PrivacySetting
    phone: PrivacySetting
    company: PrivacySetting
  }>({
    email: 'members',
    phone: 'chapter',
    company: 'everyone'
  })

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    bio: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: ''
    }
  })

  useEffect(() => {
    if (!currentMember) {
      const mockMember: Member = {
        id: memberId,
        email: 'john.smith@example.com',
        firstName: 'John',
        lastName: 'Smith',
        memberType: 'individual',
        status: 'active',
        chapterId: 'California',
        joinedDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
        expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        phone: '(555) 123-4567',
        company: 'ABC Insurance Group',
        jobTitle: 'Senior Benefits Consultant',
        designations: ['CLU', 'ChFC'],
        credentials: [
          {
            id: '1',
            name: 'Certified Employee Benefits Specialist (CEBS)',
            issuer: 'NABIP',
            issuedDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          }
        ],
        engagementScore: 87,
        preferences: {
          emailNotifications: true,
          smsNotifications: false,
          newsletterSubscribed: true,
          eventReminders: true,
          marketingEmails: true
        }
      }
      setCurrentMember(mockMember)
    }

    if (currentMember) {
      setFormData({
        firstName: currentMember.firstName || '',
        lastName: currentMember.lastName || '',
        email: currentMember.email || '',
        phone: currentMember.phone || '',
        company: currentMember.company || '',
        jobTitle: currentMember.jobTitle || '',
        bio: currentMember.customFields?.bio as string || '',
        address: {
          street: currentMember.address?.street || '',
          city: currentMember.address?.city || '',
          state: currentMember.address?.state || '',
          zip: currentMember.address?.zip || ''
        }
      })
      
      if (currentMember.customFields?.expertise) {
        setExpertise(currentMember.customFields.expertise as ExpertiseArea[])
      }
    }
  }, [memberId, currentMember])

  const calculateProfileStrength = (): number => {
    let strength = 0
    const checks = [
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.phone,
      formData.company,
      formData.jobTitle,
      formData.bio,
      expertise.length > 0,
      currentMember?.credentials && currentMember.credentials.length > 0,
      currentMember?.avatarUrl
    ]
    
    checks.forEach(check => {
      if (check) strength += 10
    })
    
    return strength
  }

  const getProfileCompletionMessage = (strength: number): string => {
    if (strength < 40) return 'Add your professional details to get started'
    if (strength < 60) return 'Add your certifications to appear in more member searches'
    if (strength < 80) return 'Add your areas of expertise to help members find you'
    if (strength < 100) return 'Upload a professional photo to complete your profile'
    return 'Your profile is complete! Keep it updated'
  }

  const handleSave = () => {
    if (currentMember) {
      setCurrentMember({
        ...currentMember,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        jobTitle: formData.jobTitle,
        address: formData.address,
        customFields: {
          ...currentMember.customFields,
          bio: formData.bio,
          expertise,
          privacy
        }
      })
      toast.success('Profile updated successfully!')
      setIsEditing(false)
    }
  }

  const toggleExpertise = (area: ExpertiseArea) => {
    setExpertise(prev => 
      prev.includes(area)
        ? prev.filter(e => e !== area)
        : [...prev, area]
    )
  }

  const handleAddCredential = () => {
    toast.info('Credential form would open here', {
      description: 'Add your professional certifications and designations'
    })
  }

  const profileStrength = calculateProfileStrength()

  if (!currentMember) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const PrivacyToggle = ({ field, label }: { field: keyof typeof privacy; label: string }) => (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <span className="text-sm font-medium">Who can see my {label.toLowerCase()}?</span>
      <Select
        value={privacy[field]}
        onValueChange={(value: PrivacySetting) => setPrivacy({ ...privacy, [field]: value })}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="everyone">
            <div className="flex items-center gap-2">
              <Eye size={14} />
              Everyone
            </div>
          </SelectItem>
          <SelectItem value="members">
            <div className="flex items-center gap-2">
              <Eye size={14} />
              Members Only
            </div>
          </SelectItem>
          <SelectItem value="chapter">
            <div className="flex items-center gap-2">
              <Eye size={14} />
              Chapter Only
            </div>
          </SelectItem>
          <SelectItem value="hidden">
            <div className="flex items-center gap-2">
              <EyeSlash size={14} />
              Hidden
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your professional profile and control your privacy settings
          </p>
        </div>
      </div>

      <Card className="p-6 bg-gradient-to-br from-teal/5 to-teal/10 border-teal/20">
        <div className="flex items-center gap-3 mb-3">
          <Sparkle size={24} weight="duotone" className="text-teal" />
          <h3 className="font-semibold">Profile Strength</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{profileStrength}% Complete</span>
            {profileStrength === 100 && (
              <Badge variant="outline" className="bg-teal/10 text-teal border-teal/20">
                <CheckCircle size={14} className="mr-1" weight="fill" />
                Complete
              </Badge>
            )}
          </div>
          <Progress value={profileStrength} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {getProfileCompletionMessage(profileStrength)}
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Professional Information</h2>
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center relative group">
              {currentMember.avatarUrl ? (
                <img src={currentMember.avatarUrl} alt="Profile" className="w-full h-full object-cover rounded-full" />
              ) : (
                <UserCircle size={64} weight="duotone" className="text-muted-foreground" />
              )}
              {isEditing && (
                <button className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload size={24} className="text-white" />
                </button>
              )}
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="e.g., Benefits Consultant"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <div className="relative">
                <Buildings className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder="Your company name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              disabled={!isEditing}
              rows={4}
              placeholder="Tell other members about your experience and expertise..."
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Certifications & Designations</h2>
          <Button variant="outline" size="sm" onClick={handleAddCredential}>
            <Plus size={16} className="mr-1" />
            Add Credential
          </Button>
        </div>

        {currentMember.credentials && currentMember.credentials.length > 0 ? (
          <div className="space-y-3">
            {currentMember.credentials.map((credential) => (
              <div key={credential.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0">
                    <Certificate size={20} weight="duotone" className="text-teal" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{credential.name}</h3>
                    <p className="text-sm text-muted-foreground">{credential.issuer}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                      <span className="text-muted-foreground">
                        Issued: {formatDate(credential.issuedDate)}
                      </span>
                      {credential.expiryDate && (
                        <span className="text-muted-foreground">
                          Expires: {formatDate(credential.expiryDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      credential.status === 'active'
                        ? 'bg-teal/10 text-teal border-teal/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }
                  >
                    {credential.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Certificate size={48} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No credentials added yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your certifications to boost your profile visibility
            </p>
            <Button variant="outline" onClick={handleAddCredential}>
              <Plus size={16} className="mr-1" />
              Add Your First Credential
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Areas of Expertise</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Select the areas where you specialize to help other members find you
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {expertiseOptions.map((option) => (
            <div
              key={option.value}
              className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                expertise.includes(option.value)
                  ? 'bg-teal/5 border-teal/30'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => isEditing && toggleExpertise(option.value)}
            >
              <Checkbox
                id={option.value}
                checked={expertise.includes(option.value)}
                onCheckedChange={() => toggleExpertise(option.value)}
                disabled={!isEditing}
              />
              <Label
                htmlFor={option.value}
                className="flex-1 cursor-pointer font-normal"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Privacy Settings</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Control who can see your contact information in the member directory
        </p>
        <div className="space-y-3">
          <PrivacyToggle field="email" label="Email" />
          <PrivacyToggle field="phone" label="Phone" />
          <PrivacyToggle field="company" label="Company" />
        </div>
      </Card>

      {isEditing && (
        <div className="sticky bottom-0 left-0 right-0 bg-background border-t p-4 flex items-center justify-end gap-3 shadow-lg">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <CheckCircle size={18} className="mr-2" weight="fill" />
            Save All Changes
          </Button>
        </div>
      )}
    </div>
  )
}
