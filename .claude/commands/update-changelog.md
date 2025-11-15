# Update Changelog

Generate comprehensive changelog from Git commit history using Conventional Commits format, establishing structured release documentation that supports transparent communication and sustainable project management across the AMS Platform.

## Command Definition

You are a Git workflow specialist focused on establishing automated changelog generation processes that streamline release documentation and improve visibility into project evolution for stakeholders across the organization.

When the user invokes this command, analyze commit history and generate a professionally formatted CHANGELOG.md that follows industry standards while maintaining Brookside BI brand voice and visual presentation.

### Workflow Overview

Execute the following steps to transform Git commit history into actionable release documentation that drives measurable transparency and stakeholder confidence.

### Step 1: Analyze Git Repository

**Objective**: Establish baseline understanding of repository state and release history

**Execution**:

1. Check current branch and repository status
2. Identify latest release tag (if any)
3. Determine commit range for changelog generation
4. Validate Git repository is in clean state

**Commands**:

```bash
# Get repository status
git status

# List all tags sorted by version
git tag --sort=-v:refname

# Get latest tag
git describe --tags --abbrev=0 2>/dev/null || echo "No tags found"

# Count commits since last tag
git rev-list --count HEAD ^$(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD")
```

**Decision Logic**:

- **If tags exist**: Generate changelog since most recent tag
- **If no tags exist**: Generate changelog for entire commit history
- **User override**: Allow user to specify custom commit range (e.g., `v1.0.0..HEAD`)

### Step 2: Gather User Configuration

Use the AskUserQuestion tool to collect changelog generation preferences:

**Question 1: Changelog Scope**

- **Question**: "What range of commits should be included in the changelog?"
- **Header**: "Commit Range"
- **multiSelect**: false
- **Options**:
- **label**: "Since Last Tag"
- **description**: "Generate changelog for all commits since the most recent release tag"
- **label**: "All Commits"
- **description**: "Generate comprehensive changelog for entire repository history"
- **label**: "Custom Range"
- **description**: "Specify custom Git commit range (e.g., v1.0.0..HEAD, main~10..HEAD)"
- **label**: "Since Specific Date"
- **description**: "Generate changelog for commits after a specific date"

**Question 2: Include Optional Elements**

- **Question**: "Which additional elements would you like to include in the changelog?"
- **Header**: "Elements"
- **multiSelect**: true
- **Options**:
- **label**: "Mermaid Timeline"
- **description**: "Add visual timeline diagram showing release progression (recommended)"
- **label**: "Author Credits"
- **description**: "Include commit author names and contributor statistics"
- **label**: "PR Links"
- **description**: "Link commits to Pull Requests on GitHub (requires GitHub repository)"
- **label**: "Breaking Changes"
- **description**: "Highlight breaking changes section prominently (recommended for major versions)"

**Question 3: Changelog Format**

- **Question**: "What changelog format would you prefer?"
- **Header**: "Format"
- **multiSelect**: false
- **Options**:
- **label**: "Keep a Changelog"
- **description**: "Industry-standard format following keepachangelog.com guidelines (recommended)"
- **label**: "Conventional Commits"
- **description**: "Grouped by commit type (feat, fix, docs, etc.) with technical focus"
- **label**: "Brookside BI Enhanced"
- **description**: "Custom format emphasizing business outcomes and stakeholder communication"

### Step 3: Parse Commit History

**Objective**: Extract and categorize commits using Conventional Commits specification

**Conventional Commits Pattern**:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Commit Types to Track**:

- `feat`: New features (user-facing functionality)
- `fix`: Bug fixes (resolves user-reported or internal issues)
- `docs`: Documentation changes (content, guides, references)
- `chore`: Maintenance tasks (dependencies, tooling, build processes)
- `refactor`: Code refactoring (no functional changes)
- `test`: Test additions or modifications
- `perf`: Performance improvements
- `ci`: Continuous integration changes
- `build`: Build system changes
- `style`: Code style changes (formatting, no functional impact)
- `revert`: Revert previous commits

**Breaking Changes Detection**:

- Footer contains `BREAKING CHANGE:` or `!` in type/scope
- Example: `feat!: redesign authentication flow`

**Parsing Execution**:

```bash
# Get commit history in parseable format
git log <commit-range> --pretty=format:"%H|%an|%ae|%ad|%s|%b" --date=short

# Example output:
# abc123|John Doe|john@example.com|2025-01-15|feat: add user authentication|Added JWT-based auth
# def456|Jane Smith|jane@example.com|2025-01-14|fix: resolve login timeout|Fixed session handling
```

**Parsing Logic**:

```typescript
interface ParsedCommit {
 hash: string;
 author: string;
 email: string;
 date: string;
 type: string;
 scope?: string;
 description: string;
 body: string;
 breaking: boolean;
 prNumber?: string;
}

function parseCommit(commitLine: string): ParsedCommit {
 // Extract commit metadata
 const [hash, author, email, date, subject, body] = commitLine.split('|');

 // Parse Conventional Commit format
 const conventionalPattern = /^(\w+)(\([\w-]+\))?(!)?:\s*(.+)$/;
 const match = subject.match(conventionalPattern);

 if (!match) {
 // Non-conventional commit - categorize as 'chore'
 return {
 hash,
 author,
 email,
 date,
 type: 'chore',
 description: subject,
 body,
 breaking: false
 };
 }

 const [_, type, scope, breakingFlag, description] = match;

 // Check for breaking changes
 const breaking = !!breakingFlag || body.includes('BREAKING CHANGE:');

 // Extract PR number from commit message
 const prMatch = subject.match(/#(\d+)/);
 const prNumber = prMatch ? prMatch[1] : undefined;

 return {
 hash,
 author,
 email,
 date,
 type,
 scope: scope?.replace(/[()]/g, ''),
 description,
 body,
 breaking,
 prNumber
 };
}
```

### Step 4: Generate Changelog Content

**Objective**: Transform parsed commits into professionally formatted changelog

#### Format Option 1: Keep a Changelog

```markdown
# Changelog

All notable changes to the AMS Platform Documentation will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

---

## [Unreleased] - {Current Date}

### Added
- **Authentication System**: Established JWT-based authentication to streamline secure access across multi-tenant operations ([#123](https://github.com/org/repo/pull/123))
- **Custom Vue Components**: Created FeatureShowcase and ComparisonTable components to improve documentation visibility ([abc123](https://github.com/org/repo/commit/abc123))
- **Progressive Disclosure Pattern**: Implemented role-based content presentation to support diverse audience needs

### Changed
- **Build Pipeline**: Enhanced VitePress configuration to drive faster build times (15s → 8s improvement) ([#125](https://github.com/org/repo/pull/125))
- **Navigation Structure**: Restructured sidebar organization to establish more intuitive information architecture

### Fixed
- **Broken Links**: Resolved 12 dead links across documentation to ensure reliable user experience ([#124](https://github.com/org/repo/pull/124))
- **Mobile Responsiveness**: Fixed layout issues on devices below 768px width
- **Dark Mode**: Corrected brand color contrast ratios for WCAG AA compliance

### Deprecated
- **Legacy API Endpoints**: Marked v1 API routes for removal in next major version

### Removed
- **Unused Dependencies**: Eliminated 5 deprecated npm packages to streamline maintenance burden

### - **Dependency Updates**: Upgraded VitePress to v1.0.0 to address CVE-2024-XXXX vulnerability

### - **Quick Start Guide**: Added comprehensive onboarding documentation to reduce time-to-productivity for new contributors
- **Architecture Diagrams**: Enhanced system design documentation with Mermaid visualizations

### Breaking Changes
WARNING: **Authentication Migration Required**
- All API endpoints now require JWT authentication
- Legacy session-based auth will be removed in v2.0.0
- Migration guide: [Authentication Migration](./docs/guide/auth-migration.md)

---

## [1.0.0] - 2025-01-10

### Added
- Initial VitePress documentation site
- Brookside BI brand styling and custom CSS
- GitHub Pages deployment automation
- Custom Vue components for enhanced documentation

### - Comprehensive README with setup instructions
- Contributing guidelines
- Code of conduct
- License documentation

---

**Contributors**: {Author Count} contributors
- {Author Name 1} ({Commit Count} commits)
- {Author Name 2} ({Commit Count} commits)

**Total Commits**: {Total Count}
**Repository**: [AMS Documentation](https://github.com/org/repo)
```

#### Format Option 2: Conventional Commits

```markdown
# Changelog

Generated from Git commit history using Conventional Commits specification.

**Period**: {Start Date} to {End Date}
**Commits Analyzed**: {Count}

---

## Features (feat)

### Core Features
- **Authentication**: Established JWT-based authentication system to streamline secure access ([abc123](https://github.com/org/repo/commit/abc123))
 - Author: John Doe
 - Date: 2025-01-15
 - PR: [#123](https://github.com/org/repo/pull/123)

- **Component Library**: Created reusable Vue components for documentation enhancement ([def456](https://github.com/org/repo/commit/def456))
 - Components: FeatureShowcase, ComparisonTable, InteractiveDemo
 - Author: Jane Smith
 - Date: 2025-01-14

### Features
- **Progressive Disclosure**: Implemented role-based content presentation pattern ([ghi789](https://github.com/org/repo/commit/ghi789))
 - Supports: Developers, DevOps, Architects, Business Stakeholders
 - Author: John Doe
 - Date: 2025-01-13

---

## Bug Fixes (fix)

- **Link Validation**: Resolved 12 broken internal links across documentation ([jkl012](https://github.com/org/repo/commit/jkl012))
 - Impact: Improved navigation reliability
 - Files affected: 8
 - Author: Jane Smith
 - PR: [#124](https://github.com/org/repo/pull/124)

- **Mobile Layout**: Fixed responsive design issues on small devices ([mno345](https://github.com/org/repo/commit/mno345))
 - Breakpoint: 768px and below
 - Components fixed: Navigation, Sidebar, Feature cards

---

## (docs)

- **Quick Start Guide**: Added comprehensive onboarding documentation ([pqr678](https://github.com/org/repo/commit/pqr678))
 - Time savings: 30 min → 10 min for new contributors
 - Sections: Installation, Configuration, First PR

- **Architecture Diagrams**: Enhanced technical documentation with Mermaid visualizations ([stu901](https://github.com/org/repo/commit/stu901))
 - Diagrams added: 5 (system architecture, data flow, deployment, CI/CD, component structure)

---

## Chores (chore)

- **Dependency Updates**: Upgraded VitePress from v0.22.4 to v1.0.0 ([vwx234](https://github.com/org/repo/commit/vwx234))
 - Breaking changes: Configuration format updated
 - Migration completed: Yes

- **Build Optimization**: Enhanced build pipeline for faster deployment ([yza567](https://github.com/org/repo/commit/yza567))
 - Build time improvement: 15s → 8s (47% reduction)

---

## Breaking Changes WARNING:

### Authentication System Redesign
**Commit**: [abc123](https://github.com/org/repo/commit/abc123)
**Author**: John Doe
**Date**: 2025-01-15

**Change**: Migrated from session-based to JWT authentication

**Impact**:
- All API endpoints require JWT tokens
- Legacy session cookies no longer accepted
- Client applications must update authentication flow

**Migration Guide**: [Authentication Migration](./docs/guide/auth-migration.md)

**Timeline**: Legacy auth supported until v2.0.0 (Est. Q2 2025)

---

## Statistics

**Commit Breakdown**:
- Features: 15 commits (42%)
- Bug Fixes: 8 commits (22%)
- Documentation: 7 commits (19%)
- Chores: 5 commits (14%)
- Refactoring: 1 commit (3%)

**Contributors**: 8 developers
**Total Commits**: 36
**Lines Changed**: +2,847 / -1,234

**Top Contributors**:
1. John Doe - 15 commits (42%)
2. Jane Smith - 12 commits (33%)
3. Bob Johnson - 9 commits (25%)

---

**Generated**: {Current DateTime}
**Tool**: Claude Code Changelog Generator
**Format**: Conventional Commits v1.0.0
```

#### Format Option 3: Brookside BI Enhanced

```markdown
# AMS Platform Documentation - Release History

> **Purpose**: Establish transparent communication of platform evolution to drive stakeholder confidence and support informed decision-making across the organization.

**Maintained By**: Brookside Business Intelligence
**Documentation Site**: [AMS Documentation](https://brookside-buisness-intelligence.github.io/ams-docs/)

---

## Latest Release - {Current Date}

### Business Impact Summary

This release delivers significant improvements across three key areas:

1. **Operational Efficiency**: Streamlined documentation workflows reduce contributor onboarding time from 30 minutes to 10 minutes (67% improvement)
2. **System Security**: Enhanced authentication framework establishes enterprise-grade access control across multi-tenant environments
3. **User Experience**: Improved navigation and mobile responsiveness drive measurable improvements in documentation accessibility

### What's New

#### Streamlined Authentication Framework
**Business Value**: Establish secure, scalable access control to protect sensitive organizational data across distributed teams.

**Technical Implementation**:
- JWT-based authentication system with role-based access control
- Session management optimized for multi-tenant architectures
- Integration-ready design supports future SSO implementations

**Migration Required**: Yes - [View Migration Guide](./docs/guide/auth-migration.md)
**Stakeholder Impact**: All users will need to re-authenticate once; subsequent logins streamlined
**Timeline**: Deployment scheduled for {Date}

#### Enhanced Documentation Components
**Business Value**: Improve content presentation to support diverse audience needs and drive faster knowledge acquisition.

**Deliverables**:
- **FeatureShowcase Component**: Visual presentation of platform capabilities
- **ComparisonTable Component**: Side-by-side technology evaluations
- **InteractiveDemo Component**: Hands-on learning experiences

**Time Savings**: Documentation page creation reduced from 25 minutes to 3 minutes
**Maintenance Impact**: Consistent component reuse ensures brand alignment across all documentation

#### Progressive Disclosure Implementation
**Business Value**: Establish role-based content delivery that ensures each stakeholder receives relevant information without overwhelming technical detail.

**Supported Roles**:
- **Developers**: Technical implementation details, code examples, API references
- **DevOps Engineers**: Deployment guides, infrastructure architecture, monitoring setup
- **Architects**: System design patterns, scalability considerations, integration strategies
- **Business Stakeholders**: Business outcomes, ROI metrics, strategic roadmap

**Effectiveness**: 40% reduction in support inquiries due to improved content targeting

### Issues Resolved

#### Critical Fixes
- **Navigation Reliability**: Resolved 12 broken internal links that impacted user journey continuity
 - **Impact**: 100% link validation passing
 - **Benefit**: Improved user confidence and reduced support burden

- **Mobile Accessibility**: Fixed responsive design issues affecting 35% of mobile users
 - **Devices Affected**: Smartphones and tablets below 768px width
 - **Improvement**: Mobile usability score increased from 72/100 to 94/100

#### Performance Optimizations
- **Build Pipeline**: Enhanced VitePress configuration drives 47% faster deployment (15s → 8s)
 - **Business Impact**: Accelerated release cycles enable more frequent documentation updates
 - **Developer Impact**: Faster local development iteration

### Infrastructure Improvements

#### Dependency Security Updates
**Objective**: Maintain secure, reliable documentation infrastructure that protects organizational assets and ensures compliance.

**Updates Applied**:
- VitePress v0.22.4 → v1.0.0 (Security patches + feature enhancements)
- Vue v3.3.8 → v3.3.11 (Stability improvements)
- 5 deprecated packages removed (Reduced maintenance burden)

**Security Impact**: Addressed 1 critical, 2 high-priority vulnerabilities
**Compliance**: Maintains SOC 2 Type II requirements for documentation infrastructure

### Breaking Changes & Migration Guidance

WARNING: **Action Required: Authentication System Migration**

**What Changed**: Transitioned from session-based to JWT authentication framework

**Why This Matters**: Establishes scalable authentication that supports future enterprise integrations (SSO, SAML, OAuth) while improving security posture.

**Who Is Affected**: All users and API integrations

**What You Need to Do**:
1. Review [Authentication Migration Guide](./docs/guide/auth-migration.md)
2. Update client applications to use JWT tokens (if applicable)
3. Test authentication flow in staging environment
4. Schedule production migration within 30-day grace period

**Support Available**:
- Migration workshop: {Date} at {Time}
- Email: Consultations@BrooksideBI.com
- Phone: +1 209 487 2047

**Timeline**: Legacy authentication supported until {Date}, then deprecated

---

## Previous Releases

### [1.0.0] - 2025-01-10

**Milestone**: Initial production-ready documentation platform

**Achievements**:
- VitePress documentation site deployed to GitHub Pages
- Brookside BI brand identity implemented across all components
- Automated CI/CD pipeline established for continuous deployment
- Comprehensive contribution guidelines published
- 23 documentation pages covering core platform features

**Contributors**: 8 team members
**Total Effort**: 240 hours across 4 weeks
**Documentation Coverage**: 85% of platform features documented

---

## Roadmap Preview

**Upcoming Enhancements** (Target: Q1 2025):
- Goal Interactive API explorer with live examples
- Goal Video tutorials for common workflows
- Goal Multi-language support (Spanish, French)
- Goal Advanced search with AI-powered suggestions
- Goal Version-specific documentation (support multiple AMS versions)

**Your Input Matters**: Share feedback and feature requests at [Consultations@BrooksideBI.com](mailto:Consultations@BrooksideBI.com)

---

## Changelog Metrics & Insights

### Release Velocity
```mermaid
timeline
 title AMS Documentation Release Timeline
 section 2025
 Jan 10 : Initial Release
 : v1.0.0
 : 23 pages
 Jan 25 : Enhanced Auth
 : v1.1.0
 : 36 commits
 Feb 15 : Component Library
 : v1.2.0
 : Planned
```

### Contribution Statistics

**This Period**:

- **Total Commits**: 36
- **Active Contributors**: 8
- **Files Changed**: 127
- **Lines Added**: 2,847
- **Lines Removed**: 1,234

**Top Contributors**:

1. John Doe - 15 commits (Authentication, Infrastructure)
2. Jane Smith - 12 commits (Components, Documentation)
3. Bob Johnson - 9 commits (Bug Fixes, Testing)

### Quality Metrics

**Documentation Health**:

- Build Success Rate: 100%
- Link Validation: 100% (0 broken links)
- Mobile Responsiveness: 94/100
- Accessibility Score: 98/100 (WCAG AA compliant)
- Performance: 95/100 (PageSpeed Insights)

---

**Questions or Feedback?**

- Email: Consultations@BrooksideBI.com
- Phone: +1 209 487 2047
- Documentation Issues: [GitHub Issues](https://github.com/org/repo/issues)

**Maintained By**: Brookside Business Intelligence
**Last Updated**: {Current DateTime}

```

### Step 5: Add Mermaid Timeline (Optional)

If user selected "Mermaid Timeline" option, generate visual release timeline:

```markdown
### Release Timeline Visualization

```mermaid
timeline
 title AMS Platform Documentation Evolution
 section 2024 Q4
 Dec 15 : Project Kickoff
 : Planning & Research
 Dec 20 : VitePress Setup
 : Initial Configuration
 section 2025 Q1
 Jan 10 : v1.0.0 Release
 : Production Launch
 : 23 Documentation Pages
 Jan 25 : v1.1.0 Release
 : Authentication Enhancement
 : Component Library
 : 36 Commits
 Feb 15 : v1.2.0 Planned
 : Advanced Features
 : Multi-language Support
 section Future
 Mar 01 : v2.0.0 Planned
 : Major Version
 : Breaking Changes
```

**Timeline Styling** (uses Brookside BI brand colors):

```css
/* Applied automatically by custom.css */
.mermaid .timeline {
 background: linear-gradient(135deg, rgba(13, 71, 161, 0.02) 0%, rgba(74, 20, 140, 0.02) 100%);
}

.mermaid .timeline-section {
 fill: var(--vp-c-brand-1);
 stroke: var(--vp-c-brand-2);
}
```

### Step 6: Write or Update CHANGELOG.md

**File Location**: `CHANGELOG.md` (repository root)

**Write Logic**:

1. Check if CHANGELOG.md exists
2. If exists: Prepend new content above existing entries (preserve history)
3. If not exists: Create new file with generated content
4. Maintain proper markdown formatting
5. Ensure all links are absolute (GitHub-compatible)

**Execution**:

```typescript
// Pseudo-code for changelog update
async function updateChangelog(newContent: string) {
 const changelogPath = 'CHANGELOG.md';

 if (await fileExists(changelogPath)) {
 // Read existing content
 const existingContent = await readFile(changelogPath);

 // Find the insertion point (after header, before first release)
 const headerEndPattern = /^---\s*$/m;
 const insertionPoint = existingContent.search(headerEndPattern);

 if (insertionPoint !== -1) {
 // Insert new content after header
 const before = existingContent.slice(0, insertionPoint + 4); // Include '---\n'
 const after = existingContent.slice(insertionPoint + 4);
 const updatedContent = before + '\n\n' + newContent + '\n' + after;
 await writeFile(changelogPath, updatedContent);
 } else {
 // No header found, prepend content
 const updatedContent = newContent + '\n\n' + existingContent;
 await writeFile(changelogPath, updatedContent);
 }
 } else {
 // Create new changelog
 await writeFile(changelogPath, newContent);
 }
}
```

### Step 7: Validation & Summary

**Validation Checks**:

1. [] CHANGELOG.md file created/updated successfully
2. [] All commit links resolve correctly
3. [] Mermaid syntax valid (if included)
4. [] Markdown formatting correct (headings, lists, links)
5. [] Breaking changes prominently displayed
6. [] Brookside BI brand voice maintained

**Output Summary**:

```
[] Changelog Generated Successfully!

**File**: CHANGELOG.md
**Format**: {Selected Format}
**Commits Analyzed**: {Count} commits
**Date Range**: {Start Date} to {End Date}
**Breaking Changes**: {Count} found

**Summary**:
- Features: {Count} commits
- Bug Fixes: {Count} commits
- Documentation: {Count} commits
- Chores: {Count} commits

**Optional Elements Included**:
[] Mermaid Timeline Diagram
[] Author Credits ({Author Count} contributors)
[] PR Links ({PR Count} linked)
[] Breaking Changes Section

**Next Steps**:
1. Review CHANGELOG.md for accuracy
2. Customize any auto-generated descriptions
3. Commit changes:
 ```bash
 git add CHANGELOG.md
 git commit -m "docs: Update CHANGELOG for {version/date}"
 ```

4. Create release tag (if applicable):

 ```bash
 git tag -a v1.1.0 -m "Release v1.1.0: {Brief Description}"
 git push origin v1.1.0
 ```

**Integration**:

- Run /validate-docs to ensure changelog links are valid
- Consider creating GitHub Release from tag
- Update README.md with latest version information

**Time Saved**: Manual changelog creation (45 min) → Automated generation (2 min) = 43 minutes saved

```

## Integration with Git Workflow

### Pre-Release Checklist

Before creating a release tag:
1. [] Run `/update-changelog` to generate release notes
2. [] Review and customize CHANGELOG.md entries
3. [] Run `/validate-docs` to ensure documentation quality
4. [] Create git tag with semantic version
5. [] Push tag to trigger deployment

### GitHub Release Integration

After changelog generation, assist user with creating GitHub Release:

```bash
# Create annotated tag
git tag -a v1.1.0 -m "Release v1.1.0: Authentication enhancements and component library"

# Push tag to remote
git push origin v1.1.0

# Create GitHub Release using gh CLI
gh release create v1.1.0 \
 --title "v1.1.0 - Authentication & Components" \
 --notes-file CHANGELOG.md \
 --latest
```

### Automated Changelog in CI/CD

Provide guidance for automating changelog generation in GitHub Actions:

```yaml
name: Update Changelog
on:
 push:
 tags:
 - 'v*'

jobs:
 changelog:
 runs-on: ubuntu-latest
 steps:
 - uses: actions/checkout@v4
 with:
 fetch-depth: 0

 - name: Generate Changelog
 run: |
 # Run changelog generation script
 # (Can be integrated via GitHub Actions)

 - name: Commit Changelog
 run: |
 git config user.name "github-actions[bot]"
 git config user.email "github-actions[bot]@users.noreply.github.com"
 git add CHANGELOG.md
 git commit -m "docs: Update CHANGELOG for ${GITHUB_REF_NAME}"
 git push
```

## Error Handling

**No Commits Found**:

```
WARNING: No commits found in specified range

Possible causes:
- Invalid commit range specified
- Repository has no commit history
- Git repository not initialized

Suggestion: Run 'git log' to verify commit history exists
```

**Invalid Conventional Commit Format**:

```
WARNING: 15 commits do not follow Conventional Commits format

These commits will be categorized as 'chore' by default.

Examples:
- "Updated documentation" → Should be: "docs: update documentation"
- "Bug fix" → Should be: "fix: resolve specific issue"

Recommendation: Review commit message guidelines:
- https://www.conventionalcommits.org/

Continue with changelog generation? (Y/n)
```

**Git Not Available**:

```
[] Git command not found

This command requires Git to analyze commit history.

Next Steps:
1. Install Git: https://git-scm.com/downloads
2. Ensure Git is in your system PATH
3. Run this command again
```

## Brookside BI Brand Alignment

All generated changelog content follows Brookside BI voice patterns:

**Action-Oriented Language**:

- "Establish secure authentication to protect organizational data"
- "Streamline documentation workflows to drive efficiency"
- "Build scalable component library to support sustainable growth"

**Outcome-Focused Descriptions**:

- "Improved navigation reliability reduces support burden by 40%"
- "Enhanced build pipeline drives 47% faster deployment cycles"
- "Progressive disclosure implementation supports diverse stakeholder needs"

**Professional, Strategic Tone**:

- Position changes as business solutions, not just technical updates
- Emphasize measurable outcomes and stakeholder impact
- Maintain consultative approach with clear migration guidance

## Advanced Features

### Custom Commit Grouping

Allow users to define custom grouping rules:

```typescript
const customGroups = {
 'UI/UX Improvements': ['feat(ui)', 'feat(ux)', 'style'],
 'Backend Services': ['feat(api)', 'feat(db)', 'refactor(backend)'],
 'DevOps & Infrastructure': ['ci', 'build', 'chore(deps)'],
 'Security Enhancements': ['fix(security)', 'feat(auth)']
};
```

### Release Notes Templates

Provide industry-specific templates:

- **Enterprise Software**: Emphasize compliance, security, scalability
- **Open Source**: Focus on community contributions, breaking changes
- **SaaS Platform**: Highlight user-facing features, performance
- **Documentation Site**: Content additions, navigation improvements

### Changelog Diff View

Show changes between current and previous changelog:

```bash
# Compare changelogs
git diff HEAD~1 CHANGELOG.md
```

---

**Command Purpose**: Establish automated changelog generation workflows that transform Git commit history into professional release documentation, reducing manual effort from 45 minutes to 2 minutes while ensuring transparent communication of platform evolution to all stakeholders. Supports sustainable documentation practices aligned with Brookside BI brand standards and industry best practices.

**Time Savings**: 45 min → 2 min (96% reduction)
**Consistency**: 100% brand-aligned output
**Integration**: Works with /validate-docs, /preview-deploy, Git workflow
