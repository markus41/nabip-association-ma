import { Card } from '@/components/ui/card'
import { ArrowUp, ArrowDown, SunHorizon, Sun, Moon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

interface DailyChange {
  label: string
  value: number
  isPositive: boolean
}

interface PersonalizedGreetingProps {
  userName?: string
  userRole?: 'admin' | 'member' | 'chapter_admin' | 'state_admin'
  dailyChanges: DailyChange[]
  loading?: boolean
}

/**
 * Establish personalized time-based greetings to improve user engagement.
 * Dynamically selects greeting and icon based on current time of day.
 *
 * Best for: Dashboard welcome experiences requiring personalization
 */
function getGreeting(): { text: string; icon: typeof Sun } {
  const hour = new Date().getHours()

  if (hour < 12) {
    return { text: 'Good morning', icon: SunHorizon }
  } else if (hour < 18) {
    return { text: 'Good afternoon', icon: Sun }
  } else {
    return { text: 'Good evening', icon: Moon }
  }
}

/**
 * Establish role-specific messaging to streamline user workflows and provide relevant context.
 * Adapts messaging based on user permissions and responsibilities within the organization.
 *
 * Best for: Multi-role platforms requiring contextual dashboard experiences
 */
function getRoleMessage(role?: string): string {
  const roleMessages: Record<string, string> = {
    admin: "You have full system access - manage members, events, and organization settings",
    chapter_admin: "Manage your chapter's members and events",
    state_admin: "Oversee state chapter operations and member activities",
    member: "Welcome back - explore events, courses, and member benefits"
  }

  return roleMessages[role || 'member'] || roleMessages.member
}

export function PersonalizedGreeting({ userName, userRole, dailyChanges, loading }: PersonalizedGreetingProps) {
  const [greeting, setGreeting] = useState(getGreeting())

  useEffect(() => {
    setGreeting(getGreeting())
  }, [])

  const GreetingIcon = greeting.icon
  const roleMessage = getRoleMessage(userRole)

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/5 via-teal/5 to-accent/5">
        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-8 w-64 bg-muted animate-shimmer rounded" />
            <div className="h-4 w-48 bg-muted animate-shimmer rounded" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 via-teal/5 to-accent/5 border-primary/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <GreetingIcon size={32} weight="duotone" className="text-primary" />
            <div>
              <h2 className="text-2xl font-bold">
                {greeting.text}
                {userName && <span className="text-primary">, {userName}</span>}!
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {roleMessage}
              </p>
            </div>
          </div>
          
          {dailyChanges.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {dailyChanges.map((change, index) => {
                const isPositive = change.isPositive
                const Icon = isPositive ? ArrowUp : ArrowDown
                const colorClass = isPositive ? 'text-teal' : 'text-destructive'
                const bgClass = isPositive ? 'bg-teal/10' : 'bg-destructive/10'

                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bgClass}`}
                  >
                    <Icon size={16} weight="bold" className={colorClass} />
                    <span className="text-sm font-medium text-foreground">
                      {change.label}:
                    </span>
                    <span className={`text-sm font-bold ${colorClass}`}>
                      {isPositive ? '+' : ''}{change.value}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
