import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useKV } from '@github/spark/hooks'
import { Role } from '@/lib/rbac/permissions'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  chapterId?: string // For chapter admins, this is their chapter
  stateChapterId?: string // For state admins, this is their state chapter
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useKV<User | null>('ams-current-user', null)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize with a default user for demo purposes
  useEffect(() => {
    if (!user) {
      // For demo, we'll set a chapter admin user
      // In production, this would come from actual authentication
      const demoUser: User = {
        id: 'demo-user-1',
        email: 'chapter.admin@nabip.org',
        name: 'Jane Smith',
        role: Role.CHAPTER_ADMIN,
        chapterId: 'chapter-local-ca-1', // California local chapter
      }
      setUserState(demoUser)
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Mock login - in production, this would call an API
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Determine role and chapter based on email for demo
      let demoUser: User
      if (email.includes('national')) {
        demoUser = {
          id: 'user-national',
          email,
          name: 'National Admin',
          role: Role.NATIONAL_ADMIN,
        }
      } else if (email.includes('state')) {
        demoUser = {
          id: 'user-state',
          email,
          name: 'State Admin',
          role: Role.STATE_ADMIN,
          stateChapterId: 'chapter-state-ca',
        }
      } else {
        demoUser = {
          id: 'user-chapter',
          email,
          name: 'Chapter Admin',
          role: Role.CHAPTER_ADMIN,
          chapterId: 'chapter-local-ca-1',
        }
      }
      
      setUserState(demoUser)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUserState(null)
  }

  const setUser = (newUser: User | null) => {
    setUserState(newUser)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setUser }}>
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
