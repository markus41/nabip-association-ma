<!--
  🎯 NABIP AMS Pull Request Template
  This template integrates with automated workflows and specialized review agents.
  Delete sections that don't apply to your PR.
-->

## 📋 Summary

<!--
  Provide a clear, concise summary (2-3 sentences) of what this PR accomplishes.
  Lead with the business value or problem solved.
-->



## 🔗 Related Issues

<!-- Link related issues using GitHub keywords: Closes, Fixes, Resolves, Related to -->

Closes #
Related to #

---

## 🏷️ Change Classification

**Type** (check one):
- [ ] ✨ Feature - New functionality (member management, events, campaigns, etc.)
- [ ] 🐛 Bug Fix - Resolves incorrect behavior
- [ ] 🎨 UI/UX - Visual design, layout, or interaction improvements
- [ ] ⚡ Performance - Speed, efficiency, or optimization improvements
- [ ] 📚 Documentation - README, guides, or inline code comments
- [ ] 🔐 Security - Authentication, authorization, or vulnerability fixes
- [ ] 🗄️ Database - Schema changes, migrations, or query optimization
- [ ] ♻️ Refactor - Code restructuring without changing behavior
- [ ] 🔧 Configuration - Build tools, environment, or deployment config
- [ ] 📦 Dependencies - Package updates or dependency management

**Impact Areas** (check all that apply):
- [ ] Members Management
- [ ] Chapter Hierarchy
- [ ] Events & Registration
- [ ] Learning Courses (REBC)
- [ ] Campaigns & Communications
- [ ] Financial Reporting
- [ ] Authentication/Authorization
- [ ] API/Backend
- [ ] UI Components
- [ ] Database Schema

**Technology Stack** (check all that apply):
- [ ] React/TypeScript
- [ ] Vite Build Configuration
- [ ] Supabase (Database/Auth)
- [ ] Tailwind CSS/Radix UI
- [ ] Vercel Deployment

**Suggested Labels**:
<!-- e.g., type:feature, area:members, tech:react, priority:high, size:medium -->
`type:`, `area:`, `tech:`, `priority:`, `size:`

---

## 📝 Changes Made

<!--
  Bullet list of specific changes (not checkboxes).
  Focus on WHAT changed and WHY, not implementation details.
-->

-
-
-

---

## 💥 Breaking Changes

<!--
  ⚠️ REQUIRED if this PR contains breaking changes.
  Delete this section if not applicable.
-->

<details>
<summary>🚨 This PR contains breaking changes - Click to expand migration guide</summary>

### What's Breaking
<!-- Describe what existing functionality will break -->

### Migration Guide
<!-- Step-by-step instructions for users/developers to adapt -->
1.
2.
3.

### Deprecation Timeline
<!-- When will deprecated features be removed? -->

### Rollback Plan
<!-- How to revert if issues arise post-deployment -->

</details>

---

## 📸 Visual Changes

<!--
  REQUIRED for UI/UX changes. Delete if not applicable.
  Include screenshots or screen recordings showing before/after.
-->

<details>
<summary>🎨 Visual Changes - Click to expand</summary>

### Before
<!-- Screenshot or "N/A - New Feature" -->


### After
<!-- Screenshot or video demonstrating changes -->


### Responsiveness Verification
- [ ] Mobile (320px - 767px)
- [ ] Tablet (768px - 1023px)
- [ ] Desktop (1024px+)

### Theme Verification
- [ ] Light mode
- [ ] Dark mode

### Accessibility Verification
- [ ] Keyboard navigation works
- [ ] Screen reader tested (or N/A)
- [ ] Color contrast meets WCAG AA (4.5:1)

</details>

---

## ⚡ Performance Impact

<!--
  REQUIRED for UI components, database queries, or API changes.
  Delete if not applicable.
-->

<details>
<summary>⚡ Performance Metrics - Click to expand</summary>

### Bundle Size Impact
<!-- Run `pnpm build` and check bundle analyzer -->
- Main bundle: <!-- e.g., +12kb, -5kb, or "No change" -->
- Lazy-loaded chunks: <!-- New chunks created? -->

### Lighthouse Scores
<!-- Run Lighthouse or wait for automated CI check -->
- Performance: <!-- Before → After (or "See CI results") -->
- Accessibility: <!-- Before → After (or "See CI results") -->

### Database/API Performance
- [ ] No new N+1 query issues
- [ ] Queries use proper indexes
- [ ] API response time < 500ms (or explain why not)

### Large Dataset Testing
- [ ] Tested with 100+ records (if applicable)
- [ ] Virtualization implemented for long lists (if applicable)

</details>

---

## 🔒 Security Considerations

<!--
  REQUIRED for authentication, data handling, or user input changes.
  Delete if not applicable.
-->

<details>
<summary>🔒 Security Checklist - Click to expand</summary>

- [ ] User input properly validated and sanitized
- [ ] No SQL injection vulnerabilities (using Supabase query builders)
- [ ] No XSS vulnerabilities (using React's built-in escaping)
- [ ] Authentication/authorization checks in place
- [ ] Sensitive data not exposed in logs or errors
- [ ] No credentials or secrets in code (using environment variables)
- [ ] Row Level Security (RLS) policies implemented for new tables
- [ ] CSRF protection maintained (if form submission)

**Security Impact**: <!-- None, Low, Medium, High, Critical -->

</details>

---

## 🧪 Testing Strategy

<!--
  Focus on MANUAL testing and edge cases.
  Automated checks (TypeScript, ESLint, build) are handled by CI.
-->

### Manual Testing Completed
- [ ] Tested happy path scenarios
- [ ] Tested error cases and edge conditions
- [ ] Verified user permissions/authorization (if applicable)
- [ ] Tested with realistic data volumes
- [ ] Verified loading/empty states display correctly

### Test Coverage
<!-- Only if adding/modifying tests -->
- [ ] Unit tests added for new utility functions
- [ ] Integration tests added for new features
- [ ] E2E tests updated (if user-facing workflow changed)
- [ ] Test coverage maintained or improved

### Browser/Device Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers (if UI changes)

---

## 🚀 Deployment Notes

<!--
  REQUIRED if deployment requires special steps.
  Delete if standard deployment.
-->

<details>
<summary>🚀 Deployment Checklist - Click to expand</summary>

### Environment Variables
<!-- List any new or modified environment variables -->
```bash
# Add these to Vercel environment settings:
# NEXT_PUBLIC_FEATURE_FLAG_NAME=true
# SUPABASE_NEW_PERMISSION=value
```

- [ ] Updated `.env.example` with new variables
- [ ] Documented in README or deployment docs
- [ ] Added to Vercel dashboard (production + preview)

### Database Migrations
<!-- Required for schema changes -->
- [ ] Migration script created in `supabase/migrations/`
- [ ] Migration tested locally
- [ ] Rollback script prepared (if complex change)
- [ ] RLS policies updated for new tables/columns

### Deployment Order
<!-- If changes require specific deployment sequence -->
1.
2.
3.

### Feature Flags
- [ ] Feature behind flag (if phased rollout needed)
- [ ] Flag documented with removal plan

### Monitoring
<!-- What to watch after deployment -->
- Watch for:
- Alert thresholds:

</details>

---

## 👥 Reviewer Guidance

<!--
  Help reviewers focus their attention effectively.
-->

### Focus Areas
<!-- What should reviewers pay special attention to? -->
-
-

### Suggested Reviewers
<!-- Tag specific people or teams by expertise area -->
- **UI/UX**: <!-- @username -->
- **Backend/Database**: <!-- @username -->
- **Security**: <!-- @username (if security changes) -->
- **Accessibility**: <!-- @username (if a11y changes) -->

### Specialized Agent Recommendations
<!-- Reference agents in .github/agents/ that could help review this PR -->

Consider using these specialized review agents:
- [ ] `react-component-architect` - For component design and composition
- [ ] `form-validation-architect` - For form validation patterns
- [ ] `database-architect` - For schema changes and query optimization
- [ ] `navigation-accessibility-agent` - For accessibility compliance
- [ ] `performance-optimization-engineer` - For bundle and render optimization
- [ ] `security-specialist` - For security vulnerability assessment

---

## 🤖 Automated Checks

<!--
  These workflows run automatically - no manual verification needed.
  Links will be populated by GitHub Actions.
-->

The following automated checks will run on this PR:

- ✅ **CI Build & Type Check** - Validates TypeScript and builds successfully
- ✅ **ESLint & Code Quality** - Ensures code style compliance
- ✅ **Accessibility Auditor** - Validates WCAG 2.1 AA compliance
- ✅ **Security Comprehensive** - Scans for vulnerabilities
- ✅ **Lighthouse CI** - Measures performance, accessibility, SEO
- ✅ **Dependency Auditor** - Checks for vulnerable dependencies
- ✅ **PR Enhancement Bot** - Auto-labels, size analysis, review checklist
- ✅ **Vercel Preview** - Deploys preview environment

**Note**: Focus your review on business logic, user experience, and code maintainability. The above checks validate technical compliance automatically.

---

## ✅ Pre-Submission Checklist

<!-- Final validation before requesting review -->

- [ ] Self-review completed (reviewed own code changes)
- [ ] Code follows [Brookside BI brand voice](../CLAUDE.md) (business value first in comments)
- [ ] Follows [contribution guidelines](../CONTRIBUTING.md)
- [ ] Breaking changes documented with migration guide (if applicable)
- [ ] Visual changes include before/after screenshots (if applicable)
- [ ] Performance impact assessed (if applicable)
- [ ] Security considerations addressed (if applicable)
- [ ] Documentation updated (README, CLAUDE.md, inline comments as needed)
- [ ] Changelog entry added for user-facing changes
- [ ] Deployment notes documented (if special steps required)

---

## 📌 Additional Context

<!--
  Any additional information reviewers should know:
  - Known limitations or technical debt
  - Future improvements planned
  - Context about architectural decisions
  - References to external documentation or designs
-->



---

<!--
  💡 New Contributor?

  Welcome to NABIP AMS development! This repository follows structured development practices:

  - **Setup**: Run `pnpm install` and configure `.env.local` with Supabase credentials
  - **Development**: Use `pnpm dev` for local testing with hot reload
  - **Building**: Run `pnpm build` to validate production build
  - **Standards**: Follow [Conventional Commits](https://www.conventionalcommits.org/) and TypeScript strict mode
  - **Brand Voice**: Follow [Brookside BI guidelines](../CLAUDE.md) - business value first

  See [CONTRIBUTING.md](../CONTRIBUTING.md) for complete onboarding guide.

  Questions? Check existing PRs for examples or reach out in discussions.
-->
