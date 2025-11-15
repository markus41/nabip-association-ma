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
