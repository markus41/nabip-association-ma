/**
 * Email Template Library - Establish reusable communication templates
 * to streamline member engagement and ensure consistent branding.
 *
 * Designed for: Organizations requiring professional email templates
 * Best for: Automated member communications with dynamic personalization
 *
 * Features:
 * - Five production-ready templates with responsive HTML
 * - SendGrid dynamic template variable support
 * - Merge field definitions for personalization
 * - Template categorization and metadata
 */

import type { EmailTemplate, TemplateMergeField } from './email-types'

/**
 * Template merge field definitions for consistent personalization
 */
export const commonMergeFields: TemplateMergeField[] = [
  {
    key: 'firstName',
    label: 'First Name',
    type: 'text',
    required: true,
    description: 'Member first name',
  },
  {
    key: 'lastName',
    label: 'Last Name',
    type: 'text',
    required: true,
    description: 'Member last name',
  },
  {
    key: 'email',
    label: 'Email Address',
    type: 'text',
    required: true,
    description: 'Member email',
  },
  {
    key: 'memberType',
    label: 'Membership Type',
    type: 'text',
    required: false,
    description: 'Individual, Organizational, Student, or Lifetime',
  },
  {
    key: 'company',
    label: 'Company',
    type: 'text',
    required: false,
    description: 'Member company name',
  },
]

/**
 * Welcome Email Template - First touchpoint for new members
 */
export const welcomeTemplate: EmailTemplate = {
  id: 'tpl-welcome-001',
  name: 'Welcome to NABIP',
  type: 'welcome',
  subject: 'Welcome to NABIP, {{firstName}}!',
  previewText: 'Your membership journey starts here',
  category: 'Onboarding',
  htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f7; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .content h2 { color: #1e3a5f; font-size: 24px; margin-top: 0; }
    .content p { color: #4b5563; line-height: 1.6; font-size: 16px; }
    .cta-button { display: inline-block; background-color: #1e3a5f; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .cta-button:hover { background-color: #2563eb; }
    .benefits { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .benefit-item { display: flex; align-items: start; margin: 15px 0; }
    .benefit-icon { color: #10b981; margin-right: 12px; font-size: 20px; }
    .footer { background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to NABIP!</h1>
    </div>

    <div class="content">
      <h2>Hi {{firstName}},</h2>

      <p>Thank you for joining the National Association of Benefits and Insurance Professionals! We're thrilled to have you as part of our community of 20,000+ insurance professionals.</p>

      <p>Your {{memberType}} membership gives you access to exclusive resources designed to support your professional growth and business success.</p>

      <div class="benefits">
        <h3 style="color: #1e3a5f; margin-top: 0;">Your Member Benefits</h3>
        <div class="benefit-item">
          <span class="benefit-icon">✓</span>
          <span>Access to continuing education courses and CE credits</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">✓</span>
          <span>Exclusive industry events and networking opportunities</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">✓</span>
          <span>Legislative advocacy and compliance resources</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">✓</span>
          <span>Member-only webinars and educational content</span>
        </div>
      </div>

      <p>Get started by completing your member profile and exploring our learning platform:</p>

      <a href="https://nabip.org/member-portal" class="cta-button">Access Member Portal</a>

      <p>If you have any questions, our member support team is here to help at <a href="mailto:support@nabip.org" style="color: #2563eb;">support@nabip.org</a>.</p>

      <p>Welcome aboard!</p>
      <p><strong>The NABIP Team</strong></p>
    </div>

    <div class="footer">
      <p>National Association of Benefits and Insurance Professionals</p>
      <p>© 2024 NABIP. All rights reserved.</p>
      <p><a href="{{unsubscribeUrl}}" style="color: #6b7280;">Manage Email Preferences</a></p>
    </div>
  </div>
</body>
</html>
  `,
  plainTextContent: 'Welcome to NABIP, {{firstName}}! Your membership journey starts here...',
  mergeFields: [
    ...commonMergeFields,
    {
      key: 'unsubscribeUrl',
      label: 'Unsubscribe URL',
      type: 'url',
      required: true,
      description: 'Preference center link',
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
  isActive: true,
}

/**
 * Event Invitation Template - Drive event registrations
 */
export const eventInvitationTemplate: EmailTemplate = {
  id: 'tpl-event-001',
  name: 'Event Invitation',
  type: 'event_invitation',
  subject: "You're Invited: {{eventName}}",
  previewText: 'Join us for an exclusive member event',
  category: 'Events',
  htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f7; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .hero { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 50px 30px; text-align: center; color: #ffffff; }
    .hero h1 { margin: 0; font-size: 32px; font-weight: 700; }
    .hero .date { font-size: 18px; margin-top: 10px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .event-details { background-color: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0; }
    .detail-row { display: flex; margin: 12px 0; align-items: start; }
    .detail-icon { color: #10b981; margin-right: 12px; font-weight: bold; }
    .cta-button { display: inline-block; background-color: #10b981; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 25px 0; font-size: 18px; }
    .cta-button:hover { background-color: #059669; }
    .footer { background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <h1>{{eventName}}</h1>
      <div class="date">{{eventDate}} | {{eventLocation}}</div>
    </div>

    <div class="content">
      <p>Dear {{firstName}},</p>

      <p>You're invited to join fellow NABIP members for an exclusive event designed to enhance your professional knowledge and expand your network.</p>

      <div class="event-details">
        <h3 style="margin-top: 0; color: #1e3a5f;">Event Details</h3>
        <div class="detail-row">
          <span class="detail-icon">📅</span>
          <span><strong>Date:</strong> {{eventDate}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-icon">⏰</span>
          <span><strong>Time:</strong> {{eventTime}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-icon">📍</span>
          <span><strong>Location:</strong> {{eventLocation}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-icon">🎓</span>
          <span><strong>CE Credits:</strong> {{ceCredits}} credits available</span>
        </div>
      </div>

      <p><strong>What You'll Learn:</strong></p>
      <p>{{eventDescription}}</p>

      <p>Space is limited. Reserve your spot today!</p>

      <div style="text-align: center;">
        <a href="{{registrationUrl}}" class="cta-button">Register Now</a>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">Member Rate: {{memberPrice}} | Non-Member Rate: {{nonMemberPrice}}</p>
    </div>

    <div class="footer">
      <p>Questions? Contact us at <a href="mailto:events@nabip.org" style="color: #10b981;">events@nabip.org</a></p>
      <p><a href="{{unsubscribeUrl}}" style="color: #6b7280;">Manage Email Preferences</a></p>
    </div>
  </div>
</body>
</html>
  `,
  plainTextContent: "You're invited to {{eventName}} on {{eventDate}}...",
  mergeFields: [
    ...commonMergeFields,
    {
      key: 'eventName',
      label: 'Event Name',
      type: 'text',
      required: true,
      description: 'Name of the event',
    },
    {
      key: 'eventDate',
      label: 'Event Date',
      type: 'date',
      required: true,
      description: 'Event date',
    },
    {
      key: 'eventTime',
      label: 'Event Time',
      type: 'text',
      required: true,
      description: 'Event start time',
    },
    {
      key: 'eventLocation',
      label: 'Event Location',
      type: 'text',
      required: true,
      description: 'Event venue or virtual platform',
    },
    {
      key: 'eventDescription',
      label: 'Event Description',
      type: 'text',
      required: true,
      description: 'Brief event description',
    },
    {
      key: 'ceCredits',
      label: 'CE Credits',
      type: 'number',
      required: false,
      defaultValue: '0',
      description: 'Continuing education credits',
    },
    {
      key: 'memberPrice',
      label: 'Member Price',
      type: 'text',
      required: true,
      description: 'Member registration price',
    },
    {
      key: 'nonMemberPrice',
      label: 'Non-Member Price',
      type: 'text',
      required: true,
      description: 'Non-member registration price',
    },
    {
      key: 'registrationUrl',
      label: 'Registration URL',
      type: 'url',
      required: true,
      description: 'Event registration link',
    },
    {
      key: 'unsubscribeUrl',
      label: 'Unsubscribe URL',
      type: 'url',
      required: true,
      description: 'Preference center link',
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
  isActive: true,
}

/**
 * Newsletter Template - Monthly member updates
 */
export const newsletterTemplate: EmailTemplate = {
  id: 'tpl-newsletter-001',
  name: 'Monthly Newsletter',
  type: 'newsletter',
  subject: 'NABIP Insider: {{monthYear}} Edition',
  previewText: 'Industry news, events, and member spotlights',
  category: 'Communications',
  htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f7; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #1e3a5f; padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
    .header .subtitle { color: #d1d5db; margin-top: 8px; font-size: 16px; }
    .content { padding: 40px 30px; }
    .article { margin-bottom: 35px; padding-bottom: 25px; border-bottom: 1px solid #e5e7eb; }
    .article:last-child { border-bottom: none; }
    .article h2 { color: #1e3a5f; font-size: 22px; margin-top: 0; }
    .article p { color: #4b5563; line-height: 1.6; }
    .read-more { color: #2563eb; text-decoration: none; font-weight: 600; }
    .cta-box { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 25px; border-radius: 8px; text-align: center; color: #ffffff; margin: 30px 0; }
    .cta-box h3 { margin-top: 0; font-size: 20px; }
    .cta-button { display: inline-block; background-color: #ffffff; color: #f59e0b; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 15px; }
    .footer { background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NABIP Insider</h1>
      <div class="subtitle">{{monthYear}} Edition</div>
    </div>

    <div class="content">
      <p>Hello {{firstName}},</p>

      <p>Welcome to this month's edition of NABIP Insider, featuring the latest industry news, upcoming events, and professional development opportunities.</p>

      <div class="article">
        <h2>{{headlineTitle1}}</h2>
        <p>{{headlineExcerpt1}}</p>
        <a href="{{headlineUrl1}}" class="read-more">Read More →</a>
      </div>

      <div class="article">
        <h2>{{headlineTitle2}}</h2>
        <p>{{headlineExcerpt2}}</p>
        <a href="{{headlineUrl2}}" class="read-more">Read More →</a>
      </div>

      <div class="cta-box">
        <h3>📚 New CE Course Available</h3>
        <p style="margin: 10px 0;">{{courseTitle}} - Earn {{courseCredits}} CE credits</p>
        <a href="{{courseUrl}}" class="cta-button">Enroll Now</a>
      </div>

      <div class="article">
        <h2>Upcoming Events</h2>
        <p><strong>{{upcomingEvent1}}</strong><br>{{upcomingEventDate1}}</p>
        <p><strong>{{upcomingEvent2}}</strong><br>{{upcomingEventDate2}}</p>
        <a href="{{eventsUrl}}" class="read-more">View All Events →</a>
      </div>
    </div>

    <div class="footer">
      <p>National Association of Benefits and Insurance Professionals</p>
      <p><a href="{{unsubscribeUrl}}" style="color: #6b7280;">Manage Email Preferences</a></p>
    </div>
  </div>
</body>
</html>
  `,
  plainTextContent: 'NABIP Insider - {{monthYear}} Edition...',
  mergeFields: [
    ...commonMergeFields,
    {
      key: 'monthYear',
      label: 'Month & Year',
      type: 'text',
      required: true,
      defaultValue: 'January 2024',
      description: 'Newsletter issue month and year',
    },
    {
      key: 'headlineTitle1',
      label: 'Headline 1 Title',
      type: 'text',
      required: true,
      description: 'First article headline',
    },
    {
      key: 'headlineExcerpt1',
      label: 'Headline 1 Excerpt',
      type: 'text',
      required: true,
      description: 'First article excerpt',
    },
    {
      key: 'headlineUrl1',
      label: 'Headline 1 URL',
      type: 'url',
      required: true,
      description: 'First article link',
    },
    {
      key: 'headlineTitle2',
      label: 'Headline 2 Title',
      type: 'text',
      required: true,
      description: 'Second article headline',
    },
    {
      key: 'headlineExcerpt2',
      label: 'Headline 2 Excerpt',
      type: 'text',
      required: true,
      description: 'Second article excerpt',
    },
    {
      key: 'headlineUrl2',
      label: 'Headline 2 URL',
      type: 'url',
      required: true,
      description: 'Second article link',
    },
    {
      key: 'courseTitle',
      label: 'Course Title',
      type: 'text',
      required: false,
      description: 'Featured course name',
    },
    {
      key: 'courseCredits',
      label: 'Course Credits',
      type: 'number',
      required: false,
      description: 'CE credits for featured course',
    },
    {
      key: 'courseUrl',
      label: 'Course URL',
      type: 'url',
      required: false,
      description: 'Featured course enrollment link',
    },
    {
      key: 'upcomingEvent1',
      label: 'Upcoming Event 1',
      type: 'text',
      required: false,
      description: 'First upcoming event name',
    },
    {
      key: 'upcomingEventDate1',
      label: 'Event 1 Date',
      type: 'text',
      required: false,
      description: 'First event date',
    },
    {
      key: 'upcomingEvent2',
      label: 'Upcoming Event 2',
      type: 'text',
      required: false,
      description: 'Second upcoming event name',
    },
    {
      key: 'upcomingEventDate2',
      label: 'Event 2 Date',
      type: 'text',
      required: false,
      description: 'Second event date',
    },
    {
      key: 'eventsUrl',
      label: 'Events URL',
      type: 'url',
      required: true,
      description: 'Events calendar link',
    },
    {
      key: 'unsubscribeUrl',
      label: 'Unsubscribe URL',
      type: 'url',
      required: true,
      description: 'Preference center link',
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
  isActive: true,
}

/**
 * Renewal Reminder Template - Drive membership renewals
 */
export const renewalReminderTemplate: EmailTemplate = {
  id: 'tpl-renewal-001',
  name: 'Membership Renewal Reminder',
  type: 'renewal_reminder',
  subject: '⏰ Your NABIP Membership Expires in {{daysUntilExpiry}} Days',
  previewText: 'Renew now to continue your member benefits',
  category: 'Renewals',
  htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f7; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .alert-banner { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px 30px; }
    .alert-banner strong { color: #92400e; font-size: 18px; }
    .content { padding: 40px 30px; }
    .expiry-box { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; padding: 30px; border-radius: 8px; text-align: center; margin: 25px 0; }
    .expiry-box .days { font-size: 48px; font-weight: 700; margin: 10px 0; }
    .expiry-box .label { font-size: 18px; opacity: 0.95; }
    .benefits-list { background-color: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0; }
    .benefit { margin: 12px 0; display: flex; align-items: start; }
    .benefit-icon { color: #10b981; margin-right: 10px; font-size: 18px; }
    .cta-button { display: inline-block; background-color: #1e3a5f; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 25px 0; font-size: 18px; }
    .cta-button:hover { background-color: #2563eb; }
    .pricing { text-align: center; margin: 30px 0; }
    .price { font-size: 36px; font-weight: 700; color: #1e3a5f; }
    .footer { background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="alert-banner">
      <strong>⚠️ Action Required: Membership Expiring Soon</strong>
    </div>

    <div class="content">
      <h1 style="color: #1e3a5f;">Don't Lose Your Member Benefits</h1>

      <p>Dear {{firstName}},</p>

      <p>Your NABIP {{memberType}} membership is set to expire soon. Don't miss out on the valuable benefits that support your professional success.</p>

      <div class="expiry-box">
        <div class="label">Your Membership Expires In</div>
        <div class="days">{{daysUntilExpiry}}</div>
        <div class="label">Days</div>
        <div style="margin-top: 15px; font-size: 16px;">Expiration Date: {{expirationDate}}</div>
      </div>

      <div class="benefits-list">
        <h3 style="margin-top: 0; color: #1e3a5f;">What You'll Keep With Renewal:</h3>
        <div class="benefit">
          <span class="benefit-icon">✓</span>
          <span>Unlimited access to CE courses and certifications</span>
        </div>
        <div class="benefit">
          <span class="benefit-icon">✓</span>
          <span>Exclusive member pricing on events and conferences</span>
        </div>
        <div class="benefit">
          <span class="benefit-icon">✓</span>
          <span>Legislative advocacy and industry updates</span>
        </div>
        <div class="benefit">
          <span class="benefit-icon">✓</span>
          <span>Networking with 20,000+ industry professionals</span>
        </div>
        <div class="benefit">
          <span class="benefit-icon">✓</span>
          <span>Marketing resources and business tools</span>
        </div>
      </div>

      <div class="pricing">
        <div class="price">{{renewalPrice}}</div>
        <div style="color: #6b7280; margin-top: 5px;">Annual {{memberType}} Membership</div>
      </div>

      <div style="text-align: center;">
        <a href="{{renewalUrl}}" class="cta-button">Renew My Membership</a>
      </div>

      <p style="margin-top: 30px;">Questions about your renewal? Contact our membership team at <a href="mailto:membership@nabip.org" style="color: #2563eb;">membership@nabip.org</a> or call {{supportPhone}}.</p>

      <p><strong>Thank you for your continued support of NABIP!</strong></p>
    </div>

    <div class="footer">
      <p>National Association of Benefits and Insurance Professionals</p>
      <p><a href="{{unsubscribeUrl}}" style="color: #6b7280;">Manage Email Preferences</a></p>
    </div>
  </div>
</body>
</html>
  `,
  plainTextContent: 'Your NABIP membership expires in {{daysUntilExpiry}} days...',
  mergeFields: [
    ...commonMergeFields,
    {
      key: 'daysUntilExpiry',
      label: 'Days Until Expiry',
      type: 'number',
      required: true,
      description: 'Days remaining until membership expires',
    },
    {
      key: 'expirationDate',
      label: 'Expiration Date',
      type: 'date',
      required: true,
      description: 'Membership expiration date',
    },
    {
      key: 'renewalPrice',
      label: 'Renewal Price',
      type: 'text',
      required: true,
      defaultValue: '$199',
      description: 'Annual renewal price',
    },
    {
      key: 'renewalUrl',
      label: 'Renewal URL',
      type: 'url',
      required: true,
      description: 'Membership renewal link',
    },
    {
      key: 'supportPhone',
      label: 'Support Phone',
      type: 'text',
      required: false,
      defaultValue: '1-800-XXX-XXXX',
      description: 'Support phone number',
    },
    {
      key: 'unsubscribeUrl',
      label: 'Unsubscribe URL',
      type: 'url',
      required: true,
      description: 'Preference center link',
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
  isActive: true,
}

/**
 * Thank You Template - Post-purchase confirmation
 */
export const thankYouTemplate: EmailTemplate = {
  id: 'tpl-thankyou-001',
  name: 'Thank You - Payment Received',
  type: 'payment_receipt',
  subject: 'Thank You for Your Payment - Receipt #{{transactionId}}',
  previewText: 'Your payment has been processed successfully',
  category: 'Transactional',
  htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f7; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .success-banner { background-color: #d1fae5; padding: 25px 30px; text-align: center; border-bottom: 3px solid #10b981; }
    .success-banner .icon { font-size: 48px; margin-bottom: 10px; }
    .success-banner h1 { color: #065f46; margin: 0; font-size: 24px; }
    .content { padding: 40px 30px; }
    .receipt-box { background-color: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #e5e7eb; }
    .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .receipt-row:last-child { border-bottom: none; font-weight: 700; font-size: 18px; color: #1e3a5f; }
    .receipt-label { color: #6b7280; }
    .receipt-value { color: #1f2937; font-weight: 500; }
    .cta-button { display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .info-box { background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 25px 0; }
    .footer { background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-banner">
      <div class="icon">✅</div>
      <h1>Payment Received</h1>
    </div>

    <div class="content">
      <p>Dear {{firstName}},</p>

      <p>Thank you for your payment! This email confirms that we have successfully processed your transaction.</p>

      <div class="receipt-box">
        <h3 style="margin-top: 0; color: #1e3a5f;">Payment Receipt</h3>
        <div class="receipt-row">
          <span class="receipt-label">Transaction ID</span>
          <span class="receipt-value">{{transactionId}}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Date</span>
          <span class="receipt-value">{{transactionDate}}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Description</span>
          <span class="receipt-value">{{description}}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Payment Method</span>
          <span class="receipt-value">{{paymentMethod}}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-label">Amount Paid</span>
          <span class="receipt-value">{{amount}}</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="{{invoiceUrl}}" class="cta-button">Download Invoice</a>
      </div>

      <div class="info-box">
        <strong>📧 Keep This Email For Your Records</strong>
        <p style="margin: 10px 0 0 0; font-size: 14px;">This serves as your official receipt. You can also access this invoice anytime from your member portal.</p>
      </div>

      <p>If you have any questions about this transaction, please don't hesitate to contact our billing team at <a href="mailto:billing@nabip.org" style="color: #2563eb;">billing@nabip.org</a>.</p>

      <p>Thank you for being a valued member of NABIP!</p>

      <p><strong>The NABIP Team</strong></p>
    </div>

    <div class="footer">
      <p>National Association of Benefits and Insurance Professionals</p>
      <p>This is an automated receipt. Please do not reply to this email.</p>
      <p><a href="{{unsubscribeUrl}}" style="color: #6b7280;">Manage Email Preferences</a></p>
    </div>
  </div>
</body>
</html>
  `,
  plainTextContent: 'Payment Received - Receipt #{{transactionId}}...',
  mergeFields: [
    ...commonMergeFields,
    {
      key: 'transactionId',
      label: 'Transaction ID',
      type: 'text',
      required: true,
      description: 'Unique transaction identifier',
    },
    {
      key: 'transactionDate',
      label: 'Transaction Date',
      type: 'date',
      required: true,
      description: 'Payment date',
    },
    {
      key: 'description',
      label: 'Description',
      type: 'text',
      required: true,
      description: 'Payment description',
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      type: 'text',
      required: true,
      description: 'Payment method used',
    },
    {
      key: 'amount',
      label: 'Amount',
      type: 'text',
      required: true,
      description: 'Payment amount',
    },
    {
      key: 'invoiceUrl',
      label: 'Invoice URL',
      type: 'url',
      required: true,
      description: 'Invoice download link',
    },
    {
      key: 'unsubscribeUrl',
      label: 'Unsubscribe URL',
      type: 'url',
      required: true,
      description: 'Preference center link',
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
  isActive: true,
}

/**
 * All available templates collection
 */
export const emailTemplates: EmailTemplate[] = [
  welcomeTemplate,
  eventInvitationTemplate,
  newsletterTemplate,
  renewalReminderTemplate,
  thankYouTemplate,
]

/**
 * Get template by ID
 */
export function getTemplateById(id: string): EmailTemplate | undefined {
  return emailTemplates.find((t) => t.id === id)
}

/**
 * Get templates by type
 */
export function getTemplatesByType(
  type: EmailTemplate['type']
): EmailTemplate[] {
  return emailTemplates.filter((t) => t.type === type)
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): EmailTemplate[] {
  return emailTemplates.filter((t) => t.category === category)
}

/**
 * Get all active templates
 */
export function getActiveTemplates(): EmailTemplate[] {
  return emailTemplates.filter((t) => t.isActive)
}
