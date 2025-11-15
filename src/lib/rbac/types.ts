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
  member: any // Will be Member from types.ts
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
