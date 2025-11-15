// RBAC Permission System for NABIP AMS
export enum Permission {
  // Member management
  MEMBER_VIEW = 'member:view',
  MEMBER_CREATE = 'member:create',
  MEMBER_EDIT = 'member:edit',
  MEMBER_DELETE = 'member:delete',

  // Event management
  EVENT_VIEW = 'event:view',
  EVENT_CREATE = 'event:create',
  EVENT_EDIT = 'event:edit',
  EVENT_DELETE = 'event:delete',

  // Chapter management
  CHAPTER_VIEW = 'chapter:view',
  CHAPTER_VIEW_ALL = 'chapter:view_all',
  CHAPTER_EDIT = 'chapter:edit',
  CHAPTER_DELETE = 'chapter:delete',

  // Financial
  FINANCE_VIEW = 'finance:view',
  FINANCE_VIEW_ALL = 'finance:view_all',
  FINANCE_MANAGE = 'finance:manage',

  // Communications
  COMMUNICATION_SEND = 'communication:send',
  COMMUNICATION_VIEW = 'communication:view',

  // Reports
  REPORT_VIEW = 'report:view',
  REPORT_VIEW_ALL = 'report:view_all',
  REPORT_CREATE = 'report:create',

  // Administrative
  USER_MANAGE = 'user:manage',
  ROLE_MANAGE = 'role:manage',
  SETTINGS_MANAGE = 'settings:manage',
  AUDIT_VIEW = 'audit:view',
}

export enum Role {
  NATIONAL_ADMIN = 'national_admin',
  STATE_ADMIN = 'state_admin',
  CHAPTER_ADMIN = 'chapter_admin',
  MEMBER = 'member',
  GUEST = 'guest',
}

export const rolePermissions: Record<Role, Permission[]> = {
  [Role.NATIONAL_ADMIN]: Object.values(Permission), // All permissions
  
  [Role.STATE_ADMIN]: [
    Permission.MEMBER_VIEW,
    Permission.MEMBER_CREATE,
    Permission.MEMBER_EDIT,
    Permission.EVENT_VIEW,
    Permission.EVENT_CREATE,
    Permission.EVENT_EDIT,
    Permission.CHAPTER_VIEW,
    Permission.CHAPTER_VIEW_ALL, // Can view all chapters in their state
    Permission.CHAPTER_EDIT,
    Permission.FINANCE_VIEW,
    Permission.FINANCE_VIEW_ALL, // Can view finances for their state
    Permission.COMMUNICATION_SEND,
    Permission.COMMUNICATION_VIEW,
    Permission.REPORT_VIEW,
    Permission.REPORT_VIEW_ALL,
    Permission.REPORT_CREATE,
  ],
  
  [Role.CHAPTER_ADMIN]: [
    Permission.MEMBER_VIEW, // Only their chapter
    Permission.MEMBER_CREATE,
    Permission.MEMBER_EDIT,
    Permission.EVENT_VIEW, // Only their chapter
    Permission.EVENT_CREATE,
    Permission.EVENT_EDIT,
    Permission.CHAPTER_VIEW, // Only their chapter
    Permission.FINANCE_VIEW, // Only their chapter
    Permission.COMMUNICATION_SEND, // To their chapter members
    Permission.COMMUNICATION_VIEW,
    Permission.REPORT_VIEW, // Only their chapter
    Permission.REPORT_CREATE,
  ],
  
  [Role.MEMBER]: [
    Permission.MEMBER_VIEW, // Only their own profile
    Permission.EVENT_VIEW,
    Permission.FINANCE_VIEW, // Only their own transactions
    Permission.REPORT_VIEW, // Only their own data
  ],
  
  [Role.GUEST]: [
    Permission.EVENT_VIEW,
  ],
}

export function hasPermission(
  userRole: Role,
  permission: Permission
): boolean {
  return rolePermissions[userRole]?.includes(permission) ?? false
}

export function hasAnyPermission(
  userRole: Role,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(userRole, p))
}

export function hasAllPermissions(
  userRole: Role,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(userRole, p))
}
