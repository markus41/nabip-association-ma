import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PaperPlaneRight, X } from '@phosphor-icons/react'
import type { ChapterLeader } from '@/lib/types'

interface DirectMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipient: ChapterLeader
  chapterName: string
  onSend: (subject: string, content: string, recipientId: string, recipientName: string) => void
}

/**
 * Direct messaging dialog for contacting chapter leaders
 * Implements WCAG 2.1 AA accessibility standards
 */
export function DirectMessageDialog({
  open,
  onOpenChange,
  recipient,
  chapterName,
  onSend,
}: DirectMessageDialogProps) {
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subject.trim() || !content.trim()) {
      return
    }

    setIsSending(true)
    
    try {
      await onSend(subject, content, recipient.id, recipient.name)
      
      // Reset form
      setSubject('')
      setContent('')
      onOpenChange(false)
    } finally {
      setIsSending(false)
    }
  }

  const handleCancel = () => {
    setSubject('')
    setContent('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" aria-describedby="message-dialog-description">
        <DialogHeader>
          <DialogTitle>Message Chapter Leader</DialogTitle>
          <DialogDescription id="message-dialog-description">
            Send a direct message to {recipient.name} ({recipient.role}) from {chapterName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient Info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-muted-foreground">To:</Label>
              <span className="text-sm font-semibold">{recipient.name}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {recipient.role} • {chapterName}
            </div>
            {recipient.email && (
              <div className="text-xs text-muted-foreground">
                {recipient.email}
              </div>
            )}
          </div>

          {/* Subject Field */}
          <div className="space-y-2">
            <Label htmlFor="message-subject" className="text-sm font-medium">
              Subject <span className="text-red-500" aria-label="required">*</span>
            </Label>
            <Input
              id="message-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter message subject"
              required
              aria-required="true"
              disabled={isSending}
              className="w-full"
            />
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="message-content" className="text-sm font-medium">
              Message <span className="text-red-500" aria-label="required">*</span>
            </Label>
            <Textarea
              id="message-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message here..."
              required
              aria-required="true"
              disabled={isSending}
              className="min-h-[200px] resize-y"
            />
            <p className="text-xs text-muted-foreground">
              {content.length} characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSending}
            >
              <X size={16} className="mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSending || !subject.trim() || !content.trim()}
            >
              <PaperPlaneRight size={16} className="mr-2" weight="bold" />
              {isSending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
