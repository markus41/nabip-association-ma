import { useAuth } from '@/lib/auth/AuthContext'
import { Permission, hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/rbac/permissions'

export function usePermission(permission: Permission): boolean {
  const { user } = useAuth()
  if (!user) return false
  return hasPermission(user.role, permission)
}

export function usePermissions(permissions: Permission[]): boolean[] {
  const { user } = useAuth()
  if (!user) return permissions.map(() => false)
  return permissions.map((p) => hasPermission(user.role, p))
}

export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { user } = useAuth()
  if (!user) return false
  return hasAnyPermission(user.role, permissions)
}

export function useHasAllPermissions(permissions: Permission[]): boolean {
  const { user } = useAuth()
  if (!user) return false
  return hasAllPermissions(user.role, permissions)
}
