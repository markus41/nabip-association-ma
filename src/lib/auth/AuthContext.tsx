import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { RoleName } from '@/lib/rbac'

export interface User {
  id: string
  email: string
  name: string
  role: RoleName
  chapterId?: string // For chapter admins, this is their chapter
  stateChapterId?: string // For state admins, this is their state chapter
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // DEMO MODE: Start with a default demo user (National Admin)
  const [user, setUserState] = useState<User | null>({
    id: 'demo-user-123',
    email: 'demo@nabip.org',
    name: 'Demo User',
    role: 'national_admin'
  })
  const [isLoading, setIsLoading] = useState(false) // No loading in demo mode
  const [error, setError] = useState<string | null>(null)

  // Demo mode - no authentication required
  useEffect(() => {
    console.log('[AuthContext] Running in DEMO MODE - authentication disabled')
  }, [])

  const login = async (email: string, password: string) => {
    // DEMO MODE: Login not implemented
    console.log('[login] Demo mode - login bypassed')
  }

  const clearError = () => {
    setError(null)
  }

  const logout = async () => {
    // DEMO MODE: Logout not implemented
    console.log('[logout] Demo mode - logout bypassed')
  }

  const setUser = (newUser: User | null) => {
    setUserState(newUser)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, setUser, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
