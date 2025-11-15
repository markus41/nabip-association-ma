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
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Maps Supabase auth user + member data to application User type
 */
async function mapAuthUserToUser(authUser: SupabaseUser): Promise<User | null> {
  try {
    console.log('[mapAuthUserToUser] Starting to map user:', authUser.email)
    if (!authUser.email) {
      console.error('[mapAuthUserToUser] Auth user has no email')
      return null
    }

    // Query members table to get member data
    console.log('[mapAuthUserToUser] Querying members table for:', authUser.email)
    const { data: member, error } = await supabase
      .from('members')
      .select('id, first_name, last_name, email, chapter_id, custom_fields')
      .eq('email', authUser.email)
      .maybeSingle()

    console.log('[mapAuthUserToUser] Members query result:', { member, error })

    if (error) {
      console.error('Failed to fetch member data:', error)
      return null
    }

    if (!member) {
      console.error('No member record found for email:', authUser.email)
      return null
    }

    // Determine role from custom_fields ONLY (simplified approach)
    // NOTE: RPC function checks removed as they don't exist in database yet
    // Future: Re-enable after creating is_national_admin_member(), is_state_admin_member(), is_chapter_admin_member()
    const customFields = member.custom_fields as Record<string, any> | null
    let role: RoleName = 'member'

    console.log('[mapAuthUserToUser] Determining role from custom_fields:', customFields)

    // Extract role from custom_fields with validation
    if (customFields && typeof customFields === 'object' && 'role' in customFields) {
      const roleValue = customFields.role

      // Validate role is a valid RoleName
      const validRoles: RoleName[] = ['member', 'chapter_admin', 'state_admin', 'national_admin']
      if (typeof roleValue === 'string' && validRoles.includes(roleValue as RoleName)) {
        role = roleValue as RoleName
        console.log('[mapAuthUserToUser] Role assigned from custom_fields:', role)
      } else {
        console.warn('[mapAuthUserToUser] Invalid role in custom_fields:', roleValue)
      }
    } else {
      console.warn('[mapAuthUserToUser] No role found in custom_fields, defaulting to member')
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
  const [error, setError] = useState<string | null>(null)

  // Initialize auth state and set up listener
  useEffect(() => {
    console.log('[AuthContext] Initializing auth check...')

    // Add timeout to prevent infinite loading if Supabase hangs
    const timeout = setTimeout(() => {
      console.error('[AuthContext] Session check timed out after 5 seconds')
      setIsLoading(false)
    }, 5000)

    // Check current session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(timeout)
        console.log('[AuthContext] getSession completed. Session:', session ? 'exists' : 'null')
        if (session?.user) {
          console.log('[AuthContext] Session user found, mapping to app user...')
          mapAuthUserToUser(session.user).then(appUser => {
            console.log('[AuthContext] User mapped:', appUser)
            setUserState(appUser)
            setError(null)
            setIsLoading(false)
          }).catch(err => {
            console.error('[AuthContext] Error mapping user:', err)
            setError('Failed to load user profile. Please refresh the page.')
            setUserState(null)
            setIsLoading(false)
          })
        } else {
          console.log('[AuthContext] No session found, setting loading to false')
          setError(null)
          setIsLoading(false)
        }
      })
      .catch(err => {
        clearTimeout(timeout)
        console.error('[AuthContext] getSession error:', err)
        setError('Failed to connect to authentication service. Please check your internet connection.')
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
    setError(null)
    try {
      console.log('[login] Attempting login for:', email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('[login] Auth error:', error)
        setError(error.message || 'Invalid email or password')
        throw error
      }

      console.log('[login] Auth successful, mapping user...')

      if (data.user) {
        // Add timeout for user mapping
        const mappingPromise = mapAuthUserToUser(data.user)
        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => reject(new Error('User mapping timed out after 10 seconds')), 10000)
        })

        const appUser = await Promise.race([mappingPromise, timeoutPromise])
        console.log('[login] User mapped successfully:', appUser)

        if (!appUser) {
          setError('No member record found for this account. Please contact support.')
          throw new Error('No member record found')
        }

        setUserState(appUser)
        setError(null)
      }
    } catch (error) {
      console.error('[login] Login error:', error)
      if (!error) {
        setError('An unexpected error occurred during login')
      }
      setIsLoading(false)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
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
