/**
 * Welcome Email Template - First touchpoint for new NABIP members
 * establishing value and next steps for engagement.
 *
 * Designed for: New member onboarding and activation
 * Best for: Automated welcome series and initial engagement
 */

import { Text, Button, Section, Row, Column, Heading } from '@react-email/components'
import { BaseEmailTemplate } from './BaseEmailTemplate'

interface WelcomeEmailProps {
  firstName: string
  lastName: string
  memberType: string
  chapterName: string
  portalUrl: string
  unsubscribeUrl: string
  preferenceUrl: string
}

export function WelcomeEmailTemplate({
  firstName,
  lastName,
  memberType,
  chapterName,
  portalUrl,
  unsubscribeUrl,
  preferenceUrl,
}: WelcomeEmailProps) {
  return (
    <BaseEmailTemplate
      previewText={`Welcome to NABIP, ${firstName}! Get started with your membership`}
      unsubscribeUrl={unsubscribeUrl}
      preferenceUrl={preferenceUrl}
    >
      <Heading style={h1}>Welcome to NABIP, {firstName}!</Heading>

      <Text style={paragraph}>
        We're thrilled to have you join the National Association of Benefits &
        Insurance Professionals as a <strong>{memberType} member</strong> with{' '}
        <strong>{chapterName}</strong>.
      </Text>

      <Text style={paragraph}>
        Your membership provides access to industry-leading resources,
        professional development opportunities, and a network of over 20,000
        insurance professionals nationwide.
      </Text>

      <Section style={benefitsSection}>
        <Heading style={h2}>Your Member Benefits</Heading>

        <Row style={benefitRow}>
          <Column style={benefitIcon}>✓</Column>
          <Column>
            <Text style={benefitTitle}>Professional Development</Text>
            <Text style={benefitText}>
              Access to CE courses, webinars, and certification programs
            </Text>
          </Column>
        </Row>

        <Row style={benefitRow}>
          <Column style={benefitIcon}>✓</Column>
          <Column>
            <Text style={benefitTitle}>Networking Events</Text>
            <Text style={benefitText}>
              Connect with peers at conferences, chapter meetings, and workshops
            </Text>
          </Column>
        </Row>

        <Row style={benefitRow}>
          <Column style={benefitIcon}>✓</Column>
          <Column>
            <Text style={benefitTitle}>Industry Resources</Text>
            <Text style={benefitText}>
              Exclusive research, legislative updates, and market insights
            </Text>
          </Column>
        </Row>

        <Row style={benefitRow}>
          <Column style={benefitIcon}>✓</Column>
          <Column>
            <Text style={benefitTitle}>Member Discounts</Text>
            <Text style={benefitText}>
              Special pricing on events, education, and partner services
            </Text>
          </Column>
        </Row>
      </Section>

      <Section style={ctaSection}>
        <Heading style={h2}>Get Started</Heading>
        <Text style={paragraph}>
          Complete your profile and explore member resources in your personal
          portal:
        </Text>
        <Button style={button} href={portalUrl}>
          Access Member Portal
        </Button>
      </Section>

      <Section style={nextStepsSection}>
        <Heading style={h3}>Recommended Next Steps</Heading>
        <ol style={list}>
          <li style={listItem}>Complete your member profile</li>
          <li style={listItem}>Join your local chapter's upcoming event</li>
          <li style={listItem}>Explore CE courses in the Learning Center</li>
          <li style={listItem}>Connect with chapter leadership</li>
        </ol>
      </Section>

      <Text style={signoff}>
        Welcome aboard,
        <br />
        <strong>The NABIP Team</strong>
      </Text>

      <Text style={helpText}>
        Questions? Contact us at{' '}
        <a href="mailto:support@nabip.org" style={link}>
          support@nabip.org
        </a>{' '}
        or call (800) 555-NABIP
      </Text>
    </BaseEmailTemplate>
  )
}

// Component-specific styles
const h1 = {
  color: '#1e3a5f',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  lineHeight: '1.3',
}

const h2 = {
  color: '#1e3a5f',
  fontSize: '20px',
  fontWeight: '600',
  margin: '32px 0 16px',
}

const h3 = {
  color: '#1e3a5f',
  fontSize: '16px',
  fontWeight: '600',
  margin: '24px 0 12px',
}

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
}

const benefitsSection = {
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#f6f9fc',
  borderRadius: '8px',
}

const benefitRow = {
  marginBottom: '16px',
}

const benefitIcon = {
  color: '#10b981',
  fontSize: '20px',
  fontWeight: 'bold',
  width: '32px',
  paddingTop: '2px',
}

const benefitTitle = {
  color: '#1e3a5f',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 4px',
}

const benefitText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
  lineHeight: '20px',
}

const ctaSection = {
  margin: '32px 0',
  textAlign: 'center' as const,
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
  padding: '14px 32px',
  margin: '16px 0',
}

const nextStepsSection = {
  margin: '32px 0',
}

const list = {
  color: '#525f7f',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0 0 0',
  paddingLeft: '24px',
}

const listItem = {
  marginBottom: '8px',
}

const signoff = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '32px 0 0',
}

const helpText = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '24px 0 0',
}

const link = {
  color: '#1e3a5f',
  textDecoration: 'underline',
}

// Export for SendGrid dynamic template generation
export const WelcomeEmailTemplatePreview = WelcomeEmailTemplate

export default WelcomeEmailTemplate
