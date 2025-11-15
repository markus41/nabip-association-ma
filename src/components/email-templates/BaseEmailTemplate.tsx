/**
 * Base Email Template - Establishes consistent brand structure for all
 * email communications with responsive design and accessibility.
 *
 * Designed for: Professional email communications with NABIP branding
 * Best for: Foundation for all email template types
 */

import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Img,
  Text,
  Link,
  Hr,
} from '@react-email/components'

interface BaseEmailTemplateProps {
  previewText: string
  children: React.ReactNode
  unsubscribeUrl?: string
  preferenceUrl?: string
}

export function BaseEmailTemplate({
  previewText,
  children,
  unsubscribeUrl,
  preferenceUrl,
}: BaseEmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Row>
              <Column style={headerColumn}>
                <Text style={headerTitle}>NABIP</Text>
                <Text style={headerSubtitle}>
                  National Association of Benefits & Insurance Professionals
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Main Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={hr} />
            <Row>
              <Column>
                <Text style={footerText}>
                  National Association of Benefits & Insurance Professionals
                </Text>
                <Text style={footerText}>
                  1234 Insurance Way, Suite 100 | Washington, DC 20001
                </Text>
                <Text style={footerText}>
                  Phone: (800) 555-NABIP | Email: info@nabip.org
                </Text>
              </Column>
            </Row>

            {/* Social Links */}
            <Row style={socialRow}>
              <Column align="center">
                <Link href="https://linkedin.com/company/nabip" style={socialLink}>
                  LinkedIn
                </Link>
                {' | '}
                <Link href="https://twitter.com/nabip" style={socialLink}>
                  Twitter
                </Link>
                {' | '}
                <Link href="https://facebook.com/nabip" style={socialLink}>
                  Facebook
                </Link>
              </Column>
            </Row>

            {/* Unsubscribe Links */}
            {(unsubscribeUrl || preferenceUrl) && (
              <Row style={unsubscribeRow}>
                <Column align="center">
                  {preferenceUrl && (
                    <Link href={preferenceUrl} style={unsubscribeLink}>
                      Update Email Preferences
                    </Link>
                  )}
                  {preferenceUrl && unsubscribeUrl && ' | '}
                  {unsubscribeUrl && (
                    <Link href={unsubscribeUrl} style={unsubscribeLink}>
                      Unsubscribe
                    </Link>
                  )}
                </Column>
              </Row>
            )}

            <Row>
              <Column align="center">
                <Text style={footerDisclaimer}>
                  This email was sent to you because you are a member of NABIP.
                  If you no longer wish to receive these emails, please use the
                  unsubscribe link above.
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles using inline CSS for email client compatibility
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
}

const header = {
  backgroundColor: '#1e3a5f',
  padding: '24px',
  borderRadius: '8px 8px 0 0',
}

const headerColumn = {
  textAlign: 'center' as const,
}

const headerTitle = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  letterSpacing: '1px',
}

const headerSubtitle = {
  color: '#a0c4db',
  fontSize: '12px',
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const content = {
  backgroundColor: '#ffffff',
  padding: '32px',
}

const footer = {
  backgroundColor: '#ffffff',
  padding: '24px 32px',
  borderRadius: '0 0 8px 8px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '0 0 24px',
}

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '4px 0',
  textAlign: 'center' as const,
}

const socialRow = {
  marginTop: '16px',
}

const socialLink = {
  color: '#1e3a5f',
  fontSize: '12px',
  textDecoration: 'none',
  fontWeight: '500',
}

const unsubscribeRow = {
  marginTop: '16px',
}

const unsubscribeLink = {
  color: '#8898aa',
  fontSize: '11px',
  textDecoration: 'underline',
}

const footerDisclaimer = {
  color: '#aab7c4',
  fontSize: '11px',
  lineHeight: '16px',
  margin: '16px 0 0',
  textAlign: 'center' as const,
}
