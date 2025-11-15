-- =====================================================================================
-- Migration: Comprehensive Schema for Issues #61-#91
-- Date: 2025-01-15
-- Description: Creates 17 new tables for user preferences, financial tracking,
--              analytics, and infrastructure components
-- Estimated Hours: 40 hours across all features
-- =====================================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search on documents

-- =====================================================================================
-- SECTION 1: USER PREFERENCES (4 TABLES)
-- Issues: #61-#64
-- =====================================================================================

-- =====================================================================================
-- Table: user_preferences
-- Purpose: Store individual user settings and preferences
-- Issue: #61
-- =====================================================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Display preferences
  greeting_message VARCHAR(255),
  theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'America/New_York',

  -- View defaults
  default_dashboard_view VARCHAR(50) DEFAULT 'overview',
  default_member_list_view VARCHAR(20) DEFAULT 'table' CHECK (default_member_list_view IN ('table', 'grid', 'kanban')),
  items_per_page INTEGER DEFAULT 25 CHECK (items_per_page IN (10, 25, 50, 100)),

  -- Notification preferences
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  digest_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (digest_frequency IN ('daily', 'weekly', 'monthly', 'never')),

  -- Privacy preferences
  show_profile_publicly BOOLEAN DEFAULT false,
  allow_member_directory_listing BOOLEAN DEFAULT true,

  -- Custom preferences (JSON for extensibility)
  custom_settings JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_member_preferences UNIQUE(member_id)
);

-- Indexes for user preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_member ON user_preferences(member_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

COMMENT ON TABLE user_preferences IS 'Individual user settings for greeting, theme, default views, and notifications';
COMMENT ON COLUMN user_preferences.custom_settings IS 'JSONB field for extensible custom preferences';

-- =====================================================================================
-- Table: dashboard_widgets
-- Purpose: Define available widget types for dashboards
-- Issue: #62
-- =====================================================================================
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'member_growth_chart', 'upcoming_events'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'analytics', 'members', 'events', 'financial', 'engagement'
  component_name VARCHAR(100) NOT NULL, -- React component name
  default_config JSONB DEFAULT '{}'::jsonb,
  min_width INTEGER DEFAULT 1,
  min_height INTEGER DEFAULT 1,
  max_width INTEGER DEFAULT 12,
  max_height INTEGER DEFAULT 12,
  requires_role_tier INTEGER DEFAULT 1 CHECK (requires_role_tier BETWEEN 1 AND 4),
  is_active BOOLEAN DEFAULT true,
  icon VARCHAR(50), -- Phosphor icon name
  preview_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for dashboard widgets
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_category ON dashboard_widgets(category);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_active ON dashboard_widgets(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_role ON dashboard_widgets(requires_role_tier);

COMMENT ON TABLE dashboard_widgets IS 'Available widget types for customizable dashboards';
COMMENT ON COLUMN dashboard_widgets.widget_key IS 'Unique identifier for widget type (e.g., member_growth_chart)';
COMMENT ON COLUMN dashboard_widgets.requires_role_tier IS '1=Member, 2=Chapter Admin, 3=State Admin, 4=National Admin';

-- =====================================================================================
-- Table: user_dashboard_layouts
-- Purpose: Custom dashboard layout configurations per user
-- Issue: #63
-- =====================================================================================
CREATE TABLE IF NOT EXISTS user_dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  layout_name VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  layout_config JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of widget positions
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_member_layout_name UNIQUE(member_id, layout_name)
);

-- Indexes for dashboard layouts
CREATE INDEX IF NOT EXISTS idx_user_dashboard_layouts_member ON user_dashboard_layouts(member_id);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_layouts_default ON user_dashboard_layouts(member_id, is_default) WHERE is_default = true;

COMMENT ON TABLE user_dashboard_layouts IS 'Custom dashboard layout configurations per user';
COMMENT ON COLUMN user_dashboard_layouts.layout_config IS 'JSONB array of widget positions: [{widgetKey, x, y, w, h, config}]';

-- =====================================================================================
-- Table: user_dashboard_preferences
-- Purpose: Widget-specific settings per user
-- Issue: #64
-- =====================================================================================
CREATE TABLE IF NOT EXISTS user_dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  widget_id UUID NOT NULL REFERENCES dashboard_widgets(id) ON DELETE CASCADE,
  widget_config JSONB DEFAULT '{}'::jsonb, -- User-specific widget configuration
  is_visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_member_widget UNIQUE(member_id, widget_id)
);

-- Indexes for dashboard preferences
CREATE INDEX IF NOT EXISTS idx_user_dashboard_preferences_member ON user_dashboard_preferences(member_id);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_preferences_widget ON user_dashboard_preferences(widget_id);
CREATE INDEX IF NOT EXISTS idx_user_dashboard_preferences_visible ON user_dashboard_preferences(member_id, is_visible) WHERE is_visible = true;

COMMENT ON TABLE user_dashboard_preferences IS 'Widget-specific settings and visibility per user';
COMMENT ON COLUMN user_dashboard_preferences.widget_config IS 'User-specific overrides for widget configuration';

-- =====================================================================================
-- SECTION 2: FINANCIAL TRACKING (3 TABLES)
-- Issues: #65-#67
-- =====================================================================================

-- =====================================================================================
-- Table: refunds
-- Purpose: Track refund history and processing
-- Issue: #65
-- =====================================================================================
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Refund details
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(3) DEFAULT 'USD',
  reason VARCHAR(50) CHECK (reason IN ('requested_by_customer', 'duplicate', 'fraudulent', 'event_cancelled', 'other')),
  reason_description TEXT,

  -- Processing information
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected')),
  refund_method VARCHAR(50), -- 'original_payment_method', 'check', 'store_credit'

  -- Stripe integration
  stripe_refund_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  processor_response JSONB,

  -- Approval workflow
  requested_by UUID REFERENCES members(id),
  approved_by UUID REFERENCES members(id),
  approved_at TIMESTAMPTZ,

  -- Important dates
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,

  -- Audit fields
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for refunds
CREATE INDEX IF NOT EXISTS idx_refunds_transaction ON refunds(transaction_id);
CREATE INDEX IF NOT EXISTS idx_refunds_member ON refunds(member_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_requested_at ON refunds(requested_at);
CREATE INDEX IF NOT EXISTS idx_refunds_stripe_refund ON refunds(stripe_refund_id);
CREATE INDEX IF NOT EXISTS idx_refunds_requested_by ON refunds(requested_by);

COMMENT ON TABLE refunds IS 'Refund tracking with approval workflow and Stripe integration';
COMMENT ON COLUMN refunds.reason IS 'Categorized refund reason for reporting and compliance';
COMMENT ON COLUMN refunds.metadata IS 'Additional refund context and integration data';

-- =====================================================================================
-- Table: event_expenses
-- Purpose: Track event costs for ROI analysis
-- Issue: #66
-- =====================================================================================
CREATE TABLE IF NOT EXISTS event_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- Expense details
  expense_category VARCHAR(50) NOT NULL, -- 'venue', 'catering', 'speakers', 'marketing', 'materials', 'technology', 'other'
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(3) DEFAULT 'USD',

  -- Vendor information
  vendor_name VARCHAR(255),
  vendor_contact_email VARCHAR(255),
  invoice_number VARCHAR(100),
  invoice_url TEXT,

  -- Payment tracking
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_due_date DATE,
  payment_date DATE,
  payment_method VARCHAR(50),

  -- Budget tracking
  budgeted_amount DECIMAL(10,2),
  is_budgeted BOOLEAN DEFAULT false,

  -- Approval workflow
  submitted_by UUID REFERENCES members(id),
  approved_by UUID REFERENCES members(id),
  approved_at TIMESTAMPTZ,

  -- Audit fields
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of attachment URLs
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for event expenses
CREATE INDEX IF NOT EXISTS idx_event_expenses_event ON event_expenses(event_id);
CREATE INDEX IF NOT EXISTS idx_event_expenses_category ON event_expenses(expense_category);
CREATE INDEX IF NOT EXISTS idx_event_expenses_payment_status ON event_expenses(payment_status);
CREATE INDEX IF NOT EXISTS idx_event_expenses_payment_due ON event_expenses(payment_due_date) WHERE payment_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_event_expenses_submitted_by ON event_expenses(submitted_by);

COMMENT ON TABLE event_expenses IS 'Event cost tracking for ROI analysis and budget management';
COMMENT ON COLUMN event_expenses.expense_category IS 'Categorized expense types for reporting';
COMMENT ON COLUMN event_expenses.budgeted_amount IS 'Original budget allocation for variance analysis';

-- =====================================================================================
-- SECTION 3: ANALYTICS & ENGAGEMENT (6 TABLES)
-- Issues: #68-#73
-- =====================================================================================

-- =====================================================================================
-- Table: chapter_metrics
-- Purpose: Chapter performance benchmarking
-- Issue: #67
-- =====================================================================================
CREATE TABLE IF NOT EXISTS chapter_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,

  -- Time period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metric_type VARCHAR(20) DEFAULT 'monthly' CHECK (metric_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),

  -- Membership metrics
  total_members INTEGER DEFAULT 0,
  active_members INTEGER DEFAULT 0,
  new_members INTEGER DEFAULT 0,
  churned_members INTEGER DEFAULT 0,
  member_growth_rate DECIMAL(5,2),
  retention_rate DECIMAL(5,2),

  -- Engagement metrics
  avg_engagement_score DECIMAL(5,2),
  events_hosted INTEGER DEFAULT 0,
  total_event_attendees INTEGER DEFAULT 0,
  avg_event_attendance_rate DECIMAL(5,2),

  -- Financial metrics
  total_revenue DECIMAL(10,2) DEFAULT 0,
  membership_revenue DECIMAL(10,2) DEFAULT 0,
  event_revenue DECIMAL(10,2) DEFAULT 0,
  other_revenue DECIMAL(10,2) DEFAULT 0,

  -- Communication metrics
  emails_sent INTEGER DEFAULT 0,
  email_open_rate DECIMAL(5,2),
  email_click_rate DECIMAL(5,2),

  -- Comparative metrics (percentiles vs. similar chapters)
  percentile_rank INTEGER,
  national_avg_comparison DECIMAL(5,2), -- % above/below national average

  -- Audit fields
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_chapter_period UNIQUE(chapter_id, period_start, period_end, metric_type)
);

-- Indexes for chapter metrics
CREATE INDEX IF NOT EXISTS idx_chapter_metrics_chapter ON chapter_metrics(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_metrics_period ON chapter_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_chapter_metrics_type ON chapter_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_chapter_metrics_calculated ON chapter_metrics(calculated_at);

COMMENT ON TABLE chapter_metrics IS 'Chapter performance metrics for benchmarking and comparison';
COMMENT ON COLUMN chapter_metrics.percentile_rank IS 'Chapter ranking percentile among similar chapters';
COMMENT ON COLUMN chapter_metrics.national_avg_comparison IS 'Percentage above/below national average';

-- =====================================================================================
-- Table: member_engagement
-- Purpose: Track individual member engagement activities
-- Issue: #68
-- =====================================================================================
CREATE TABLE IF NOT EXISTS member_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Activity tracking
  activity_type VARCHAR(50) NOT NULL, -- 'event_attendance', 'email_open', 'email_click', 'login', 'course_enrollment', 'course_completion', 'committee_participation'
  activity_source VARCHAR(100), -- Source identifier (event_id, email_campaign_id, etc.)
  activity_value DECIMAL(10,2), -- Monetary value or points associated

  -- Engagement scoring
  engagement_points INTEGER DEFAULT 0,
  engagement_weight DECIMAL(3,2) DEFAULT 1.0, -- Multiplier for different activity types

  -- Context
  activity_metadata JSONB DEFAULT '{}'::jsonb,
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  activity_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for member engagement
CREATE INDEX IF NOT EXISTS idx_member_engagement_member ON member_engagement(member_id);
CREATE INDEX IF NOT EXISTS idx_member_engagement_type ON member_engagement(activity_type);
CREATE INDEX IF NOT EXISTS idx_member_engagement_timestamp ON member_engagement(activity_timestamp);
CREATE INDEX IF NOT EXISTS idx_member_engagement_source ON member_engagement(activity_source);
CREATE INDEX IF NOT EXISTS idx_member_engagement_member_timestamp ON member_engagement(member_id, activity_timestamp DESC);

COMMENT ON TABLE member_engagement IS 'Individual member engagement activity tracking';
COMMENT ON COLUMN member_engagement.engagement_points IS 'Points earned for this activity';
COMMENT ON COLUMN member_engagement.engagement_weight IS 'Activity type weight multiplier';

-- =====================================================================================
-- Table: engagement_metrics
-- Purpose: Aggregated engagement scores and trends
-- Issue: #69
-- =====================================================================================
CREATE TABLE IF NOT EXISTS engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Calculated scores
  overall_engagement_score DECIMAL(5,2) DEFAULT 0,
  event_engagement_score DECIMAL(5,2) DEFAULT 0,
  email_engagement_score DECIMAL(5,2) DEFAULT 0,
  course_engagement_score DECIMAL(5,2) DEFAULT 0,
  community_engagement_score DECIMAL(5,2) DEFAULT 0,

  -- Activity counts
  total_activities INTEGER DEFAULT 0,
  activities_last_30_days INTEGER DEFAULT 0,
  activities_last_90_days INTEGER DEFAULT 0,
  activities_last_year INTEGER DEFAULT 0,

  -- Engagement trends
  engagement_trend VARCHAR(20), -- 'increasing', 'stable', 'decreasing', 'at_risk'
  trend_percentage DECIMAL(5,2), -- % change over previous period

  -- Time-based metrics
  days_since_last_activity INTEGER,
  avg_activities_per_month DECIMAL(5,2),
  most_active_day_of_week INTEGER, -- 0=Sunday, 6=Saturday
  most_active_hour INTEGER, -- 0-23

  -- Segmentation
  engagement_segment VARCHAR(20), -- 'champion', 'active', 'casual', 'at_risk', 'dormant'

  -- Calculation metadata
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  calculation_period_start DATE,
  calculation_period_end DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_member_engagement_metrics UNIQUE(member_id)
);

-- Indexes for engagement metrics
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_member ON engagement_metrics(member_id);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_segment ON engagement_metrics(engagement_segment);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_trend ON engagement_metrics(engagement_trend);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_score ON engagement_metrics(overall_engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_calculated ON engagement_metrics(last_calculated_at);

COMMENT ON TABLE engagement_metrics IS 'Aggregated member engagement scores and behavioral patterns';
COMMENT ON COLUMN engagement_metrics.engagement_segment IS 'Member categorization based on engagement level';
COMMENT ON COLUMN engagement_metrics.engagement_trend IS 'Recent engagement trajectory for proactive intervention';

-- =====================================================================================
-- Table: churn_predictions
-- Purpose: ML-based churn risk predictions
-- Issue: #70
-- =====================================================================================
CREATE TABLE IF NOT EXISTS churn_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Prediction details
  churn_probability DECIMAL(5,4) NOT NULL CHECK (churn_probability BETWEEN 0 AND 1),
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  predicted_churn_date DATE,
  confidence_score DECIMAL(5,4) CHECK (confidence_score BETWEEN 0 AND 1),

  -- Contributing factors
  primary_risk_factors JSONB DEFAULT '[]'::jsonb, -- Array of {factor, weight, value, impact}
  behavioral_indicators JSONB DEFAULT '{}'::jsonb,

  -- Intervention recommendations
  recommended_actions JSONB DEFAULT '[]'::jsonb, -- Array of suggested retention strategies
  intervention_priority INTEGER DEFAULT 0,

  -- Model information
  model_version VARCHAR(50),
  model_type VARCHAR(50), -- 'logistic_regression', 'random_forest', 'neural_network'
  feature_importance JSONB DEFAULT '{}'::jsonb,

  -- Outcome tracking
  actual_churned BOOLEAN,
  actual_churn_date DATE,
  intervention_applied BOOLEAN DEFAULT false,
  intervention_details JSONB,

  -- Timestamps
  prediction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for churn predictions
CREATE INDEX IF NOT EXISTS idx_churn_predictions_member ON churn_predictions(member_id);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_risk ON churn_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_probability ON churn_predictions(churn_probability DESC);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_date ON churn_predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_valid ON churn_predictions(valid_until) WHERE valid_until > CURRENT_DATE;
CREATE INDEX IF NOT EXISTS idx_churn_predictions_intervention ON churn_predictions(intervention_priority DESC) WHERE intervention_applied = false;

COMMENT ON TABLE churn_predictions IS 'ML-based member churn risk predictions with intervention recommendations';
COMMENT ON COLUMN churn_predictions.churn_probability IS 'Predicted probability of churn (0-1)';
COMMENT ON COLUMN churn_predictions.recommended_actions IS 'AI-generated retention strategies';

-- =====================================================================================
-- Table: ai_analysis_log
-- Purpose: Track AI-generated insights and recommendations
-- Issue: #71
-- =====================================================================================
CREATE TABLE IF NOT EXISTS ai_analysis_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Analysis context
  analysis_type VARCHAR(50) NOT NULL, -- 'churn_prediction', 'engagement_forecast', 'campaign_optimization', 'revenue_forecast'
  entity_type VARCHAR(50), -- 'member', 'chapter', 'event', 'campaign'
  entity_id UUID,

  -- AI input/output
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  insights JSONB DEFAULT '[]'::jsonb, -- Array of generated insights
  recommendations JSONB DEFAULT '[]'::jsonb, -- Array of actionable recommendations

  -- Model information
  model_name VARCHAR(100),
  model_version VARCHAR(50),
  confidence_score DECIMAL(5,4),
  processing_time_ms INTEGER,

  -- Quality metrics
  accuracy_score DECIMAL(5,4),
  validated BOOLEAN DEFAULT false,
  validation_result JSONB,
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES members(id),

  -- User interaction
  viewed_by UUID[] DEFAULT ARRAY[]::UUID[],
  applied BOOLEAN DEFAULT false,
  applied_by UUID REFERENCES members(id),
  applied_at TIMESTAMPTZ,
  effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for AI analysis log
CREATE INDEX IF NOT EXISTS idx_ai_analysis_type ON ai_analysis_log(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_entity ON ai_analysis_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_created ON ai_analysis_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_applied ON ai_analysis_log(applied) WHERE applied = true;
CREATE INDEX IF NOT EXISTS idx_ai_analysis_model ON ai_analysis_log(model_name, model_version);

COMMENT ON TABLE ai_analysis_log IS 'Audit trail for AI-generated insights and recommendations';
COMMENT ON COLUMN ai_analysis_log.insights IS 'AI-generated insights in structured format';
COMMENT ON COLUMN ai_analysis_log.effectiveness_rating IS 'User feedback on recommendation quality (1-5)';

-- =====================================================================================
-- Table: cohorts
-- Purpose: Define member cohorts for analysis
-- Issue: #72
-- =====================================================================================
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cohort definition
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cohort_type VARCHAR(50) NOT NULL, -- 'join_date', 'chapter', 'membership_tier', 'engagement_level', 'activity_pattern', 'custom'
  definition_criteria JSONB NOT NULL, -- Structured criteria for cohort membership

  -- Membership tracking
  member_count INTEGER DEFAULT 0,
  is_dynamic BOOLEAN DEFAULT true, -- True = auto-updates; False = static snapshot

  -- Filters
  chapter_ids UUID[] DEFAULT ARRAY[]::UUID[],
  membership_types VARCHAR(50)[] DEFAULT ARRAY[]::VARCHAR[],
  date_range_start DATE,
  date_range_end DATE,

  -- Ownership
  created_by UUID REFERENCES members(id),
  is_public BOOLEAN DEFAULT false,
  shared_with UUID[] DEFAULT ARRAY[]::UUID[], -- Member IDs with view access

  -- Metadata
  tags VARCHAR(50)[] DEFAULT ARRAY[]::VARCHAR[],
  color VARCHAR(7), -- Hex color for UI visualization

  -- Refresh tracking
  last_calculated_at TIMESTAMPTZ,
  auto_refresh_enabled BOOLEAN DEFAULT true,
  refresh_frequency_hours INTEGER DEFAULT 24,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for cohorts
CREATE INDEX IF NOT EXISTS idx_cohorts_type ON cohorts(cohort_type);
CREATE INDEX IF NOT EXISTS idx_cohorts_created_by ON cohorts(created_by);
CREATE INDEX IF NOT EXISTS idx_cohorts_public ON cohorts(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_cohorts_dynamic ON cohorts(is_dynamic) WHERE is_dynamic = true;
CREATE INDEX IF NOT EXISTS idx_cohorts_tags ON cohorts USING gin(tags);

COMMENT ON TABLE cohorts IS 'Cohort definitions for member segmentation and analysis';
COMMENT ON COLUMN cohorts.is_dynamic IS 'True = members auto-update based on criteria; False = static snapshot';
COMMENT ON COLUMN cohorts.definition_criteria IS 'Structured JSON criteria for cohort membership logic';

-- =====================================================================================
-- Table: cohort_metrics
-- Purpose: Track cohort performance over time
-- Issue: #73
-- =====================================================================================
CREATE TABLE IF NOT EXISTS cohort_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,

  -- Time period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metric_type VARCHAR(20) DEFAULT 'monthly' CHECK (metric_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),

  -- Membership metrics
  starting_member_count INTEGER DEFAULT 0,
  ending_member_count INTEGER DEFAULT 0,
  new_members INTEGER DEFAULT 0,
  churned_members INTEGER DEFAULT 0,
  retention_rate DECIMAL(5,2),
  churn_rate DECIMAL(5,2),

  -- Engagement metrics
  avg_engagement_score DECIMAL(5,2),
  total_activities INTEGER DEFAULT 0,
  avg_activities_per_member DECIMAL(5,2),

  -- Event metrics
  events_attended INTEGER DEFAULT 0,
  avg_events_per_member DECIMAL(5,2),
  event_attendance_rate DECIMAL(5,2),

  -- Financial metrics
  total_revenue DECIMAL(10,2) DEFAULT 0,
  avg_revenue_per_member DECIMAL(10,2),
  lifetime_value DECIMAL(10,2),

  -- Email engagement
  emails_sent INTEGER DEFAULT 0,
  email_open_rate DECIMAL(5,2),
  email_click_rate DECIMAL(5,2),

  -- Comparative analysis
  vs_previous_period_pct DECIMAL(5,2), -- % change from previous period
  vs_overall_avg_pct DECIMAL(5,2), -- % difference from overall average

  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_cohort_period UNIQUE(cohort_id, period_start, period_end, metric_type)
);

-- Indexes for cohort metrics
CREATE INDEX IF NOT EXISTS idx_cohort_metrics_cohort ON cohort_metrics(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_metrics_period ON cohort_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_cohort_metrics_type ON cohort_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_cohort_metrics_calculated ON cohort_metrics(calculated_at);

COMMENT ON TABLE cohort_metrics IS 'Time-series performance metrics for cohort analysis';
COMMENT ON COLUMN cohort_metrics.vs_previous_period_pct IS 'Percentage change from previous period for trend analysis';

-- =====================================================================================
-- SECTION 4: INFRASTRUCTURE (3 TABLES)
-- Issues: #74-#76
-- =====================================================================================

-- =====================================================================================
-- Table: notifications
-- Purpose: System-wide notification management
-- Issue: #74
-- =====================================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Recipient
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Notification content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL, -- 'info', 'success', 'warning', 'error', 'event', 'renewal', 'payment', 'system'
  category VARCHAR(50), -- 'membership', 'events', 'financial', 'system', 'engagement'

  -- Priority and routing
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  delivery_channels VARCHAR(20)[] DEFAULT ARRAY['in_app']::VARCHAR[], -- 'in_app', 'email', 'sms', 'push'

  -- Links and actions
  action_url TEXT,
  action_label VARCHAR(100),
  related_entity_type VARCHAR(50), -- 'event', 'member', 'transaction', 'campaign'
  related_entity_id UUID,

  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'dismissed', 'failed')),
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  -- Delivery tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,

  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  icon VARCHAR(50), -- Phosphor icon name

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_member ON notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_member_status ON notifications(member_id, status) WHERE status != 'dismissed';
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at);

COMMENT ON TABLE notifications IS 'Multi-channel notification system with delivery tracking';
COMMENT ON COLUMN notifications.delivery_channels IS 'Array of channels: in_app, email, sms, push';
COMMENT ON COLUMN notifications.expires_at IS 'Auto-dismiss notification after this timestamp';

-- =====================================================================================
-- Table: documents
-- Purpose: Document management and storage
-- Issue: #75
-- =====================================================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Document metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,
  document_type VARCHAR(50) NOT NULL, -- 'policy', 'procedure', 'form', 'template', 'report', 'meeting_minutes', 'bylaw', 'contract'
  category VARCHAR(50), -- 'governance', 'operations', 'financial', 'legal', 'hr', 'events', 'membership'

  -- File information
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  file_extension VARCHAR(10),

  -- Storage location
  storage_provider VARCHAR(50) DEFAULT 'supabase', -- 'supabase', 's3', 'azure', 'google'
  storage_path TEXT,
  storage_bucket VARCHAR(100),

  -- Version control
  version VARCHAR(20) DEFAULT '1.0',
  version_number INTEGER DEFAULT 1,
  is_latest_version BOOLEAN DEFAULT true,
  parent_document_id UUID REFERENCES documents(id),

  -- Access control
  access_level VARCHAR(20) DEFAULT 'public' CHECK (access_level IN ('public', 'members_only', 'chapter_admin', 'state_admin', 'national_admin')),
  required_role_tier INTEGER DEFAULT 1 CHECK (required_role_tier BETWEEN 1 AND 4),
  chapter_id UUID REFERENCES chapters(id), -- NULL = available to all chapters

  -- Organization
  tags VARCHAR(50)[] DEFAULT ARRAY[]::VARCHAR[],
  folder_path VARCHAR(255), -- Virtual folder structure

  -- Content analysis
  full_text_content TEXT, -- Extracted text for search
  word_count INTEGER,
  page_count INTEGER,

  -- Metadata
  author_name VARCHAR(255),
  uploaded_by UUID REFERENCES members(id),
  approved_by UUID REFERENCES members(id),
  approved_at TIMESTAMPTZ,

  -- Tracking
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,

  -- Lifecycle
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT false,

  -- Search optimization
  search_vector tsvector,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_chapter ON documents(chapter_id);
CREATE INDEX IF NOT EXISTS idx_documents_access ON documents(access_level);
CREATE INDEX IF NOT EXISTS idx_documents_latest ON documents(is_latest_version) WHERE is_latest_version = true;
CREATE INDEX IF NOT EXISTS idx_documents_archived ON documents(is_archived) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at DESC);

COMMENT ON TABLE documents IS 'Document management with version control and full-text search';
COMMENT ON COLUMN documents.access_level IS 'Access control: public, members_only, or role-based';
COMMENT ON COLUMN documents.search_vector IS 'Full-text search index using tsvector';

-- =====================================================================================
-- Table: committees
-- Purpose: Committee and working group management
-- Issue: #76
-- =====================================================================================
CREATE TABLE IF NOT EXISTS committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Committee details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  committee_type VARCHAR(50) NOT NULL, -- 'standing', 'ad_hoc', 'task_force', 'advisory', 'executive'
  purpose TEXT,

  -- Hierarchy
  chapter_id UUID REFERENCES chapters(id), -- NULL = national committee
  parent_committee_id UUID REFERENCES committees(id),

  -- Leadership
  chair_member_id UUID REFERENCES members(id),
  vice_chair_member_id UUID REFERENCES members(id),
  secretary_member_id UUID REFERENCES members(id),

  -- Membership tracking
  member_count INTEGER DEFAULT 0,
  max_members INTEGER, -- NULL = unlimited
  requires_approval BOOLEAN DEFAULT false,

  -- Meeting information
  meeting_schedule VARCHAR(255), -- e.g., "2nd Tuesday of each month at 2pm EST"
  meeting_location VARCHAR(255),
  virtual_meeting_url TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'archived')),

  -- Important dates
  established_date DATE,
  target_completion_date DATE,
  completed_date DATE,

  -- Communication
  email_list VARCHAR(255),
  slack_channel VARCHAR(100),
  shared_drive_url TEXT,

  -- Goals and outcomes
  goals JSONB DEFAULT '[]'::jsonb, -- Array of committee goals
  deliverables JSONB DEFAULT '[]'::jsonb, -- Array of expected deliverables
  achievements JSONB DEFAULT '[]'::jsonb, -- Array of completed achievements

  -- Privacy
  is_public BOOLEAN DEFAULT true,

  -- Metadata
  tags VARCHAR(50)[] DEFAULT ARRAY[]::VARCHAR[],
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for committees
CREATE INDEX IF NOT EXISTS idx_committees_chapter ON committees(chapter_id);
CREATE INDEX IF NOT EXISTS idx_committees_parent ON committees(parent_committee_id);
CREATE INDEX IF NOT EXISTS idx_committees_type ON committees(committee_type);
CREATE INDEX IF NOT EXISTS idx_committees_status ON committees(status);
CREATE INDEX IF NOT EXISTS idx_committees_chair ON committees(chair_member_id);
CREATE INDEX IF NOT EXISTS idx_committees_tags ON committees USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_committees_public ON committees(is_public) WHERE is_public = true;

COMMENT ON TABLE committees IS 'Committee and working group management with hierarchy and membership tracking';
COMMENT ON COLUMN committees.committee_type IS 'Type: standing, ad_hoc, task_force, advisory, executive';
COMMENT ON COLUMN committees.goals IS 'JSONB array of committee objectives and goals';

-- =====================================================================================
-- TRIGGERS: updated_at automation
-- =====================================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all new tables
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dashboard_widgets_updated_at BEFORE UPDATE ON dashboard_widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_dashboard_layouts_updated_at BEFORE UPDATE ON user_dashboard_layouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_dashboard_preferences_updated_at BEFORE UPDATE ON user_dashboard_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_expenses_updated_at BEFORE UPDATE ON event_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chapter_metrics_updated_at BEFORE UPDATE ON chapter_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_engagement_metrics_updated_at BEFORE UPDATE ON engagement_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_churn_predictions_updated_at BEFORE UPDATE ON churn_predictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_analysis_log_updated_at BEFORE UPDATE ON ai_analysis_log FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cohorts_updated_at BEFORE UPDATE ON cohorts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cohort_metrics_updated_at BEFORE UPDATE ON cohort_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_committees_updated_at BEFORE UPDATE ON committees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================================
-- TRIGGER: Document full-text search vector update
-- =====================================================================================
CREATE OR REPLACE FUNCTION documents_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector =
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.full_text_content, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_search_vector_trigger
BEFORE INSERT OR UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION documents_search_vector_update();

-- =====================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
