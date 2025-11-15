/**
 * Renewal Reminder Email - Streamline membership renewal process with
 * clear calls-to-action and value reinforcement.
 *
 * Designed for: Automated renewal reminders to reduce lapse rates
 * Best for: Time-sensitive membership retention communications
 */

import { Text, Button, Section, Heading } from '@react-email/components'
import { BaseEmailTemplate } from './BaseEmailTemplate'

interface RenewalReminderProps {
  firstName: string
  lastName: string
  memberType: string
  expiryDate: string
  daysUntilExpiry: number
  renewalAmount: number
  renewalUrl: string
  unsubscribeUrl: string
  preferenceUrl: string
}

export function RenewalReminderTemplate({
  firstName,
  expiryDate,
  daysUntilExpiry,
  renewalAmount,
  renewalUrl,
  unsubscribeUrl,
  preferenceUrl,
}: RenewalReminderProps) {
  const isUrgent = daysUntilExpiry <= 7
  const hasExpired = daysUntilExpiry < 0

  return (
    <BaseEmailTemplate
      previewText={`${hasExpired ? 'Renew your NABIP membership' : `Your membership expires in ${daysUntilExpiry} days`}`}
      unsubscribeUrl={unsubscribeUrl}
      preferenceUrl={preferenceUrl}
    >
      {hasExpired ? (
        <>
          <Heading style={h1Urgent}>Your NABIP Membership Has Expired</Heading>
          <Text style={paragraph}>
            Hi {firstName}, we noticed your NABIP membership expired on{' '}
            <strong>{new Date(expiryDate).toLocaleDateString()}</strong>.
          </Text>
        </>
      ) : (
        <>
          <Heading style={isUrgent ? h1Urgent : h1}>
            {isUrgent
              ? `Your Membership Expires in ${daysUntilExpiry} Days`
              : 'Time to Renew Your NABIP Membership'}
          </Heading>
          <Text style={paragraph}>
            Hi {firstName}, your NABIP membership will expire on{' '}
            <strong>{new Date(expiryDate).toLocaleDateString()}</strong>.
          </Text>
        </>
      )}

      <Section style={renewalBox}>
        <Text style={renewalLabel}>Renewal Amount</Text>
        <Text style={renewalAmount}>${renewalAmount.toFixed(2)}</Text>
        <Button style={button} href={renewalUrl}>
          {hasExpired ? 'Renew Now' : 'Renew My Membership'}
        </Button>
      </Section>

      <Text style={paragraph}>
        Don't lose access to the valuable benefits that support your professional
        growth and business success:
      </Text>

      <ul style={list}>
        <li style={listItem}>
          <strong>Continuing Education:</strong> Maintain your credentials with
          exclusive CE courses
        </li>
        <li style={listItem}>
          <strong>Networking Opportunities:</strong> Connect with industry leaders
          at conferences and events
        </li>
        <li style={listItem}>
          <strong>Legislative Advocacy:</strong> Your voice in insurance policy
          and regulation
        </li>
        <li style={listItem}>
          <strong>Industry Resources:</strong> Research, tools, and insights to
          grow your practice
        </li>
      </ul>

      <Section style={ctaSection}>
        <Text style={paragraph}>
          Renew today to continue enjoying these benefits without interruption.
        </Text>
        <Button style={buttonSecondary} href={renewalUrl}>
          Complete Renewal
        </Button>
      </Section>

      <Text style={helpText}>
        Questions about your renewal? Contact our Member Services team at{' '}
        <a href="mailto:renewals@nabip.org" style={link}>
          renewals@nabip.org
        </a>{' '}
        or call (800) 555-NABIP.
      </Text>
    </BaseEmailTemplate>
  )
}

const h1 = {
  color: '#1e3a5f',
  fontSize: '26px',
  fontWeight: 'bold',
  margin: '0 0 20px',
  lineHeight: '1.3',
}

const h1Urgent = {
  ...h1,
  color: '#dc2626',
}

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
}

const renewalBox = {
  backgroundColor: '#f0f9ff',
  border: '2px solid #3b82f6',
  borderRadius: '8px',
  padding: '32px',
  textAlign: 'center' as const,
  margin: '32px 0',
}

const renewalLabel = {
  color: '#6b7280',
  fontSize: '14px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px',
}

const renewalAmount = {
  color: '#1e3a5f',
  fontSize: '48px',
  fontWeight: 'bold',
  margin: '0 0 24px',
}

const button = {
  backgroundColor: '#1e3a5f',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
}

const buttonSecondary = {
  ...button,
  backgroundColor: '#3b82f6',
}

const list = {
  color: '#525f7f',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '16px 0',
  paddingLeft: '24px',
}

const listItem = {
  marginBottom: '12px',
}

const ctaSection = {
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  textAlign: 'center' as const,
}

const helpText = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '32px 0 0',
}

const link = {
  color: '#1e3a5f',
  textDecoration: 'underline',
}

export default RenewalReminderTemplate
