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
