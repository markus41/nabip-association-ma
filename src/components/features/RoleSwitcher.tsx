import { useAuth } from '@/lib/auth/AuthContext'
import { RoleName } from '@/lib/rbac/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserCircle, CaretDown } from '@phosphor-icons/react'

export function RoleSwitcher() {
  const { user, setUser } = useAuth()

  const switchRole = (role: RoleName) => {
    if (!user) return

    let updatedUser = { ...user, role }

    // Set appropriate chapter IDs based on role
    switch (role) {
      case 'chapter_admin':
        updatedUser.chapterId = 'chapter-local-ca-1'
        delete updatedUser.stateChapterId
        break
      case 'state_admin':
        updatedUser.stateChapterId = 'chapter-state-ca'
        delete updatedUser.chapterId
        break
      case 'national_admin':
        delete updatedUser.chapterId
        delete updatedUser.stateChapterId
        break
      default:
        delete updatedUser.chapterId
        delete updatedUser.stateChapterId
    }

    setUser(updatedUser)
  }

  if (!user) return null

  const roleLabels: Record<string, string> = {
    'national_admin': 'National Admin',
    'state_admin': 'State Admin',
    'chapter_admin': 'Chapter Admin',
    'member': 'Member',
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserCircle size={16} weight="duotone" />
          <span className="hidden md:inline">{roleLabels[user.role]}</span>
          <CaretDown size={12} weight="bold" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Switch Role (Demo)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(roleLabels).map(([role, label]) => (
          <DropdownMenuItem
            key={role}
            onClick={() => switchRole(role as RoleName)}
            disabled={user.role === role}
          >
            {label}
            {user.role === role && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
