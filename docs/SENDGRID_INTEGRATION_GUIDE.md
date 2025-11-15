# SendGrid Integration Guide for NABIP Email Campaigns

**Establish reliable email delivery infrastructure with SendGrid integration for production-ready email marketing campaigns.**

> **Designed for:** Organizations requiring scalable email delivery with detailed engagement analytics
> **Best for:** Production email campaigns with real-time tracking and compliance management

---

## Table of Contents

1. [SendGrid Account Setup](#sendgrid-account-setup)
2. [API Key Configuration](#api-key-configuration)
3. [Domain Authentication](#domain-authentication)
4. [Dynamic Template Creation](#dynamic-template-creation)
5. [Webhook Configuration](#webhook-configuration)
6. [Environment Variables](#environment-variables)
7. [Testing & Validation](#testing--validation)
8. [Best Practices](#best-practices)

---

## SendGrid Account Setup

### 1. Create SendGrid Account

1. Visit [SendGrid.com](https://sendgrid.com) and sign up
2. Choose appropriate plan:
   - **Free Tier**: 100 emails/day (development/testing)
   - **Essentials**: $19.95/month, 50,000 emails
   - **Pro**: $89.95/month, 100,000+ emails (recommended for production)

3. Verify your email address
4. Complete sender verification

### 2. Account Configuration

Navigate to **Settings → Sender Authentication** and verify:
- ✅ Single Sender Verification (minimum)
- ✅ Domain Authentication (recommended for production)
- ✅ Link Branding

---

## API Key Configuration

### Create API Key with Proper Permissions

1. Navigate to **Settings → API Keys**
2. Click **Create API Key**
3. Name: `NABIP_AMS_Production` (or similar)
4. Select **Restricted Access**
5. Enable these permissions:

```
Mail Send: Full Access
Email Activity: Read Access
Suppressions: Full Access
Stats: Read Access
Webhooks: Full Access
Templates: Full Access
```

6. Copy API key immediately (shown only once)
7. Store securely in environment variables

### Environment Variable Setup

Add to your `.env.local` file:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@nabip.org
SENDGRID_FROM_NAME=NABIP
SENDGRID_REPLY_TO=support@nabip.org

# Webhook Configuration
SENDGRID_WEBHOOK_URL=https://your-domain.com/api/sendgrid/webhook
SENDGRID_WEBHOOK_SIGNING_KEY=your-webhook-signing-key
```

---

## Domain Authentication

**Critical for deliverability and avoiding spam folders**

### 1. Authenticate Your Domain

1. Go to **Settings → Sender Authentication → Domain Authentication**
2. Click **Authenticate Your Domain**
3. Select DNS host (GoDaddy, Cloudflare, etc.)
4. Enter domain: `nabip.org`
5. Advanced Settings:
   - ✅ Use automated security
   - ✅ Use same domain for links

### 2. Add DNS Records

SendGrid will provide DNS records. Add these to your domain's DNS settings:

```dns
Type: CNAME
Host: em1234.nabip.org
Value: u1234567.wl123.sendgrid.net

Type: CNAME
Host: s1._domainkey.nabip.org
Value: s1.domainkey.u1234567.wl123.sendgrid.net

Type: CNAME
Host: s2._domainkey.nabip.org
Value: s2.domainkey.u1234567.wl123.sendgrid.net
```

### 3. Verify DNS Propagation

Wait 24-48 hours for DNS propagation, then click **Verify** in SendGrid dashboard.

✅ **Status should show "Verified"**

---

## Dynamic Template Creation

### 1. Create Base Template

1. Navigate to **Email API → Dynamic Templates**
2. Click **Create Dynamic Template**
3. Name: `NABIP Welcome Email`
4. Click **Add Version**

### 2. Use Design Editor

**Option A: Code Editor (Recommended)**

Use your React Email templates:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{subject}}</title>
</head>
<body>
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <!-- Your email HTML from React Email -->
        <h1>Welcome to NABIP, {{firstName}}!</h1>
        <p>We're thrilled to have you join as a {{memberType}} member.</p>

        <!-- Merge fields available: -->
        <!-- {{firstName}}, {{lastName}}, {{email}}, {{memberType}}, -->
        <!-- {{chapterName}}, {{portalUrl}}, etc. -->
    </div>
</body>
</html>
```

**Option B: Drag & Drop Editor**

Use visual editor for non-technical staff.

### 3. Test Template

Use **Send Test** feature with sample data:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "memberType": "Professional",
  "chapterName": "California State Chapter",
  "portalUrl": "https://nabip.org/portal"
}
```

### 4. Get Template ID

After saving, copy the **Template ID** (e.g., `d-1234567890abcdef`)

Store in your application:

```typescript
const WELCOME_TEMPLATE_ID = 'd-1234567890abcdef'
```

---

## Webhook Configuration

**Enable real-time engagement tracking**

### 1. Create Event Webhook

1. Navigate to **Settings → Mail Settings → Event Webhook**
2. Click **Create New Webhook**
3. Configure:

```
Friendly Name: NABIP AMS Production Webhook
Post URL: https://your-domain.com/api/sendgrid/webhook
HTTP Method: POST
```

### 2. Select Events to Track

Enable these events:

- ✅ **Delivered** - Email successfully delivered to recipient
- ✅ **Opened** - Recipient opened email (requires tracking pixel)
- ✅ **Clicked** - Recipient clicked link (requires click tracking)
- ✅ **Bounced** - Email bounced (hard or soft)
- ✅ **Dropped** - Email dropped (invalid address, suppression list)
- ✅ **Spam Report** - Recipient marked as spam
- ✅ **Unsubscribe** - Recipient clicked unsubscribe link

### 3. Enable Signed Event Webhook

1. Toggle **Signed Event Webhook** to ON
2. Copy the **Verification Key**
3. Store in environment variable: `SENDGRID_WEBHOOK_SIGNING_KEY`

### 4. Test Webhook

Use SendGrid's **Test Your Integration** button to send sample events.

---

## Webhook Handler Implementation

Create API endpoint to receive SendGrid webhooks:

### Next.js API Route Example

```typescript
// app/api/sendgrid/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { EventWebhook, EventWebhookHeader } from '@sendgrid/eventwebhook'

const WEBHOOK_KEY = process.env.SENDGRID_WEBHOOK_SIGNING_KEY!

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const payload = await request.text()
    const signature = request.headers.get(EventWebhookHeader.SIGNATURE())
    const timestamp = request.headers.get(EventWebhookHeader.TIMESTAMP())

    const eventWebhook = new EventWebhook()
    const ecPublicKey = eventWebhook.convertPublicKeyToECDSA(WEBHOOK_KEY)

    const isValid = eventWebhook.verifySignature(
      ecPublicKey,
      payload,
      signature!,
      timestamp!
    )

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Process events
    const events = JSON.parse(payload)

    for (const event of events) {
      await processWebhookEvent(event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

async function processWebhookEvent(event: any) {
  const { email, event: eventType, timestamp, sg_message_id } = event

  // Update campaign_sends table
  // Insert into email_events table
  // Update engagement metrics

  // Example Supabase update:
  const { data, error } = await supabase
    .from('campaign_sends')
    .update({
      [`${eventType}_at`]: new Date(timestamp * 1000).toISOString(),
      status: eventType === 'delivered' ? 'delivered' : undefined,
    })
    .eq('sendgrid_message_id', sg_message_id)
}
```

---

## Environment Variables

Complete `.env.local` configuration:

```bash
# ============================================================================
# SendGrid Email Service Configuration
# ============================================================================

# API Keys
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Sender Information
SENDGRID_FROM_EMAIL=noreply@nabip.org
SENDGRID_FROM_NAME=NABIP
SENDGRID_REPLY_TO=support@nabip.org

# Webhook Configuration
SENDGRID_WEBHOOK_URL=https://your-domain.com/api/sendgrid/webhook
SENDGRID_WEBHOOK_SIGNING_KEY=MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...

# Rate Limiting
SENDGRID_MAX_SENDS_PER_SECOND=10
SENDGRID_BATCH_SIZE=100

# Tracking Settings
SENDGRID_TRACK_OPENS=true
SENDGRID_TRACK_CLICKS=true

# Template IDs (from SendGrid dashboard)
SENDGRID_TEMPLATE_WELCOME=d-1234567890abcdef
SENDGRID_TEMPLATE_RENEWAL=d-abcdef1234567890
SENDGRID_TEMPLATE_EVENT=d-567890abcdef1234

# Optional: IP Pool for dedicated IP
# SENDGRID_IP_POOL=your-ip-pool-name

# Optional: Unsubscribe Groups
SENDGRID_ENABLE_UNSUBSCRIBE_GROUPS=true
```

---

## Testing & Validation

### 1. Test Email Sending

```typescript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

async function testEmailSend() {
  const msg = {
    to: 'test@example.com',
    from: {
      email: process.env.SENDGRID_FROM_EMAIL!,
      name: process.env.SENDGRID_FROM_NAME!,
    },
    subject: 'Test Email',
    templateId: process.env.SENDGRID_TEMPLATE_WELCOME!,
    dynamicTemplateData: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
    },
  }

  try {
    await sgMail.send(msg)
    console.log('✅ Test email sent successfully')
  } catch (error) {
    console.error('❌ Email send failed:', error)
  }
}
```

### 2. Validate Webhook Delivery

Use [webhook.site](https://webhook.site) or [ngrok](https://ngrok.com) for local testing:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use ngrok URL in SendGrid webhook settings
# https://abc123.ngrok.io/api/sendgrid/webhook
```

### 3. Monitor Email Activity

Navigate to **Activity Feed** in SendGrid dashboard to see real-time email events.

---

## Best Practices

### Deliverability

✅ **DO:**
- Authenticate your domain with SPF, DKIM, DMARC
- Maintain clean email lists (remove bounces)
- Warm up new sending domains gradually
- Use consistent from address
- Include plain text version
- Test emails before mass sending

❌ **DON'T:**
- Send from generic domains (gmail.com, yahoo.com)
- Buy email lists
- Use URL shorteners
- Include too many links (>5)
- Use ALL CAPS subject lines
- Send without unsubscribe link

### Compliance

✅ **CAN-SPAM Requirements:**
- Include physical postal address
- Provide clear unsubscribe mechanism
- Honor unsubscribe requests within 10 days
- Don't use deceptive subject lines
- Identify message as advertisement if applicable

✅ **GDPR Requirements:**
- Obtain explicit consent before sending
- Maintain records of consent
- Provide data access/deletion capabilities
- Include privacy policy link

### Performance Optimization

**Rate Limiting:**
```typescript
const BATCH_SIZE = 100
const MAX_SENDS_PER_SECOND = 10

async function sendCampaignBatches(recipients: Member[]) {
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)
    await sendBatch(batch)

    // Throttle to respect rate limits
    await delay(1000 / MAX_SENDS_PER_SECOND)
  }
}
```

**Error Handling:**
```typescript
async function sendWithRetry(message: MailData, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sgMail.send(message)
      return { success: true }
    } catch (error: any) {
      if (attempt === maxRetries) {
        // Log to error tracking service
        console.error('Final send attempt failed:', error)
        return { success: false, error }
      }

      // Exponential backoff
      await delay(Math.pow(2, attempt) * 1000)
    }
  }
}
```

---

## Troubleshooting

### Common Issues

**Issue: Emails going to spam**
- ✅ Verify domain authentication
- ✅ Check email content for spam triggers
- ✅ Ensure consistent sending patterns
- ✅ Monitor spam complaint rate (<0.1%)

**Issue: High bounce rate**
- ✅ Clean email list regularly
- ✅ Remove hard bounces immediately
- ✅ Use double opt-in for new subscribers
- ✅ Validate email addresses before sending

**Issue: Webhook not receiving events**
- ✅ Verify webhook URL is publicly accessible
- ✅ Check webhook signature validation
- ✅ Ensure HTTPS (required for production)
- ✅ Review webhook event history in SendGrid

---

## Support Resources

- **SendGrid Documentation:** https://docs.sendgrid.com
- **Status Page:** https://status.sendgrid.com
- **Support Portal:** https://support.sendgrid.com
- **Community Forum:** https://community.sendgrid.com

---

## Next Steps

1. ✅ Complete domain authentication
2. ✅ Create dynamic templates for all campaign types
3. ✅ Configure webhook endpoint
4. ✅ Test end-to-end email flow
5. ✅ Set up monitoring and alerts
6. ✅ Train team on campaign creation workflow

---

**Need Help?**

Contact NABIP Technical Support:
- Email: tech-support@nabip.org
- Phone: (800) 555-NABIP
- Hours: Monday-Friday, 9 AM - 5 PM ET
