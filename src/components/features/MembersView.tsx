import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MagnifyingGlass, Plus, Funnel, Download, UserCircle } from '@phosphor-icons/react'
import type { Member } from '@/lib/types'
import { formatDate, getStatusColor } from '@/lib/data-utils'
import { toast } from 'sonner'

interface MembersViewProps {
  members: Member[]
  onAddMember: () => void
  loading?: boolean
}

export function MembersView({ members, onAddMember, loading }: MembersViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = 
        member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.company?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter
      const matchesType = typeFilter === 'all' || member.memberType === typeFilter
      
      return matchesSearch && matchesStatus && matchesType
    })
  }, [members, searchQuery, statusFilter, typeFilter])

  const stats = useMemo(() => {
    const active = members.filter(m => m.status === 'active').length
    const pending = members.filter(m => m.status === 'pending').length
    const expired = members.filter(m => m.status === 'expired').length
    const avgEngagement = members.reduce((sum, m) => sum + m.engagementScore, 0) / members.length
    
    const byType = members.reduce((acc, m) => {
      acc[m.memberType] = (acc[m.memberType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      active,
      pending,
      expired,
      avgEngagement: Math.round(avgEngagement),
      byType
    }
  }, [members])

  const handleExport = () => {
    toast.success('Exporting members data...', {
      description: 'Your CSV file will download shortly.'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage your {members.length.toLocaleString()} members
          </p>
        </div>
        <Button onClick={onAddMember} data-action="add-member">
          <Plus className="mr-2" size={18} weight="bold" />
          Add Member
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlass
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              placeholder="Search members by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Funnel className="mr-2" size={16} />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <Funnel className="mr-2" size={16} />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="organizational">Organizational</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="lifetime">Lifetime</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Download size={18} />
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
              <UserCircle size={20} weight="duotone" className="text-teal" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Active Members
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : stats.active.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <UserCircle size={20} weight="duotone" className="text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Pending Approval
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : stats.pending}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <UserCircle size={20} weight="duotone" className="text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Expired
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : stats.expired}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCircle size={20} weight="duotone" className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Avg Engagement
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : `${stats.avgEngagement}%`}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Engagement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-muted animate-shimmer rounded w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <UserCircle size={48} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No members found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.slice(0, 50).map((member) => (
                <TableRow
                  key={member.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedMember(member)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-sm">{member.memberType}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(member.status)}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{member.company || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatDate(member.joinedDate)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[60px]">
                        <div
                          className="h-full bg-teal transition-all"
                          style={{ width: `${member.engagementScore}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {member.engagementScore}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {filteredMembers.length > 50 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing 50 of {filteredMembers.length.toLocaleString()} members
        </div>
      )}

      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
            <DialogDescription>
              View and manage member information
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle size={32} weight="duotone" className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </h3>
                  <p className="text-muted-foreground">{selectedMember.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className={getStatusColor(selectedMember.status)}>
                      {selectedMember.status}
                    </Badge>
                    <Badge variant="outline">{selectedMember.memberType}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                  <p className="text-sm">{selectedMember.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Company</p>
                  <p className="text-sm">{selectedMember.company || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Joined Date</p>
                  <p className="text-sm">{formatDate(selectedMember.joinedDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Expiry Date</p>
                  <p className="text-sm">{formatDate(selectedMember.expiryDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Engagement Score</p>
                  <p className="text-sm">{selectedMember.engagementScore}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Designations</p>
                  <p className="text-sm">
                    {selectedMember.designations?.length ? selectedMember.designations.join(', ') : '—'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">Edit Member</Button>
                <Button variant="outline" className="flex-1">View Activity</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
