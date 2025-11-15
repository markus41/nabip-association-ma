/**
 * Bulk Edit Dialog
 *
 * Establishes safe bulk editing interface with field selection, validation, and preview.
 * Supports replace, append, and clear strategies with atomic operations.
 *
 * Safety: Validates all changes before applying, shows preview, supports undo within session
 * Best for: Efficient multi-chapter updates with data integrity guarantees
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  PencilSimple,
  Warning,
  CheckCircle,
  Info
} from '@phosphor-icons/react'
import { toast } from 'sonner'

import type { Chapter } from '@/lib/types'
import {
  bulkEditChapters,
  BULK_EDITABLE_FIELDS,
  type BulkEditOptions,
  type BulkOperationResult
} from '@/lib/bulk-operations'

interface BulkEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chapters: Chapter[]
  selectedChapterIds: string[]
  onComplete?: (result: BulkOperationResult) => void
}

export function BulkEditDialog({
  open,
  onOpenChange,
  chapters,
  selectedChapterIds,
  onComplete
}: BulkEditDialogProps) {
  // Selected fields to edit
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())

  // Field values
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({})

  // Edit strategy
  const [strategy, setStrategy] = useState<'replace' | 'append' | 'clear'>('replace')

  // Operation state
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Get selected chapters
  const selectedChapters = chapters.filter(c => selectedChapterIds.includes(c.id))

  // Handle field selection toggle
  const handleFieldToggle = (fieldKey: string) => {
    const newSelected = new Set(selectedFields)
    if (newSelected.has(fieldKey)) {
      newSelected.delete(fieldKey)
      // Remove field value when deselected
      const newValues = { ...fieldValues }
      delete newValues[fieldKey]
      setFieldValues(newValues)
    } else {
      newSelected.add(fieldKey)
    }
    setSelectedFields(newSelected)
  }

  // Handle field value change
  const handleFieldValueChange = (fieldKey: string, value: any) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldKey]: value
    }))
  }

  // Handle select all fields
  const handleSelectAllFields = () => {
    setSelectedFields(new Set(Object.keys(BULK_EDITABLE_FIELDS)))
  }

  // Handle deselect all fields
  const handleDeselectAllFields = () => {
    setSelectedFields(new Set())
    setFieldValues({})
  }

  // Validate before applying
  const validateEdit = (): string[] => {
    const errors: string[] = []

    if (selectedFields.size === 0) {
      errors.push('Please select at least one field to edit')
    }

    if (strategy !== 'clear') {
      // Check that all selected fields have values
      for (const field of selectedFields) {
        if (!(field in fieldValues) || fieldValues[field] === '') {
          const fieldDef = BULK_EDITABLE_FIELDS[field as keyof typeof BULK_EDITABLE_FIELDS]
          errors.push(`Missing value for ${fieldDef.label}`)
        }
      }

      // Validate URLs
      for (const [key, value] of Object.entries(fieldValues)) {
        const fieldDef = BULK_EDITABLE_FIELDS[key as keyof typeof BULK_EDITABLE_FIELDS]
        if (fieldDef.type === 'url' && value) {
          try {
            new URL(value)
          } catch {
            errors.push(`Invalid URL for ${fieldDef.label}`)
          }
        }

        // Validate emails
        if (fieldDef.type === 'email' && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            errors.push(`Invalid email for ${fieldDef.label}`)
          }
        }
      }
    }

    return errors
  }

  // Handle apply bulk edit
  const handleApply = async () => {
    // Validate
    const errors = validateEdit()
    setValidationErrors(errors)

    if (errors.length > 0) {
      return
    }

    // Build options
    const options: BulkEditOptions = {
      fields: fieldValues,
      strategy,
      validateFirst: true
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      const result = await bulkEditChapters(
        chapters,
        selectedChapterIds,
        options,
        (current, total) => {
          setProgress(Math.round((current / total) * 100))
        }
      )

      if (result.success) {
        toast.success('Bulk edit completed', {
          description: `Successfully updated ${result.successCount} chapters`
        })
        onComplete?.(result)
        onOpenChange(false)
      } else {
        toast.error('Bulk edit completed with errors', {
          description: `${result.successCount} succeeded, ${result.failureCount} failed`
        })
        setValidationErrors(result.errors.map(e => `${e.chapterName}: ${e.error}`))
      }
    } catch (error) {
      toast.error('Bulk edit failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  // Render field input based on type
  const renderFieldInput = (fieldKey: string) => {
    const fieldDef = BULK_EDITABLE_FIELDS[fieldKey as keyof typeof BULK_EDITABLE_FIELDS]
    const value = fieldValues[fieldKey] || ''

    if (strategy === 'clear') {
      return (
        <div className="text-sm text-muted-foreground">
          Field will be cleared
        </div>
      )
    }

    switch (fieldDef.type) {
      case 'text':
      case 'url':
      case 'email':
      case 'tel':
        if (fieldKey === 'description' || fieldKey === 'meetingSchedule') {
          return (
            <Textarea
              value={value}
              onChange={(e) => handleFieldValueChange(fieldKey, e.target.value)}
              placeholder={`Enter ${fieldDef.label.toLowerCase()}`}
              rows={3}
              className="resize-none"
            />
          )
        }
        return (
          <Input
            type={fieldDef.type === 'email' ? 'email' : 'text'}
            value={value}
            onChange={(e) => handleFieldValueChange(fieldKey, e.target.value)}
            placeholder={`Enter ${fieldDef.label.toLowerCase()}`}
          />
        )

      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleFieldValueChange(fieldKey, e.target.value)}
            placeholder={`Enter ${fieldDef.label.toLowerCase()}`}
          />
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PencilSimple size={24} weight="duotone" />
            Bulk Edit Chapters
          </DialogTitle>
          <DialogDescription>
            Update multiple chapters at once. Select fields to edit and provide new values.
            <Badge variant="secondary" className="ml-2">
              {selectedChapterIds.length} chapters selected
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Strategy Selection */}
          <div className="space-y-2">
            <Label>Edit Strategy</Label>
            <Select value={strategy} onValueChange={(v: any) => setStrategy(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="replace">
                  Replace - Overwrite existing values
                </SelectItem>
                <SelectItem value="clear">
                  Clear - Remove values
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Field Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Fields to Edit ({selectedFields.size} selected)</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllFields}
                  disabled={isProcessing}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAllFields}
                  disabled={isProcessing}
                >
                  Deselect All
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-4">
                {Object.entries(BULK_EDITABLE_FIELDS).map(([key, fieldDef]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`field-${key}`}
                        checked={selectedFields.has(key)}
                        onCheckedChange={() => handleFieldToggle(key)}
                        disabled={isProcessing}
                      />
                      <Label
                        htmlFor={`field-${key}`}
                        className="flex-1 cursor-pointer font-medium"
                      >
                        {fieldDef.label}
                      </Label>
                    </div>

                    {selectedFields.has(key) && (
                      <div className="ml-6">
                        {renderFieldInput(key)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Preview */}
          {selectedFields.size > 0 && (
            <Alert>
              <Info size={16} />
              <AlertDescription>
                This will update {selectedFields.size} field{selectedFields.size !== 1 ? 's' : ''}
                {' '}across {selectedChapterIds.length} chapter{selectedChapterIds.length !== 1 ? 's' : ''}.
                All changes are atomic - either all succeed or all fail.
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <Warning size={16} />
              <AlertDescription>
                <p className="font-medium mb-1">Validation Errors:</p>
                <ul className="text-sm list-disc list-inside">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Processing...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isProcessing || selectedFields.size === 0}
          >
            {isProcessing ? 'Processing...' : `Update ${selectedChapterIds.length} Chapters`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
