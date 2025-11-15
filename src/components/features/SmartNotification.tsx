import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Warning, TrendDown, Clock, CheckCircle, Info } from '@phosphor-icons/react'
import { ReactNode } from 'react'

export type NotificationSeverity = 'critical' | 'warning' | 'info' | 'success'

export interface SmartNotificationData {
  id: string
  severity: NotificationSeverity
  title: string
  message: string
  actionLabel: string
  onAction: () => void
  metric?: string
}

interface SmartNotificationProps {
  notification: SmartNotificationData
}

const severityConfig = {
  critical: {
    bgColor: 'bg-destructive/5 border-destructive/20',
    textColor: 'text-destructive',
    icon: Warning,
    iconBg: 'bg-destructive/10',
  },
  warning: {
    bgColor: 'bg-accent/10 border-accent/30',
    textColor: 'text-accent-foreground',
    icon: TrendDown,
    iconBg: 'bg-accent/20',
  },
  info: {
    bgColor: 'bg-primary/5 border-primary/20',
    textColor: 'text-primary',
    icon: Info,
    iconBg: 'bg-primary/10',
  },
  success: {
    bgColor: 'bg-teal/5 border-teal/20',
    textColor: 'text-teal',
    icon: CheckCircle,
    iconBg: 'bg-teal/10',
  },
}

export function SmartNotification({ notification }: SmartNotificationProps) {
  const config = severityConfig[notification.severity]
  const Icon = config.icon

  return (
    <Card className={`p-4 border ${config.bgColor}`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg ${config.iconBg} flex items-center justify-center shrink-0`}>
          <Icon size={20} weight="bold" className={config.textColor} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">{notification.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {notification.message}
          </p>
          {notification.metric && (
            <p className={`text-lg font-bold mt-2 ${config.textColor}`}>
              {notification.metric}
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={notification.onAction}
          className="shrink-0"
        >
          {notification.actionLabel}
        </Button>
      </div>
    </Card>
  )
}

interface SmartNotificationsProps {
  notifications: SmartNotificationData[]
}

export function SmartNotifications({ notifications }: SmartNotificationsProps) {
  if (notifications.length === 0) return null

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <SmartNotification key={notification.id} notification={notification} />
      ))}
    </div>
  )
}
