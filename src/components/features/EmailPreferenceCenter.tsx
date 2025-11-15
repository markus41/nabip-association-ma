/**
 * Email Preference Center - Establish granular email communication controls
 * that respect user preferences and support sustainable engagement practices.
 *
 * Designed for: User-controlled email preference management with legal compliance
 * Best for: Organizations requiring CAN-SPAM compliant unsubscribe management
 *
 * Features:
 * - Granular preference controls by communication type
 * - One-click unsubscribe from all emails
 * - Frequency management (digest options)
 * - Resubscribe capabilities
 * - Audit trail for preference changes
 */

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
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
  DialogFooter,
} from '@/components/ui/dialog'
import {
  EnvelopeSimple,
  EnvelopeOpen,
  CheckCircle,
  Warning,
  Bell,
  Calendar,
  GraduationCap,
  Megaphone,
} from '@phosphor-icons/react'
import type { UnsubscribePreferences, Unsubscribe } from '@/lib/email-types'
import { toast } from 'sonner'

interface EmailPreferenceCenterProps {
  memberId: string
  email: string
  currentPreferences: UnsubscribePreferences
  onUpdatePreferences: (preferences: UnsubscribePreferences) => void
  onUnsubscribeAll: (reason?: string, feedback?: string) => void
}

export function EmailPreferenceCenter({
  memberId,
  email,
  currentPreferences,
  onUpdatePreferences,
  onUnsubscribeAll,
}: EmailPreferenceCenterProps) {
  const [preferences, setPreferences] = useState<UnsubscribePreferences>(currentPreferences)
  const [hasChanges, setHasChanges] = useState(false)
  const [showUnsubscribeAll, setShowUnsubscribeAll] = useState(false)
  const [unsubscribeReason, setUnsubscribeReason] = useState('')
  const [unsubscribeFeedback, setUnsubscribeFeedback] = useState('')
  const [digestFrequency, setDigestFrequency] = useState<'daily' | 'weekly' | 'never'>('never')

  const updatePreference = (key: keyof UnsubscribePreferences, value: boolean) => {
    const updated = { ...preferences, [key]: value }
    setPreferences(updated)
    setHasChanges(true)
  }

  const handleSavePreferences = () => {
    onUpdatePreferences(preferences)
    setHasChanges(false)
    toast.success('Preferences Updated', {
      description: 'Your email preferences have been saved successfully.',
    })
  }

  const handleUnsubscribeAll = () => {
    onUnsubscribeAll(unsubscribeReason, unsubscribeFeedback)
    setShowUnsubscribeAll(false)
    toast.success('Unsubscribed Successfully', {
      description: 'You will no longer receive emails from NABIP.',
    })
  }

  const allDisabled = Object.values(preferences).every((v) => !v)

  const preferenceCategories = [
    {
      key: 'newsletters' as const,
      label: 'Newsletters & Updates',
      description: 'Monthly industry insights, association news, and member spotlights',
      icon: <EnvelopeOpen size={24} className="text-primary" weight="duotone" />,
    },
    {
      key: 'eventAnnouncements' as const,
      label: 'Event Announcements',
      description: 'Invitations to conferences, webinars, and networking events',
      icon: <Calendar size={24} className="text-teal" weight="duotone" />,
    },
    {
      key: 'renewalReminders' as const,
      label: 'Renewal Reminders',
      description: 'Notifications about membership renewal and payment due dates',
      icon: <Bell size={24} className="text-accent-foreground" weight="duotone" />,
    },
    {
      key: 'courseUpdates' as const,
      label: 'Course & Education Updates',
      description: 'New CE courses, learning opportunities, and certification programs',
      icon: <GraduationCap size={24} className="text-primary" weight="duotone" />,
    },
    {
      key: 'marketingEmails' as const,
      label: 'Marketing & Promotions',
      description: 'Special offers, partner benefits, and promotional campaigns',
      icon: <Megaphone size={24} className="text-orange-600" weight="duotone" />,
    },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <EnvelopeSimple size={32} className="text-primary" weight="duotone" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Email Preferences</h1>
        <p className="text-muted-foreground">
          Manage how you receive communications from NABIP
        </p>
        <p className="text-sm text-muted-foreground">
          Subscribed as: <strong>{email}</strong>
        </p>
      </div>

      {/* Warning if all disabled */}
      {allDisabled && (
        <Card className="p-4 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-start gap-3">
            <Warning size={24} className="text-orange-600 mt-0.5" weight="duotone" />
            <div>
              <p className="font-medium text-orange-900 dark:text-orange-100">
                All Communications Disabled
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                You won't receive any emails from NABIP. Important membership updates
                and transactional emails will still be sent.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Digest Frequency */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <Label className="text-base font-semibold">Email Frequency</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Choose how often you want to receive email updates
            </p>
          </div>
        </div>
        <Select value={digestFrequency} onValueChange={(v: any) => setDigestFrequency(v)}>
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="never">
              Send emails as they occur (default)
            </SelectItem>
            <SelectItem value="daily">
              Daily digest - Combine emails into daily summary
            </SelectItem>
            <SelectItem value="weekly">
              Weekly digest - Receive one email per week
            </SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Preference Categories */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Communication Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Select the types of emails you want to receive from NABIP
        </p>

        {preferenceCategories.map((category) => (
          <Card key={category.key} className="p-6">
            <div className="flex items-start gap-4">
              <div className="mt-1">{category.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <Label
                    htmlFor={category.key}
                    className="text-base font-semibold cursor-pointer"
                  >
                    {category.label}
                  </Label>
                  <Switch
                    id={category.key}
                    checked={preferences[category.key]}
                    onCheckedChange={(checked) =>
                      updatePreference(category.key, checked)
                    }
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Transactional Emails Notice */}
      <Card className="p-6 bg-muted/30">
        <div className="flex items-start gap-3">
          <CheckCircle size={24} className="text-primary mt-0.5" weight="duotone" />
          <div>
            <p className="font-medium">Transactional Emails</p>
            <p className="text-sm text-muted-foreground mt-1">
              You'll continue to receive important emails like payment receipts,
              password resets, and account security notifications regardless of
              these preferences.
            </p>
          </div>
        </div>
      </Card>

      <Separator />

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setShowUnsubscribeAll(true)}
        >
          Unsubscribe from All Emails
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            disabled={!hasChanges}
            onClick={() => {
              setPreferences(currentPreferences)
              setHasChanges(false)
            }}
          >
            Reset
          </Button>
          <Button disabled={!hasChanges} onClick={handleSavePreferences}>
            Save Preferences
          </Button>
        </div>
      </div>

      {/* Resubscribe Section */}
      {allDisabled && (
        <Card className="p-6 text-center border-2 border-dashed">
          <p className="text-sm text-muted-foreground mb-4">
            Changed your mind? You can resubscribe at any time.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              const allEnabled = {
                newsletters: true,
                eventAnnouncements: true,
                renewalReminders: true,
                courseUpdates: true,
                marketingEmails: true,
                transactionalEmails: true,
              }
              setPreferences(allEnabled)
              setHasChanges(true)
            }}
          >
            Resubscribe to All
          </Button>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground pt-6 border-t">
        <p>
          National Association of Benefits & Insurance Professionals
        </p>
        <p className="mt-1">
          Questions? Contact us at{' '}
          <a href="mailto:support@nabip.org" className="text-primary hover:underline">
            support@nabip.org
          </a>
        </p>
      </div>

      {/* Unsubscribe All Dialog */}
      <Dialog open={showUnsubscribeAll} onOpenChange={setShowUnsubscribeAll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsubscribe from All Emails?</DialogTitle>
            <DialogDescription>
              You'll stop receiving all email communications from NABIP, except for
              critical transactional emails (receipts, security alerts, etc.)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reason">
                Why are you unsubscribing? (Optional)
              </Label>
              <Select value={unsubscribeReason} onValueChange={setUnsubscribeReason}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="too_frequent">
                    Emails are too frequent
                  </SelectItem>
                  <SelectItem value="not_relevant">
                    Content is not relevant
                  </SelectItem>
                  <SelectItem value="no_longer_member">
                    No longer a member
                  </SelectItem>
                  <SelectItem value="privacy_concerns">
                    Privacy concerns
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="feedback">
                Additional feedback (Optional)
              </Label>
              <Textarea
                id="feedback"
                value={unsubscribeFeedback}
                onChange={(e) => setUnsubscribeFeedback(e.target.value)}
                placeholder="Help us improve our communications..."
                className="mt-2"
                rows={3}
              />
            </div>

            <Card className="p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> You can resubscribe at any time by visiting
                this preference center or contacting member support.
              </p>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnsubscribeAll(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUnsubscribeAll}>
              Unsubscribe from All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Public unsubscribe page component for email links
 */
interface PublicUnsubscribePageProps {
  token: string
  onUnsubscribe: (token: string, preferences: Partial<UnsubscribePreferences>) => void
}

export function PublicUnsubscribePage({
  token,
  onUnsubscribe,
}: PublicUnsubscribePageProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handleOneClickUnsubscribe = async () => {
    setIsProcessing(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    onUnsubscribe(token, {
      newsletters: false,
      eventAnnouncements: false,
      courseUpdates: false,
      marketingEmails: false,
    })

    setIsProcessing(false)
    setIsComplete(true)
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
            <CheckCircle size={32} className="text-green-600" weight="fill" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">
            You've Been Unsubscribed
          </h1>
          <p className="text-muted-foreground mb-6">
            You will no longer receive marketing emails from NABIP. Important
            account notifications will still be sent.
          </p>
          <div className="text-sm text-muted-foreground">
            <p>Changed your mind?</p>
            <Button variant="link" className="mt-2">
              Update Email Preferences
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <EnvelopeSimple size={32} className="text-primary" weight="duotone" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">Unsubscribe</h1>
        <p className="text-muted-foreground mb-6">
          Would you like to unsubscribe from NABIP marketing emails?
        </p>

        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={handleOneClickUnsubscribe}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Unsubscribe'}
          </Button>
          <Button variant="outline" className="w-full">
            Manage Email Preferences
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          You'll continue to receive important transactional emails like
          receipts and account notifications.
        </p>
      </Card>
    </div>
  )
}
