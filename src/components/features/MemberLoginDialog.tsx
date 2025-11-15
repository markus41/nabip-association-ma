import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SignIn, EnvelopeSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Member } from '@/lib/types'

interface MemberLoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: Member[]
  onLoginSuccess: (member: Member) => void
}

export function MemberLoginDialog({
  open,
  onOpenChange,
  members,
  onLoginSuccess
}: MemberLoginDialogProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    setIsLoading(true)

    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500))

    // Find member by email (case-insensitive)
    const member = members.find(
      m => m.email.toLowerCase() === email.toLowerCase().trim()
    )

    setIsLoading(false)

    if (member) {
      toast.success('Login successful', {
        description: `Welcome back, ${member.firstName}!`
      })
      onLoginSuccess(member)
      onOpenChange(false)
      setEmail('')
    } else {
      toast.error('Member not found', {
        description: 'No member found with this email address. Please check and try again.'
      })
    }
  }

  const handleDemoLogin = () => {
    // For demo purposes, login with the first active member
    const activeMember = members.find(m => m.status === 'active')
    
    if (activeMember) {
      toast.success('Demo login successful', {
        description: `Logged in as ${activeMember.firstName} ${activeMember.lastName}`
      })
      onLoginSuccess(activeMember)
      onOpenChange(false)
      setEmail('')
    } else {
      toast.error('No demo member available')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SignIn size={24} weight="duotone" className="text-primary" />
            Member Portal Login
          </DialogTitle>
          <DialogDescription>
            Enter your email address to access your member portal
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLogin}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <EnvelopeSimple
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Demo Mode:</strong> Click "Demo Login" 
                to login as a sample member, or enter any member email from the Members page.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleDemoLogin}
              disabled={isLoading || members.length === 0}
            >
              Demo Login
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
