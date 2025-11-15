import type { Member, Chapter } from '@/lib/types'
import type {
  MemberRole,
  Permission,
  ResourceType,
  ActionType,
  PermissionScope,
  TargetScope,
  PermissionResult,
  AccessibleEntity,
  Role,
} from './types'

// Re-export types for convenience
export type { Role, MemberRole, Permission, ResourceType, ActionType, PermissionScope, TargetScope, PermissionResult, AccessibleEntity }

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
