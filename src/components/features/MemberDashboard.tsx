import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  Warning,
  X,
  Download,
  CreditCard,
  CalendarDots,
  IdentificationCard,
  PencilSimple,
  CurrencyDollar,
  Buildings,
  UserCircle,
  Certificate,
  TrendUp,
  ChartLine
} from '@phosphor-icons/react'
import type { Member } from '@/lib/types'
import { formatDate } from '@/lib/data-utils'
import { toast } from 'sonner'

interface MemberDashboardProps {
  memberId: string
  onNavigate: (section: string) => void
}

export function MemberDashboard({ memberId, onNavigate }: MemberDashboardProps) {
  const [currentMember, setCurrentMember] = useKV<Member | null>('current-member', null)
  const [annualSavings] = useState(2847)

  useEffect(() => {
    if (!currentMember) {
      const mockMember: Member = {
        id: memberId,
        email: 'john.smith@example.com',
        firstName: 'John',
        lastName: 'Smith',
        memberType: 'individual',
        status: 'active',
        chapterId: 'California',
        joinedDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
        expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        phone: '(555) 123-4567',
        company: 'ABC Insurance Group',
        jobTitle: 'Benefits Consultant',
        designations: ['CLU', 'ChFC'],
        credentials: [
          {
            id: '1',
            name: 'Certified Employee Benefits Specialist (CEBS)',
            issuer: 'NABIP',
            issuedDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          }
        ],
        engagementScore: 87,
        preferences: {
          emailNotifications: true,
          smsNotifications: false,
          newsletterSubscribed: true,
          eventReminders: true,
          marketingEmails: true
        }
      }
      setCurrentMember(mockMember)
    }
  }, [memberId])

  if (!currentMember) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const daysUntilExpiry = Math.ceil(
    (new Date(currentMember.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  const getStatusIcon = () => {
    if (currentMember.status === 'active' && daysUntilExpiry > 30) {
      return <CheckCircle size={32} weight="fill" className="text-teal" />
    } else if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      return <Warning size={32} weight="fill" className="text-accent" />
    } else {
      return <X size={32} weight="fill" className="text-destructive" />
    }
  }

  const getStatusText = () => {
    if (currentMember.status === 'active' && daysUntilExpiry > 30) {
      return { text: 'Active Member', color: 'text-teal' }
    } else if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      return { text: `Expires in ${daysUntilExpiry} days`, color: 'text-accent' }
    } else {
      return { text: 'Membership Lapsed', color: 'text-destructive' }
    }
  }

  const statusInfo = getStatusText()

  const quickActions = [
    {
      label: 'Pay Dues',
      icon: CreditCard,
      action: () => toast.success('Redirecting to payment portal...'),
      variant: 'default' as const,
      highlight: daysUntilExpiry <= 30
    },
    {
      label: 'Register for Event',
      icon: CalendarDots,
      action: () => onNavigate('events'),
      variant: 'outline' as const,
      highlight: false
    },
    {
      label: 'Update My Info',
      icon: PencilSimple,
      action: () => onNavigate('profile'),
      variant: 'outline' as const,
      highlight: false
    },
    {
      label: 'Download Card',
      icon: Download,
      action: () => toast.success('Membership card downloaded!'),
      variant: 'outline' as const,
      highlight: false
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Welcome back, {currentMember.firstName}!</h1>
        <p className="text-muted-foreground">
          Here's your membership overview and quick access to the things you need most.
        </p>
      </div>

      <Card className="p-8 bg-gradient-to-br from-primary via-primary to-[oklch(0.20_0.05_250)]">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border-2 border-white/20 shadow-lg">
            {currentMember.avatarUrl ? (
              <img src={currentMember.avatarUrl} alt={currentMember.firstName} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <UserCircle size={64} weight="duotone" className="text-white" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {currentMember.firstName} {currentMember.lastName}
                </h2>
                <p className="text-white/80 font-medium">
                  Member #{currentMember.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full">
                {getStatusIcon()}
                <span className="text-white font-semibold">{statusInfo.text}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <Buildings size={18} />
                <span>{currentMember.company}</span>
              </div>
              <div className="flex items-center gap-2">
                <IdentificationCard size={18} />
                <span>{currentMember.chapterId} Chapter</span>
              </div>
              {currentMember.designations && currentMember.designations.length > 0 && (
                <div className="flex items-center gap-2">
                  <Certificate size={18} />
                  <span>{currentMember.designations.join(', ')}</span>
                </div>
              )}
            </div>

            {daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
              <div className="mt-4 bg-accent/20 backdrop-blur border border-accent/30 rounded-lg p-3">
                <p className="text-white font-medium text-sm">
                  Your membership expires on {formatDate(currentMember.expiryDate)}. Renew now to maintain your benefits!
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.label}
              variant={action.highlight ? 'default' : action.variant}
              size="lg"
              className={`h-auto flex-col gap-3 p-6 ${action.highlight ? 'bg-accent hover:bg-accent/90 text-accent-foreground ring-2 ring-accent/50 shadow-lg' : ''}`}
              onClick={action.action}
            >
              <Icon size={32} weight="duotone" />
              <span className="font-semibold">{action.label}</span>
            </Button>
          )
        })}
      </div>

      <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <TrendUp size={24} weight="duotone" className="text-accent" />
              Your Benefits at a Glance
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Total savings this year through member-exclusive pricing and discounts
            </p>
            <div className="flex items-baseline gap-2">
              <CurrencyDollar size={32} weight="bold" className="text-accent" />
              <span className="text-5xl font-bold text-accent">{annualSavings.toLocaleString()}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Based on member-only event pricing, resources, and exclusive offers
            </p>
          </div>
          <div className="hidden md:block">
            <ChartLine size={96} weight="duotone" className="text-accent/30" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Engagement Score</span>
              <span className="font-semibold">{currentMember.engagementScore}%</span>
            </div>
            <Progress value={currentMember.engagementScore} className="h-2" />
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <span className="font-medium">{formatDate(currentMember.joinedDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Membership Type</span>
                <Badge variant="secondary" className="capitalize">{currentMember.memberType}</Badge>
              </div>
              {currentMember.credentials && currentMember.credentials.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Credentials</span>
                  <Badge variant="outline" className="bg-teal/10 text-teal border-teal/20">
                    {currentMember.credentials.length}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0">
                <Certificate size={16} weight="duotone" className="text-teal" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Credential Updated</p>
                <p className="text-xs text-muted-foreground">CEBS certification renewed</p>
                <p className="text-xs text-muted-foreground mt-1">2 days ago</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CalendarDots size={16} weight="duotone" className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Event Registration</p>
                <p className="text-xs text-muted-foreground">2024 Annual Conference</p>
                <p className="text-xs text-muted-foreground mt-1">1 week ago</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <PencilSimple size={16} weight="duotone" className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Profile Updated</p>
                <p className="text-xs text-muted-foreground">Contact information changed</p>
                <p className="text-xs text-muted-foreground mt-1">2 weeks ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
