/**
 * Authentication Context and Hooks
 * Provides mock authentication for demo purposes
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from '@/lib/types'
import { Role, Permission, hasPermission as checkPermission } from '@/lib/rbac/permissions'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUserRole: (userId: string, newRole: Role) => void
  switchUser: (userId: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Mock users for demo purposes
 */
const MOCK_USERS: User[] = [
  {
    id: 'user-admin-1',
    email: 'admin@nabip.org',
    firstName: 'Admin',
    lastName: 'User',
    role: Role.ADMIN,
    status: 'active',
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'user-manager-1',
    email: 'manager@nabip.org',
    firstName: 'Manager',
    lastName: 'Smith',
    role: Role.MANAGER,
    status: 'active',
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'user-member-1',
    email: 'member@nabip.org',
    firstName: 'John',
    lastName: 'Doe',
    role: Role.MEMBER,
    status: 'active',
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'user-guest-1',
    email: 'guest@example.com',
    firstName: 'Guest',
    lastName: 'User',
    role: Role.GUEST,
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>(MOCK_USERS)

  useEffect(() => {
    // Check for stored user session
    const storedUserId = localStorage.getItem('ams-current-user-id')
    if (storedUserId) {
      const foundUser = users.find((u) => u.id === storedUserId)
      if (foundUser) {
        setUser(foundUser)
      } else {
        // Default to admin for demo
        setUser(users[0])
        localStorage.setItem('ams-current-user-id', users[0].id)
      }
    } else {
      // Default to admin for demo
      setUser(users[0])
      localStorage.setItem('ams-current-user-id', users[0].id)
    }
    setIsLoading(false)
  }, [users])

  const login = async (email: string, _password: string) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    const foundUser = users.find((u) => u.email === email)
    if (foundUser) {
      const updatedUser = { ...foundUser, lastLoginAt: new Date().toISOString() }
      setUser(updatedUser)
      localStorage.setItem('ams-current-user-id', updatedUser.id)
    } else {
      throw new Error('User not found')
    }
    setIsLoading(false)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('ams-current-user-id')
  }

  const updateUserRole = (userId: string, newRole: Role) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.id === userId ? { ...u, role: newRole } : u
      )
    )
    
    // Update current user if it's the one being changed
    if (user?.id === userId) {
      setUser((prev) => (prev ? { ...prev, role: newRole } : null))
    }
  }

  const switchUser = (userId: string) => {
    const foundUser = users.find((u) => u.id === userId)
    if (foundUser) {
      setUser(foundUser)
      localStorage.setItem('ams-current-user-id', foundUser.id)
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, updateUserRole, switchUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Hook to check if current user has a specific permission
 */
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth()
  if (!user) return false
  return checkPermission(user.role as Role, permission)
}

/**
 * Hook to check if current user has any of the specified permissions
 */
export function usePermissions(permissions: Permission[]): boolean[] {
  const { user } = useAuth()
  if (!user) return permissions.map(() => false)
  return permissions.map((p) => checkPermission(user.role as Role, p))
}

/**
 * Hook to check if current user has all of the specified permissions
 */
export function useHasAllPermissions(permissions: Permission[]): boolean {
  const { user } = useAuth()
  if (!user) return false
  return permissions.every((p) => checkPermission(user.role as Role, p))
}

/**
 * Hook to get current user's role
 */
export function useRole(): Role | null {
  const { user } = useAuth()
  return user?.role as Role | null
}
