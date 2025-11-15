import { useState } from 'react'
import { useLocalStorage } from '@/lib/useLocalStorage'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  UserCircle,
  EnvelopeSimple,
  Phone,
  Buildings,
  MapPin,
  CreditCard,
  Certificate,
  Bell,
  Lock
} from '@phosphor-icons/react'
import type { Member, Credential } from '@/lib/types'
import { formatDate } from '@/lib/data-utils'
import { toast } from 'sonner'
import { MemberPortalLogin } from './MemberPortalLogin'

interface MemberPortalProps {
  memberId: string
}

export function MemberPortal({ memberId }: MemberPortalProps) {
  const [currentMember, setCurrentMember] = useLocalStorage<Member | null>('current-member', null)
  const [isEditing, setIsEditing] = useState(false)

  const [formData, setFormData] = useState({
    firstName: currentMember?.firstName || '',
    lastName: currentMember?.lastName || '',
    email: currentMember?.email || '',
    phone: currentMember?.phone || '',
    company: currentMember?.company || '',
    jobTitle: currentMember?.jobTitle || ''
  })

  const [preferences, setPreferences] = useState({
    emailNotifications: currentMember?.preferences?.emailNotifications ?? true,
    smsNotifications: currentMember?.preferences?.smsNotifications ?? false,
    newsletterSubscribed: currentMember?.preferences?.newsletterSubscribed ?? true,
    eventReminders: currentMember?.preferences?.eventReminders ?? true,
    marketingEmails: currentMember?.preferences?.marketingEmails ?? true
  })

  const handleSaveProfile = () => {
    if (currentMember) {
      setCurrentMember({
        ...currentMember,
        ...formData
      })
      toast.success('Profile updated successfully')
      setIsEditing(false)
    }
  }

  const handleSavePreferences = () => {
    if (currentMember) {
      setCurrentMember({
        ...currentMember,
        preferences
      })
      toast.success('Preferences updated successfully')
    }
  }

  const handleRenewMembership = () => {
    toast.success('Redirecting to renewal payment...', {
      description: 'You will be redirected to the payment portal.'
    })
  }

  if (!currentMember) {
    return (
      <MemberPortalLogin
        onLoginSuccess={(member) => {
          setCurrentMember(member)
          toast.success('Welcome back!', {
            description: `Successfully logged in as ${member.firstName} ${member.lastName}`
          })
        }}
        onForgotPassword={(email) => {
          toast.info('Password Reset Requested', {
            description: `Password reset instructions have been sent to ${email}`
          })
        }}
      />
    )
  }

  const daysUntilExpiry = Math.ceil(
    (new Date(currentMember.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Member Portal</h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile, preferences, and membership
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            currentMember.status === 'active'
              ? 'bg-teal/10 text-teal border-teal/20'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }
        >
          {currentMember.status}
        </Badge>
      </div>

      {daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
        <Card className="p-4 border-accent bg-accent/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Membership Renewal Reminder</h3>
              <p className="text-sm text-muted-foreground">
                Your membership expires in {daysUntilExpiry} days on{' '}
                {formatDate(currentMember.expiryDate)}. Renew now to avoid interruption of benefits.
              </p>
            </div>
            <Button onClick={handleRenewMembership}>Renew Now</Button>
          </div>
        </Card>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="membership">Membership</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Personal Information</h2>
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle size={48} weight="duotone" className="text-primary" />
                </div>
                {isEditing && (
                  <Button variant="outline" size="sm">
                    Change Photo
                  </Button>
                )}
              </div>

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
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <EnvelopeSimple
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
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
                    <Phone
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
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
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <div className="relative">
                    <Buildings
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={18}
                    />
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Professional Credentials</h2>
            {currentMember.credentials && currentMember.credentials.length > 0 ? (
              <div className="space-y-4">
                {currentMember.credentials.map((credential) => (
                  <div
                    key={credential.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
                        <Certificate size={20} weight="duotone" className="text-teal" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{credential.name}</h3>
                        <p className="text-sm text-muted-foreground">{credential.issuer}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm">
                          <span>Issued: {formatDate(credential.issuedDate)}</span>
                          {credential.expiryDate && (
                            <span>
                              Expires: {formatDate(credential.expiryDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
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
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Certificate size={48} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-4">No credentials on file</p>
                <Button variant="outline">Add Credential</Button>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Communication Preferences</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <EnvelopeSimple size={18} className="text-muted-foreground" />
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive important updates and notifications
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, emailNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Phone size={18} className="text-muted-foreground" />
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get text alerts for urgent matters
                  </p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={preferences.smsNotifications}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, smsNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell size={18} className="text-muted-foreground" />
                    <Label htmlFor="event-reminders">Event Reminders</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Reminders for upcoming events you've registered for
                  </p>
                </div>
                <Switch
                  id="event-reminders"
                  checked={preferences.eventReminders}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, eventReminders: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="newsletter">Newsletter Subscription</Label>
                  <p className="text-sm text-muted-foreground">
                    Monthly newsletter with industry insights
                  </p>
                </div>
                <Switch
                  id="newsletter"
                  checked={preferences.newsletterSubscribed}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, newsletterSubscribed: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Promotional offers and special announcements
                  </p>
                </div>
                <Switch
                  id="marketing"
                  checked={preferences.marketingEmails}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, marketingEmails: checked })
                  }
                />
              </div>

              <div className="pt-4 border-t">
                <Button onClick={handleSavePreferences}>Save Preferences</Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="membership" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Membership Details</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Member ID</p>
                  <p className="font-mono">{currentMember.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Membership Type
                  </p>
                  <Badge variant="outline" className="capitalize">
                    {currentMember.memberType}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Join Date</p>
                  <p>{formatDate(currentMember.joinedDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Expiry Date</p>
                  <p>{formatDate(currentMember.expiryDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Chapter</p>
                  <p>{currentMember.chapterId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Engagement Score
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[120px]">
                      <div
                        className="h-full bg-teal transition-all"
                        style={{ width: `${currentMember.engagementScore}%` }}
                      />
                    </div>
                    <span className="text-sm tabular-nums">
                      {currentMember.engagementScore}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t space-y-3">
                <Button className="w-full" onClick={handleRenewMembership}>
                  <CreditCard className="mr-2" size={18} />
                  Renew Membership
                </Button>
                <Button variant="outline" className="w-full">
                  <MapPin className="mr-2" size={18} />
                  Transfer Chapter
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MemberPortal
