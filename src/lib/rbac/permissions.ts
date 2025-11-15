/**
 * Role-Based Access Control (RBAC) Permissions System
 * Defines roles, permissions, and authorization logic for the NABIP AMS
 */

export enum Permission {
  // Member management
  MEMBER_VIEW = 'member:view',
  MEMBER_CREATE = 'member:create',
  MEMBER_EDIT = 'member:edit',
  MEMBER_DELETE = 'member:delete',
  MEMBER_EXPORT = 'member:export',

  // Event management
  EVENT_VIEW = 'event:view',
  EVENT_CREATE = 'event:create',
  EVENT_EDIT = 'event:edit',
  EVENT_DELETE = 'event:delete',
  EVENT_MANAGE_REGISTRATION = 'event:manage-registration',

  // Chapter management
  CHAPTER_VIEW = 'chapter:view',
  CHAPTER_CREATE = 'chapter:create',
  CHAPTER_EDIT = 'chapter:edit',
  CHAPTER_DELETE = 'chapter:delete',

  // Financial
  FINANCE_VIEW = 'finance:view',
  FINANCE_MANAGE = 'finance:manage',
  FINANCE_EXPORT = 'finance:export',

  // Communications
  COMMUNICATION_VIEW = 'communication:view',
  COMMUNICATION_CREATE = 'communication:create',
  COMMUNICATION_SEND = 'communication:send',

  // Learning/Courses
  COURSE_VIEW = 'course:view',
  COURSE_CREATE = 'course:create',
  COURSE_EDIT = 'course:edit',
  COURSE_DELETE = 'course:delete',

  // Reports
  REPORT_VIEW = 'report:view',
  REPORT_CREATE = 'report:create',
  REPORT_EXPORT = 'report:export',

  // Administrative
  USER_MANAGE = 'user:manage',
  ROLE_ASSIGN = 'role:assign',
  ROLE_MANAGE = 'role:manage',
  SETTINGS_MANAGE = 'settings:manage',
  AUDIT_VIEW = 'audit:view',

  // Portal
  PORTAL_ACCESS = 'portal:access',
}

export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
  GUEST = 'guest',
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: 'Administrator',
  [Role.MANAGER]: 'Manager',
  [Role.MEMBER]: 'Member',
  [Role.GUEST]: 'Guest',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [Role.ADMIN]: 'Full access to all features and settings',
  [Role.MANAGER]: 'Can manage members, events, and communications',
  [Role.MEMBER]: 'Can view content and manage own profile',
  [Role.GUEST]: 'Limited view-only access',
}

/**
 * Role to Permission mappings
 * Defines which permissions each role has
 */
export const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission), // Admins have all permissions
  
  [Role.MANAGER]: [
    // Member management
    Permission.MEMBER_VIEW,
    Permission.MEMBER_CREATE,
    Permission.MEMBER_EDIT,
    Permission.MEMBER_EXPORT,
    
    // Event management
    Permission.EVENT_VIEW,
    Permission.EVENT_CREATE,
    Permission.EVENT_EDIT,
    Permission.EVENT_MANAGE_REGISTRATION,
    
    // Chapter management
    Permission.CHAPTER_VIEW,
    Permission.CHAPTER_EDIT,
    
    // Financial
    Permission.FINANCE_VIEW,
    
    // Communications
    Permission.COMMUNICATION_VIEW,
    Permission.COMMUNICATION_CREATE,
    Permission.COMMUNICATION_SEND,
    
    // Learning
    Permission.COURSE_VIEW,
    Permission.COURSE_CREATE,
    Permission.COURSE_EDIT,
    
    // Reports
    Permission.REPORT_VIEW,
    Permission.REPORT_CREATE,
    Permission.REPORT_EXPORT,
    
    // Portal
    Permission.PORTAL_ACCESS,
  ],
  
  [Role.MEMBER]: [
    // Member management
    Permission.MEMBER_VIEW,
    
    // Event management
    Permission.EVENT_VIEW,
    
    // Chapter management
    Permission.CHAPTER_VIEW,
    
    // Communications
    Permission.COMMUNICATION_VIEW,
    
    // Learning
    Permission.COURSE_VIEW,
    
    // Reports
    Permission.REPORT_VIEW,
    
    // Portal
    Permission.PORTAL_ACCESS,
  ],
  
  [Role.GUEST]: [
    // Event management
    Permission.EVENT_VIEW,
    
    // Chapter management
    Permission.CHAPTER_VIEW,
  ],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  userRole: Role,
  permission: Permission
): boolean {
  return rolePermissions[userRole]?.includes(permission) ?? false
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(
  userRole: Role,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(userRole, p))
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(
  userRole: Role,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(userRole, p))
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return rolePermissions[role] || []
}

/**
 * Get role hierarchy level (higher number = more privileges)
 */
export function getRoleLevel(role: Role): number {
  const levels: Record<Role, number> = {
    [Role.GUEST]: 0,
    [Role.MEMBER]: 1,
    [Role.MANAGER]: 2,
    [Role.ADMIN]: 3,
  }
  return levels[role] || 0
}

/**
 * Check if one role can manage another role
 * (e.g., can assign/revoke roles)
 */
export function canManageRole(
  managerRole: Role,
  targetRole: Role
): boolean {
  return getRoleLevel(managerRole) > getRoleLevel(targetRole)
}
