import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { RoleName } from '@/lib/rbac'
import type { User as SupabaseUser } from '@supabase/supabase-js'

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
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Maps Supabase auth user + member data to application User type
 */
async function mapAuthUserToUser(authUser: SupabaseUser): Promise<User | null> {
  try {
    if (!authUser.email) {
      console.error('Auth user has no email')
      return null
    }

    // Query members table to get member data
    const { data: member, error } = await supabase
      .from('members')
      .select('id, first_name, last_name, email, chapter_id, metadata')
      .eq('email', authUser.email)
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch member data:', error)
      return null
    }

    if (!member) {
      console.error('No member record found for email:', authUser.email)
      return null
    }

    // Determine role from metadata or default to 'member'
    // In production, this would check a roles table or use RLS functions
    const metadata = member.metadata as Record<string, any> | null
    let role: RoleName = 'member'

    if (metadata?.role) {
      role = metadata.role as RoleName
    } else {
      // Check if user is an admin using RLS functions
      const { data: isNationalAdmin } = await supabase.rpc('is_national_admin_member')
      const { data: isStateAdmin } = await supabase.rpc('is_state_admin_member')
      const { data: isChapterAdmin } = await supabase.rpc('is_chapter_admin_member', {
        chapter_id: member.chapter_id || ''
      })

      if (isNationalAdmin) {
        role = 'national_admin'
      } else if (isStateAdmin) {
        role = 'state_admin'
      } else if (isChapterAdmin) {
        role = 'chapter_admin'
      }
    }

    // Get chapter info for state/chapter admins
    let stateChapterId: string | undefined
    if ((role === 'state_admin' || role === 'chapter_admin') && member.chapter_id) {
      const { data: chapter } = await supabase
        .from('chapters')
        .select('id, type, parent_chapter_id')
        .eq('id', member.chapter_id)
        .maybeSingle()

      if (chapter?.type === 'state') {
        stateChapterId = chapter.id
      } else if (chapter?.type === 'local' && chapter.parent_chapter_id) {
        // For local chapter admins, find their state chapter
        const { data: parentChapter } = await supabase
          .from('chapters')
          .select('id, type, parent_chapter_id')
          .eq('id', chapter.parent_chapter_id)
          .maybeSingle()

        if (parentChapter?.type === 'state') {
          stateChapterId = parentChapter.id
        }
      }
    }

    return {
      id: authUser.id,
      email: authUser.email,
      name: `${member.first_name} ${member.last_name}`,
      role,
      chapterId: role === 'chapter_admin' ? member.chapter_id || undefined : undefined,
      stateChapterId,
    }
  } catch (error) {
    console.error('Error mapping auth user to app user:', error)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state and set up listener
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        mapAuthUserToUser(session.user).then(setUserState)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const appUser = await mapAuthUserToUser(session.user)
        setUserState(appUser)
      } else {
        setUserState(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        const appUser = await mapAuthUserToUser(data.user)
        setUserState(appUser)
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      setUserState(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
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
