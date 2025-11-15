/**
 * Permission Guard Component
 * Conditionally renders content based on user permissions
 */

import { ReactNode } from 'react'
import { useAuth } from '@/lib/auth/context'
import { Permission, hasPermission, Role } from '@/lib/rbac/permissions'
import { Card } from '@/components/ui/card'
import { ShieldWarning } from '@phosphor-icons/react'

interface PermissionGuardProps {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
  showMessage?: boolean
}

/**
 * Guards content based on a single permission
 */
export function PermissionGuard({
  permission,
  children,
  fallback,
  showMessage = true,
}: PermissionGuardProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user || !hasPermission(user.role as Role, permission)) {
    if (fallback !== undefined) {
      return <>{fallback}</>
    }

    if (showMessage) {
      return (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <ShieldWarning className="h-16 w-16 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Access Denied</h3>
              <p className="text-sm text-muted-foreground">
                You don't have permission to access this content.
              </p>
            </div>
          </div>
        </Card>
      )
    }

    return null
  }

  return <>{children}</>
}

interface AnyPermissionGuardProps {
  permissions: Permission[]
  children: ReactNode
  fallback?: ReactNode
  showMessage?: boolean
}

/**
 * Guards content - user needs ANY of the specified permissions
 */
export function AnyPermissionGuard({
  permissions,
  children,
  fallback,
  showMessage = true,
}: AnyPermissionGuardProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const hasAnyPermission = permissions.some((permission) =>
    user ? hasPermission(user.role as Role, permission) : false
  )

  if (!user || !hasAnyPermission) {
    if (fallback !== undefined) {
      return <>{fallback}</>
    }

    if (showMessage) {
      return (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <ShieldWarning className="h-16 w-16 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Access Denied</h3>
              <p className="text-sm text-muted-foreground">
                You don't have permission to access this content.
              </p>
            </div>
          </div>
        </Card>
      )
    }

    return null
  }

  return <>{children}</>
}

interface AllPermissionsGuardProps {
  permissions: Permission[]
  children: ReactNode
  fallback?: ReactNode
  showMessage?: boolean
}

/**
 * Guards content - user needs ALL of the specified permissions
 */
export function AllPermissionsGuard({
  permissions,
  children,
  fallback,
  showMessage = true,
}: AllPermissionsGuardProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const hasAllPermissions = permissions.every((permission) =>
    user ? hasPermission(user.role as Role, permission) : false
  )

  if (!user || !hasAllPermissions) {
    if (fallback !== undefined) {
      return <>{fallback}</>
    }

    if (showMessage) {
      return (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <ShieldWarning className="h-16 w-16 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Access Denied</h3>
              <p className="text-sm text-muted-foreground">
                You don't have permission to access this content.
              </p>
            </div>
          </div>
        </Card>
      )
    }

    return null
  }

  return <>{children}</>
}

interface RoleGuardProps {
  roles: Role[]
  children: ReactNode
  fallback?: ReactNode
  showMessage?: boolean
}

/**
 * Guards content based on user role
 */
export function RoleGuard({
  roles,
  children,
  fallback,
  showMessage = true,
}: RoleGuardProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user || !roles.includes(user.role as Role)) {
    if (fallback !== undefined) {
      return <>{fallback}</>
    }

    if (showMessage) {
      return (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <ShieldWarning className="h-16 w-16 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Access Denied</h3>
              <p className="text-sm text-muted-foreground">
                You don't have the required role to access this content.
              </p>
            </div>
          </div>
        </Card>
      )
    }

    return null
  }

  return <>{children}</>
}
