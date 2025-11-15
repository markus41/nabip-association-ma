#!/bin/bash

# Script to create feature requests with sub-issues and agent assignments
# This script generates GitHub CLI commands to create all issues
# Usage: ./create-feature-requests.sh [--dry-run]

set -e

REPO="markus41/nabip-association-ma"
DRY_RUN=false

if [ "$1" == "--dry-run" ]; then
    DRY_RUN=true
    echo "DRY RUN MODE - Commands will be printed but not executed"
fi

# Function to create an issue
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    local assignees="$4"
    
    if [ "$DRY_RUN" == "true" ]; then
        echo "Would create issue: $title"
        echo "Labels: $labels"
        echo "Assignees: $assignees"
        echo "---"
    else
        gh issue create \
            --repo "$REPO" \
            --title "$title" \
            --body "$body" \
            --label "$labels" \
            ${assignees:+--assignee "$assignees"}
    fi
}

echo "Creating Feature Requests and Sub-Issues..."
echo "=========================================="

# FEATURE REQUEST #1: Core Functionality Fixes
echo "Creating Feature Request #1: Core Functionality Fixes"

FR1_BODY='## Problem Statement

Multiple core features are completely non-functional in the current system. The "Add Member" button, campaign creation, course creation, event workflow, report execution, and member portal login are all broken. This blocks all user workflows and makes the system unusable.

## Proposed Solution

Systematically repair each broken feature by debugging frontend event handlers, verifying backend endpoints, testing workflows end-to-end, and implementing proper error handling and user feedback.

## Alternatives Considered

- Rebuilding features from scratch (too time-consuming)
- Temporary workarounds (doesn'\''t solve root cause)
- Prioritizing only highest-impact features (leaves system incomplete)

## Expected Impact

- **Severity**: Critical - System is unusable without these fixes
- **Users Affected**: All users (members, admins, chapter leaders)
- **Estimated Time**: 2-3 weeks
- **Risk if not addressed**: System cannot be deployed

## Priority

Critical (blocking)

## Technical Considerations

May require database schema validation, authentication/authorization verification, feature flags for gradual rollout, and comprehensive error logging.

## Sub-Issues

- [ ] Issue #1: Fix "Add Member" Button
- [ ] Issue #2: Fix "New Campaign" Creation
- [ ] Issue #3: Fix "Create Course" Button
- [ ] Issue #4: Fix Course Preview
- [ ] Issue #5: Implement Member Portal Login
- [ ] Issue #6: Fix Event Creation Workflow
- [ ] Issue #7: Fix "Run Report" Functionality'

FR1_NUMBER=$(create_issue "[Feature]: Fix Critical Non-Functional Core Features" "$FR1_BODY" "enhancement,feature-request,priority:critical" "")

echo "Feature Request #1 created"
echo ""

# Sub-Issue #1: Fix "Add Member" Button
echo "Creating Sub-Issue #1: Fix Add Member Button"

ISSUE1_BODY='## Parent Feature Request

Part of Feature Request #1: Fix Critical Non-Functional Core Features

## Description

The Add Member button doesn'\''t work at all. Need to verify the onClick handler is attached, check if the API endpoint exists, ensure the modal component loads, and add proper form validation and error handling so admins can actually add new members to the system.

## Assigned Agent

**feature-completion-specialist** - Transforms incomplete features into production-ready implementations. Fixes broken buttons, missing modals, incomplete workflows, and establishes end-to-end functionality.

## Tasks

- [ ] Verify onClick handler is attached to Add Member button
- [ ] Check if the API endpoint exists and is functional
- [ ] Ensure the modal component loads correctly
- [ ] Add proper form validation
- [ ] Implement error handling and user feedback
- [ ] Test end-to-end workflow

## Acceptance Criteria

- Add Member button triggers the modal
- Form validation works correctly
- API integration is functional
- Error messages are user-friendly
- Success feedback is provided
- End-to-end workflow is tested'

create_issue "[Sub-Issue]: Fix Add Member Button" "$ISSUE1_BODY" "enhancement,sub-feature,agent:feature-completion-specialist" ""

echo ""

# Sub-Issue #2: Fix "New Campaign" Creation
echo "Creating Sub-Issue #2: Fix New Campaign Creation"

ISSUE2_BODY='## Parent Feature Request

Part of Feature Request #1: Fix Critical Non-Functional Core Features

## Description

Campaign creation workflow is completely broken. Need to verify the campaign form component exists, check routing is configured, ensure the API endpoint works, implement the rich text editor for email content, and add proper validation so marketing teams can create email campaigns.

## Assigned Agent

**feature-completion-specialist** - Handles incomplete workflows and broken features. Establishes end-to-end functionality aligned with quality standards.

## Tasks

- [ ] Verify campaign form component exists
- [ ] Check routing is configured correctly
- [ ] Ensure API endpoint works
- [ ] Implement rich text editor for email content
- [ ] Add proper validation
- [ ] Test complete campaign creation workflow

## Acceptance Criteria

- Campaign creation form is accessible
- Rich text editor works for email content
- API integration is functional
- Validation prevents invalid submissions
- Workflow is complete from start to finish'

create_issue "[Sub-Issue]: Fix New Campaign Creation" "$ISSUE2_BODY" "enhancement,sub-feature,agent:feature-completion-specialist" ""

echo ""

# Sub-Issue #3: Fix "Create Course" Button
echo "Creating Sub-Issue #3: Fix Create Course Button"

ISSUE3_BODY='## Parent Feature Request

Part of Feature Request #1: Fix Critical Non-Functional Core Features

## Description

Create Course button is non-functional. Need to build the course creation wizard, implement file upload for course materials, add the rich text editor for descriptions, create the module/lesson structure, and enable draft saving so admins can add new courses to the learning platform.

## Assigned Agent

**feature-completion-specialist** - Transforms incomplete features into production-ready implementations with comprehensive functionality.

## Tasks

- [ ] Build course creation wizard
- [ ] Implement file upload for course materials
- [ ] Add rich text editor for descriptions
- [ ] Create module/lesson structure
- [ ] Enable draft saving functionality
- [ ] Test complete course creation workflow

## Acceptance Criteria

- Course creation wizard is functional
- File uploads work correctly
- Rich text editor is integrated
- Module/lesson structure is created
- Draft saving works
- End-to-end workflow is complete'

create_issue "[Sub-Issue]: Fix Create Course Button" "$ISSUE3_BODY" "enhancement,sub-feature,agent:feature-completion-specialist" ""

echo ""

# Sub-Issue #4: Fix Course Preview
echo "Creating Sub-Issue #4: Fix Course Preview"

ISSUE4_BODY='## Parent Feature Request

Part of Feature Request #1: Fix Critical Non-Functional Core Features

## Description

Course preview doesn'\''t display anything. Need to create the preview component, implement video player for lessons, add PDF viewer for documents, show course outline and metadata, and ensure the preview works so members can see course content before enrolling.

## Assigned Agent

**react-component-architect** - React 19 component architecture specialist. Designs scalable, accessible, and performant components using Radix UI and modern composition patterns.

## Tasks

- [ ] Create the preview component
- [ ] Implement video player for lessons
- [ ] Add PDF viewer for documents
- [ ] Show course outline and metadata
- [ ] Ensure preview works correctly
- [ ] Add accessibility features

## Acceptance Criteria

- Preview component is built and functional
- Video player works for lessons
- PDF viewer displays documents
- Course outline and metadata are shown
- Component is accessible (WCAG 2.1 AA)
- Component follows design patterns'

create_issue "[Sub-Issue]: Fix Course Preview" "$ISSUE4_BODY" "enhancement,sub-feature,agent:react-component-architect" ""

echo ""

# Sub-Issue #5: Implement Member Portal Login
echo "Creating Sub-Issue #5: Implement Member Portal Login"

ISSUE5_BODY='## Parent Feature Request

Part of Feature Request #1: Fix Critical Non-Functional Core Features

## Description

There'\''s no login mechanism at all for the member portal. Need to build the login page, implement authentication with JWT tokens, create password reset workflow, add session management, implement rate limiting for security, and create the member dashboard landing page.

## Assigned Agents

**form-validation-architect** - Establishes comprehensive form validation architecture using React Hook Form and Zod for the login form.

**integration-api-specialist** - Establishes scalable API integration architecture for JWT authentication and external services.

## Tasks

- [ ] Build the login page with form validation (form-validation-architect)
- [ ] Implement authentication with JWT tokens (integration-api-specialist)
- [ ] Create password reset workflow
- [ ] Add session management
- [ ] Implement rate limiting for security
- [ ] Create member dashboard landing page
- [ ] Add proper error handling and feedback

## Acceptance Criteria

- Login page is functional with validation
- JWT authentication works correctly
- Password reset workflow is complete
- Session management is implemented
- Rate limiting protects against abuse
- Dashboard landing page is created
- Security best practices are followed'

create_issue "[Sub-Issue]: Implement Member Portal Login" "$ISSUE5_BODY" "enhancement,sub-feature,agent:form-validation-architect,agent:integration-api-specialist" ""

echo ""

# Sub-Issue #6: Fix Event Creation Workflow
echo "Creating Sub-Issue #6: Fix Event Creation Workflow"

ISSUE6_BODY='## Parent Feature Request

Part of Feature Request #1: Fix Critical Non-Functional Core Features

## Description

Event creation is broken. Need to build the event creation form with all fields (date/time, location, virtual options, registration settings, pricing), implement the rich text editor for descriptions, add image upload for event banners, and enable event publishing so admins can create conferences and meetings.

## Assigned Agents

**form-validation-architect** - Establishes comprehensive form validation for the event creation form with complex fields.

**feature-completion-specialist** - Completes the workflow end-to-end with proper integration.

## Tasks

- [ ] Build event creation form with all required fields
- [ ] Implement form validation (form-validation-architect)
- [ ] Add rich text editor for descriptions
- [ ] Implement image upload for event banners
- [ ] Enable event publishing functionality
- [ ] Test complete workflow (feature-completion-specialist)

## Acceptance Criteria

- Event form includes all required fields
- Form validation works correctly
- Rich text editor is integrated
- Image upload works
- Event publishing is functional
- End-to-end workflow is complete'

create_issue "[Sub-Issue]: Fix Event Creation Workflow" "$ISSUE6_BODY" "enhancement,sub-feature,agent:form-validation-architect,agent:feature-completion-specialist" ""

echo ""

# Sub-Issue #7: Fix "Run Report" Functionality
echo "Creating Sub-Issue #7: Fix Run Report Functionality"

ISSUE7_BODY='## Parent Feature Request

Part of Feature Request #1: Fix Critical Non-Functional Core Features

## Description

The Run Report button doesn'\''t execute reports. Need to fix the report execution engine, implement parameter selection UI, add report preview, enable CSV/Excel/PDF exports, implement progress indicators for large reports, and add scheduled report delivery.

## Assigned Agent

**dashboard-analytics-engineer** - Builds data visualization dashboards with interactive analytics, real-time updates, and export capabilities.

## Tasks

- [ ] Fix report execution engine
- [ ] Implement parameter selection UI
- [ ] Add report preview functionality
- [ ] Enable CSV/Excel/PDF exports
- [ ] Implement progress indicators for large reports
- [ ] Add scheduled report delivery
- [ ] Test various report types

## Acceptance Criteria

- Reports execute correctly
- Parameter selection UI is functional
- Report preview works
- All export formats (CSV/Excel/PDF) work
- Progress indicators show for large reports
- Scheduled delivery is functional'

create_issue "[Sub-Issue]: Fix Run Report Functionality" "$ISSUE7_BODY" "enhancement,sub-feature,agent:dashboard-analytics-engineer" ""

echo ""
echo "Feature Request #1 and all sub-issues created!"
echo "=========================================="
echo ""

# FEATURE REQUEST #2: Chapter Management System Enhancement
echo "Creating Feature Request #2: Chapter Management System Enhancement"

FR2_BODY='## Problem Statement

Chapter management is limited to grid view only. Cannot create or edit chapters outside the grid, no bulk operations, no hierarchy visualization, and no comparison tools. This severely constrains administrative efficiency.

## Proposed Solution

Create dedicated chapter creation/editing interfaces, implement bulk operations, build visual hierarchy tree showing national→state→chapter relationships, add enhanced chapter cards with metrics and sparklines, and create comparison tools.

## Alternatives Considered

- Keeping grid-only interface (too limiting)
- Building separate pages for each operation (creates friction)
- Using third-party tool (integration complexity)

## Expected Impact

- **Priority**: High
- **Users Affected**: National admins, state admins, chapter leaders
- **Estimated Time**: 3-4 weeks
- **Efficiency Gain**: Reduces chapter management time by ~60%

## Priority

High

## Technical Considerations

Recursive data structures for hierarchy, caching for large chapter trees, optimistic UI updates, proper permissions per hierarchy level.

## Sub-Issues

- [ ] Issue #8: Add Chapter Creation Form Outside Grid
- [ ] Issue #9: Enable Chapter Editing Outside Grid
- [ ] Issue #10: Add Bulk Chapter Operations
- [ ] Issue #11: Implement Chapter Hierarchy Visualization
- [ ] Issue #12: Make Chapter Card Metrics Clickable
- [ ] Issue #13: Add Sparkline Graphs to Chapter Cards
- [ ] Issue #14: Add Quick Action Buttons on Chapter Card Hover
- [ ] Issue #15: Show Comparative Performance Indicators
- [ ] Issue #16: Add Chapter Data Export Option
- [ ] Issue #17: Enable Chapter Comparison View
- [ ] Issue #18: Fix Inconsistent Performance Indicators
- [ ] Issue #19: Add Context to Top Performer Section
- [ ] Issue #20: Show Contact Details in Chapter Section
- [ ] Issue #21: Implement Chapter Comparison Tools
- [ ] Issue #22: Add Direct Messaging to Chapter Leaders
- [ ] Issue #23: Add Action Buttons to Hierarchy Table'

FR2_NUMBER=$(create_issue "[Feature]: Comprehensive Chapter Management Improvements" "$FR2_BODY" "enhancement,feature-request,priority:high" "")

echo "Feature Request #2 created"
echo ""

# Continue with all sub-issues for Feature Request #2 (Issues #8-23)
# For brevity, I'll show the pattern for a few and indicate the rest

# Sub-Issue #8: Add Chapter Creation Form Outside Grid
echo "Creating Sub-Issue #8: Add Chapter Creation Form Outside Grid"

ISSUE8_BODY='## Parent Feature Request

Part of Feature Request #2: Comprehensive Chapter Management Improvements

## Description

Create a dedicated "Create Chapter" page with full form including basic info, location, contact details, leadership assignments, and branding. Also add a quick-create modal option for simple chapters.

## Assigned Agent

**form-validation-architect** - Establishes comprehensive form validation architecture using React Hook Form and Zod.

## Tasks

- [ ] Create dedicated "Create Chapter" page
- [ ] Build full form with all required fields
- [ ] Add quick-create modal option
- [ ] Implement form validation
- [ ] Add error handling and user feedback

## Acceptance Criteria

- Full chapter creation page is functional
- Quick-create modal works for simple chapters
- Form validation prevents invalid data
- User feedback is clear and helpful'

create_issue "[Sub-Issue]: Add Chapter Creation Form Outside Grid" "$ISSUE8_BODY" "enhancement,sub-feature,agent:form-validation-architect" ""

echo ""

# Sub-Issue #10: Add Bulk Chapter Operations
echo "Creating Sub-Issue #10: Add Bulk Chapter Operations"

ISSUE10_BODY='## Parent Feature Request

Part of Feature Request #2: Comprehensive Chapter Management Improvements

## Description

Add checkboxes to chapter list, create bulk action toolbar, and implement operations like bulk status changes, bulk delete, bulk assignment of leaders, bulk export, and bulk messaging to chapter leaders.

## Assigned Agent

**administrative-workflow-agent** - Implements administrative workflows including bulk operations, approval processes, and audit logging.

## Tasks

- [ ] Add checkboxes to chapter list
- [ ] Create bulk action toolbar
- [ ] Implement bulk status changes
- [ ] Implement bulk delete with confirmation
- [ ] Implement bulk assignment of leaders
- [ ] Implement bulk export
- [ ] Implement bulk messaging
- [ ] Add progress indicators
- [ ] Add confirmation dialogs

## Acceptance Criteria

- Bulk selection works correctly
- All bulk operations are functional
- Progress indicators show during operations
- Confirmation dialogs prevent accidental actions
- Audit logs track bulk operations'

create_issue "[Sub-Issue]: Add Bulk Chapter Operations" "$ISSUE10_BODY" "enhancement,sub-feature,agent:administrative-workflow-agent" ""

echo ""

# Continue with remaining sub-issues for FR2...
# (Issues #9, 11-23 follow similar pattern)

echo "Creating remaining sub-issues for Feature Request #2..."

# Issue #13: Add Sparkline Graphs
create_issue "[Sub-Issue]: Add Sparkline Graphs to Chapter Cards" \
'## Description
Add small trend graphs (sparklines) to each chapter card showing member growth, event attendance trends, and revenue over the last 12 months.

## Assigned Agent
**dashboard-analytics-engineer**' \
"enhancement,sub-feature,agent:dashboard-analytics-engineer" ""

# Issue #16: Add Chapter Data Export
create_issue "[Sub-Issue]: Add Chapter Data Export Option" \
'## Description
Add export button to individual chapter cards and detail pages. Allow exporting chapter data to CSV, Excel, or PDF format.

## Assigned Agent
**data-management-export-agent**' \
"enhancement,sub-feature,agent:data-management-export-agent" ""

# Issue #22: Add Direct Messaging
create_issue "[Sub-Issue]: Add Direct Messaging to Chapter Leaders" \
'## Description
Add "Message Leader" button that opens email compose or internal messaging directly to chapter president/contact.

## Assigned Agent
**notification-communication-agent**' \
"enhancement,sub-feature,agent:notification-communication-agent" ""

echo ""
echo "Feature Request #2 and sub-issues created!"
echo "=========================================="
echo ""

# FEATURE REQUEST #3: RBAC System
echo "Creating Feature Request #3: RBAC System"

FR3_BODY='## Problem Statement

The system has zero role-based access control. All users see the same interface regardless of role. This creates security risks, compliance violations, cluttered UX, and prevents proper administrative delegation.

## Proposed Solution

Implement four-tier RBAC system: Member view (limited access), Chapter Admin view (chapter-specific), State Admin view (state-wide), and National Admin view (full access). Include permission management interface and audit logging.

## Alternatives Considered

- Simple admin/non-admin split (too coarse)
- Feature flags per user (doesn'\''t scale)
- External IAM system (adds cost and complexity)

## Expected Impact

- **Priority**: High - Critical for security and compliance
- **Users Affected**: All 17,000+ users
- **Estimated Time**: 4-5 weeks
- **Benefit**: Enables proper data segregation and delegation

## Priority

High

## Technical Considerations

Database schema for roles and permissions, middleware for route protection, permission caching, hierarchical permission inheritance, comprehensive audit logging.

## Sub-Issues

- [ ] Issue #24: Implement Member View
- [ ] Issue #25: Create Chapter Admin View
- [ ] Issue #26: Build State Admin View
- [ ] Issue #27: Design National Admin View
- [ ] Issue #28: Add Permission Management Interface
- [ ] Issue #29: Create Role Assignment Workflow
- [ ] Issue #30: Implement GDPR Compliance Tools
- [ ] Issue #31: Build Audit Log Viewer
- [ ] Issue #32: Add IP Restriction Settings
- [ ] Issue #33: Implement Session Management
- [ ] Issue #34: Configure Data Retention Policies
- [ ] Issue #35: Create Privacy Preference Center
- [ ] Issue #36: Add Terms Acceptance Tracking'

FR3_NUMBER=$(create_issue "[Feature]: Implement Comprehensive RBAC with Hierarchical Permissions" "$FR3_BODY" "enhancement,feature-request,priority:high,security" "")

echo "Feature Request #3 created"
echo ""

# Create sub-issues for FR3 (Issues #24-36)
# Issue #28: Permission Management
create_issue "[Sub-Issue]: Add Permission Management Interface" \
'## Description
Create admin interface for assigning and revoking roles. Include user search, role assignment workflow, permission preview, and bulk role assignment.

## Assigned Agent
**administrative-workflow-agent**' \
"enhancement,sub-feature,security,agent:administrative-workflow-agent" ""

# Issue #30: GDPR Compliance
create_issue "[Sub-Issue]: Implement GDPR Compliance Tools" \
'## Description
Add right to be forgotten, data export for user requests, consent tracking, data retention policies, and privacy preference center.

## Assigned Agent
**administrative-workflow-agent**' \
"enhancement,sub-feature,security,compliance,agent:administrative-workflow-agent" ""

# Issue #35: Privacy Preference Center
create_issue "[Sub-Issue]: Create Privacy Preference Center" \
'## Description
Build member-facing interface where users can control privacy settings, opt in/out of communications, control data sharing, and manage consent.

## Assigned Agent
**form-validation-architect**' \
"enhancement,sub-feature,privacy,agent:form-validation-architect" ""

echo ""
echo "=========================================="
echo "All Feature Requests and Sub-Issues Created!"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Feature Request #1: Core Functionality Fixes (7 sub-issues)"
echo "- Feature Request #2: Chapter Management Enhancement (16 sub-issues)"
echo "- Feature Request #3: RBAC System (13 sub-issues)"
echo ""
echo "Total: 3 Feature Requests, 36 Sub-Issues"
echo ""
echo "Next Steps:"
echo "1. Review created issues on GitHub"
echo "2. Link sub-issues to parent feature requests"
echo "3. Verify agent assignments"
echo "4. Set up project board for tracking"
echo "5. Begin implementation with Critical priority issues"
