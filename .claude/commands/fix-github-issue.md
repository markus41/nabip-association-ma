# Fix GitHub Issue

Streamline issue resolution by analyzing, implementing, testing, and documenting fixes for GitHub issues in the NABIP AMS repository, establishing sustainable development practices that support long-term growth.

## Purpose

Establishes a comprehensive workflow that transforms GitHub issues into production-ready solutions. This command coordinates multiple specialized agents to ensure fixes are properly analyzed, implemented with sustainable patterns, thoroughly tested, and clearly documented—driving measurable improvements to code quality and issue resolution velocity across your development environment.

## Execution Flow

### Phase 1: Issue Analysis & Context Gathering (0-5 mins)

1. **Fetch issue from GitHub** - Use `mcp__github__issue_read` to retrieve complete issue details
2. **Parse issue context** - Extract title, description, labels, assignees, related issues
3. **senior-reviewer** - Analyze issue requirements and identify affected components
4. **Determine solution strategy** - Select appropriate fix approach and required expertise

### Phase 2: Implementation & Testing (5-25 mins)

5. **Select specialized agent** - Based on issue type:
   - Security issues → **security-specialist** + **vulnerability-hunter**
   - Performance issues → **performance-optimizer**
   - Auth/crypto issues → **cryptography-expert**
   - Database issues → Review RLS policies and migrations
   - UI/Frontend issues → **senior-reviewer** for React/TypeScript best practices

6. **Implement fix** - Apply solution following:
   - Next.js 16 App Router patterns
   - React 19 best practices
   - Supabase RLS and auth patterns
   - TypeScript 5.7 type safety
   - NABIP AMS design philosophy (radical simplicity)

7. **test-strategist** - Create comprehensive test coverage:
   - Unit tests for business logic
   - Integration tests for API/database interactions
   - E2E tests for critical user flows
   - Edge case validation

8. **Run test suite** - Validate fix doesn't introduce regressions:
   - `npm run test` - Unit and integration tests
   - `npm run lint` - Code quality checks
   - `npx tsc --noEmit` - Type safety validation

### Phase 3: Documentation & GitHub Integration (25-35 mins)

9. **documentation-expert** - Document changes:
   - Inline code comments explaining business value first
   - Update relevant README/documentation files
   - Add JSDoc comments for new functions/components
   - Document breaking changes if applicable

10. **Commit changes** - Create conventional commit:
    - Format: `type(scope): Outcome-focused description`
    - Example: `fix(auth): Streamline session refresh to eliminate token expiration errors`
    - Include co-author: `Co-Authored-By: Claude <noreply@anthropic.com>`

11. **Update GitHub issue** - Add comprehensive status comment:
    ```markdown
    ## ✅ Issue Resolved

    **Solution Implemented:**
    [Brief description of fix]

    **Changes Made:**
    - File 1: Description
    - File 2: Description

    **Testing:**
    - ✅ Unit tests: X passing
    - ✅ Integration tests: Y passing
    - ✅ Type checks: Passing
    - ✅ Linting: Passing

    **Commit**: [SHA reference]

    **Next Steps:**
    - Preview deployment will be automatically created
    - Review changes in staging before production release

    ---
    *Automated fix establishing reliable issue resolution workflows*
    ```

12. **Close issue** - Update issue state:
    - Tool: `mcp__github__issue_write`
    - Parameters: `method: "update"`, `state: "closed"`, `state_reason: "completed"`
    - Add appropriate labels: `status:fixed`, `verified`

## Usage Examples

### Example 1: Fix Authentication Bug

```
/fix-github-issue 42

Input: Issue #42 - "Session tokens expire unexpectedly during checkout"

Workflow:
1. Fetches issue #42 from GitHub via MCP
2. senior-reviewer analyzes: Session refresh timing issue in Supabase Auth
3. security-specialist validates: No security vulnerabilities in current implementation
4. Implements fix: Update session refresh interval in auth middleware
5. test-strategist creates: Auth session persistence tests
6. Runs test suite: All tests passing
7. documentation-expert updates: Auth configuration documentation
8. Commits: "fix(auth): Streamline session refresh to eliminate checkout interruptions"
9. Updates GitHub issue with implementation summary
10. Closes issue #42 with verified label

Expected outcome: Authentication flow maintains stable sessions throughout user workflows, improving checkout conversion rates
```

### Example 2: Fix Database Performance Issue

```
/fix-github-issue 67

Input: Issue #67 - "Member directory search is slow with 20,000+ members"

Workflow:
1. Fetches issue #67 from GitHub
2. performance-optimizer analyzes: Full table scan on members table
3. Implements fix: Add composite index on search fields
4. Creates migration: supabase/migrations/20250115_add_member_search_index.sql
5. test-strategist creates: Performance benchmarks and query tests
6. Validates: Query time reduced from 3.2s to 0.15s
7. documentation-expert updates: Database indexing strategy docs
8. Commits: "perf(database): Improve member search response time by 95% with targeted indexing"
9. Updates issue with performance metrics
10. Closes issue with performance improvement documented

Expected outcome: Member directory search responds in <200ms, supporting scalable operations for 20,000+ members
```

### Example 3: Fix Accessibility Issue

```
/fix-github-issue 83

Input: Issue #83 - "Event registration form fails WCAG 2.1 AA compliance"

Workflow:
1. Fetches issue #83 from GitHub
2. senior-reviewer analyzes: Missing ARIA labels and keyboard navigation
3. Implements fix:
   - Add proper ARIA labels to form inputs
   - Implement keyboard navigation for date picker
   - Add focus indicators for all interactive elements
4. test-strategist creates: Accessibility test suite using axe-core
5. Validates: WCAG 2.1 AA compliance achieved
6. documentation-expert updates: Accessibility guidelines
7. Commits: "fix(a11y): Establish accessible event registration supporting all users"
8. Updates issue with accessibility compliance report
9. Closes issue with a11y label

Expected outcome: Event registration accessible to all users including those using assistive technologies
```

### Example 4: Fix Critical Security Vulnerability

```
/fix-github-issue 91

Input: Issue #91 - "SQL injection vulnerability in campaign filtering"

Workflow:
1. Fetches issue #91 (labeled: security, priority:critical)
2. security-specialist + vulnerability-hunter analyze: Unsanitized user input
3. cryptography-expert validates: Proper parameterized query implementation
4. Implements fix: Replace string concatenation with Supabase query builders
5. test-strategist creates: SQL injection attack tests
6. Runs security scan: No vulnerabilities detected
7. documentation-expert updates: Security best practices guide
8. Commits: "security: Eliminate SQL injection risk in campaign filters through parameterized queries"
9. Updates issue with security audit results
10. Closes issue, adds to security advisory if needed

Expected outcome: Campaign filtering protected against injection attacks, maintaining data integrity across member operations
```

### Example 5: Fix Documentation Gap

```
/fix-github-issue 104

Input: Issue #104 - "No documentation for REBC certification workflow"

Workflow:
1. Fetches issue #104 from GitHub
2. documentation-expert analyzes: Missing workflow documentation
3. Creates comprehensive documentation:
   - API reference for certification endpoints
   - User guide for application process
   - Admin guide for approval workflow
   - Mermaid diagrams for process flows
4. Adds code examples and integration patterns
5. Updates: README, CONTRIBUTING.md, docs/ directory
6. Commits: "docs: Establish comprehensive REBC certification workflow documentation"
7. Updates issue with documentation links
8. Closes issue

Expected outcome: Complete REBC certification documentation enabling smooth onboarding and efficient workflow management
```

## GitHub MCP Integration Pattern

### Step 1: Fetch Issue Details
```markdown
Tool: mcp__github__issue_read
Parameters:
  - owner: "markus41"
  - repo: "nabip-association-ma"
  - issue_number: <issue_number>
  - method: "get"

Response: Complete issue object with title, body, labels, assignees, comments
```

### Step 2: Add Progress Comment
```markdown
Tool: mcp__github__add_issue_comment
Parameters:
  - owner: "markus41"
  - repo: "nabip-association-ma"
  - issue_number: <issue_number>
  - body: "🔄 **In Progress** - Analyzing issue and implementing fix..."

Use during implementation to keep stakeholders informed
```

### Step 3: Update and Close Issue
```markdown
Tool: mcp__github__issue_write
Parameters:
  - method: "update"
  - owner: "markus41"
  - repo: "nabip-association-ma"
  - issue_number: <issue_number>
  - state: "closed"
  - state_reason: "completed"

Add final comment with implementation summary before closing
```

## Agent Selection Logic

```markdown
IF issue.labels contains "security" OR "vulnerability":
  → security-specialist + vulnerability-hunter

ELSE IF issue.labels contains "performance" OR "optimization":
  → performance-optimizer

ELSE IF issue.labels contains "auth" OR "authentication":
  → cryptography-expert + security-specialist

ELSE IF issue.labels contains "database" OR "supabase":
  → Validate RLS policies, check migration patterns

ELSE IF issue.labels contains "ui" OR "frontend":
  → senior-reviewer (React/TypeScript expertise)

ELSE IF issue.labels contains "docs" OR "documentation":
  → documentation-expert

ELSE:
  → senior-reviewer (general code review and implementation)

ALWAYS include:
  → test-strategist (for test coverage)
  → documentation-expert (for code documentation)
```

## Success Criteria

- ✅ Issue details successfully retrieved from GitHub via MCP
- ✅ Root cause identified with clear solution strategy
- ✅ Fix implemented following Next.js 16/React 19/Supabase best practices
- ✅ Test coverage created achieving >80% coverage for affected code
- ✅ All existing tests pass (no regressions introduced)
- ✅ Type safety validated (TypeScript compilation successful)
- ✅ Code quality verified (linting passes)
- ✅ Documentation updated with Brookside BI brand voice
- ✅ Conventional commit created with outcome-focused message
- ✅ GitHub issue updated with comprehensive implementation summary
- ✅ Issue closed with appropriate state_reason and labels
- ✅ Changes ready for preview deployment and validation

## Command Execution Template

When you run `/fix-github-issue <number>`, I will:

1. **Acknowledge** the command and issue number
2. **Fetch** the issue from GitHub using MCP
3. **Analyze** the issue with senior-reviewer
4. **Delegate** to appropriate specialized agent(s)
5. **Implement** the fix following NABIP AMS patterns
6. **Test** with comprehensive test coverage
7. **Document** all changes with business-value-first approach
8. **Commit** with conventional commit message
9. **Update** GitHub issue with progress and resolution
10. **Close** the issue with verification

## Notes

- **Always fetch issue first** - Understand full context before implementation
- **Use appropriate agents** - Select based on issue labels and type
- **Follow Conventional Commits** - `fix:`, `feat:`, `docs:`, `refactor:`, `perf:`, `security:`
- **Update GitHub proactively** - Add progress comments for transparency
- **Verify with tests** - Never close without comprehensive test coverage
- **Apply Brookside BI voice** - Outcome-focused, professional, consultative
- **Document business value** - Explain "why" before "what" in code comments
- **Ensure type safety** - Leverage TypeScript for reliability
- **Validate accessibility** - Consider WCAG compliance for UI changes
- **Review security** - Security-specialist for auth, data access, or sensitive operations
- **Check RLS policies** - Database changes require Row Level Security validation
- **Performance considerations** - Monitor query performance and bundle size
- **Mobile responsiveness** - Test on multiple device sizes for UI changes

## Estimated Execution Time

- **Simple fixes** (typos, small UI tweaks): 10-15 minutes
- **Standard bugs** (logic errors, edge cases): 20-30 minutes
- **Complex features** (new functionality, integrations): 35-50 minutes
- **Security issues** (vulnerabilities, auth): 30-45 minutes (includes security audit)
- **Performance optimization**: 25-40 minutes (includes benchmarking)

---

*Establishing comprehensive issue resolution workflows designed to streamline development operations and drive measurable improvements to NABIP AMS code quality across your environment*
