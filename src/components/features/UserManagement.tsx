/**
 * User Management View
 * Interface for managing users and assigning roles
 */

import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { useAuth } from '@/lib/auth/context'
import { Permission } from '@/lib/rbac/permissions'
import type { User, RoleAssignmentRequest } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UserPlus, ShieldCheck, MagnifyingGlass } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Role,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  canManageRole,
} from '@/lib/rbac/permissions'
import { auditLogger, AuditAction } from '@/lib/audit/audit-logger'

interface UserManagementViewProps {
  users: User[]
  onUpdateUser: (userId: string, updates: Partial<User>) => void
  onCreateUser: (user: Omit<User, 'id'>) => void
}

export function UserManagementView({
  users,
  onUpdateUser,
  onCreateUser,
}: UserManagementViewProps) {
  const { user: currentUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showRoleEditor, setShowRoleEditor] = useState(false)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newRole, setNewRole] = useState<Role | ''>('')
  const [reason, setReason] = useState('')
  const [requests, setRequests] = useKV<RoleAssignmentRequest[]>(
    'ams-role-requests',
    []
  )

  // Filter users based on search
  const filteredUsers = users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case Role.ADMIN:
        return 'destructive'
      case Role.MANAGER:
        return 'default'
      case Role.MEMBER:
        return 'secondary'
      case Role.GUEST:
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'pending':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const handleRoleChange = () => {
    if (!selectedUser || !newRole || !currentUser) return

    // Check if current user can manage this role
    if (!canManageRole(currentUser.role as Role, selectedUser.role as Role)) {
      toast.error('You do not have permission to manage this user\'s role')
      return
    }

    // Update the user's role
    onUpdateUser(selectedUser.id, { role: newRole })

    // Log the role assignment
    auditLogger.logRoleAssignment(
      currentUser.id,
      `${currentUser.firstName} ${currentUser.lastName}`,
      selectedUser.id,
      `${selectedUser.firstName} ${selectedUser.lastName}`,
      selectedUser.role,
      newRole,
      reason
    )

    toast.success(`Role updated to ${ROLE_LABELS[newRole]}`)
    setShowRoleEditor(false)
    setSelectedUser(null)
    setNewRole('')
    setReason('')
  }

  const openRoleEditor = (user: User) => {
    setSelectedUser(user)
    setNewRole(user.role as Role)
    setShowRoleEditor(true)
  }

  if (!currentUser) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Please log in to access this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage users and assign roles
          </p>
        </div>
        <Button onClick={() => setShowCreateUser(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {ROLE_LABELS[user.role as Role] || user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(user.status)}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.lastLoginAt
                    ? format(new Date(user.lastLoginAt), 'MMM d, yyyy')
                    : 'Never'}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openRoleEditor(user)}
                    disabled={
                      !canManageRole(
                        currentUser.role as Role,
                        user.role as Role
                      )
                    }
                  >
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Edit Role
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Role Editor Dialog */}
      <Dialog open={showRoleEditor} onOpenChange={setShowRoleEditor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              {selectedUser &&
                `Change role for ${selectedUser.firstName} ${selectedUser.lastName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">New Role</Label>
              <Select
                value={newRole}
                onValueChange={(value) => setNewRole(value as Role)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Role).map((role) => (
                    <SelectItem
                      key={role}
                      value={role}
                      disabled={
                        !canManageRole(currentUser.role as Role, role)
                      }
                    >
                      <div>
                        <div className="font-medium">{ROLE_LABELS[role]}</div>
                        <div className="text-xs text-muted-foreground">
                          {ROLE_DESCRIPTIONS[role]}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Why are you changing this user's role?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleEditor(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={!newRole}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
