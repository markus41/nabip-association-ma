import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { UserCircle, CaretDown } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/lib/types'

interface RoleSwitcherProps {
  currentRole: UserRole
  onRoleChange: (role: UserRole, chapterId: string | null) => void
  chapters: Array<{ id: string; name: string }>
}

export function RoleSwitcher({ currentRole, onRoleChange, chapters }: RoleSwitcherProps) {
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'member':
        return 'Member'
      case 'chapter_admin':
        return 'Chapter Admin'
      case 'state_admin':
        return 'State Admin'
      case 'national_admin':
        return 'National Admin'
    }
  }

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'member':
        return 'secondary'
      case 'chapter_admin':
        return 'default'
      case 'state_admin':
        return 'default'
      case 'national_admin':
        return 'default'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserCircle size={16} />
          <Badge variant={getRoleBadgeVariant(currentRole)}>
            {getRoleLabel(currentRole)}
          </Badge>
          <CaretDown size={12} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Role (Demo)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onRoleChange('national_admin', null)}>
          <div className="flex items-center justify-between w-full">
            <span>National Admin</span>
            {currentRole === 'national_admin' && <Badge variant="default" className="text-xs">Active</Badge>}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onRoleChange('state_admin', null)}>
          <div className="flex items-center justify-between w-full">
            <span>State Admin</span>
            {currentRole === 'state_admin' && <Badge variant="default" className="text-xs">Active</Badge>}
          </div>
        </DropdownMenuItem>
        {chapters.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Chapter Admin Roles</DropdownMenuLabel>
            {chapters.slice(0, 5).map((chapter) => (
              <DropdownMenuItem
                key={chapter.id}
                onClick={() => onRoleChange('chapter_admin', chapter.id)}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm">Chapter Admin</span>
                  <span className="text-xs text-muted-foreground">{chapter.name}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onRoleChange('member', null)}>
          <div className="flex items-center justify-between w-full">
            <span>Member</span>
            {currentRole === 'member' && <Badge variant="secondary" className="text-xs">Active</Badge>}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
