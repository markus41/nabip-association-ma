import { useEffect, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Member, Chapter } from '@/lib/types'
import type {
  MemberRole,
  Permission,
  RBACContext,
  ResourceType,
  ActionType,
  TargetScope,
} from './types'
import {
  hasPermission,
  hasRole as checkHasRole,
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

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
    hasRole: (roleName) => checkHasRole(memberRoles, roleName),
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
  const [currentMember] = useKV<Member | null>('currentMember', null)
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
  const [currentMember] = useKV<Member | null>('currentMember', null)
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
  const [currentMember] = useKV<Member | null>('currentMember', null)
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
  const [currentMember] = useKV<Member | null>('currentMember', null)
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
