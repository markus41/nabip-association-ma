// ============================================================================
// RBAC EXPORTS
// ============================================================================

// Types
export type {
  RoleLevel,
  RoleName,
  PermissionScope,
  ResourceType,
  ActionType,
  ScopeType,
  Permission,
  Role,
  MemberRole,
  RBACContext,
  TargetScope,
  AccessibleEntity,
  PermissionCheckOptions,
  PermissionResult,
  PermissionAuditEntry,
} from './types'

// Permission functions
export {
  hasPermission,
  checkPermission,
  canViewMember,
  canEditMember,
  canEditChapter,
  canCreateEvent,
  canCreateCampaign,
  getHighestRole,
  hasRole,
  isAdmin,
  isNationalAdmin,
  filterByPermissions,
  getAccessibleChapterIds,
  getAccessibleStates,
} from './permissions'

// React hooks
export {
  useRBAC,
  usePermission,
  useHasRole,
  useMemberPermissions,
  useChapterPermissions,
} from './hooks'

// Cache utilities
export {
  getPermissionCache,
  setPermissionCache,
  clearPermissionCache,
} from './cache'
