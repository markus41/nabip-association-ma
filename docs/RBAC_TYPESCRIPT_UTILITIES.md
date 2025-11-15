# RBAC TypeScript Utilities
## NABIP Association Management System

**Version:** 1.0
**Last Updated:** 2025-11-15
**Location:** `src/lib/rbac/`

---

## Overview

This document provides comprehensive documentation for the TypeScript RBAC utilities used in the NABIP AMS client application. These utilities enable permission checks, role validation, and scope management in React components.

### File Structure

```
src/lib/rbac/
├── types.ts              # TypeScript type definitions
├── permissions.ts        # Permission validation logic
├── hooks.ts             # React hooks for permission checks
├── cache.ts             # Permission caching layer
└── utils.ts             # Helper utilities
```

---

## Type Definitions

**File:** `src/lib/rbac/types.ts`

```typescript
// ============================================================================
// RBAC TYPE DEFINITIONS
// ============================================================================

export type RoleLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export type RoleName =
  | 'member'
  | 'chapter_admin'
  | 'state_admin'
  | 'national_admin'
  | string // Allow custom roles

export type PermissionScope = 'own' | 'chapter' | 'state' | 'national' | 'all' | 'public'

export type ResourceType =
  | 'member'
  | 'chapter'
  | 'event'
  | 'campaign'
  | 'course'
  | 'report'
  | 'transaction'
  | 'role'
  | 'permission'
  | 'audit'
  | 'system'

export type ActionType =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'export'
  | 'manage'
  | 'assign'

export type ScopeType = 'global' | 'chapter' | 'state'

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface Permission {
  id: string
  name: string // e.g., 'member.view.chapter'
  resource: ResourceType
  action: ActionType
  scope: PermissionScope
  description: string
  createdAt: string
}

export interface Role {
  id: string
  name: RoleName
  level: RoleLevel
  description: string
  isSystemRole: boolean
  permissions: Permission[]
  createdAt: string
  updatedAt: string
}

export interface MemberRole {
  id: string
  memberId: string
  roleId: string
  role: Role
  scopeType: ScopeType
  scopeChapterId?: string
  scopeState?: string
  assignedAt: string
  assignedBy?: string
  expiresAt?: string
  isActive: boolean
}

export interface RBACContext {
  member: Member
  roles: MemberRole[]
  permissions: Permission[]
  highestRole: Role | null
  hasPermission: (
    resource: ResourceType,
    action: ActionType,
    targetScope?: TargetScope
  ) => boolean
  hasRole: (roleName: RoleName) => boolean
  getRoleLevel: () => RoleLevel
  canAccess: (entity: AccessibleEntity) => boolean
  isLoading: boolean
  error: Error | null
}

export interface TargetScope {
  chapterId?: string
  state?: string
}

export interface AccessibleEntity {
  type: ResourceType
  id: string
  chapterId?: string
  state?: string
  ownerId?: string
}

// ============================================================================
// PERMISSION CHECK TYPES
// ============================================================================

export interface PermissionCheckOptions {
  targetScope?: TargetScope
  throwOnDeny?: boolean
  logDenial?: boolean
}

export interface PermissionResult {
  granted: boolean
  reason?: string
  matchedRole?: MemberRole
  matchedPermission?: Permission
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export interface PermissionAuditEntry {
  timestamp: string
  memberId: string
  action: string
  resource: ResourceType
  resourceId?: string
  granted: boolean
  denialReason?: string
  ipAddress?: string
  userAgent?: string
}
```

---

## Permission Validation

**File:** `src/lib/rbac/permissions.ts`

```typescript
import type {
  Member,
  Chapter,
  MemberRole,
  Permission,
  ResourceType,
  ActionType,
  PermissionScope,
  TargetScope,
  PermissionResult,
  AccessibleEntity,
} from './types'

// ============================================================================
// CORE PERMISSION CHECKS
// ============================================================================

/**
 * Check if member has specific permission based on their active roles
 *
 * @param member - Current member
 * @param memberRoles - Member's active role assignments
 * @param resource - Resource type to check (e.g., 'member', 'event')
 * @param action - Action to perform (e.g., 'view', 'edit')
 * @param targetScope - Optional target scope (chapterId, state)
 * @returns true if permission granted, false otherwise
 *
 * @example
 * hasPermission(currentMember, roles, 'member', 'edit', { chapterId: 'chapter-123' })
 */
export function hasPermission(
  member: Member,
  memberRoles: MemberRole[],
  resource: ResourceType,
  action: ActionType,
  targetScope?: TargetScope
): boolean {
  const result = checkPermission(member, memberRoles, resource, action, targetScope)
  return result.granted
}

/**
 * Detailed permission check with reason and matched role
 *
 * @param member - Current member
 * @param memberRoles - Member's active role assignments
 * @param resource - Resource type
 * @param action - Action type
 * @param targetScope - Target scope
 * @returns PermissionResult with granted status and metadata
 */
export function checkPermission(
  member: Member,
  memberRoles: MemberRole[],
  resource: ResourceType,
  action: ActionType,
  targetScope?: TargetScope
): PermissionResult {
  // Filter active, non-expired roles
  const activeRoles = memberRoles.filter(
    (mr) =>
      mr.isActive &&
      (!mr.expiresAt || new Date(mr.expiresAt) > new Date())
  )

  if (activeRoles.length === 0) {
    return {
      granted: false,
      reason: 'No active roles found',
    }
  }

  // Check each role for matching permission
  for (const memberRole of activeRoles) {
    const { role, scopeType, scopeChapterId, scopeState } = memberRole

    // Find matching permission in role
    const permission = role.permissions.find(
      (p) => p.resource === resource && p.action === action
    )

    if (!permission) continue

    // Validate scope
    const scopeMatch = validateScope(
      permission.scope,
      scopeType,
      scopeChapterId,
      scopeState,
      targetScope
    )

    if (scopeMatch) {
      return {
        granted: true,
        matchedRole: memberRole,
        matchedPermission: permission,
      }
    }
  }

  return {
    granted: false,
    reason: `No matching permission: ${resource}.${action}`,
  }
}

/**
 * Validate permission scope against target scope
 *
 * @param permissionScope - Scope from permission (own, chapter, state, national, etc.)
 * @param roleScopeType - Member role scope type (global, chapter, state)
 * @param roleScopeChapterId - Chapter ID if chapter scope
 * @param roleScopeState - State code if state scope
 * @param targetScope - Target resource scope
 * @returns true if scope matches, false otherwise
 */
function validateScope(
  permissionScope: PermissionScope,
  roleScopeType: 'global' | 'chapter' | 'state',
  roleScopeChapterId?: string,
  roleScopeState?: string,
  targetScope?: TargetScope
): boolean {
  // Public scope is accessible to all
  if (permissionScope === 'public') return true

  // Global role scope grants access to all scopes
  if (roleScopeType === 'global') return true

  // Own scope (handled at application level, not DB level)
  if (permissionScope === 'own') return true

  // National scope requires global role scope
  if (permissionScope === 'national' || permissionScope === 'all') {
    return roleScopeType === 'global'
  }

  // Chapter scope
  if (permissionScope === 'chapter') {
    if (roleScopeType === 'chapter') {
      // Check if target chapter matches role scope chapter
      if (targetScope?.chapterId) {
        return roleScopeChapterId === targetScope.chapterId
      }
      return true // Chapter admin can access chapter-scoped resources
    }

    if (roleScopeType === 'state') {
      // State admin can access all chapters in their state
      // Requires chapter lookup to verify state match
      // This would be handled by passing targetScope.state
      if (targetScope?.state) {
        return roleScopeState === targetScope.state
      }
      return true // State admin has chapter-level access
    }
  }

  // State scope
  if (permissionScope === 'state') {
    if (roleScopeType === 'state') {
      if (targetScope?.state) {
        return roleScopeState === targetScope.state
      }
      return true
    }
  }

  return false
}

// ============================================================================
// SPECIFIC PERMISSION CHECKS
// ============================================================================

/**
 * Check if member can view another member's profile
 */
export function canViewMember(
  currentMember: Member,
  targetMember: Member,
  memberRoles: MemberRole[]
): boolean {
  // Can always view own profile
  if (currentMember.id === targetMember.id) {
    return true
  }

  // Check permission based on target member's chapter/state
  return hasPermission(
    currentMember,
    memberRoles,
    'member',
    'view',
    { chapterId: targetMember.chapterId }
  )
}

/**
 * Check if member can edit another member's profile
 */
export function canEditMember(
  currentMember: Member,
  targetMember: Member,
  memberRoles: MemberRole[]
): boolean {
  // Can edit own profile
  if (currentMember.id === targetMember.id) {
    return hasPermission(currentMember, memberRoles, 'member', 'edit', undefined)
  }

  // Require chapter/state/national scope
  return hasPermission(
    currentMember,
    memberRoles,
    'member',
    'edit',
    { chapterId: targetMember.chapterId }
  )
}

/**
 * Check if member can edit chapter details
 */
export function canEditChapter(
  currentMember: Member,
  targetChapter: Chapter,
  memberRoles: MemberRole[]
): boolean {
  return hasPermission(
    currentMember,
    memberRoles,
    'chapter',
    'edit',
    { chapterId: targetChapter.id, state: targetChapter.state }
  )
}

/**
 * Check if member can create events for a chapter
 */
export function canCreateEvent(
  currentMember: Member,
  targetChapter: Chapter,
  memberRoles: MemberRole[]
): boolean {
  return hasPermission(
    currentMember,
    memberRoles,
    'event',
    'create',
    { chapterId: targetChapter.id, state: targetChapter.state }
  )
}

/**
 * Check if member can send email campaign for a scope
 */
export function canCreateCampaign(
  currentMember: Member,
  memberRoles: MemberRole[],
  campaignScope: 'chapter' | 'state' | 'national',
  targetScope?: TargetScope
): boolean {
  return hasPermission(
    currentMember,
    memberRoles,
    'campaign',
    'create',
    targetScope
  )
}

// ============================================================================
// ROLE CHECKS
// ============================================================================

/**
 * Get member's highest role level
 */
export function getHighestRole(memberRoles: MemberRole[]): Role | null {
  const activeRoles = memberRoles.filter(
    (mr) =>
      mr.isActive &&
      (!mr.expiresAt || new Date(mr.expiresAt) > new Date())
  )

  if (activeRoles.length === 0) return null

  return activeRoles.reduce((highest, current) =>
    current.role.level > (highest?.level || 0) ? current.role : highest
  , activeRoles[0].role)
}

/**
 * Check if member has specific role
 */
export function hasRole(
  memberRoles: MemberRole[],
  roleName: string
): boolean {
  return memberRoles.some(
    (mr) =>
      mr.role.name === roleName &&
      mr.isActive &&
      (!mr.expiresAt || new Date(mr.expiresAt) > new Date())
  )
}

/**
 * Check if member is admin (any level >= 2)
 */
export function isAdmin(memberRoles: MemberRole[]): boolean {
  const highestRole = getHighestRole(memberRoles)
  return (highestRole?.level || 0) >= 2
}

/**
 * Check if member is national admin
 */
export function isNationalAdmin(memberRoles: MemberRole[]): boolean {
  return hasRole(memberRoles, 'national_admin')
}

// ============================================================================
// BULK FILTERING
// ============================================================================

/**
 * Filter list of entities based on view permission
 *
 * @example
 * const visibleMembers = filterByPermissions(
 *   allMembers,
 *   currentMember,
 *   memberRoles,
 *   'member'
 * )
 */
export function filterByPermissions<T extends AccessibleEntity>(
  items: T[],
  currentMember: Member,
  memberRoles: MemberRole[],
  resource: ResourceType
): T[] {
  return items.filter((item) => {
    // Check own items
    if (item.ownerId === currentMember.id) return true

    // Check permission
    return hasPermission(
      currentMember,
      memberRoles,
      resource,
      'view',
      {
        chapterId: item.chapterId,
        state: item.state,
      }
    )
  })
}

/**
 * Get accessible chapter IDs for current member
 */
export function getAccessibleChapterIds(
  memberRoles: MemberRole[]
): string[] {
  const chapterIds = new Set<string>()

  for (const memberRole of memberRoles) {
    if (!memberRole.isActive) continue
    if (memberRole.expiresAt && new Date(memberRole.expiresAt) <= new Date()) continue

    // Global scope = all chapters
    if (memberRole.scopeType === 'global') {
      return ['*'] // Special marker for "all chapters"
    }

    // Chapter scope
    if (memberRole.scopeType === 'chapter' && memberRole.scopeChapterId) {
      chapterIds.add(memberRole.scopeChapterId)
    }

    // State scope = all chapters in state (requires chapter lookup)
    // This would be handled by querying chapters where state = scopeState
  }

  return Array.from(chapterIds)
}

/**
 * Get accessible states for current member
 */
export function getAccessibleStates(
  memberRoles: MemberRole[]
): string[] {
  const states = new Set<string>()

  for (const memberRole of memberRoles) {
    if (!memberRole.isActive) continue
    if (memberRole.expiresAt && new Date(memberRole.expiresAt) <= new Date()) continue

    if (memberRole.scopeType === 'global') {
      return ['*'] // All states
    }

    if (memberRole.scopeType === 'state' && memberRole.scopeState) {
      states.add(memberRole.scopeState)
    }
  }

  return Array.from(states)
}
```

---

## React Hooks

**File:** `src/lib/rbac/hooks.ts`

```typescript
import { useEffect, useState } from 'react'
import { useKV } from '@github-spark/sdk'
import type {
  Member,
  MemberRole,
  Permission,
  RBACContext,
  ResourceType,
  ActionType,
  TargetScope,
} from './types'
import {
  hasPermission,
  hasRole,
  getHighestRole,
  canViewMember,
  canEditMember,
  canEditChapter,
} from './permissions'
import { getPermissionCache, setPermissionCache } from './cache'

// ============================================================================
// PRIMARY RBAC HOOK
// ============================================================================

/**
 * Primary hook for RBAC functionality
 * Provides member roles, permissions, and permission check functions
 *
 * @param memberId - Current member's ID
 * @returns RBACContext with roles, permissions, and helper functions
 *
 * @example
 * function MyComponent() {
 *   const rbac = useRBAC(currentMember.id)
 *
 *   if (!rbac.hasPermission('event', 'create', { chapterId: 'chapter-123' })) {
 *     return <AccessDenied />
 *   }
 *
 *   return <CreateEventForm />
 * }
 */
export function useRBAC(memberId: string): RBACContext {
  const [memberRoles] = useKV<MemberRole[]>(`member-roles:${memberId}`, [])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch member roles from Supabase (with caching)
  useEffect(() => {
    async function fetchRoles() {
      try {
        setIsLoading(true)

        // Check cache first
        const cached = getPermissionCache(memberId)
        if (cached) {
          setIsLoading(false)
          return
        }

        // Fetch from Supabase
        const { data, error } = await supabase
          .from('member_roles')
          .select(`
            *,
            role:roles (
              *,
              permissions:role_permissions (
                permission:permissions (*)
              )
            )
          `)
          .eq('member_id', memberId)
          .eq('is_active', true)
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)

        if (error) throw error

        // Transform and cache
        const transformedRoles = transformMemberRoles(data)
        setPermissionCache(memberId, transformedRoles)

        setIsLoading(false)
      } catch (err) {
        setError(err as Error)
        setIsLoading(false)
      }
    }

    fetchRoles()

    // Refresh every 5 minutes
    const interval = setInterval(fetchRoles, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [memberId])

  // Get member data
  const [members] = useKV<Member[]>('members', [])
  const member = members.find((m) => m.id === memberId)

  if (!member) {
    return {
      member: null as any,
      roles: [],
      permissions: [],
      highestRole: null,
      hasPermission: () => false,
      hasRole: () => false,
      getRoleLevel: () => 0,
      canAccess: () => false,
      isLoading: false,
      error: new Error('Member not found'),
    }
  }

  // Extract all permissions from roles
  const permissions: Permission[] = memberRoles.flatMap(
    (mr) => mr.role.permissions
  )

  const highestRole = getHighestRole(memberRoles)

  return {
    member,
    roles: memberRoles,
    permissions,
    highestRole,
    hasPermission: (resource, action, targetScope) =>
      hasPermission(member, memberRoles, resource, action, targetScope),
    hasRole: (roleName) => hasRole(memberRoles, roleName),
    getRoleLevel: () => highestRole?.level || 0,
    canAccess: (entity) => {
      return hasPermission(
        member,
        memberRoles,
        entity.type,
        'view',
        {
          chapterId: entity.chapterId,
          state: entity.state,
        }
      )
    },
    isLoading,
    error,
  }
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for checking specific permission
 * Returns boolean indicating if permission granted
 *
 * @example
 * function DeleteButton({ member }) {
 *   const canDelete = usePermission('member', 'delete', { chapterId: member.chapterId })
 *   return canDelete ? <button>Delete</button> : null
 * }
 */
export function usePermission(
  resource: ResourceType,
  action: ActionType,
  targetScope?: TargetScope
): boolean {
  const [currentMember] = useKV<Member>('currentMember', null)
  const rbac = useRBAC(currentMember?.id || '')

  if (!currentMember) return false

  return rbac.hasPermission(resource, action, targetScope)
}

/**
 * Hook for checking if user has specific role
 *
 * @example
 * function AdminPanel() {
 *   const isAdmin = useHasRole('chapter_admin')
 *   return isAdmin ? <AdminDashboard /> : <AccessDenied />
 * }
 */
export function useHasRole(roleName: string): boolean {
  const [currentMember] = useKV<Member>('currentMember', null)
  const rbac = useRBAC(currentMember?.id || '')

  return rbac.hasRole(roleName)
}

/**
 * Hook for member-specific permissions
 *
 * @example
 * function MemberProfile({ member }) {
 *   const { canView, canEdit } = useMemberPermissions(member)
 *
 *   return (
 *     <div>
 *       {canView && <MemberDetails member={member} />}
 *       {canEdit && <EditButton />}
 *     </div>
 *   )
 * }
 */
export function useMemberPermissions(targetMember: Member) {
  const [currentMember] = useKV<Member>('currentMember', null)
  const rbac = useRBAC(currentMember?.id || '')

  if (!currentMember) {
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
    }
  }

  return {
    canView: canViewMember(currentMember, targetMember, rbac.roles),
    canEdit: canEditMember(currentMember, targetMember, rbac.roles),
    canDelete: rbac.hasPermission('member', 'delete', {
      chapterId: targetMember.chapterId,
    }),
  }
}

/**
 * Hook for chapter-specific permissions
 */
export function useChapterPermissions(chapter: Chapter) {
  const [currentMember] = useKV<Member>('currentMember', null)
  const rbac = useRBAC(currentMember?.id || '')

  if (!currentMember) {
    return {
      canView: false,
      canEdit: false,
      canCreateEvent: false,
      canManageMembers: false,
    }
  }

  return {
    canView: rbac.hasPermission('chapter', 'view', undefined),
    canEdit: canEditChapter(currentMember, chapter, rbac.roles),
    canCreateEvent: rbac.hasPermission('event', 'create', {
      chapterId: chapter.id,
      state: chapter.state,
    }),
    canManageMembers: rbac.hasPermission('member', 'edit', {
      chapterId: chapter.id,
    }),
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function transformMemberRoles(data: any[]): MemberRole[] {
  return data.map((item) => ({
    id: item.id,
    memberId: item.member_id,
    roleId: item.role_id,
    role: {
      id: item.role.id,
      name: item.role.name,
      level: item.role.level,
      description: item.role.description,
      isSystemRole: item.role.is_system_role,
      permissions: item.role.permissions.map((rp: any) => rp.permission),
      createdAt: item.role.created_at,
      updatedAt: item.role.updated_at,
    },
    scopeType: item.scope_type,
    scopeChapterId: item.scope_chapter_id,
    scopeState: item.scope_state,
    assignedAt: item.assigned_at,
    assignedBy: item.assigned_by,
    expiresAt: item.expires_at,
    isActive: item.is_active,
  }))
}
```

---

## Permission Caching

**File:** `src/lib/rbac/cache.ts`

```typescript
import type { MemberRole } from './types'

// In-memory cache (5 minute TTL)
const permissionCache = new Map<string, { roles: MemberRole[]; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function getPermissionCache(memberId: string): MemberRole[] | null {
  const cached = permissionCache.get(memberId)
  if (!cached) return null

  const age = Date.now() - cached.timestamp
  if (age > CACHE_TTL) {
    permissionCache.delete(memberId)
    return null
  }

  return cached.roles
}

export function setPermissionCache(memberId: string, roles: MemberRole[]): void {
  permissionCache.set(memberId, {
    roles,
    timestamp: Date.now(),
  })
}

export function clearPermissionCache(memberId?: string): void {
  if (memberId) {
    permissionCache.delete(memberId)
  } else {
    permissionCache.clear()
  }
}
```

---

## Usage Examples

### Example 1: Conditional Rendering

```typescript
import { usePermission } from '@/lib/rbac/hooks'

function MemberManagementView() {
  const canCreateMember = usePermission('member', 'create', { chapterId: currentChapter.id })
  const canExportMembers = usePermission('member', 'export', { chapterId: currentChapter.id })

  return (
    <div>
      <h1>Member Management</h1>

      {canCreateMember && (
        <button onClick={handleCreateMember}>Add New Member</button>
      )}

      {canExportMembers && (
        <button onClick={handleExport}>Export to CSV</button>
      )}

      <MemberList />
    </div>
  )
}
```

### Example 2: Protected Route

```typescript
import { useHasRole } from '@/lib/rbac/hooks'
import { Navigate } from 'react-router-dom'

function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAdmin = useHasRole('chapter_admin')

  if (!isAdmin) {
    return <Navigate to="/unauthorized" />
  }

  return <>{children}</>
}

// Usage
<AdminRoute>
  <ChapterAdminDashboard />
</AdminRoute>
```

### Example 3: Permission-Based Filtering

```typescript
import { useRBAC } from '@/lib/rbac/hooks'
import { filterByPermissions } from '@/lib/rbac/permissions'

function MemberListView() {
  const [allMembers] = useKV<Member[]>('members', [])
  const [currentMember] = useKV<Member>('currentMember', null)
  const rbac = useRBAC(currentMember?.id || '')

  // Filter members based on view permission
  const visibleMembers = filterByPermissions(
    allMembers.map(m => ({
      ...m,
      type: 'member' as const,
      ownerId: m.id,
    })),
    currentMember!,
    rbac.roles,
    'member'
  )

  return (
    <div>
      <h1>Members ({visibleMembers.length})</h1>
      {visibleMembers.map(member => (
        <MemberCard key={member.id} member={member} />
      ))}
    </div>
  )
}
```

### Example 4: Complex Permission Logic

```typescript
import { useRBAC, useMemberPermissions } from '@/lib/rbac/hooks'

function MemberDetailView({ member }: { member: Member }) {
  const rbac = useRBAC(useCurrentMember().id)
  const memberPerms = useMemberPermissions(member)

  const canSendEmail = rbac.hasPermission('campaign', 'create', {
    chapterId: member.chapterId,
  })

  const canViewTransactions = rbac.hasPermission('transaction', 'view', {
    chapterId: member.chapterId,
  })

  return (
    <div>
      <MemberHeader member={member} />

      {memberPerms.canView && (
        <MemberProfile member={member} />
      )}

      {memberPerms.canEdit && (
        <EditMemberForm member={member} />
      )}

      {canSendEmail && (
        <SendEmailButton member={member} />
      )}

      {canViewTransactions && (
        <TransactionHistory memberId={member.id} />
      )}

      {memberPerms.canDelete && (
        <DeleteMemberButton member={member} />
      )}
    </div>
  )
}
```

---

## Best Practices

### 1. Use Specific Hooks

```typescript
// GOOD - Specific hook
const canEdit = usePermission('member', 'edit', { chapterId })

// AVOID - Generic hook for simple check
const rbac = useRBAC(memberId)
const canEdit = rbac.hasPermission('member', 'edit', { chapterId })
```

### 2. Cache Permission Results

```typescript
// GOOD - Cache in component state
const [canEdit, setCanEdit] = useState(false)

useEffect(() => {
  setCanEdit(rbac.hasPermission('member', 'edit', { chapterId }))
}, [rbac, chapterId])

// AVOID - Recalculate on every render
return rbac.hasPermission('member', 'edit', { chapterId }) ? <EditButton /> : null
```

### 3. Handle Loading States

```typescript
function ProtectedComponent() {
  const rbac = useRBAC(currentMember.id)

  if (rbac.isLoading) {
    return <LoadingSpinner />
  }

  if (rbac.error) {
    return <ErrorMessage error={rbac.error} />
  }

  if (!rbac.hasPermission('event', 'create')) {
    return <AccessDenied />
  }

  return <CreateEventForm />
}
```

### 4. Provide Context for Scope

```typescript
// GOOD - Explicit scope
const canEdit = usePermission('member', 'edit', {
  chapterId: member.chapterId,
})

// AVOID - Missing scope (may grant unintended access)
const canEdit = usePermission('member', 'edit')
```

---

## Testing

### Unit Tests

```typescript
import { hasPermission, canEditMember } from '@/lib/rbac/permissions'
import { mockMember, mockMemberRoles } from '@/__mocks__/rbac'

describe('Permission Checks', () => {
  it('should grant permission for own profile edit', () => {
    const member = mockMember({ id: '123' })
    const roles = mockMemberRoles({ memberId: '123', roleName: 'member' })

    expect(
      hasPermission(member, roles, 'member', 'edit', undefined)
    ).toBe(true)
  })

  it('should deny chapter admin access to other chapters', () => {
    const member = mockMember({ id: '123', chapterId: 'chapter-1' })
    const roles = mockMemberRoles({
      memberId: '123',
      roleName: 'chapter_admin',
      scopeChapterId: 'chapter-1',
    })
    const targetMember = mockMember({ id: '456', chapterId: 'chapter-2' })

    expect(canEditMember(member, targetMember, roles)).toBe(false)
  })
})
```

---

## Related Documentation
- Database Schema: `RBAC_DATABASE_SCHEMA.md`
- Permission Matrix: `RBAC_PERMISSION_MATRIX.md`
- RLS Policies: `RBAC_RLS_POLICIES.md`
- Migration Guide: `RBAC_MIGRATION_GUIDE.md`
- Admin Guide: `RBAC_ADMIN_GUIDE.md`
