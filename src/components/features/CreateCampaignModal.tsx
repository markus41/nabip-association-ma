import { useState } from 'react'
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Campaign, CampaignStatus } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(100, 'Name is too long'),
  subject: z.string().min(1, 'Subject line is required').max(200, 'Subject is too long'),
  content: z.string().min(10, 'Content must be at least 10 characters').max(10000, 'Content is too long'),
  segmentQuery: z.string().min(1, 'Segment query is required'),
  status: z.enum(['draft', 'scheduled', 'sending', 'sent'] as const).default('draft'),
  scheduledDate: z.string().optional(),
})

type CampaignFormData = z.infer<typeof campaignSchema>

interface CreateCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateCampaign: (campaign: Campaign) => void
}

export function CreateCampaignModal({
  open,
  onOpenChange,
  onCreateCampaign,
}: CreateCampaignModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      subject: '',
      content: '',
      segmentQuery: 'status:active',
      status: 'draft',
      scheduledDate: '',
    },
  })

  const handleSubmit = async (data: CampaignFormData) => {
    setIsSubmitting(true)

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      const newCampaign: Campaign = {
        id: uuidv4(),
        name: data.name,
        subject: data.subject,
        content: data.content,
        segmentQuery: data.segmentQuery,
        recipientCount: 0,
        status: data.status as CampaignStatus,
        scheduledDate: data.scheduledDate || undefined,
        sentDate: undefined,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        unsubscribeRate: 0,
        createdBy: 'current-user',
        templateId: undefined,
        abTestVariant: undefined,
      }

      onCreateCampaign(newCampaign)

      toast.success('Campaign created successfully', {
        description: `${data.name} has been created as a ${data.status}.`,
      })

      form.reset()
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to create campaign', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Set up a new email campaign to communicate with your members
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Monthly Newsletter - December 2024"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Internal name for this campaign
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Line</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Important Updates for December"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The subject line recipients will see
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your email content here..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The body of your email campaign
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="segmentQuery"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Segment Query</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., status:active AND memberType:individual"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Define which members will receive this campaign
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Campaign status
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Date</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        disabled={form.watch('status') !== 'scheduled'}
                      />
                    </FormControl>
                    <FormDescription>
                      When to send (if scheduled)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                {isSubmitting ? 'Creating...' : 'Create Campaign'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
