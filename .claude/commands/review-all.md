# Comprehensive AMS Code Review

Establish comprehensive code quality standards across the NABIP AMS codebase to ensure reliability, security, and sustainable development practices for multi-chapter association management operations.

## Review Scope

### Next.js 16 & React 19 Patterns
**Server vs. Client Components:**
- Verify `'use client'` is only used when necessary (interactivity, hooks, browser APIs)
- Ensure Server Components are default for data fetching
- Check for proper async/await patterns in Server Components
- Validate no useState/useEffect in Server Components
- Review proper component tree architecture (Server Components wrapping Client Components)

**Data Fetching & Caching:**
- Review fetch cache strategies (`force-cache`, `no-store`, `revalidate`)
- Verify proper use of `unstable_cache` for database queries
- Check for N+1 query prevention
- Assess proper error boundaries and loading states
- Validate Suspense boundary placement

**Server Actions:**
- Verify `'use server'` directive placement
- Check for proper form validation (Zod schemas)
- Assess revalidatePath/revalidateTag usage after mutations
- Review error handling and user feedback patterns
- Validate idempotent action design

**Routing & Layout:**
- Verify proper route group structure (`(dashboard)`, etc.)
- Check layout nesting and data passing patterns
- Assess middleware integration for auth session management
- Review parallel routes and intercepting routes usage

**React 19 Best Practices:**
- Review hooks dependencies (useEffect, useMemo, useCallback)
- Check for proper memo usage (avoid premature optimization)
- Assess use of new hooks (useOptimistic, useActionState)
- Verify concurrent rendering compatibility
- Validate transitions and deferred values usage

### Supabase Security & Patterns
**Row Level Security (RLS):**
- Verify RLS policies exist for ALL tables
- Check policy completeness (SELECT, INSERT, UPDATE, DELETE)
- Assess policy logic correctness (no data leaks)
- Verify chapter isolation enforcement in policies
- Review member data privacy rules
- Validate role-based access control (Tech Manager, Chapter Admin, Member)

**Authentication & Authorization:**
- Verify proper auth checks in Server Components (`lib/supabase/server.ts`)
- Check client-side auth patterns (`lib/supabase/client.ts`)
- Assess middleware session refresh logic
- Review protected route enforcement
- Validate user role and permission checks

**Query Optimization:**
- Check for N+1 query prevention (use joins, batch requests)
- Verify proper indexing usage
- Assess use of `.select()` to fetch only needed columns
- Review use of `.count()`, `.range()`, and pagination
- Validate efficient query patterns (avoid multiple round trips)

**Database Design:**
- Verify foreign key constraints
- Check for proper data normalization
- Assess use of Postgres features (JSON, arrays, enums, functions)
- Review migration scripts for idempotency
- Validate database schema consistency

### TypeScript Quality
**Type Safety:**
- Verify strict mode compliance (`tsconfig.json`)
- Check for proper type annotations (no implicit `any`)
- Assess use of branded types for domain primitives (IDs, emails, etc.)
- Review union types and discriminated unions
- Validate proper generic usage

**Validation Schemas:**
- Verify Zod schemas for all form inputs
- Check API route input validation
- Assess Server Action parameter validation
- Review error message quality and i18n support
- Validate schema reusability and composition

**Type Organization:**
- Check type definitions location (`types/`, per-module)
- Verify proper interface vs. type usage
- Assess DTO (Data Transfer Object) patterns
- Review shared types organization

### Accessibility (WCAG 2.1 AA)
**ARIA Labels & Roles:**
- Verify proper `aria-label`, `aria-labelledby` usage
- Check form field associations (`htmlFor`, `id`)
- Assess dialog/modal accessibility
- Review landmark roles (`<nav>`, `<main>`, `<aside>`)
- Validate live regions for dynamic updates (`aria-live`)

**Keyboard Navigation:**
- Verify tab order is logical
- Check focus management (trapped focus in modals)
- Assess keyboard shortcuts don't conflict with screen readers
- Review focus indicators visibility (WCAG contrast requirements)
- Validate skip links presence

**Screen Reader Support:**
- Verify semantic HTML usage
- Check alt text for images and icons
- Assess button vs. link usage appropriately
- Review headings hierarchy (h1-h6)
- Validate form error announcements

**Color Contrast:**
- Verify WCAG AA compliance (4.5:1 for normal text, 3:1 for large)
- Check focus indicators meet contrast requirements
- Assess dark mode contrast ratios
- Review error states visibility

### Performance Optimization
**Core Web Vitals:**
- Assess LCP (Largest Contentful Paint) - flag >2.5s
- Review FID/INP (First Input Delay / Interaction to Next Paint) - flag >200ms
- Check CLS (Cumulative Layout Shift) - flag >0.1
- Validate overall performance score (Lighthouse >90)

**Bundle Size:**
- Verify dynamic imports for large components
- Check for proper code splitting by route
- Assess third-party library size impact
- Review Image component usage (`next/image` with optimization)
- Validate font loading strategies (next/font)

**Database Performance:**
- Check query efficiency (use EXPLAIN ANALYZE mentally)
- Verify proper caching strategies (unstable_cache, React cache)
- Assess connection pooling usage (Supabase edge functions)
- Review use of materialized views for reports
- Validate index coverage for common queries

**Rendering Strategies:**
- Verify appropriate ISR/SSG usage for static content
- Check streaming and progressive rendering
- Assess partial prerendering opportunities
- Review static vs. dynamic route selection

### Security (OWASP Top 10)
**Injection Prevention:**
- Verify parameterized queries (Supabase prevents SQL injection by default)
- Check for XSS vulnerabilities in dynamic content
- Assess command injection risks (external process calls)
- Review LDAP/NoSQL injection prevention

**Authentication & Session Management:**
- Verify secure session handling (HttpOnly cookies)
- Check for session fixation vulnerabilities
- Assess password policies (Supabase Auth enforces)
- Review logout and session invalidation
- Validate CSRF protection for state-changing operations

**Sensitive Data Exposure:**
- Check for exposed secrets or credentials (env vars, .gitignore)
- Verify PII encryption at rest (Supabase encryption)
- Assess secure transmission (HTTPS enforcement)
- Review API key rotation practices
- Validate no sensitive data in logs or error messages

**Access Control:**
- Verify proper authorization checks (RLS policies, middleware)
- Check for insecure direct object references (IDOR)
- Assess privilege escalation prevention
- Review role-based access control completeness
- Validate horizontal and vertical access control

**Security Headers:**
- Verify Content Security Policy (CSP) configuration
- Check X-Frame-Options, X-Content-Type-Options
- Assess HSTS (HTTP Strict Transport Security)
- Review Referrer-Policy and Permissions-Policy

## AMS-Specific Review Criteria

### Member Data Privacy
**PII Protection:**
- Verify PII handling (encryption at rest, secure transmission)
- Check GDPR compliance (data export, deletion, consent tracking)
- Assess audit logging for sensitive operations (member updates, deletions)
- Review data retention policies
- Validate anonymization for analytics

**RLS Enforcement:**
- Verify members can only access own data
- Check chapter admins can only access own chapter members
- Assess Tech Manager global access patterns
- Review cross-member data leaks prevention

### Chapter Isolation (Multi-Tenancy)
**Data Segmentation:**
- Verify no cross-chapter data leaks in queries
- Check RLS policies enforce chapter boundaries
- Assess chapter admin permission scoping
- Review aggregate queries for chapter-level filtering
- Validate chapter context in all database operations

**UI/UX Isolation:**
- Check chapter selector presence where needed
- Verify chapter context in navigation breadcrumbs
- Assess chapter-specific branding/theming
- Review chapter switcher for multi-chapter users

### Event Capacity Enforcement
**Race Condition Prevention:**
- Check for atomic operations (database transactions, functions)
- Verify overselling prevention (optimistic locking, row locking)
- Assess waitlist implementation correctness
- Review refund/cancellation logic (idempotent operations)
- Validate capacity decrement patterns

**Edge Cases:**
- Check concurrent registration handling
- Verify waitlist promotion logic
- Assess capacity update race conditions
- Review event cancellation rollback

### Payment Processing Security
**PCI-DSS Compliance:**
- Verify no storage of credit card numbers (use Stripe tokens)
- Check secure payment flow (client-side tokenization)
- Assess idempotent payment processing
- Review payment reconciliation logic
- Validate refund handling

**Transaction Integrity:**
- Check for atomic payment + registration operations
- Verify payment failure rollback logic
- Assess duplicate charge prevention
- Review payment status state machine

### REBC Workflow Validation
**State Machine Consistency:**
- Verify multi-step workflow state transitions (Draft → Submitted → Under Review → Approved/Rejected)
- Check validation schema completeness at each step
- Assess rollback/retry logic for failures
- Review approval workflow state transitions
- Validate state machine invariants

**Data Consistency:**
- Check for orphaned workflow records
- Verify cascade deletes and updates
- Assess referential integrity
- Review audit trail completeness

### Membership Types
**Type Handling:**
- Verify correct handling of Individual, Agency, Student, Corporate types
- Check dues calculation logic for each type (different rates, billing cycles)
- Assess type-specific feature access enforcement
- Review type transition workflows (Student → Individual upgrade)
- Validate type-specific validation rules

**Billing Logic:**
- Check prorated dues calculations
- Verify renewal logic per type
- Assess grace period handling
- Review type-specific discount rules

## Code Quality Checklist

### Readability & Maintainability
- [ ] Self-documenting code with clear variable/function names
- [ ] Appropriate comments for complex logic (business rules)
- [ ] Consistent formatting (Prettier configured)
- [ ] Function length reasonable (<50 lines)
- [ ] File length reasonable (<300 lines)
- [ ] Cyclomatic complexity reasonable (<10 per function)

### DRY & Reusability
- [ ] No code duplication (extract to utilities, hooks, components)
- [ ] Proper abstraction levels
- [ ] Reusable components in `components/ui/` and `components/`
- [ ] Shared utilities in `lib/`
- [ ] Common types in `types/`

### Error Handling
- [ ] Try-catch blocks in async operations
- [ ] Error boundaries for React component errors
- [ ] User-friendly error messages
- [ ] Proper error logging (no console.log in production)
- [ ] Graceful degradation patterns

### Documentation
- [ ] README.md up-to-date
- [ ] CLAUDE.md reflects current architecture
- [ ] JSDoc comments for public APIs
- [ ] Inline comments for complex business logic
- [ ] Migration guides for breaking changes

### Testing
- [ ] Unit tests for business logic (>80% coverage)
- [ ] Integration tests for critical paths
- [ ] E2E tests for key user flows
- [ ] Test data factories for consistent fixtures
- [ ] Mock strategies for external dependencies

## Architecture Review Checklist

### Separation of Concerns
- [ ] Business logic separate from presentation
- [ ] Database logic encapsulated in services
- [ ] UI components focus on rendering
- [ ] API routes thin (delegate to services)
- [ ] Server Actions focused (single responsibility)

### Coupling & Cohesion
- [ ] Loose coupling between modules
- [ ] High cohesion within modules
- [ ] Clear module boundaries
- [ ] Minimal circular dependencies
- [ ] Dependency injection where appropriate

### Design Patterns
- [ ] Appropriate use of patterns (no over-engineering)
- [ ] Repository pattern for data access
- [ ] Factory pattern for complex object creation
- [ ] Strategy pattern for varying algorithms
- [ ] Observer pattern for event handling

### SOLID Principles
- [ ] Single Responsibility Principle (one reason to change)
- [ ] Open/Closed Principle (open for extension, closed for modification)
- [ ] Liskov Substitution Principle (subtype substitutability)
- [ ] Interface Segregation Principle (many specific interfaces)
- [ ] Dependency Inversion Principle (depend on abstractions)

## Output Format

Structure findings as follows:

### 🚨 Critical Issues (Must Fix Before Deploy)
- Security vulnerabilities (auth bypass, RLS gaps, XSS, SQL injection)
- Data loss risks (race conditions, missing transactions)
- Breaking changes without migration path
- PII exposure or GDPR violations
- Cross-chapter data leaks

### ⚠️ High Priority (Should Fix This Sprint)
- SOLID principle violations
- Significant code smells (high complexity, deep nesting)
- Missing error handling in critical paths
- Poor separation of concerns
- N+1 query problems
- Missing RLS policies
- Server/Client Component misuse
- Event capacity race conditions
- REBC workflow state inconsistencies

### 📋 Medium Priority (Address in Next Sprint)
- Code duplication
- Naming inconsistencies
- Missing documentation
- Moderate complexity issues (cyclomatic complexity 7-10)
- Suboptimal cache strategies
- Missing validation schemas
- Accessibility gaps (missing ARIA labels)
- Performance optimizations (bundle size, image optimization)

### 💡 Low Priority (Nice to Have)
- Minor style inconsistencies
- Optimization opportunities
- Enhanced readability suggestions
- Additional test coverage for edge cases
- Documentation enhancements

### ✅ Positive Observations
- Highlight well-implemented patterns
- Acknowledge good practices (proper Server Component usage, RLS policies, accessibility)
- Recognize elegant solutions
- Praise adherence to Brookside BI standards

## Advanced Analysis Options

### Parallel Execution Mode (Recommended)
For faster review of large codebases:
```
/review-all --parallel
```
- Analyzes multiple modules concurrently
- Reduces review time by ~50%
- Generates unified report at completion

### Focused Review Modes
Target specific review areas:
```
/review-all --focus=security      # Security-only review
/review-all --focus=performance   # Performance-only review
/review-all --focus=accessibility # Accessibility-only review
/review-all --focus=ams-domain    # AMS-specific business logic
```

### Severity Threshold
Filter findings by minimum severity:
```
/review-all --min-severity=high   # Only CRITICAL and HIGH priority issues
```

## Agent Collaboration

This command can invoke specialized agents for deep dives:

- **security-specialist**: For comprehensive security audit (OWASP Top 10, RLS policies, PII protection)
- **performance-optimizer**: For Core Web Vitals analysis, bundle size optimization, query performance
- **test-engineer**: For test coverage analysis, test quality assessment, testing strategy
- **accessibility-auditor**: For WCAG 2.1 AA/AAA compliance verification

**Example:**
```
For critical security findings, invoke: /invoke security-specialist "Review RLS policies for cross-chapter data leak prevention"
For performance bottlenecks, invoke: /invoke performance-optimizer "Analyze event registration flow for N+1 queries"
```

## Review Execution

When running this review:

1. **Scan codebase structure** - Understand overall organization
2. **Review authentication flows** - Verify Supabase auth patterns, middleware, RLS
3. **Check AMS-specific logic** - Member privacy, chapter isolation, event capacity, REBC workflows
4. **Analyze data flows** - Database queries, Server Components, Server Actions
5. **Assess UI patterns** - shadcn/ui usage, accessibility, responsiveness
6. **Evaluate performance** - Bundle size, Core Web Vitals, caching strategies
7. **Security scan** - OWASP Top 10, exposed secrets, input validation
8. **Generate report** - Structured findings with priority levels

**Estimated Time:** 30-45 minutes for comprehensive review (depends on codebase size)

**Best For:** Pre-release reviews, quarterly code quality audits, onboarding new developers to codebase standards.

## Example Review Findings

### Critical Issue Example: Missing RLS Policy
```
CRITICAL: Missing RLS policy for event_registrations table

Location: supabase/migrations/001_create_event_registrations.sql
Impact: Members can view/cancel registrations from other chapters

Current State:
- RLS enabled: ✅
- SELECT policy: ❌ Missing
- DELETE policy: ❌ Missing

Recommended Fix:
CREATE POLICY "members_view_own_registrations"
ON event_registrations FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "members_cancel_own_registrations"
ON event_registrations FOR DELETE
USING (
  user_id = auth.uid()
  AND status = 'active'
  AND event_id IN (
    SELECT id FROM events WHERE start_date > NOW()
  )
);

Rationale: Establishes data access boundaries that prevent cross-member data leaks and ensure GDPR compliance. Critical for multi-chapter organizations to maintain member trust and organizational governance.
```

### High Priority Example: Race Condition in Event Registration
```
HIGH: Race condition in event capacity enforcement

Location: app/events/[id]/register/actions.ts
Impact: Event overselling possible under concurrent load

Current Implementation:
async function registerForEvent(eventId: string) {
  const { data: event } = await supabase
    .from('events')
    .select('capacity, registered_count')
    .eq('id', eventId)
    .single()

  if (event.registered_count >= event.capacity) {
    throw new Error('Event is full')
  }

  // Race condition: another registration could happen here
  await supabase.from('event_registrations').insert(...)
  await supabase.from('events').update({
    registered_count: event.registered_count + 1
  })
}

Recommended Fix: Use database function with row-level locking
-- See supabase/functions/register_for_event.sql for implementation

Rationale: Establishes reliable capacity enforcement through atomic database operations. This prevents overselling and maintains event integrity—critical for high-demand events like Capitol Conference.
```

### Medium Priority Example: Accessibility Gap
```
MEDIUM: Missing ARIA labels in member search form

Location: app/(dashboard)/members/search-form.tsx
Impact: Screen reader users cannot effectively use search functionality

Current Implementation:
<Input placeholder="Search members..." onChange={handleSearch} />

Recommended Fix:
<Label htmlFor="member-search" className="sr-only">
  Search members by name, email, or chapter
</Label>
<Input
  id="member-search"
  name="member-search"
  placeholder="Search members..."
  onChange={handleSearch}
  aria-label="Search members by name, email, or chapter"
  aria-describedby="search-instructions"
/>
<p id="search-instructions" className="sr-only">
  Type to filter members. Results update as you type.
</p>

Rationale: Establishes accessible user experiences for all members, including those using assistive technologies. Supports organizational inclusivity goals and ensures WCAG 2.1 AA compliance.
```

### Low Priority Example: Performance Optimization
```
LOW: Suboptimal image loading on member directory

Location: app/(dashboard)/members/member-card.tsx
Impact: Slower LCP on member directory page (currently 2.8s, target <2.5s)

Current Implementation:
<img src={member.avatar_url} alt={member.name} />

Recommended Fix:
<Image
  src={member.avatar_url}
  alt={member.name}
  width={64}
  height={64}
  loading="lazy"
  quality={75}
  sizes="(max-width: 768px) 48px, 64px"
/>

Rationale: Establishes optimized image delivery that improves Core Web Vitals and member experience. Using next/image provides automatic optimization, lazy loading, and responsive sizing.
```

## Quality Gates for Approval

Before approving code for production deployment, ensure:

**Security Gates:**
- [ ] No CRITICAL or HIGH security issues remain
- [ ] All RLS policies complete and tested
- [ ] No exposed secrets or credentials
- [ ] Authentication flows verified
- [ ] Input validation complete

**Functionality Gates:**
- [ ] All AMS-specific business logic correct
- [ ] Event capacity race conditions resolved
- [ ] Chapter isolation verified (no cross-chapter leaks)
- [ ] Payment processing idempotent
- [ ] REBC workflow state transitions valid

**Quality Gates:**
- [ ] TypeScript strict mode compliance
- [ ] No Server/Client Component misuse
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Core Web Vitals within targets
- [ ] Test coverage >80% for critical paths

**Documentation Gates:**
- [ ] CLAUDE.md updated with architectural changes
- [ ] README.md reflects current setup
- [ ] Migration guides provided for breaking changes
- [ ] JSDoc comments for public APIs

---

**Brookside BI Note:** This comprehensive review establishes sustainable development practices that drive measurable outcomes in code quality, security posture, and system reliability across multi-chapter association management operations.
