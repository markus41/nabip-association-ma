# Third-Party Integration Architecture
**NABIP Association Management System**

> **Mission**: Establish scalable, secure integration framework to streamline external service connectivity across payment processing, communications, semantic search, and authentication—supporting sustainable multi-team operations and measurable business outcomes.

---

## Table of Contents
- [Executive Summary](#executive-summary)
- [Integration Overview](#integration-overview)
- [Security Architecture](#security-architecture)
- [Integration Patterns](#integration-patterns)
- [Monitoring & Observability](#monitoring--observability)
- [Deployment Guide](#deployment-guide)

---

## Executive Summary

### Business Value Proposition
This integration framework establishes reliable data exchange patterns that:
- **Streamline Payment Processing**: Automated Stripe integration for subscriptions, invoicing, and revenue tracking
- **Improve Member Communications**: Scalable SendGrid delivery with campaign analytics and deliverability monitoring
- **Drive Content Discovery**: Semantic search via Pinecone/pgvector enabling intelligent member resource matching
- **Secure Access Control**: OAuth SSO integration supporting Google, Microsoft, LinkedIn for frictionless authentication

### Best For
- Organizations managing 20,000+ members with complex payment workflows
- Multi-chapter associations requiring centralized communication infrastructure
- Teams scaling AI-powered content discovery and personalization
- Enterprises demanding enterprise-grade security and compliance (SOC2, GDPR)

### Success Metrics
- Payment processing reliability: 99.9% uptime with <500ms latency
- Email deliverability: >98% inbox placement rate
- Search relevance: >85% accuracy on member resource queries
- SSO adoption: >70% member authentication via OAuth providers

---

## Integration Overview

### Supported Integrations

#### 1. Stripe Payment Infrastructure
**Purpose**: Establish scalable payment processing for membership dues, event registrations, and recurring subscriptions

**Capabilities**:
- Customer lifecycle management (creation, updates, deactivation)
- Subscription billing with automated renewal and dunning workflows
- Invoice generation with configurable payment terms
- Webhook event processing for real-time status synchronization
- Dispute handling and refund automation

**Data Flow**:
```
NABIP Member → Stripe Customer
Membership Tier → Stripe Product/Price
Recurring Dues → Stripe Subscription
Event Registration → Stripe Payment Intent
Invoice → Stripe Invoice
```

**Performance Characteristics**:
- Request rate: 100 req/sec (Stripe API limits)
- Webhook processing: <2 seconds from event creation to database sync
- Retry strategy: Exponential backoff (1s, 2s, 4s, 8s, 16s max)

#### 2. SendGrid Email Delivery
**Purpose**: Streamline transactional and marketing email delivery with comprehensive deliverability analytics

**Capabilities**:
- Template-based email composition with dynamic personalization
- Campaign segmentation using member attributes and engagement data
- Real-time event tracking (opens, clicks, bounces, unsubscribes)
- Suppression list management for compliance (CAN-SPAM, GDPR)
- A/B testing for subject lines and content optimization

**Email Categories**:
- Transactional: Welcome emails, password resets, receipts, renewal reminders
- Campaigns: Newsletters, event announcements, chapter updates
- Operational: System notifications, admin alerts

**Performance Characteristics**:
- Send rate: 10,000 emails/hour (SendGrid tier-dependent)
- Delivery latency: <30 seconds (95th percentile)
- Event webhook processing: <1 second

#### 3. Pinecone Vector Search (with pgvector Alternative)
**Purpose**: Drive intelligent content discovery through semantic search across member resources, course catalogs, and knowledge base

**Capabilities**:
- Embedding generation via OpenAI text-embedding-3-small
- Hybrid search combining semantic similarity and keyword matching
- Real-time index updates on content creation/modification
- Multi-tenant namespacing for chapter-specific content isolation
- Metadata filtering for precise result scoping

**Search Use Cases**:
- Member resource matching based on professional interests
- Course recommendations aligned with career development goals
- Knowledge base article retrieval for member support queries

**Architecture Comparison**:

| Feature | Pinecone (Managed) | pgvector (Supabase) |
|---------|-------------------|---------------------|
| Setup Complexity | Low (API-first) | Medium (PostgreSQL extension) |
| Scaling | Automatic | Manual (index tuning required) |
| Cost | Usage-based ($70-500/mo) | Compute-based (included in Supabase tier) |
| Latency | <50ms (p95) | <100ms (p95, optimized) |
| Best For | Teams prioritizing managed infrastructure | Cost-conscious deployments with DB expertise |

**Recommendation**: Start with pgvector for cost efficiency; migrate to Pinecone if query volume exceeds 1M/month or latency requirements tighten.

#### 4. OpenAI Embeddings Generation
**Purpose**: Support semantic search and AI-powered content recommendations through high-quality text embeddings

**Capabilities**:
- text-embedding-3-small model (1536 dimensions, $0.02/1M tokens)
- Batch processing for cost optimization (up to 100 texts per request)
- Rate limiting with queue management (3,000 RPM limit)
- Embedding caching to minimize redundant API calls

**Performance Characteristics**:
- Latency: <200ms per batch (100 texts)
- Cost: ~$5/month for 100,000 member resource embeddings
- Cache hit rate: >80% in steady-state operations

#### 5. OAuth SSO Providers
**Purpose**: Streamline member authentication through trusted identity providers, improving security and user experience

**Supported Providers**:
- Google Workspace (best for organizational email-based access)
- Microsoft Azure AD (enterprise SSO integration)
- LinkedIn (professional network verification)

**Capabilities**:
- PKCE flow for secure authorization code exchange
- Token refresh automation with expiry management
- Profile data synchronization (email, name, photo)
- Account linking with existing email-based members

**Security Features**:
- State parameter validation to prevent CSRF attacks
- Nonce verification for OpenID Connect flows
- Token storage using httpOnly secure cookies
- Session timeout with inactivity detection (30 minutes)

---

## Security Architecture

### Credential Management Strategy

#### Supabase Vault Integration
All sensitive credentials encrypted at rest using Supabase Vault:

```sql
-- Store API key securely in Vault
SELECT vault.create_secret(
  'STRIPE_API_KEY',
  'sk_live_xxxxxxxxxxxxx',
  'Production Stripe API key for payment processing'
);

-- Retrieve credential for secure use
SELECT decrypted_secret
FROM vault.decrypted_secrets
WHERE name = 'STRIPE_API_KEY';
```

**Rotation Policy**:
- API keys rotated quarterly (minimum)
- Webhook secrets rotated after any security incident
- OAuth client secrets rotated semi-annually
- Automated rotation notifications via SendGrid

#### Environment Variable Configuration
Development and staging environments use `.env.local` (excluded from version control):

```bash
# Stripe Configuration
STRIPE_API_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Pinecone Configuration (optional)
PINECONE_API_KEY=xxxxxxxxxxxxx
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=nabip-ams-production

# OAuth Providers
GOOGLE_CLIENT_ID=xxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
MICROSOFT_CLIENT_ID=xxxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET=xxxxxxxxxxxxx
LINKEDIN_CLIENT_ID=xxxxxxxxxxxxx
LINKEDIN_CLIENT_SECRET=xxxxxxxxxxxxx
```

### Webhook Security

#### Signature Verification
All webhook handlers implement cryptographic signature validation:

**Stripe Webhook Verification**:
```typescript
import { stripe } from '@/lib/integrations/stripe/client'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!

  try {
    // Verify webhook signature to prevent spoofing attacks
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    // Process verified event
    await handleStripeEvent(event)

    return new Response('Success', { status: 200 })
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Forbidden', { status: 403 })
  }
}
```

**SendGrid Event Verification**:
```typescript
import crypto from 'crypto'

function verifyWebhook(req: Request): boolean {
  const signature = req.headers.get('X-Twilio-Email-Event-Webhook-Signature')
  const timestamp = req.headers.get('X-Twilio-Email-Event-Webhook-Timestamp')

  const payload = timestamp + req.body
  const expectedSignature = crypto
    .createHmac('sha256', process.env.SENDGRID_WEBHOOK_VERIFICATION_KEY!)
    .update(payload)
    .digest('base64')

  return signature === expectedSignature
}
```

### Rate Limiting & Abuse Prevention

#### Request Throttling
Implemented via Vercel Edge Middleware with Redis (Upstash):

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true,
})

export async function middleware(req: Request) {
  const identifier = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier)

  if (!success) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      }
    })
  }

  return NextResponse.next()
}
```

#### Circuit Breaker Pattern
Prevents cascade failures from third-party service degradation:

```typescript
class CircuitBreaker {
  private failureCount = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private lastFailureTime?: number

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime! > 60000) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failureCount = 0
    this.state = 'closed'
  }

  private onFailure() {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= 5) {
      this.state = 'open'
    }
  }
}
```

---

## Integration Patterns

### 1. Retry Strategy with Exponential Backoff

All external API calls implement resilient retry logic:

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1
      const isRetryableError = isTransientError(error)

      if (isLastAttempt || !isRetryableError) {
        throw error
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      await sleep(delay)
    }
  }

  throw new Error('Max retries exceeded')
}

function isTransientError(error: any): boolean {
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504]
  return retryableStatusCodes.includes(error.statusCode)
}
```

### 2. Idempotent Operations

Ensure safe retry behavior using idempotency keys:

```typescript
async function createStripeCustomer(member: Member) {
  const idempotencyKey = `customer-${member.id}-${Date.now()}`

  return await stripe.customers.create(
    {
      email: member.email,
      name: `${member.firstName} ${member.lastName}`,
      metadata: {
        nabip_member_id: member.id,
        chapter_id: member.chapterId,
      }
    },
    {
      idempotencyKey, // Prevents duplicate customer creation on retry
    }
  )
}
```

### 3. Event-Driven Synchronization

Webhook events trigger database state updates:

```typescript
async function handleStripeEvent(event: Stripe.Event) {
  // Log all incoming events for audit trail
  await supabase.from('integration_events').insert({
    integration_id: STRIPE_INTEGRATION_ID,
    event_type: event.type,
    payload: event.data,
    status: 'processing',
  })

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await syncSubscription(event.data.object)
        break
      case 'customer.subscription.updated':
        await updateSubscription(event.data.object)
        break
      case 'invoice.paid':
        await recordPayment(event.data.object)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailure(event.data.object)
        break
    }

    // Mark event as processed
    await updateEventStatus(event.id, 'completed')
  } catch (error) {
    await updateEventStatus(event.id, 'failed', error.message)
    throw error
  }
}
```

---

## Monitoring & Observability

### Health Check Endpoints

Monitor integration availability via standardized health checks:

```typescript
// app/api/health/integrations/route.ts
export async function GET() {
  const healthChecks = await Promise.allSettled([
    checkStripeHealth(),
    checkSendGridHealth(),
    checkPineconeHealth(),
    checkOpenAIHealth(),
  ])

  const results = {
    stripe: healthChecks[0],
    sendgrid: healthChecks[1],
    pinecone: healthChecks[2],
    openai: healthChecks[3],
    timestamp: new Date().toISOString(),
  }

  const allHealthy = healthChecks.every(check => check.status === 'fulfilled')

  return Response.json(results, {
    status: allHealthy ? 200 : 503
  })
}
```

### Metrics Collection

Track integration performance using Vercel Analytics:

```typescript
import { track } from '@vercel/analytics'

async function trackIntegrationMetric(
  provider: string,
  operation: string,
  duration: number,
  success: boolean
) {
  track('integration_operation', {
    provider,
    operation,
    duration_ms: duration,
    success,
    timestamp: Date.now(),
  })

  // Also store in Supabase for historical analysis
  await supabase.from('integration_metrics').insert({
    provider,
    operation,
    duration_ms: duration,
    success,
  })
}
```

### Alert Configuration

Proactive notification for integration failures:

```typescript
async function sendIntegrationAlert(
  integration: string,
  severity: 'warning' | 'critical',
  message: string
) {
  // Send email via SendGrid
  await sendgrid.send({
    to: 'operations@nabip.org',
    from: 'alerts@nabip.org',
    subject: `[${severity.toUpperCase()}] Integration Alert: ${integration}`,
    text: message,
  })

  // Log to audit trail
  await supabase.from('integration_alerts').insert({
    integration,
    severity,
    message,
    timestamp: new Date().toISOString(),
  })
}
```

### Alerting Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Error Rate | >5% | >10% | Investigate integration logs |
| Latency (p95) | >2s | >5s | Review rate limiting, consider circuit breaker |
| Webhook Failures | >10/hour | >50/hour | Verify signature secrets, check endpoint availability |
| Rate Limit Hits | >100/hour | >500/hour | Implement request queuing or upgrade tier |

---

## Deployment Guide

### Prerequisites

1. **Supabase Project Setup**
   - Create production project at https://app.supabase.com
   - Enable Vault extension for credential encryption
   - Configure Row Level Security (RLS) policies

2. **Third-Party Service Accounts**
   - Stripe: Create account, obtain API keys from https://dashboard.stripe.com
   - SendGrid: Register account, generate API key from https://app.sendgrid.com
   - OpenAI: Create API key at https://platform.openai.com
   - Pinecone (optional): Sign up at https://www.pinecone.io
   - OAuth Providers: Register applications for each SSO provider

3. **Vercel Project Configuration**
   - Link repository to Vercel project
   - Configure environment variables in project settings
   - Enable Edge Middleware for rate limiting

### Installation Steps

#### Step 1: Database Schema Deployment

```bash
# Apply integration schema to Supabase
npx supabase db push --file supabase/migrations/create_integrations_schema.sql

# Verify schema deployment
npx supabase db diff
```

#### Step 2: Environment Configuration

Create `.env.local` with all integration credentials:

```bash
# Copy template
cp .env.example .env.local

# Edit with production credentials
nano .env.local
```

#### Step 3: Webhook Endpoint Registration

Configure webhook endpoints with each provider:

**Stripe Webhooks**:
1. Navigate to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Select events: `customer.*`, `subscription.*`, `invoice.*`, `payment_intent.*`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

**SendGrid Event Webhooks**:
1. Navigate to https://app.sendgrid.com/settings/mail_settings
2. Enable Event Webhook
3. Set URL: `https://your-domain.vercel.app/api/webhooks/sendgrid`
4. Select events: `processed`, `delivered`, `opened`, `clicked`, `bounced`, `unsubscribed`

#### Step 4: Credential Storage

Store production credentials in Supabase Vault:

```sql
-- Execute via Supabase SQL Editor
SELECT vault.create_secret('STRIPE_API_KEY', 'sk_live_xxxxxxxxxxxxx');
SELECT vault.create_secret('SENDGRID_API_KEY', 'SG.xxxxxxxxxxxxx');
SELECT vault.create_secret('OPENAI_API_KEY', 'sk-proj-xxxxxxxxxxxxx');
SELECT vault.create_secret('PINECONE_API_KEY', 'xxxxxxxxxxxxx');
```

#### Step 5: Integration Testing

Run comprehensive integration tests:

```bash
# Test Stripe connectivity
npm run test:integration:stripe

# Test SendGrid email delivery
npm run test:integration:sendgrid

# Test OpenAI embeddings
npm run test:integration:openai

# Test webhook signature verification
npm run test:webhooks
```

#### Step 6: Production Deployment

```bash
# Deploy to Vercel with environment variables
vercel --prod

# Verify deployment health
curl https://your-domain.vercel.app/api/health/integrations
```

### Post-Deployment Validation

1. **Verify Webhook Delivery**: Trigger test events from each provider dashboard
2. **Monitor Error Rates**: Review Vercel logs for first 24 hours
3. **Test End-to-End Workflows**:
   - Create Stripe customer → Verify database sync
   - Send test email via SendGrid → Verify event tracking
   - Generate embedding → Verify vector storage

---

## Maintenance & Operations

### Credential Rotation Schedule

| Credential Type | Rotation Frequency | Automation |
|----------------|-------------------|------------|
| Stripe API Keys | Quarterly | Manual (Stripe UI) |
| SendGrid API Keys | Quarterly | Manual (SendGrid UI) |
| OpenAI API Keys | Semi-annually | Manual (OpenAI Platform) |
| Webhook Secrets | After incidents | Manual |
| OAuth Client Secrets | Semi-annually | Manual (Provider UI) |

### Backup & Disaster Recovery

**Integration Configuration Backup**:
- Export integration settings weekly to encrypted S3 bucket
- Store webhook endpoint configurations in version control (excluding secrets)
- Document manual recovery procedures in runbook

**Data Synchronization Recovery**:
- Stripe: Re-sync via API pagination (customers, subscriptions, invoices)
- SendGrid: Event data retained for 30 days, re-ingest if needed
- Embeddings: Regenerate from source content (cached in Supabase)

### Cost Optimization

**Expected Monthly Costs** (20,000 active members):

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| Stripe | 2,000 transactions | $58 (2.9% + $0.30 per transaction) |
| SendGrid | 100,000 emails | $19.95 (Essentials plan) |
| OpenAI | 100,000 embeddings | $5 |
| Pinecone (optional) | 1M queries | $70 (Starter plan) |
| **Total** | | **$152.95 - $222.95** |

**Cost Reduction Strategies**:
- Implement embedding caching (reduces OpenAI costs by ~80%)
- Use SendGrid dynamic templates (reduce API calls)
- Consider pgvector instead of Pinecone (saves $70/month)
- Batch Stripe API calls (reduce rate limit consumption)

---

## Support & Resources

### Documentation
- [Stripe API Reference](https://stripe.com/docs/api)
- [SendGrid API Documentation](https://docs.sendgrid.com/api-reference)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Pinecone Quickstart](https://docs.pinecone.io/docs/quickstart)

### Troubleshooting
- Integration logs: Supabase Dashboard → Database → `integration_events`
- Webhook failures: Provider dashboards show delivery attempts
- Rate limiting: Vercel Analytics → Edge Middleware metrics

### Contact
- **Integration Support**: integrations@nabip.org
- **Brookside BI Consulting**: consultations@brooksidebi.com | +1 209 487 2047

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-15
**Maintained By**: Brookside BI Engineering Team
