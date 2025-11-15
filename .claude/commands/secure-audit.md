# Security Vulnerability Audit

Establish comprehensive security vulnerability assessment for NABIP AMS following OWASP Top 10, Supabase security best practices, and Next.js SSR security patterns to protect member data across multi-chapter environments.

## Purpose

Conduct systematic security audit of the NABIP AMS codebase designed to identify and remediate vulnerabilities in member data protection, payment processing, chapter data isolation, and authentication workflows while supporting sustainable security practices.

## OWASP Top 10 (2021) - NABIP AMS Context

### 1. Broken Access Control
**AMS-Specific Risks:**
- Chapter admins accessing other chapters' member data
- Members viewing other members' private information
- Unauthorized access to financial records or REBC certification data
- Privilege escalation from member to chapter admin role

**Security Checks:**
- ✅ Supabase RLS policies enforce chapter data isolation
- ✅ Auth middleware protects all authenticated routes
- ✅ API routes validate user permissions before data access
- ✅ Server Components use `createClient()` with cookie handling
- ✅ Client Components never expose `SUPABASE_SERVICE_ROLE_KEY`
- ✅ JWT tokens stored in httpOnly cookies (SSR pattern)

**Test Scenarios:**
```typescript
// Test: Chapter admin cannot access other chapters
// Expected: RLS policy denies cross-chapter access
await supabase.from('members')
  .select('*')
  .eq('chapter_id', 'other-chapter-id'); // Should return empty or error

// Test: Member cannot modify other members' profiles
// Expected: RLS policy restricts to own record
await supabase.from('members')
  .update({ email: 'malicious@example.com' })
  .eq('id', 'other-member-id'); // Should fail
```

**Remediation:**
- Implement comprehensive RLS policies for all tables
- Validate user permissions in API routes using `auth.uid()`
- Never rely solely on client-side access control
- Test RLS policies with different user roles (see `/rls-test` command)
- Audit admin privilege assignments quarterly

---

### 2. Cryptographic Failures
**AMS-Specific Risks:**
- Member SSN exposure (used for REBC certification applications)
- Payment card data leakage
- Email addresses and phone numbers transmitted unencrypted
- Session tokens exposed in client-side storage
- Supabase API keys committed to repository

**Security Checks:**
- ✅ TLS 1.3 enforced via Vercel edge network
- ✅ Supabase database encrypted at rest (AES-256)
- ✅ Supabase Storage encrypted at rest (AES-256)
- ✅ JWT tokens use strong cryptographic signatures
- ✅ Environment variables secured in Vercel (encrypted at rest)
- ✅ No hardcoded secrets in source code
- ✅ Payment data tokenized via Stripe (no full card storage)

**Test Scenarios:**
```bash
# Check for exposed secrets in codebase
grep -r "SUPABASE_SERVICE_ROLE_KEY" . --exclude-dir=node_modules
grep -r "sk_live_" . --exclude-dir=node_modules # Stripe secret keys

# Validate TLS version
curl -I https://your-domain.vercel.app | grep -i "TLS"

# Check for sensitive data in logs
grep -r "ssn\|credit.*card\|cvv" logs/ --ignore-case
```

**Remediation:**
- Encrypt SSN fields at application level before Supabase storage
- Use Stripe Elements for payment collection (PCI-hosted fields)
- Never log sensitive data (SSN, payment cards, passwords)
- Rotate Supabase keys if accidentally exposed
- Implement `.env.local` with `.gitignore` for local secrets
- Use Vercel Environment Variables for production secrets

---

### 3. Injection
**AMS-Specific Risks:**
- SQL injection via Supabase query filters
- NoSQL injection in member search functionality
- Command injection in file upload processing
- Log injection via member-submitted data

**Security Checks:**
- ✅ Supabase client uses parameterized queries (built-in protection)
- ✅ Input validation for all form submissions
- ✅ Server-side validation in API routes (never trust client)
- ✅ File upload validation (type, size, content scanning)
- ✅ Sanitize user input before logging

**Test Scenarios:**
```typescript
// Test: SQL injection via member search
// Malicious input: ' OR '1'='1
const maliciousSearch = "' OR '1'='1";
await supabase.from('members')
  .select('*')
  .ilike('name', `%${maliciousSearch}%`); // Should NOT return all members

// Test: NoSQL injection via event filters
const maliciousFilter = { "$ne": null };
// Supabase should sanitize or reject invalid filter syntax
```

**Remediation:**
- Always use Supabase's built-in query methods (`.eq()`, `.ilike()`, etc.)
- Validate and sanitize user input in API routes:
  ```typescript
  import { z } from 'zod';

  const memberSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    chapter_id: z.string().uuid(),
  });

  // In API route
  const validated = memberSchema.parse(req.body);
  ```
- Never construct raw SQL queries from user input
- Implement content security for file uploads (scan for malware)

---

### 4. Insecure Design
**AMS-Specific Risks:**
- Race conditions in event registration (capacity limits)
- Insufficient rate limiting for password reset requests
- No anti-automation for bulk member imports
- Inadequate session timeout for chapter admins
- Missing CAPTCHA for public forms

**Security Checks:**
- ✅ Event capacity enforced with database transactions
- ✅ Rate limiting on authentication endpoints
- ✅ Session timeout configured appropriately (1 hour default)
- ✅ MFA available for Tech Manager accounts
- ✅ Audit logging for sensitive operations

**Test Scenarios:**
```typescript
// Test: Race condition in event registration
// Simulate 10 concurrent registrations for last 5 spots
const promises = Array(10).fill(null).map(() =>
  supabase.from('event_registrations').insert({
    event_id: 'capitol-conference',
    member_id: randomMemberId(),
  })
);
await Promise.all(promises);
// Expected: Only 5 succeed, 5 fail due to capacity limit

// Test: Brute force password reset
// Expected: Rate limiting blocks after 5 attempts
for (let i = 0; i < 20; i++) {
  await fetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email: 'target@example.com' }),
  });
}
```

**Remediation:**
- Implement Upstash Rate Limiting:
  ```typescript
  import { Ratelimit } from '@upstash/ratelimit';
  import { Redis } from '@upstash/redis';

  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '10 s'),
  });

  export async function POST(req: Request) {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return new Response('Rate limit exceeded', { status: 429 });
    }
    // ... handle request
  }
  ```
- Use database transactions for event registration capacity
- Implement CAPTCHA (hCaptcha, reCAPTCHA) for public forms
- Configure session timeout in Supabase Auth settings

---

### 5. Security Misconfiguration
**AMS-Specific Risks:**
- Default Supabase RLS policies too permissive
- CORS allowing unauthorized domains
- Verbose error messages exposing database structure
- Missing security headers (CSP, X-Frame-Options)
- Development mode exposed in production

**Security Checks:**
- ✅ RLS enabled on all tables containing member data
- ✅ CORS restricted to trusted origins
- ✅ Error messages sanitized (no stack traces in production)
- ✅ Security headers configured in `next.config.mjs`
- ✅ `NODE_ENV=production` in Vercel deployment
- ✅ Source maps disabled or protected in production

**Test Scenarios:**
```typescript
// Test: CORS policy enforcement
const response = await fetch('https://your-domain.vercel.app/api/members', {
  headers: {
    'Origin': 'https://malicious-site.com',
  },
});
// Expected: CORS error or request blocked

// Test: Security headers present
const headers = await fetch('https://your-domain.vercel.app').then(r => r.headers);
console.log(headers.get('Content-Security-Policy')); // Should be present
console.log(headers.get('X-Frame-Options')); // Should be 'DENY'
```

**Remediation:**
- Configure security headers in `next.config.mjs`:
  ```typescript
  const securityHeaders = [
    {
      key: 'Content-Security-Policy',
      value: `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live;
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https:;
        connect-src 'self' https://*.supabase.co;
        frame-ancestors 'none';
      `.replace(/\s{2,}/g, ' ').trim()
    },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  ];

  export default {
    async headers() {
      return [{ source: '/:path*', headers: securityHeaders }];
    },
  };
  ```
- Enable RLS on all tables by default
- Sanitize error messages in API routes:
  ```typescript
  try {
    // ... database operation
  } catch (error) {
    console.error(error); // Log full error server-side
    return new Response('Internal server error', { status: 500 }); // Generic client message
  }
  ```

---

### 6. Vulnerable and Outdated Components
**AMS-Specific Risks:**
- Outdated Next.js/React versions with known XSS vulnerabilities
- Vulnerable npm dependencies (Supabase client, shadcn/ui components)
- Unpatched Vercel platform vulnerabilities
- Third-party integrations (Stripe, email) with security issues

**Security Checks:**
- ✅ GitHub Dependabot alerts enabled
- ✅ Automated dependency audits via `dependency-auditor.yml` workflow
- ✅ Regular `pnpm audit` execution
- ✅ Vercel platform auto-updates enabled
- ✅ Third-party service versions monitored

**Test Scenarios:**
```bash
# Check for vulnerable dependencies
pnpm audit --production

# Check for outdated packages
pnpm outdated

# Scan for known vulnerabilities with specific CVEs
pnpm audit --audit-level=moderate

# Review GitHub Security Advisories
gh api repos/:owner/:repo/vulnerability-alerts
```

**Remediation:**
- Enable GitHub Dependabot in repository settings
- Configure `.github/workflows/dependency-auditor.yml`:
  ```yaml
  name: Dependency Security Audit
  on:
    schedule:
      - cron: '0 0 * * 1' # Weekly Monday
    push:
      paths:
        - 'package.json'
        - 'pnpm-lock.yaml'

  jobs:
    audit:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - run: pnpm install
        - run: pnpm audit --audit-level=high
  ```
- Update dependencies regularly (quarterly minimum)
- Subscribe to security advisories for Next.js, Supabase, Stripe
- Test updates in staging before production deployment

---

### 7. Identification and Authentication Failures
**AMS-Specific Risks:**
- Weak password policies for member accounts
- Session fixation attacks
- Credential stuffing from compromised databases
- Insufficient MFA enforcement for chapter admins
- Session tokens exposed in URLs

**Security Checks:**
- ✅ Supabase Auth password policy enforced (min 8 characters)
- ✅ Session tokens in httpOnly cookies (not localStorage)
- ✅ Session refresh on every request via middleware
- ✅ MFA available for Tech Manager accounts
- ✅ Account lockout after failed login attempts
- ✅ Password reset via secure email link

**Test Scenarios:**
```typescript
// Test: Weak password rejected
const weakPassword = 'pass';
const { error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: weakPassword,
});
// Expected: Error due to password policy

// Test: Session token not in URL
const response = await fetch('/dashboard');
const url = new URL(response.url);
// Expected: No 'token' or 'session' query parameter

// Test: Session expiration
// Wait 1 hour + 1 minute (default session timeout)
// Expected: Middleware redirects to /auth/login
```

**Remediation:**
- Configure Supabase Auth password policy:
  - Minimum 8 characters
  - Require uppercase, lowercase, number, special character (recommended)
- Enable MFA for all chapter admin accounts:
  ```typescript
  // In Supabase Dashboard → Authentication → MFA
  // Enable TOTP (Time-based One-Time Password)
  ```
- Implement account lockout:
  ```typescript
  // Track failed attempts in database
  const failedAttempts = await supabase
    .from('login_attempts')
    .select('count')
    .eq('email', email)
    .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
    .single();

  if (failedAttempts.count >= 5) {
    return new Response('Account locked. Try again in 15 minutes.', { status: 429 });
  }
  ```
- Never expose session tokens in URLs or localStorage

---

### 8. Software and Data Integrity Failures
**AMS-Specific Risks:**
- REBC certification documents tampered during upload
- Event registration data modified without audit trail
- Financial records altered without detection
- Unsigned deployment artifacts from GitHub Actions
- npm package supply chain attacks

**Security Checks:**
- ✅ File upload integrity validation (checksums)
- ✅ Audit logging for all financial and certification record modifications
- ✅ Database triggers for critical table changes
- ✅ GitHub Actions signed commits enforced
- ✅ Vercel deployment integrity checks
- ✅ npm dependency lockfile (`pnpm-lock.yaml`) committed

**Test Scenarios:**
```typescript
// Test: Audit logging for financial record changes
await supabase.from('financial_records')
  .update({ amount: 999999 })
  .eq('id', 'record-id');

// Query audit log
const auditLog = await supabase.from('audit_logs')
  .select('*')
  .eq('resource_type', 'financial_record')
  .eq('resource_id', 'record-id')
  .order('timestamp', { ascending: false });
// Expected: Audit log entry with user, timestamp, old/new values

// Test: File upload integrity
const file = new File(['malicious content'], 'cert.pdf', { type: 'application/pdf' });
const uploadResponse = await uploadREBCDocument(file);
// Expected: File content validation, virus scanning
```

**Remediation:**
- Implement comprehensive audit logging:
  ```typescript
  // lib/audit-log.ts
  export async function logAuditEvent(
    userId: string,
    action: 'created' | 'updated' | 'deleted' | 'accessed',
    resourceType: string,
    resourceId: string,
    metadata?: Record<string, any>
  ) {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
      timestamp: new Date().toISOString(),
      ip_address: getClientIP(),
    });
  }
  ```
- Validate file uploads:
  ```typescript
  import crypto from 'crypto';

  function validateFileIntegrity(file: File, expectedChecksum?: string) {
    const hash = crypto.createHash('sha256');
    hash.update(file.content);
    const checksum = hash.digest('hex');

    if (expectedChecksum && checksum !== expectedChecksum) {
      throw new Error('File integrity check failed');
    }
    return checksum;
  }
  ```
- Use Supabase database triggers for critical tables:
  ```sql
  CREATE TRIGGER audit_financial_changes
  AFTER UPDATE ON financial_records
  FOR EACH ROW
  EXECUTE FUNCTION log_financial_change();
  ```

---

### 9. Security Logging and Monitoring Failures
**AMS-Specific Risks:**
- Unauthorized chapter data access not logged
- Payment processing failures not monitored
- Failed authentication attempts not tracked
- Data export activities not audited
- Insufficient log retention for compliance

**Security Checks:**
- ✅ Authentication events logged (login, logout, failed attempts)
- ✅ Data access logged for sensitive tables (financial, certification)
- ✅ Payment transactions logged with timestamps
- ✅ Admin actions logged (role assignments, permission changes)
- ✅ Log retention policy enforced (1-3 years)
- ✅ Alerts configured for suspicious activity

**Test Scenarios:**
```typescript
// Test: Failed login attempts logged
await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'wrong-password',
});

// Query auth logs
const authLogs = await supabase.from('auth_logs')
  .select('*')
  .eq('event', 'login_failed')
  .eq('email', 'test@example.com');
// Expected: Log entry with timestamp, IP address, user agent

// Test: Member data access logged
await supabase.from('members')
  .select('*')
  .eq('id', 'member-id');

// Query audit logs
const accessLog = await supabase.from('audit_logs')
  .select('*')
  .eq('action', 'accessed')
  .eq('resource_type', 'member');
// Expected: Log entry showing who accessed which member record
```

**Remediation:**
- Implement comprehensive logging:
  ```typescript
  // middleware.ts - Log all authenticated requests
  export async function middleware(req: NextRequest) {
    const supabase = createServerClient(/* ... */);
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      await logAuditEvent(
        session.user.id,
        'accessed',
        'route',
        req.nextUrl.pathname,
        { method: req.method, ip: req.ip }
      );
    }

    return updateSession(req);
  }
  ```
- Configure log retention in Supabase:
  ```sql
  -- Auto-delete logs older than 1 year
  DELETE FROM audit_logs
  WHERE timestamp < NOW() - INTERVAL '1 year';
  ```
- Set up alerts for suspicious activity:
  ```typescript
  // Example: Alert on 10+ failed logins in 5 minutes
  const recentFailedLogins = await supabase.from('auth_logs')
    .select('count')
    .eq('event', 'login_failed')
    .eq('email', email)
    .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString());

  if (recentFailedLogins.count >= 10) {
    await sendSecurityAlert('Potential brute force attack', { email });
  }
  ```

---

### 10. Server-Side Request Forgery (SSRF)
**AMS-Specific Risks:**
- Webhook URL manipulation (Stripe payment notifications)
- Email API exploitation (member welcome emails)
- Third-party API integration vulnerabilities
- Malicious file URLs in document uploads

**Security Checks:**
- ✅ Webhook URLs validated against allowlist
- ✅ External API calls restricted to trusted domains
- ✅ File upload URLs validated before fetching
- ✅ Network policies prevent internal service access
- ✅ Stripe webhook signatures verified

**Test Scenarios:**
```typescript
// Test: Malicious webhook URL blocked
const maliciousWebhook = {
  url: 'http://internal-service:8080/admin',
  event: 'payment.success',
};

const response = await fetch('/api/webhooks/register', {
  method: 'POST',
  body: JSON.stringify(maliciousWebhook),
});
// Expected: Error due to URL not in allowlist

// Test: SSRF via file upload URL
const maliciousFileUrl = 'http://169.254.169.254/latest/meta-data/';
const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  body: JSON.stringify({ fileUrl: maliciousFileUrl }),
});
// Expected: Error due to invalid URL format or domain
```

**Remediation:**
- Validate webhook URLs:
  ```typescript
  const ALLOWED_WEBHOOK_DOMAINS = [
    'stripe.com',
    'sendgrid.com',
    'your-domain.com',
  ];

  function validateWebhookUrl(url: string): boolean {
    const parsed = new URL(url);
    return ALLOWED_WEBHOOK_DOMAINS.some(domain =>
      parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  }
  ```
- Verify Stripe webhook signatures:
  ```typescript
  import Stripe from 'stripe';

  export async function POST(req: Request) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const signature = req.headers.get('stripe-signature')!;
    const body = await req.text();

    try {
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      // ... handle event
    } catch (error) {
      return new Response('Invalid signature', { status: 400 });
    }
  }
  ```
- Restrict external API calls:
  ```typescript
  const ALLOWED_API_DOMAINS = ['api.stripe.com', 'api.sendgrid.com'];

  async function callExternalAPI(url: string) {
    const parsed = new URL(url);
    if (!ALLOWED_API_DOMAINS.includes(parsed.hostname)) {
      throw new Error('Unauthorized external API domain');
    }
    // ... make API call
  }
  ```

---

## Additional Security Checks

### API Security
**Checks:**
- ✅ All API routes require authentication
- ✅ Rate limiting implemented on sensitive endpoints
- ✅ Input validation using Zod or similar library
- ✅ Output encoding to prevent XSS
- ✅ CORS configured to restrict origins

**Example Secure API Route:**
```typescript
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';

const memberSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  chapter_id: z.string().uuid(),
});

export async function POST(req: Request) {
  // Rate limiting
  const ratelimit = new Ratelimit({/* ... */});
  const { success } = await ratelimit.limit(req.headers.get('x-forwarded-for') ?? 'unknown');
  if (!success) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // Authentication
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Input validation
  const body = await req.json();
  const validated = memberSchema.safeParse(body);
  if (!validated.success) {
    return Response.json({ error: validated.error }, { status: 400 });
  }

  // Business logic with RLS enforcement
  const { data, error } = await supabase
    .from('members')
    .insert(validated.data)
    .select()
    .single();

  if (error) {
    console.error(error); // Server-side logging only
    return new Response('Failed to create member', { status: 500 });
  }

  return Response.json(data);
}
```

---

### Secrets Management
**Checks:**
- ✅ No secrets in source code or Git history
- ✅ Environment variables used for all sensitive config
- ✅ `.env.local` in `.gitignore`
- ✅ Vercel Environment Variables encrypted at rest
- ✅ Service role key never exposed to client
- ✅ Regular secret rotation policy

**Example `.env.local` (NEVER commit):**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # NEVER expose to client!

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx # NEVER expose to client!
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email
SENDGRID_API_KEY=SG.xxx # NEVER expose to client!
```

---

### CORS Configuration
**Checks:**
- ✅ CORS restricted to trusted origins only
- ✅ Credentials allowed only for same-origin requests
- ✅ Preflight requests handled correctly

**Example CORS Configuration:**
```typescript
// middleware.ts or API route
export function middleware(req: NextRequest) {
  const response = NextResponse.next();

  const allowedOrigins = [
    'https://nabip-ams.vercel.app',
    'https://nabip.org',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
  ].filter(Boolean);

  const origin = req.headers.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}
```

---

### CSRF Protection
**Checks:**
- ✅ State-changing operations use POST/PUT/DELETE (not GET)
- ✅ SameSite cookie attribute configured
- ✅ CSRF tokens for sensitive operations (optional with SameSite)

**Example CSRF Protection:**
```typescript
// next.config.mjs
export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Set-Cookie',
            value: 'SameSite=Strict; Secure; HttpOnly',
          },
        ],
      },
    ];
  },
};
```

---

### Content Security Policy
**Checks:**
- ✅ CSP header restricts script sources
- ✅ Inline scripts avoided (or using nonces)
- ✅ External resource domains whitelisted
- ✅ Frame ancestors restricted

**Example CSP (see Security Misconfiguration section above for full implementation)**

---

### Input Validation and Sanitization
**Checks:**
- ✅ All user input validated server-side
- ✅ Type validation using TypeScript and Zod
- ✅ Length limits enforced
- ✅ Special characters sanitized where appropriate
- ✅ File uploads restricted by type and size

**Example Comprehensive Validation:**
```typescript
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Schema for member registration
const memberRegistrationSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase(),
  phone: z.string().regex(/^\d{10}$/, 'Invalid phone format'),
  chapter_id: z.string().uuid(),
  bio: z.string().max(500).optional(),
  rebc_application: z.object({
    ssn: z.string().regex(/^\d{9}$/, 'Invalid SSN format'),
    documents: z.array(z.instanceof(File)).max(5),
  }).optional(),
});

// In API route
export async function POST(req: Request) {
  const formData = await req.formData();
  const data = Object.fromEntries(formData);

  // Validate
  const validated = memberRegistrationSchema.parse(data);

  // Sanitize HTML in bio field
  if (validated.bio) {
    validated.bio = DOMPurify.sanitize(validated.bio);
  }

  // Validate file uploads
  if (validated.rebc_application?.documents) {
    for (const file of validated.rebc_application.documents) {
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        throw new Error('Invalid file type');
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('File too large');
      }
    }
  }

  // ... process validated data
}
```

---

### Error Handling (No Information Leakage)
**Checks:**
- ✅ Generic error messages to users
- ✅ Detailed errors logged server-side only
- ✅ No stack traces in production
- ✅ No database schema details exposed

**Example Secure Error Handling:**
```typescript
export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('members').select('*');

    if (error) {
      throw error; // Caught below
    }

    return Response.json(data);
  } catch (error) {
    // Detailed logging server-side
    console.error('Failed to fetch members:', {
      error,
      timestamp: new Date().toISOString(),
      userId: session?.user?.id,
      path: req.url,
    });

    // Generic message to client (production)
    if (process.env.NODE_ENV === 'production') {
      return new Response('Internal server error', { status: 500 });
    }

    // Detailed message in development only
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
```

---

## Output Format

For each finding, provide:

### 1. Severity
- **Critical**: Immediate exploitation possible, member data at risk
- **High**: Exploitation likely, significant impact
- **Medium**: Exploitation possible with effort, moderate impact
- **Low**: Minor security concern, minimal impact

### 2. Location
- File path (absolute): `C:\Users\...\app\api\members\route.ts`
- Line number(s): Lines 45-52
- Component/function name: `POST` handler in `members` API route

### 3. Description
Clear explanation of the vulnerability in NABIP AMS context

### 4. Impact
Potential consequences specific to association management:
- Member data exposure
- Chapter data leakage
- Payment fraud
- REBC credential theft
- Compliance violations (GDPR, PCI-DSS)

### 5. Remediation
Step-by-step fix with code examples for Supabase/Next.js stack

### 6. References
- OWASP link
- CWE identifier
- Supabase security documentation
- Next.js security best practices

---

## Security Report Template

```markdown
# NABIP AMS Security Vulnerability Audit Report

**Date**: [Date]
**Version**: [AMS Version]
**Auditor**: [Name/Agent]
**Scope**: [Components audited]

## Executive Summary

[High-level overview of security posture, critical findings count, overall risk level]

**Overall Security Posture**: [Excellent / Good / Fair / Poor]
**Critical Findings**: [Number]
**High Findings**: [Number]
**Medium Findings**: [Number]
**Low Findings**: [Number]

**Recommended Actions**: [Top 3 priority fixes]

---

## Critical Findings

### Finding 1: [Vulnerability Name]
**Severity**: Critical
**OWASP Category**: [e.g., Broken Access Control]
**CWE**: [e.g., CWE-284]

**Location**:
- File: `app/(dashboard)/chapters/[id]/page.tsx`
- Lines: 45-52
- Component: Chapter detail page

**Description**:
Chapter admins can access other chapters' financial data by manipulating the URL parameter.

**Impact**:
- Unauthorized access to financial records across all chapters
- Violation of chapter data isolation requirements
- Potential GDPR/privacy violations
- Loss of chapter administrator trust

**Proof of Concept**:
```typescript
// Malicious chapter admin (chapter ID: abc-123) accesses other chapter data
// URL: /chapters/xyz-789 (different chapter)
// Expected: Access denied
// Actual: Full access to financial records
```

**Remediation**:
1. Implement RLS policy on `financial_records` table:
   ```sql
   CREATE POLICY "Chapter admins view own chapter finances"
   ON financial_records FOR SELECT
   USING (
     chapter_id IN (
       SELECT chapter_id FROM chapter_admins
       WHERE user_id = auth.uid()
     )
   );
   ```

2. Add server-side permission check in page component:
   ```typescript
   // app/(dashboard)/chapters/[id]/page.tsx
   export default async function ChapterPage({ params }: { params: { id: string } }) {
     const supabase = createClient();
     const { data: { session } } = await supabase.auth.getSession();

     // Verify user has access to this chapter
     const { data: adminAccess } = await supabase
       .from('chapter_admins')
       .select('chapter_id')
       .eq('user_id', session?.user?.id)
       .eq('chapter_id', params.id)
       .single();

     if (!adminAccess && session?.user?.role !== 'tech_manager') {
       redirect('/unauthorized');
     }

     // ... rest of page
   }
   ```

**References**:
- OWASP: https://owasp.org/Top10/A01_2021-Broken_Access_Control/
- CWE-284: https://cwe.mitre.org/data/definitions/284.html
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security

---

[Repeat for each finding]

---

## Summary by OWASP Category

| OWASP Category | Critical | High | Medium | Low | Total |
|----------------|----------|------|--------|-----|-------|
| Broken Access Control | 2 | 3 | 1 | 0 | 6 |
| Cryptographic Failures | 0 | 1 | 2 | 1 | 4 |
| Injection | 0 | 0 | 1 | 2 | 3 |
| ... | ... | ... | ... | ... | ... |

---

## Remediation Roadmap

### Phase 1: Critical (0-7 Days)
- [ ] Fix chapter data isolation vulnerability (Finding 1)
- [ ] Implement RLS policies on all financial tables (Finding 2)
- [ ] Rotate exposed Supabase service role key (Finding 3)

**Estimated Effort**: 16-24 hours development + testing

### Phase 2: High (7-30 Days)
- [ ] Implement rate limiting on authentication endpoints (Finding 4)
- [ ] Configure security headers (CSP, X-Frame-Options) (Finding 5)
- [ ] Enable MFA for all chapter admin accounts (Finding 6)

**Estimated Effort**: 20-30 hours development + testing

### Phase 3: Medium (30-60 Days)
- [ ] Enhance audit logging for member data access (Finding 7)
- [ ] Implement CAPTCHA for public forms (Finding 8)
- [ ] Update dependencies with known vulnerabilities (Finding 9)

**Estimated Effort**: 16-20 hours development + testing

### Phase 4: Low (60-90 Days)
- [ ] Improve error message sanitization (Finding 10)
- [ ] Configure session timeout policies (Finding 11)
- [ ] Document security incident response procedures (Finding 12)

**Estimated Effort**: 8-12 hours development + documentation

---

## Compliance Impact

### GDPR
- **Critical Gaps**: Chapter data isolation vulnerabilities could lead to unauthorized PII access
- **Recommendation**: Fix all Critical and High findings before production launch

### PCI-DSS
- **Assessment**: Payment processing architecture compliant (using Stripe Elements)
- **Recommendation**: Maintain security logging for payment transactions

### SOC 2
- **Control Gaps**: Insufficient audit logging, missing security headers
- **Recommendation**: Address High priority findings to meet Trust Services Criteria

---

## Testing Methodology

**Tools Used**:
- Static analysis: ESLint security plugin, TypeScript strict mode
- Dependency scanning: `pnpm audit`, GitHub Dependabot
- Manual testing: Supabase RLS policy bypass attempts, authentication testing
- Automated scanning: OWASP ZAP, Burp Suite (if applicable)

**Test Coverage**:
- ✅ All OWASP Top 10 categories
- ✅ Supabase-specific security patterns
- ✅ Next.js SSR authentication flows
- ✅ Multi-chapter data isolation
- ✅ Payment processing security

---

## Recommendations for Continuous Security

1. **Quarterly Security Audits**: Re-run this audit every 3 months
2. **Automated Scanning**: Enable GitHub security scanning workflows
3. **Dependency Updates**: Monthly `pnpm audit` and dependency updates
4. **Security Training**: Annual security awareness for chapter admins
5. **Penetration Testing**: Annual third-party penetration test
6. **RLS Policy Review**: Validate RLS effectiveness with each schema change
7. **Incident Response**: Document and test security incident procedures

---

**Next Steps**:
1. Review and prioritize findings with development team
2. Create GitHub issues for each Critical and High finding
3. Allocate development resources for remediation phases
4. Schedule follow-up audit after Phase 1 completion

---

**Prepared By**: [Agent/Auditor Name]
**Contact**: Consultations@BrooksideBI.com | +1 209 487 2047
```

---

## Integration with Security Agents

### Recommended Agent Collaboration

**vulnerability-hunter**
- Execute penetration testing for RLS bypass and auth vulnerabilities
- Validate exploitation scenarios for identified vulnerabilities
- Provide proof-of-concept code for critical findings

**security-specialist**
- Implement security controls (headers, rate limiting, encryption)
- Configure Next.js and Vercel security settings
- Establish security monitoring and alerting

**cryptography-expert**
- Validate encryption implementation for member SSN and payment data
- Review JWT token security and key management
- Assess Supabase encryption at rest configuration

**compliance-orchestrator**
- Map vulnerabilities to compliance requirements (GDPR, PCI-DSS, SOC 2)
- Assess regulatory impact of security findings
- Provide compliance-focused remediation guidance

**database-architect**
- Design and implement RLS policies for chapter data isolation
- Optimize RLS policy performance
- Create database triggers for audit logging

---

## Success Criteria

- ✅ Zero Critical vulnerabilities in production
- ✅ All High vulnerabilities remediated within 30 days
- ✅ OWASP Top 10 fully assessed and documented
- ✅ Supabase RLS policies validated for chapter isolation
- ✅ Security headers configured and tested
- ✅ Rate limiting implemented on sensitive endpoints
- ✅ Audit logging comprehensive and tested
- ✅ Dependency vulnerabilities tracked and scheduled for updates
- ✅ Security report delivered with actionable remediation roadmap
- ✅ Compliance impact assessed (GDPR, PCI-DSS, SOC 2)

---

## Estimated Execution Time

- **Quick Security Scan**: 30-45 minutes (automated tools + critical path review)
- **Standard Vulnerability Audit**: 2-3 hours (OWASP Top 10 manual testing)
- **Comprehensive Security Audit**: 4-6 hours (full codebase + infrastructure)
- **Enterprise Compliance Audit**: 8-12 hours (includes penetration testing, compliance mapping)

---

## Notes

- **Continuous Security**: Security audits should be conducted quarterly minimum
- **Automated Scanning**: Leverage GitHub Actions workflows for continuous dependency scanning
- **Supabase Security**: Stay updated on Supabase security advisories and best practices
- **Next.js Security**: Monitor Next.js security releases and upgrade promptly
- **Vercel Platform Security**: Leverage Vercel's SOC 2 Type II certified infrastructure
- **Payment Security**: Maintain PCI-DSS SAQ A compliance through Stripe integration
- **Member Trust**: Position security as enabling member confidence and organizational growth
- **Chapter Data Isolation**: Multi-tenant RLS security is foundational for chapter administrator trust
- **Privacy by Design**: Build security into features from the start, not as afterthought
- **Legal Counsel**: Engage legal counsel for regulatory interpretation of security requirements

---

**Establishing sustainable security practices designed to support NABIP's multi-chapter growth while protecting member data and enabling regulatory compliance.**

**Contact**: Consultations@BrooksideBI.com | +1 209 487 2047
