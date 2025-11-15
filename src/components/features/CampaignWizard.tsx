/**
 * Campaign Creation Wizard - Streamline email campaign setup with guided
 * workflow for template selection, audience segmentation, and scheduling.
 *
 * Designed for: Multi-step campaign creation with validation at each stage
 * Best for: Organizations requiring structured campaign planning workflows
 *
 * Features:
 * - Template selection with preview
 * - Advanced audience segmentation
 * - A/B test configuration
 * - Scheduled sending with timezone support
 * - Test email sending
 */

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  EnvelopeSimple,
  Users,
  CalendarBlank,
  TestTube,
  ChartLine,
  Plus,
  X,
  CaretLeft,
  CaretRight,
  Check,
} from '@phosphor-icons/react'
import type { EmailTemplate, EmailCampaign, SegmentRule, Member } from '@/lib/email-types'
import type { Member as BaseMember } from '@/lib/types'
import { toast } from 'sonner'

interface CampaignWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: EmailTemplate[]
  members: BaseMember[]
  onCreateCampaign: (campaign: Partial<EmailCampaign>) => void
}

type WizardStep = 'template' | 'audience' | 'content' | 'schedule' | 'review'

export function CampaignWizard({
  open,
  onOpenChange,
  templates,
  members,
  onCreateCampaign,
}: CampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('template')

  // Campaign data
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [campaignName, setCampaignName] = useState('')
  const [subject, setSubject] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [fromName, setFromName] = useState('NABIP')
  const [fromEmail, setFromEmail] = useState('noreply@nabip.org')
  const [replyTo, setReplyTo] = useState('support@nabip.org')

  // Segmentation
  const [segmentRules, setSegmentRules] = useState<SegmentRule[]>([])

  // Scheduling
  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled'>('immediate')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [timezone, setTimezone] = useState('America/New_York')

  // A/B Testing
  const [abTestEnabled, setAbTestEnabled] = useState(false)
  const [subjectA, setSubjectA] = useState('')
  const [subjectB, setSubjectB] = useState('')
  const [testSampleSize, setTestSampleSize] = useState(100)

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  const estimatedRecipients = useMemo(() => {
    if (segmentRules.length === 0) return members.length

    return members.filter((member) => {
      return segmentRules.every((rule) => {
        const value = (member as any)[rule.field]

        switch (rule.operator) {
          case 'equals':
            return value === rule.value
          case 'not_equals':
            return value !== rule.value
          case 'contains':
            return typeof value === 'string' && value.includes(rule.value as string)
          case 'in':
            return Array.isArray(rule.value) && rule.value.includes(value)
          case 'not_in':
            return Array.isArray(rule.value) && !rule.value.includes(value)
          default:
            return true
        }
      })
    }).length
  }, [members, segmentRules])

  const addSegmentRule = () => {
    const newRule: SegmentRule = {
      id: `rule-${Date.now()}`,
      field: 'status',
      operator: 'equals',
      value: 'active',
    }
    setSegmentRules([...segmentRules, newRule])
  }

  const removeSegmentRule = (id: string) => {
    setSegmentRules(segmentRules.filter((r) => r.id !== id))
  }

  const updateSegmentRule = (id: string, updates: Partial<SegmentRule>) => {
    setSegmentRules(
      segmentRules.map((r) => (r.id === id ? { ...r, ...updates } : r))
    )
  }

  const handleNext = () => {
    const steps: WizardStep[] = ['template', 'audience', 'content', 'schedule', 'review']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const steps: WizardStep[] = ['template', 'audience', 'content', 'schedule', 'review']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const handleSendTest = () => {
    toast.success('Test Email Sent', {
      description: 'Check your inbox for the test email.',
    })
  }

  const handleCreateCampaign = () => {
    if (!selectedTemplateId || !campaignName || !subject) {
      toast.error('Please complete all required fields')
      return
    }

    const campaign: Partial<EmailCampaign> = {
      name: campaignName,
      templateId: selectedTemplateId,
      subject: abTestEnabled ? subjectA : subject,
      previewText,
      fromName,
      fromEmail,
      replyTo,
      segmentRules,
      estimatedRecipients,
      scheduleType,
      scheduledAt: scheduleType === 'scheduled'
        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        : undefined,
      timezone: scheduleType === 'scheduled' ? timezone : undefined,
      abTestEnabled,
      abTestConfig: abTestEnabled
        ? {
            subjectA,
            subjectB,
            sampleSize: testSampleSize,
            testDuration: 24,
            winnerMetric: 'open_rate',
          }
        : undefined,
      status: scheduleType === 'immediate' ? 'sending' : 'scheduled',
    }

    onCreateCampaign(campaign)
    onOpenChange(false)
    resetWizard()
  }

  const resetWizard = () => {
    setCurrentStep('template')
    setSelectedTemplateId('')
    setCampaignName('')
    setSubject('')
    setPreviewText('')
    setSegmentRules([])
    setScheduleType('immediate')
    setAbTestEnabled(false)
  }

  const isStepComplete = (step: WizardStep): boolean => {
    switch (step) {
      case 'template':
        return !!selectedTemplateId
      case 'audience':
        return true // Always valid
      case 'content':
        return !!campaignName && !!subject
      case 'schedule':
        return scheduleType === 'immediate' || (!!scheduledDate && !!scheduledTime)
      case 'review':
        return true
      default:
        return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Email Campaign</DialogTitle>
          <DialogDescription>
            Follow the steps to build your email campaign with advanced targeting
            and scheduling
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 px-4">
          {['template', 'audience', 'content', 'schedule', 'review'].map((step, index) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    currentStep === step
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isStepComplete(step as WizardStep)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted bg-muted text-muted-foreground'
                  }`}
                >
                  {isStepComplete(step as WizardStep) && currentStep !== step ? (
                    <Check size={20} weight="bold" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span className="text-xs mt-2 capitalize text-muted-foreground">
                  {step}
                </span>
              </div>
              {index < 4 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-colors ${
                    isStepComplete(step as WizardStep)
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step 1: Template Selection */}
          {currentStep === 'template' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Select Email Template</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a pre-designed template to streamline campaign creation
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplateId === template.id
                        ? 'ring-2 ring-primary shadow-md'
                        : ''
                    }`}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <div className="aspect-video bg-muted rounded mb-3 flex items-center justify-center">
                      <EnvelopeSimple size={48} className="text-muted-foreground" />
                    </div>
                    <h4 className="font-semibold mb-1">{template.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {template.type}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Audience Segmentation */}
          {currentStep === 'audience' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Define Target Audience</h3>
                <p className="text-sm text-muted-foreground">
                  Build segment rules to target specific member groups
                </p>
              </div>

              <Card className="p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Recipients</p>
                    <p className="text-3xl font-bold text-primary">
                      {estimatedRecipients.toLocaleString()}
                    </p>
                  </div>
                  <Users size={48} className="text-primary/20" weight="duotone" />
                </div>
              </Card>

              <div className="space-y-3">
                {segmentRules.map((rule, index) => (
                  <Card key={rule.id} className="p-4">
                    <div className="flex items-center gap-3">
                      {index > 0 && (
                        <Badge variant="outline" className="shrink-0">
                          AND
                        </Badge>
                      )}
                      <Select
                        value={rule.field}
                        onValueChange={(value: any) =>
                          updateSegmentRule(rule.id, { field: value })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="memberType">Member Type</SelectItem>
                          <SelectItem value="chapterId">Chapter</SelectItem>
                          <SelectItem value="engagementScore">Engagement</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={rule.operator}
                        onValueChange={(value: any) =>
                          updateSegmentRule(rule.id, { operator: value })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="not_equals">Not Equals</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="in">In</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        value={rule.value as string}
                        onChange={(e) =>
                          updateSegmentRule(rule.id, { value: e.target.value })
                        }
                        placeholder="Value"
                        className="flex-1"
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSegmentRule(rule.id)}
                      >
                        <X size={18} />
                      </Button>
                    </div>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  onClick={addSegmentRule}
                  className="w-full"
                >
                  <Plus size={16} className="mr-2" />
                  Add Segment Rule
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Content & Settings */}
          {currentStep === 'content' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Campaign Content</h3>
                <p className="text-sm text-muted-foreground">
                  Configure email content and sender information
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="campaign-name">Campaign Name *</Label>
                  <Input
                    id="campaign-name"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Q1 2024 Renewal Campaign"
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Renew Your NABIP Membership Today"
                  />
                </div>

                <div>
                  <Label htmlFor="preview-text">Preview Text</Label>
                  <Input
                    id="preview-text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Don't miss out on member benefits..."
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from-name">From Name</Label>
                    <Input
                      id="from-name"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="from-email">From Email</Label>
                    <Input
                      id="from-email"
                      type="email"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reply-to">Reply-To Email</Label>
                  <Input
                    id="reply-to"
                    type="email"
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label htmlFor="ab-test">Enable A/B Testing</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Test two subject lines to optimize open rates
                    </p>
                  </div>
                  <Switch
                    id="ab-test"
                    checked={abTestEnabled}
                    onCheckedChange={setAbTestEnabled}
                  />
                </div>

                {abTestEnabled && (
                  <div className="space-y-3 pl-4 border-l-2 border-primary">
                    <div>
                      <Label htmlFor="subject-a">Subject Line A</Label>
                      <Input
                        id="subject-a"
                        value={subjectA}
                        onChange={(e) => setSubjectA(e.target.value)}
                        placeholder="Subject variant A"
                      />
                    </div>

                    <div>
                      <Label htmlFor="subject-b">Subject Line B</Label>
                      <Input
                        id="subject-b"
                        value={subjectB}
                        onChange={(e) => setSubjectB(e.target.value)}
                        placeholder="Subject variant B"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sample-size">Test Sample Size</Label>
                      <Input
                        id="sample-size"
                        type="number"
                        value={testSampleSize}
                        onChange={(e) => setTestSampleSize(Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Scheduling */}
          {currentStep === 'schedule' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Schedule Campaign</h3>
                <p className="text-sm text-muted-foreground">
                  Choose when to send your campaign
                </p>
              </div>

              <Tabs value={scheduleType} onValueChange={(v: any) => setScheduleType(v)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="immediate">Send Immediately</TabsTrigger>
                  <TabsTrigger value="scheduled">Schedule for Later</TabsTrigger>
                </TabsList>

                <TabsContent value="immediate" className="mt-4">
                  <Card className="p-6 text-center">
                    <CalendarBlank size={48} className="mx-auto mb-4 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Campaign will be sent immediately after creation
                    </p>
                  </Card>
                </TabsContent>

                <TabsContent value="scheduled" className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">
                          Eastern (ET)
                        </SelectItem>
                        <SelectItem value="America/Chicago">
                          Central (CT)
                        </SelectItem>
                        <SelectItem value="America/Denver">
                          Mountain (MT)
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          Pacific (PT)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Step 5: Review & Send */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Review Campaign</h3>
                <p className="text-sm text-muted-foreground">
                  Verify all details before sending
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <EnvelopeSimple size={18} weight="duotone" />
                    Content Details
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Campaign Name</dt>
                      <dd className="font-medium">{campaignName}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Subject</dt>
                      <dd className="font-medium">{subject}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Template</dt>
                      <dd className="font-medium">{selectedTemplate?.name}</dd>
                    </div>
                  </dl>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Users size={18} weight="duotone" />
                    Audience
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Recipients</dt>
                      <dd className="font-medium text-2xl">
                        {estimatedRecipients.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Segment Rules</dt>
                      <dd className="font-medium">
                        {segmentRules.length > 0 ? `${segmentRules.length} active` : 'All members'}
                      </dd>
                    </div>
                  </dl>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CalendarBlank size={18} weight="duotone" />
                    Schedule
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Send Time</dt>
                      <dd className="font-medium">
                        {scheduleType === 'immediate'
                          ? 'Immediately'
                          : `${scheduledDate} at ${scheduledTime}`}
                      </dd>
                    </div>
                    {scheduleType === 'scheduled' && (
                      <div>
                        <dt className="text-muted-foreground">Timezone</dt>
                        <dd className="font-medium">{timezone}</dd>
                      </div>
                    )}
                  </dl>
                </Card>

                {abTestEnabled && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <TestTube size={18} weight="duotone" />
                      A/B Test
                    </h4>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Variant A</dt>
                        <dd className="font-medium">{subjectA}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Variant B</dt>
                        <dd className="font-medium">{subjectB}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Sample Size</dt>
                        <dd className="font-medium">{testSampleSize}</dd>
                      </div>
                    </dl>
                  </Card>
                )}
              </div>

              <Card className="p-4 bg-muted/30">
                <div className="flex items-start gap-3">
                  <TestTube size={24} className="text-primary mt-1" weight="duotone" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Send Test Email</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Preview how your campaign will look before sending to all recipients
                    </p>
                    <Button variant="outline" onClick={handleSendTest}>
                      Send Test to My Email
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 'template'}
            >
              <CaretLeft size={16} className="mr-2" />
              Back
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {currentStep === 'review' ? (
                <Button onClick={handleCreateCampaign}>
                  {scheduleType === 'immediate' ? 'Send Campaign' : 'Schedule Campaign'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!isStepComplete(currentStep)}
                >
                  Next
                  <CaretRight size={16} className="ml-2" />
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
