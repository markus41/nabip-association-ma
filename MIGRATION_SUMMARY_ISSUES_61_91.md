# Migration Summary: Issues #61-#91 Database Schema

**Migration File**: `supabase/migrations/20250115_new_tables_issues_61_91.sql`
**Date**: 2025-01-15
**Total Tables Created**: 17
**Status**: Ready for application

## Overview

This migration creates comprehensive database schema for user preferences, financial tracking, advanced analytics, and infrastructure components supporting GitHub issues #61-#91.

## Tables Created

### 1. User Preferences (4 tables)

#### `user_preferences`
- **Purpose**: Store individual user settings (theme, language, notification preferences)
- **Key Features**:
  - Theme selection (light/dark/auto)
  - Default view preferences
  - Notification preferences (email, SMS, push, digest frequency)
  - Privacy settings
  - Extensible JSONB custom_settings field
- **RLS**: Users can manage their own; National admins can view all
- **Indexes**: member_id, user_id

#### `dashboard_widgets`
- **Purpose**: Define available widget types for customizable dashboards
- **Key Features**:
  - Widget metadata (name, description, category, component name)
  - Grid sizing constraints (min/max width/height)
  - Role-based access control (requires_role_tier)
  - Icon and preview image support
- **RLS**: All authenticated users can view; National admins can manage
- **Indexes**: category, is_active, requires_role_tier
- **Seeded Data**: 10 default widgets (member growth chart, upcoming events, revenue summary, etc.)

#### `user_dashboard_layouts`
- **Purpose**: Custom dashboard layout configurations per user
- **Key Features**:
  - Named layouts with default flag
  - JSONB layout_config storing widget positions `[{widgetKey, x, y, w, h, config}]`
  - Support for multiple saved layouts per user
- **RLS**: Users manage their own layouts
- **Indexes**: member_id, is_default

#### `user_dashboard_preferences`
- **Purpose**: Widget-specific settings per user
- **Key Features**:
  - User-specific widget configuration overrides
  - Visibility toggles
  - Sort ordering
- **RLS**: Users manage their own preferences
- **Indexes**: member_id, widget_id, visibility

### 2. Financial Tracking (3 tables)

#### `refunds`
- **Purpose**: Track refund history and processing
- **Key Features**:
  - Links to transactions table (FK to existing `transactions`)
  - Categorized refund reasons (customer_request, duplicate, fraudulent, event_cancelled)
  - Multi-status workflow (pending → processing → completed/failed/rejected)
  - Stripe integration fields (stripe_refund_id, stripe_payment_intent_id)
  - Approval workflow (requested_by, approved_by, approval timestamps)
- **RLS**: Members view own; admins view by scope (chapter/state/national)
- **Indexes**: transaction_id, member_id, status, requested_at, stripe_refund_id

#### `event_expenses`
- **Purpose**: Track event costs for ROI analysis
- **Key Features**:
  - Categorized expenses (venue, catering, speakers, marketing, materials, technology)
  - Vendor tracking (name, contact, invoice details)
  - Payment tracking (status, due date, payment date)
  - Budget variance analysis (budgeted_amount vs actual amount)
  - Approval workflow
  - Attachment support (JSONB array of URLs)
- **RLS**: Event creators can view; chapter admins manage their events; state/national admins by scope
- **Indexes**: event_id, expense_category, payment_status, payment_due_date, submitted_by

### 3. Analytics & Engagement (6 tables)

#### `chapter_metrics`
- **Purpose**: Chapter performance benchmarking
- **Key Features**:
  - Time-series metrics (daily, weekly, monthly, quarterly, yearly)
  - Membership metrics (total, active, new, churned, growth rate, retention rate)
  - Engagement metrics (avg score, events hosted, attendance rates)
  - Financial metrics (revenue breakdown: membership, events, other)
  - Communication metrics (email stats)
  - Comparative analysis (percentile rank, national average comparison)
- **RLS**: Chapter admins view own; state/national admins view by scope
- **Indexes**: chapter_id, period_start/end, metric_type, calculated_at
- **Constraints**: Unique (chapter_id, period_start, period_end, metric_type)

#### `member_engagement`
- **Purpose**: Track individual member engagement activities
- **Key Features**:
  - Activity tracking (event_attendance, email_open/click, login, course_enrollment/completion, committee_participation)
  - Source tracking (links to event_id, campaign_id, etc.)
  - Engagement scoring (points, weights)
  - Session context (session_id, IP, user_agent)
  - Activity metadata (JSONB)
- **RLS**: Members view own; system can insert all; admins view all
- **Indexes**: member_id, activity_type, activity_timestamp, activity_source, composite (member_id + timestamp DESC)

#### `engagement_metrics`
- **Purpose**: Aggregated engagement scores and trends
- **Key Features**:
  - Multi-dimensional scores (overall, event, email, course, community)
  - Activity counts (total, last 30/90/365 days)
  - Trend analysis (increasing/stable/decreasing/at_risk with percentage)
  - Behavioral patterns (most active day/hour)
  - Segmentation (champion, active, casual, at_risk, dormant)
- **RLS**: Members view own; admins view all; national admins can modify
- **Indexes**: member_id, engagement_segment, engagement_trend, overall_score DESC, last_calculated_at
- **Constraints**: Unique member_id (one metrics row per member)

#### `churn_predictions`
- **Purpose**: ML-based churn risk predictions
- **Key Features**:
  - Prediction details (probability 0-1, risk level, predicted churn date, confidence score)
  - Contributing factors (JSONB array of risk factors with weights)
  - Behavioral indicators (JSONB)
  - Intervention recommendations (JSONB array of retention strategies)
  - Model tracking (version, type, feature importance)
  - Outcome tracking (actual_churned, intervention tracking)
- **RLS**: Members CANNOT view own (prevent gaming); admins only
- **Indexes**: member_id, risk_level, churn_probability DESC, prediction_date, valid_until, intervention_priority DESC
- **Business Rule**: Prevents members from seeing their own churn predictions to avoid gaming the system

#### `ai_analysis_log`
- **Purpose**: Track AI-generated insights and recommendations
- **Key Features**:
  - Analysis context (type, entity type/ID)
  - AI input/output (JSONB)
  - Generated insights and recommendations (JSONB arrays)
  - Model tracking (name, version, confidence, processing time)
  - Quality metrics (accuracy, validation tracking)
  - User interaction tracking (viewed_by array, applied status, effectiveness rating 1-5)
  - Error handling (error message, retry count)
- **RLS**: National admins only
- **Indexes**: analysis_type, entity (type + ID), created_at DESC, applied status, model_name + version

#### `cohorts`
- **Purpose**: Define member cohorts for analysis
- **Key Features**:
  - Cohort definition (name, description, type, criteria as JSONB)
  - Dynamic vs static (is_dynamic flag for auto-updates)
  - Filters (chapter_ids array, membership_types array, date ranges)
  - Sharing (created_by, is_public, shared_with member IDs array)
  - Visual metadata (tags array, hex color)
  - Auto-refresh settings (enabled flag, frequency in hours)
- **RLS**: View public cohorts or own cohorts or shared with you; admins view all; creators manage own
- **Indexes**: cohort_type, created_by, is_public, is_dynamic, tags (GIN)

#### `cohort_metrics`
- **Purpose**: Track cohort performance over time
- **Key Features**:
  - Time-series periods (daily, weekly, monthly, quarterly, yearly)
  - Membership metrics (starting/ending counts, new, churned, retention rate, churn rate)
  - Engagement metrics (avg score, total activities, avg per member)
  - Event metrics (attended, avg per member, attendance rate)
  - Financial metrics (total revenue, avg per member, lifetime value)
  - Email engagement (sent, open rate, click rate)
  - Comparative analysis (vs previous period %, vs overall avg %)
- **RLS**: Follows cohort visibility; national admins can modify
- **Indexes**: cohort_id, period_start/end, metric_type, calculated_at
- **Constraints**: Unique (cohort_id, period_start, period_end, metric_type)

### 4. Infrastructure (3 tables)

#### `notifications`
- **Purpose**: System-wide notification management
- **Key Features**:
  - Content (title, message, notification_type, category)
  - Priority levels (low, normal, high, urgent)
  - Multi-channel delivery (in_app, email, SMS, push as array)
  - Action links (action_url, action_label)
  - Entity relationships (related_entity_type/id)
  - Status tracking (pending, sent, delivered, read, dismissed, failed)
  - Scheduling (scheduled_for, expires_at)
  - Delivery tracking (sent_at, delivered_at, failed_at, failure_reason)
  - Icon support (Phosphor icon names)
- **RLS**: Users view/update own status; admins create; national admins full access
- **Indexes**: member_id, status, notification_type, member_id + status (WHERE not dismissed), scheduled_for, created_at DESC, expires_at

#### `documents`
- **Purpose**: Document management and storage
- **Key Features**:
  - Document metadata (name, description, document_type, category)
  - File information (URL, filename, size, MIME type, extension)
  - Storage providers (Supabase, S3, Azure, Google)
  - Version control (version string/number, is_latest_version, parent_document_id)
  - Access control (access_level: public/members_only/role-based, required_role_tier, chapter_id for scoping)
  - Organization (tags array, folder_path virtual structure)
  - Full-text search (extracted text, word count, page count, tsvector search_vector)
  - Tracking (download_count, view_count, last_accessed_at)
  - Lifecycle (published_at, archived_at, expires_at)
  - Approval workflow (uploaded_by, approved_by, approved_at)
- **RLS**: Public docs viewable by all; role-based access; chapter/state/national scoping
- **Indexes**: document_type, category, uploaded_by, chapter_id, access_level, is_latest_version, is_archived, tags (GIN), search_vector (GIN), created_at DESC
- **Special**: Automatic tsvector update trigger for full-text search

#### `committees`
- **Purpose**: Committee and working group management
- **Key Features**:
  - Committee details (name, description, committee_type, purpose)
  - Hierarchy (chapter_id for scoping, parent_committee_id for nesting)
  - Leadership (chair, vice chair, secretary member IDs)
  - Membership (member_count, max_members, requires_approval)
  - Meeting info (schedule, location, virtual URL)
  - Status (active, inactive, completed, archived)
  - Important dates (established, target completion, completed)
  - Communication (email list, Slack channel, shared drive URL)
  - Goals and outcomes (JSONB arrays: goals, deliverables, achievements)
  - Privacy (is_public flag)
  - Tags and metadata
- **RLS**: Public committees viewable by all; chapter/state/national scoping for management
- **Indexes**: chapter_id, parent_committee_id, committee_type, status, chair_member_id, tags (GIN), is_public

## Technical Implementation Details

### Triggers
- **updated_at Automation**: All 17 tables have triggers to auto-update `updated_at` timestamp on row changes
- **Full-Text Search**: `documents` table has automatic tsvector generation trigger combining name, description, full_text_content, and tags

### Row Level Security (RLS)
- **All tables have RLS enabled**
- **4-Tier RBAC Integration**: Uses existing helper functions:
  - `get_current_member_id()` - Get authenticated member
  - `get_member_chapter_id()` - Get member's chapter
  - `get_member_state()` / `get_member_state(member_id)` - Get state
  - `is_authenticated_member()` - Check authentication
  - `is_chapter_admin_member()` - Check chapter admin role
  - `is_state_admin_member()` - Check state admin role
  - `is_national_admin_member()` - Check national admin role

### Foreign Key Relationships
- Links to existing tables:
  - `members.id` - User identity and relationships
  - `chapters.id` - Chapter scoping
  - `events.id` - Event relationships
  - `transactions.id` - Financial tracking
  - `auth.users.id` - Supabase authentication
- Cascade delete policies preserve data integrity

### Indexes Strategy
- **Foreign keys**: Indexed for join performance
- **Frequently queried fields**: Status, type, date fields
- **Composite indexes**: member_id + timestamp for engagement tracking
- **Partial indexes**: Boolean filters (is_active = true, is_archived = false)
- **GIN indexes**: JSONB tags arrays and tsvector full-text search
- **Descending indexes**: Timestamp fields for recent-first queries

### Data Types
- **UUID**: Primary keys and foreign keys (gen_random_uuid())
- **TIMESTAMPTZ**: All timestamps (timezone-aware)
- **DECIMAL(10,2)**: Monetary amounts
- **JSONB**: Flexible metadata, arrays, nested structures
- **TEXT[]**: Arrays for tags, channels, etc.
- **INET**: IP addresses
- **tsvector**: Full-text search vectors

## Migration Application Instructions

### Option 1: Supabase CLI (Recommended)
```bash
cd /path/to/nabip-association-ma
npm run build  # Ensure TypeScript compiles
npx supabase db reset --linked  # Apply all migrations
```

### Option 2: MCP Supabase Tool
```typescript
// Use apply_migration tool
mcp__supabase__apply_migration({
  name: "new_tables_issues_61_91",
  query: "<contents of 20250115_new_tables_issues_61_91.sql>"
})
```

### Option 3: Direct SQL Execution
1. Copy contents of `supabase/migrations/20250115_new_tables_issues_61_91.sql`
2. Execute in Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)
3. Run in single transaction or split into sections

## Post-Migration Verification

### 1. Verify Tables Created
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'user_preferences', 'dashboard_widgets', 'user_dashboard_layouts', 'user_dashboard_preferences',
  'refunds', 'event_expenses',
  'chapter_metrics', 'member_engagement', 'engagement_metrics', 'churn_predictions', 'ai_analysis_log', 'cohorts', 'cohort_metrics',
  'notifications', 'documents', 'committees'
)
ORDER BY table_name;
```

### 2. Check RLS Policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'user_preferences', 'dashboard_widgets', 'refunds', 'event_expenses',
  'chapter_metrics', 'member_engagement', 'engagement_metrics', 'churn_predictions',
  'ai_analysis_log', 'cohorts', 'cohort_metrics', 'notifications', 'documents', 'committees'
)
ORDER BY tablename, policyname;
```

### 3. Verify Initial Data
```sql
-- Should return 10 dashboard widgets
SELECT COUNT(*) as widget_count FROM dashboard_widgets;

-- View seeded widgets
SELECT widget_key, name, category, requires_role_tier
FROM dashboard_widgets
ORDER BY category, name;
```

### 4. Run Security Advisor
```typescript
// Check for missing RLS policies or security issues
mcp__supabase__get_advisors({ type: "security" })
```

### 5. Check Performance Advisors
```typescript
// Check for missing indexes or performance issues
mcp__supabase__get_advisors({ type: "performance" })
```

## Integration with Existing System

### TypeScript Types
Update `src/lib/types.ts` to add new interfaces matching these tables:

```typescript
// User Preferences
export interface UserPreferences {
  id: string
  memberId: string
  userId?: string
  greetingMessage?: string
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  defaultDashboardView: string
  defaultMemberListView: 'table' | 'grid' | 'kanban'
  itemsPerPage: 10 | 25 | 50 | 100
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  digestFrequency: 'daily' | 'weekly' | 'monthly' | 'never'
  showProfilePublicly: boolean
  allowMemberDirectoryListing: boolean
  customSettings: Record<string, any>
  createdAt: string
  updatedAt: string
}

// Dashboard Widgets (and similar interfaces for all other tables)
export interface DashboardWidget {
  id: string
  widgetKey: string
  name: string
  description?: string
  category: string
  componentName: string
  defaultConfig: Record<string, any>
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
  requiresRoleTier: 1 | 2 | 3 | 4
  isActive: boolean
  icon?: string
  previewImageUrl?: string
  createdAt: string
  updatedAt: string
}
```

### React Components
Create feature components in `src/components/features/`:
- `UserPreferencesDialog.tsx` - User settings management
- `DashboardCustomizer.tsx` - Drag-and-drop dashboard layout
- `RefundsManager.tsx` - Refund processing workflow
- `EventExpenseTracker.tsx` - Event ROI analysis
- `ChapterBenchmarking.tsx` - Chapter performance comparison
- `MemberEngagementView.tsx` - Member activity timeline
- `ChurnRiskDashboard.tsx` - At-risk member interventions
- `CohortAnalyzer.tsx` - Cohort performance tracking
- `NotificationCenter.tsx` - In-app notifications
- `DocumentLibrary.tsx` - Document management UI
- `CommitteeManager.tsx` - Committee administration

### Data Utilities
Add to `src/lib/data-utils.ts`:
```typescript
// Example: Generate initial user preferences
export function generateUserPreferences(memberId: string): UserPreferences {
  return {
    id: crypto.randomUUID(),
    memberId,
    theme: 'light',
    language: 'en',
    timezone: 'America/New_York',
    defaultDashboardView: 'overview',
    defaultMemberListView: 'table',
    itemsPerPage: 25,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    digestFrequency: 'weekly',
    showProfilePublicly: false,
    allowMemberDirectoryListing: true,
    customSettings: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}
```

## Business Value & Use Cases

### User Experience
- **Personalized Dashboards**: Members customize their view with drag-and-drop widgets
- **Theme Support**: Dark mode, light mode, auto (follows system)
- **Notification Preferences**: Granular control over communication channels

### Financial Operations
- **Refund Management**: Streamlined workflow with approval routing and Stripe integration
- **Event ROI**: Track expenses vs revenue for better event planning
- **Budget Variance**: Compare budgeted amounts to actual spending

### Analytics & Insights
- **Chapter Benchmarking**: Compare chapter performance to national averages
- **Engagement Scoring**: Multi-dimensional member activity tracking
- **Churn Prevention**: ML-powered predictions with intervention recommendations
- **Cohort Analysis**: Compare member segments over time

### Administrative Efficiency
- **Multi-Channel Notifications**: Centralized communication system
- **Document Management**: Version-controlled, searchable document library
- **Committee Tracking**: Manage goals, deliverables, and member participation

## Known Limitations & Considerations

1. **Churn Predictions**: Requires ML model integration (table structure ready, model training needed)
2. **AI Analysis Log**: Designed for future AI features; currently empty
3. **Document Full-Text Search**: Requires text extraction from PDFs/docs before indexing
4. **Dashboard Widgets**: Component implementations needed to match seeded widget definitions
5. **Notification Delivery**: Multi-channel delivery (email/SMS/push) requires integration with providers

## Next Steps

1. **Apply Migration**: Use one of the methods above to execute the SQL
2. **Run Verification**: Execute verification queries to confirm success
3. **Update TypeScript Types**: Add interfaces to `src/lib/types.ts`
4. **Build UI Components**: Create React components for each feature
5. **Integrate APIs**: Connect frontend to Supabase queries
6. **Add Navigation**: Update `App.tsx` navItems to include new features
7. **Test RLS Policies**: Verify role-based access control works correctly
8. **Populate Test Data**: Create sample data for development and testing

## Support

For issues or questions:
- Review migration file: `supabase/migrations/20250115_new_tables_issues_61_91.sql`
- Check Supabase logs in dashboard
- Run security/performance advisors
- Consult CLAUDE.md for project architecture guidance
