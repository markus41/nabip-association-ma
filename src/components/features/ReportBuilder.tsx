import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Plus, X, ChartBar, Table as TableIcon, FileText } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Report, ReportColumn } from '@/lib/types'

interface ReportBuilderProps {
  open: boolean
  onClose: () => void
  onSave: (report: Report) => void
}

interface AvailableField {
  field: string
  label: string
  type: 'string' | 'number' | 'date' | 'boolean'
  category: string
}

interface SelectedColumn extends ReportColumn {
  category: string
}

const availableFields = [
  { field: 'member.firstName', label: 'First Name', type: 'string' as const, category: 'Member' },
  { field: 'member.lastName', label: 'Last Name', type: 'string' as const, category: 'Member' },
  { field: 'member.email', label: 'Email', type: 'string' as const, category: 'Member' },
  { field: 'member.memberType', label: 'Member Type', type: 'string' as const, category: 'Member' },
  { field: 'member.status', label: 'Status', type: 'string' as const, category: 'Member' },
  { field: 'member.joinedDate', label: 'Joined Date', type: 'date' as const, category: 'Member' },
  { field: 'member.expiryDate', label: 'Expiry Date', type: 'date' as const, category: 'Member' },
  { field: 'member.engagementScore', label: 'Engagement Score', type: 'number' as const, category: 'Member' },
  { field: 'chapter.name', label: 'Chapter Name', type: 'string' as const, category: 'Chapter' },
  { field: 'chapter.type', label: 'Chapter Type', type: 'string' as const, category: 'Chapter' },
  { field: 'chapter.region', label: 'Region', type: 'string' as const, category: 'Chapter' },
  { field: 'event.name', label: 'Event Name', type: 'string' as const, category: 'Event' },
  { field: 'event.startDate', label: 'Event Date', type: 'date' as const, category: 'Event' },
  { field: 'event.registeredCount', label: 'Registrations', type: 'number' as const, category: 'Event' },
  { field: 'transaction.amount', label: 'Transaction Amount', type: 'number' as const, category: 'Financial' },
  { field: 'transaction.type', label: 'Transaction Type', type: 'string' as const, category: 'Financial' },
  { field: 'transaction.date', label: 'Transaction Date', type: 'date' as const, category: 'Financial' },
]

const aggregateFunctions = [
  { value: 'none', label: 'None' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'count', label: 'Count' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
]

export function ReportBuilder({ open, onClose, onSave }: ReportBuilderProps) {
  const [reportName, setReportName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Report['category']>('custom')
  const [selectedColumns, setSelectedColumns] = useState<SelectedColumn[]>([])
  const [isPublic, setIsPublic] = useState(false)
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [scheduleTime, setScheduleTime] = useState('09:00')

  const handleAddColumn = (field: AvailableField) => {
    if (selectedColumns.find(c => c.field === field.field)) {
      toast.error('Column already added')
      return
    }
    setSelectedColumns([...selectedColumns, { ...field, aggregate: undefined }])
  }

  const handleRemoveColumn = (field: string) => {
    setSelectedColumns(selectedColumns.filter(c => c.field !== field))
  }

  const handleUpdateAggregate = (field: string, aggregate: string) => {
    setSelectedColumns(
      selectedColumns.map(c =>
        c.field === field
          ? { ...c, aggregate: aggregate === 'none' ? undefined : (aggregate as ReportColumn['aggregate']) }
          : c
      )
    )
  }

  const handleSave = () => {
    if (!reportName) {
      toast.error('Please enter a report name')
      return
    }
    if (selectedColumns.length === 0) {
      toast.error('Please select at least one column')
      return
    }

    // Remove category from columns before saving (it's only for UI grouping)
    const columnsForReport: ReportColumn[] = selectedColumns.map(({ category: _, ...col }) => col)

    const report: Report = {
      id: `report-${Date.now()}`,
      name: reportName,
      description,
      category,
      createdBy: 'Current User',
      createdDate: new Date().toISOString(),
      columns: columnsForReport,
      isPublic,
      schedule: scheduleEnabled ? {
        frequency: scheduleFrequency,
        time: scheduleTime,
        recipients: []
      } : undefined
    }

    onSave(report)
    toast.success('Report created successfully')
    onClose()

    // Reset form
    setReportName('')
    setDescription('')
    setCategory('custom')
    setSelectedColumns([])
    setIsPublic(false)
    setScheduleEnabled(false)
  }

  const groupedFields = availableFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = []
    }
    acc[field.category].push(field)
    return acc
  }, {} as Record<string, typeof availableFields>)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ChartBar size={24} weight="duotone" />
            Create Custom Report
          </DialogTitle>
          <DialogDescription>
            Build a custom report by selecting fields and configuring options
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 overflow-y-auto pr-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-name">Report Name</Label>
              <Input
                id="report-name"
                placeholder="Q1 Member Growth Report"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this report shows..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as Report['category'])}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="membership">Membership</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="public"
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked as boolean)}
              />
              <Label htmlFor="public" className="text-sm font-normal cursor-pointer">
                Make this report publicly accessible
              </Label>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedule"
                  checked={scheduleEnabled}
                  onCheckedChange={(checked) => setScheduleEnabled(checked as boolean)}
                />
                <Label htmlFor="schedule" className="text-sm font-medium cursor-pointer">
                  Schedule automatic generation
                </Label>
              </div>

              {scheduleEnabled && (
                <div className="pl-6 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="frequency" className="text-sm">Frequency</Label>
                    <Select value={scheduleFrequency} onValueChange={(value) => setScheduleFrequency(value as 'daily' | 'weekly' | 'monthly')}>
                      <SelectTrigger id="frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-sm">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Selected Columns ({selectedColumns.length})</Label>
              <Card className="p-4 min-h-[200px] max-h-[240px] overflow-y-auto">
                {selectedColumns.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    <TableIcon size={32} className="mx-auto mb-2 opacity-50" />
                    No columns selected yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedColumns.map((col) => (
                      <div
                        key={col.field}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{col.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{col.category}</p>
                          {col.type === 'number' && (
                            <div className="mt-2">
                              <Label className="text-xs text-muted-foreground mb-1.5 block">
                                Aggregation
                              </Label>
                              <Select
                                value={col.aggregate || 'none'}
                                onValueChange={(value) => handleUpdateAggregate(col.field, value)}
                              >
                                <SelectTrigger className="w-full h-9 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {aggregateFunctions.map((fn) => (
                                    <SelectItem key={fn.value} value={fn.value} className="text-sm">
                                      {fn.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveColumn(col.field)}
                          className="shrink-0 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div>
              <Label className="mb-2 block">Available Fields</Label>
              <ScrollArea className="h-[280px] rounded-lg border">
                <div className="p-4 space-y-4">
                  {Object.entries(groupedFields).map(([categoryName, fields]) => (
                    <div key={categoryName}>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        {categoryName}
                      </h4>
                      <div className="space-y-1">
                        {fields.map((field) => (
                          <button
                            key={field.field}
                            onClick={() => handleAddColumn(field)}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-left group"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{field.label}</p>
                              <p className="text-xs text-muted-foreground">{field.type}</p>
                            </div>
                            <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <FileText className="mr-2" size={18} />
            Create Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
