# Member Portal Login - Integration Guide

**Quick Start Guide for Adding MemberPortalLogin to NABIP AMS**

---

## Option 1: Standalone Login Page (Recommended)

Add a new "Portal" view to the main navigation that shows the login screen or authenticated portal.

### Step 1: Update App.tsx

```typescript
// src/App.tsx - Add to existing file

import { MemberPortalLogin } from '@/components/features/MemberPortalLogin'
import { MemberPortalLoginSkeleton } from '@/components/features/MemberPortalLoginSkeleton'
import { MemberPortal } from '@/components/features/MemberPortal'

// Add 'portal' to view type
type View =
  | 'dashboard'
  | 'members'
  | 'events'
  | 'communications'
  | 'finance'
  | 'chapters'
  | 'learning'
  | 'reports'
  | 'portal' // ADD THIS

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [currentMember, setCurrentMember] = useKV<Member | null>('current-member', null)
  const [isPortalAuthenticated, setIsPortalAuthenticated] = useState(false)

  // Add navigation item
  const navItems = [
    // ... existing items
    {
      id: 'portal' as View,
      label: 'Member Portal',
      icon: UserCircle
    }
  ]

  // Add render case for portal view
  const renderContent = () => {
    switch (currentView) {
      // ... existing cases
      case 'portal':
        if (!isPortalAuthenticated || !currentMember) {
          return (
            <div className="min-h-screen flex items-center justify-center">
              <MemberPortalLogin
                onLoginSuccess={(member) => {
                  setCurrentMember(member)
                  setIsPortalAuthenticated(true)
                }}
                onForgotPassword={(email) => {
                  toast.info('Password reset email sent to ' + email)
                  // Implement password reset flow
                }}
              />
            </div>
          )
        }
        return <MemberPortal memberId={currentMember.id} />

      default:
        return <DashboardView stats={stats} loading={loading} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Rest of existing App.tsx structure */}
      {renderContent()}
    </div>
  )
}
```

---

## Option 2: Separate Login Route (If Using Router)

If you add React Router in the future:

```typescript
// src/routes/Login.tsx
import { MemberPortalLogin } from '@/components/features/MemberPortalLogin'
import { useNavigate } from 'react-router-dom'

export function LoginPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <MemberPortalLogin
        onLoginSuccess={(member) => {
          // Store member in global state or context
          navigate('/portal/dashboard')
        }}
        onForgotPassword={(email) => {
          navigate('/auth/reset-password', { state: { email } })
        }}
      />
    </div>
  )
}
```

---

## Option 3: Modal Dialog Login

Use as a modal within the existing admin interface:

```typescript
// src/App.tsx or any component
import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { MemberPortalLogin } from '@/components/features/MemberPortalLogin'
import { Button } from '@/components/ui/button'

function AdminPanel() {
  const [showMemberLogin, setShowMemberLogin] = useState(false)

  return (
    <>
      <Button onClick={() => setShowMemberLogin(true)}>
        Member Portal Login
      </Button>

      <Dialog open={showMemberLogin} onOpenChange={setShowMemberLogin}>
        <DialogContent className="max-w-md p-0">
          <MemberPortalLogin
            onLoginSuccess={(member) => {
              setShowMemberLogin(false)
              // Handle authenticated member
            }}
            onForgotPassword={(email) => {
              setShowMemberLogin(false)
              // Show password reset dialog
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
```

---

## Integration with Authentication Service

### Basic Integration (Demo Mode)

The component works out-of-box with demo authentication:

```typescript
<MemberPortalLogin
  onLoginSuccess={(member) => {
    console.log('Demo login:', member)
    // Any valid email/password will authenticate
  }}
  onForgotPassword={(email) => {
    console.log('Reset password for:', email)
  }}
/>
```

### Custom Authentication Service

```typescript
// src/lib/auth-service.ts
import { supabase } from '@/lib/supabase'
import type { Member } from '@/lib/types'

export async function authenticateMember(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<Member | null> {
  try {
    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      return null
    }

    // 2. Fetch member profile
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('email', email)
      .single()

    if (memberError || !memberData) {
      return null
    }

    // 3. Set session storage based on rememberMe
    if (rememberMe) {
      localStorage.setItem('auth-session', authData.session.access_token)
    } else {
      sessionStorage.setItem('auth-session', authData.session.access_token)
    }

    return memberData as Member
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

// Use in component
<MemberPortalLogin
  authenticateUser={authenticateMember}
  onLoginSuccess={(member) => {
    // Member authenticated with real service
  }}
  onForgotPassword={async (email) => {
    await supabase.auth.resetPasswordForEmail(email)
  }}
/>
```

---

## Testing the Integration

### 1. Visual Test
```bash
npm run dev
```
Navigate to the portal view and verify:
- Login form renders correctly
- Fields are accessible via keyboard
- Email validation works
- Password show/hide toggles
- Remember Me checkbox functions

### 2. Run Unit Tests
```bash
npm run test src/components/features/MemberPortalLogin.test.tsx
```

### 3. Accessibility Audit
1. Open Chrome DevTools
2. Run Lighthouse audit
3. Verify Accessibility score >95

---

## Common Integration Issues

### Issue: Component not rendering
**Solution**: Verify all imports are correct and Shadcn/ui components are installed

### Issue: TypeScript errors
**Solution**: Ensure Member type is imported from '@/lib/types'

### Issue: Styling looks incorrect
**Solution**: Verify Tailwind CSS is configured and running

### Issue: Form doesn't submit
**Solution**: Check that onLoginSuccess callback is provided

---

## Quick Copy-Paste Example

Here's a minimal working example to test:

```typescript
// Test in any component
import { useState } from 'react'
import { MemberPortalLogin } from '@/components/features/MemberPortalLogin'
import type { Member } from '@/lib/types'

function TestLogin() {
  const [member, setMember] = useState<Member | null>(null)

  if (member) {
    return <div>Welcome, {member.firstName}!</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <MemberPortalLogin
        onLoginSuccess={setMember}
        onForgotPassword={(email) => alert('Reset: ' + email)}
      />
    </div>
  )
}
```

---

## Next Steps

1. **Choose integration option** (standalone, route, or modal)
2. **Implement authentication service** (coordinate with rbac-security-specialist)
3. **Test in development environment**
4. **Run accessibility audit**
5. **Deploy to staging**
6. **Gather user feedback**
7. **Iterate based on insights**

---

## Support

Questions? Contact Brookside BI:
- Email: Consultations@BrooksideBI.com
- Phone: +1 209 487 2047
- GitHub: markus41/nabip-association-ma (Issue #17)
