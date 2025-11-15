import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  EnvelopeSimple, 
  Plus, 
  PaperPlaneRight,
  ChartLine,
  Users,
  CalendarBlank,
  Trash,
  Copy,
  Clock
} from '@phosphor-icons/react'
import type { Campaign } from '@/lib/types'
import { formatDate, getStatusColor } from '@/lib/data-utils'
import { toast } from 'sonner'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { BulkActionToolbar } from './BulkActionToolbar'

interface CommunicationsViewProps {
  campaigns: Campaign[]
  onNewCampaign: () => void
  loading?: boolean
}

export function CommunicationsView({ campaigns, onNewCampaign, loading }: CommunicationsViewProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  const stats = useMemo(() => {
    const sent = campaigns.filter(c => c.status === 'sent')
    const totalRecipients = sent.reduce((sum, c) => sum + c.recipientCount, 0)
    const avgOpenRate = sent.length > 0 
      ? sent.reduce((sum, c) => sum + c.openRate, 0) / sent.length 
      : 0
    const avgClickRate = sent.length > 0
      ? sent.reduce((sum, c) => sum + c.clickRate, 0) / sent.length
      : 0

    return {
      totalSent: sent.length,
      totalRecipients,
      avgOpenRate: Math.round(avgOpenRate * 100),
      avgClickRate: Math.round(avgClickRate * 100)
    }
  }, [campaigns])

  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      const dateA = a.sentDate || a.scheduledDate || a.name
      const dateB = b.sentDate || b.scheduledDate || b.name
      return dateB.localeCompare(dateA)
    })
  }, [campaigns])

  const {
    selectedCount,
    selectedItems,
    isSelected,
    toggleSelection,
    toggleAll,
    clearSelection,
    isAllSelected,
    isSomeSelected,
  } = useBulkSelection(sortedCampaigns)

  const handleSendTest = () => {
    toast.success('Test email sent', {
      description: 'Check your inbox for the test email.'
    })
  }

  const handleBulkSchedule = () => {
    toast.success(`Scheduling ${selectedCount} campaigns`, {
      description: 'Campaigns will be sent at their scheduled times.'
    })
    clearSelection()
  }

  const handleBulkDuplicate = () => {
    toast.success(`Duplicating ${selectedCount} campaigns`, {
      description: 'New draft campaigns created.'
    })
    clearSelection()
  }

  const handleBulkDelete = () => {
    toast.success(`Deleting ${selectedCount} campaigns`, {
      description: 'Selected campaigns will be removed.'
    })
    clearSelection()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Communications</h1>
          <p className="text-muted-foreground mt-1">
            Manage email campaigns and member communications
          </p>
        </div>
        <Button onClick={onNewCampaign} data-action="new-campaign">
          <Plus className="mr-2" size={18} weight="bold" />
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <PaperPlaneRight size={20} weight="duotone" className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Campaigns Sent
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : stats.totalSent}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
              <Users size={20} weight="duotone" className="text-teal" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Total Reach
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : stats.totalRecipients.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <EnvelopeSimple size={20} weight="duotone" className="text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Avg Open Rate
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : `${stats.avgOpenRate}%`}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <ChartLine size={20} weight="duotone" className="text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Avg Click Rate
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : `${stats.avgClickRate}%`}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ChartLine size={20} weight="duotone" className="text-primary" />
            <h3 className="font-semibold">Campaign Performance</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Open Rate</span>
                <span className="text-sm font-semibold">{stats.avgOpenRate}%</span>
              </div>
              <Progress value={stats.avgOpenRate} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Click Rate</span>
                <span className="text-sm font-semibold">{stats.avgClickRate}%</span>
              </div>
              <Progress value={stats.avgClickRate} />
            </div>
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Engagement Score</span>
                <span className="text-xl font-bold text-teal">A+</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarBlank size={20} weight="duotone" className="text-teal" />
            <h3 className="font-semibold">Scheduled Campaigns</h3>
          </div>
          <div className="space-y-3">
            {sortedCampaigns.filter(c => c.status === 'scheduled').slice(0, 3).map((campaign) => (
              <div
                key={campaign.id}
                className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setSelectedCampaign(campaign)}
              >
                <p className="font-medium text-sm truncate">{campaign.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {campaign.scheduledDate && formatDate(campaign.scheduledDate)}
                </p>
              </div>
            ))}
            {sortedCampaigns.filter(c => c.status === 'scheduled').length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No scheduled campaigns</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} weight="duotone" className="text-accent-foreground" />
            <h3 className="font-semibold">Audience Reach</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Recipients</p>
              <p className="text-3xl font-bold">{stats.totalRecipients.toLocaleString()}</p>
            </div>
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-1">Avg per Campaign</p>
              <p className="text-2xl font-bold">
                {stats.totalSent > 0 ? Math.round(stats.totalRecipients / stats.totalSent).toLocaleString() : 0}
              </p>
            </div>
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-1">Active Segments</p>
              <p className="text-2xl font-bold">8</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all campaigns"
                  className={isSomeSelected && !isAllSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                />
              </TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Open Rate</TableHead>
              <TableHead>Click Rate</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-muted animate-shimmer rounded w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : sortedCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <EnvelopeSimple size={48} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No campaigns yet</p>
                </TableCell>
              </TableRow>
            ) : (
              sortedCampaigns.map((campaign) => (
                <TableRow
                  key={campaign.id}
                  className={`cursor-pointer ${isSelected(campaign.id) ? 'bg-muted/50' : ''}`}
                  onClick={(e) => {
                    // Don't trigger row click when clicking checkbox
                    if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
                      return
                    }
                    setSelectedCampaign(campaign)
                  }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected(campaign.id)}
                      onCheckedChange={() => toggleSelection(campaign.id)}
                      aria-label={`Select ${campaign.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {campaign.subject}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="tabular-nums">
                      {campaign.recipientCount.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    {campaign.status === 'sent' ? (
                      <div className="flex items-center gap-2">
                        <Progress value={campaign.openRate * 100} className="w-16 h-2" />
                        <span className="text-sm tabular-nums">
                          {Math.round(campaign.openRate * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {campaign.status === 'sent' ? (
                      <div className="flex items-center gap-2">
                        <Progress value={campaign.clickRate * 100} className="w-16 h-2" />
                        <span className="text-sm tabular-nums">
                          {Math.round(campaign.clickRate * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {campaign.sentDate
                        ? formatDate(campaign.sentDate)
                        : campaign.scheduledDate
                        ? formatDate(campaign.scheduledDate)
                        : 'Draft'}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedCampaign?.name}</DialogTitle>
            <DialogDescription>Campaign details and performance</DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Subject Line</p>
                  <p className="font-medium">{selectedCampaign.subject}</p>
                </div>
                <Badge variant="outline" className={getStatusColor(selectedCampaign.status)}>
                  {selectedCampaign.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={16} className="text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Recipients
                    </p>
                  </div>
                  <p className="text-xl font-semibold tabular-nums">
                    {selectedCampaign.recipientCount.toLocaleString()}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <EnvelopeSimple size={16} className="text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Opens
                    </p>
                  </div>
                  <p className="text-xl font-semibold tabular-nums">
                    {selectedCampaign.status === 'sent' 
                      ? `${Math.round(selectedCampaign.openRate * 100)}%`
                      : '—'}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <ChartLine size={16} className="text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Clicks
                    </p>
                  </div>
                  <p className="text-xl font-semibold tabular-nums">
                    {selectedCampaign.status === 'sent'
                      ? `${Math.round(selectedCampaign.clickRate * 100)}%`
                      : '—'}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarBlank size={16} className="text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Date
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {selectedCampaign.sentDate
                      ? formatDate(selectedCampaign.sentDate)
                      : selectedCampaign.scheduledDate
                      ? formatDate(selectedCampaign.scheduledDate)
                      : 'Not scheduled'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Segment Query</p>
                <code className="text-sm bg-muted px-3 py-2 rounded block">
                  {selectedCampaign.segmentQuery}
                </code>
              </div>

              <div className="flex gap-2">
                {selectedCampaign.status === 'draft' && (
                  <>
                    <Button className="flex-1">Edit Campaign</Button>
                    <Button variant="outline" onClick={handleSendTest}>Send Test</Button>
                  </>
                )}
                {selectedCampaign.status === 'sent' && (
                  <>
                    <Button className="flex-1">Duplicate Campaign</Button>
                    <Button variant="outline" className="flex-1">Export Report</Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BulkActionToolbar selectedCount={selectedCount} onClear={clearSelection}>
        <Button variant="outline" size="sm" onClick={handleBulkSchedule}>
          <Clock size={16} className="mr-2" />
          Schedule
        </Button>
        <Button variant="outline" size="sm" onClick={handleBulkDuplicate}>
          <Copy size={16} className="mr-2" />
          Duplicate
        </Button>
        <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
          <Trash size={16} className="mr-2" />
          Delete
        </Button>
      </BulkActionToolbar>
    </div>
  )
}
