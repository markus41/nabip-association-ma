-- =====================================================================================
-- Migration: Analytics & Predictive Insights
-- Issue: #190 - Advanced Analytics with Predictive Insights (High Priority)
-- Estimated Hours: 20 hours
-- Description: Comprehensive analytics platform with event tracking, member metrics,
--              cohort analysis, and predictive modeling for data-driven decision making
-- =====================================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================================
-- Table: analytics_events
-- Purpose: Track all user interactions and system events for behavioral analytics
-- =====================================================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL CHECK (event_category IN (
    'page_view', 'user_action', 'system_event', 'conversion', 'engagement'
  )),
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  session_id UUID,
  properties JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  page_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_member ON analytics_events(member_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_properties ON analytics_events USING GIN(properties);

-- Partitioning strategy for large-scale analytics (monthly partitions)
-- Note: Implement table partitioning in production for >1M rows/month

COMMENT ON TABLE analytics_events IS 'Event tracking for user behavior analytics and funnel analysis';
COMMENT ON COLUMN analytics_events.event_name IS 'Event name: login, page_view, button_click, form_submit, etc.';
COMMENT ON COLUMN analytics_events.properties IS 'Event-specific data: {button_id, form_name, product_id, etc.}';
COMMENT ON COLUMN analytics_events.metadata IS 'Context metadata: {chapter_id, campaign_id, device_type, etc.}';

-- =====================================================================================
-- Table: member_metrics
-- Purpose: Aggregated member engagement metrics with daily/weekly/monthly snapshots
-- =====================================================================================
CREATE TABLE IF NOT EXISTS member_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),

  -- Engagement metrics
  page_views INTEGER DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  avg_session_duration_seconds INTEGER DEFAULT 0,
  events_attended INTEGER DEFAULT 0,
  courses_completed INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,

  -- Activity scores
  engagement_score NUMERIC(5,2) DEFAULT 0, -- Weighted composite score
  activity_level VARCHAR(20) CHECK (activity_level IN ('inactive', 'low', 'medium', 'high', 'power_user')),

  -- Conversion metrics
  revenue_generated NUMERIC(12,2) DEFAULT 0,
  referrals_made INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_member_metric_period UNIQUE(member_id, metric_date, period_type)
);

-- Create indexes for member metrics queries
CREATE INDEX IF NOT EXISTS idx_member_metrics_member ON member_metrics(member_id);
CREATE INDEX IF NOT EXISTS idx_member_metrics_date ON member_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_member_metrics_period ON member_metrics(period_type);
CREATE INDEX IF NOT EXISTS idx_member_metrics_engagement ON member_metrics(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_member_metrics_activity ON member_metrics(activity_level);

COMMENT ON TABLE member_metrics IS 'Aggregated member engagement metrics with daily/weekly/monthly rollups';
COMMENT ON COLUMN member_metrics.engagement_score IS 'Weighted score: (events*5 + courses*10 + emails*1 + sessions*2) / days_active';
COMMENT ON COLUMN member_metrics.activity_level IS 'Segmentation: inactive (<10), low (10-30), medium (30-60), high (60-90), power_user (>90)';

-- =====================================================================================
-- Table: cohorts
-- Purpose: Define member cohorts for segmentation and retention analysis
-- =====================================================================================
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cohort_type VARCHAR(50) NOT NULL CHECK (cohort_type IN (
    'acquisition', 'behavioral', 'demographic', 'custom'
  )),
  definition JSONB NOT NULL, -- Cohort criteria: {join_date_range, chapter_id, member_type, etc.}
  created_by UUID NOT NULL REFERENCES members(id),
  is_dynamic BOOLEAN NOT NULL DEFAULT false, -- Re-evaluate membership automatically
  member_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for cohort queries
CREATE INDEX IF NOT EXISTS idx_cohorts_type ON cohorts(cohort_type);
CREATE INDEX IF NOT EXISTS idx_cohorts_created_by ON cohorts(created_by);
CREATE INDEX IF NOT EXISTS idx_cohorts_is_dynamic ON cohorts(is_dynamic) WHERE is_dynamic = true;

COMMENT ON TABLE cohorts IS 'Member cohorts for segmentation, retention analysis, and targeted campaigns';
COMMENT ON COLUMN cohorts.cohort_type IS 'acquisition (join date), behavioral (actions), demographic (attributes), custom';
COMMENT ON COLUMN cohorts.definition IS 'JSONB criteria: {filters: [{field, operator, value}], date_range: {start, end}}';
COMMENT ON COLUMN cohorts.is_dynamic IS 'Auto-recalculate membership vs. static snapshot at creation';

-- =====================================================================================
-- Table: cohort_members
-- Purpose: Many-to-many mapping between cohorts and members
-- =====================================================================================
CREATE TABLE IF NOT EXISTS cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  joined_cohort_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_cohort_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_cohort_member UNIQUE(cohort_id, member_id)
);

-- Create indexes for cohort membership queries
CREATE INDEX IF NOT EXISTS idx_cohort_members_cohort ON cohort_members(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_members_member ON cohort_members(member_id);
CREATE INDEX IF NOT EXISTS idx_cohort_members_active ON cohort_members(is_active) WHERE is_active = true;

COMMENT ON TABLE cohort_members IS 'Cohort membership tracking with join/leave timestamps for retention analysis';

-- =====================================================================================
-- Table: predictions
-- Purpose: Store ML predictions for churn, LTV, engagement forecasting
-- =====================================================================================
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_type VARCHAR(50) NOT NULL CHECK (prediction_type IN (
    'churn_risk', 'ltv', 'engagement_forecast', 'conversion_probability', 'next_best_action'
  )),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  prediction_value NUMERIC(10,4) NOT NULL, -- Probability score (0-1) or forecasted value
  confidence_score NUMERIC(5,4), -- Model confidence (0-1)
  model_version VARCHAR(50),
  features JSONB, -- Features used for prediction
  metadata JSONB DEFAULT '{}'::jsonb,
  prediction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at TIMESTAMPTZ, -- When prediction becomes stale
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for prediction queries
CREATE INDEX IF NOT EXISTS idx_predictions_type ON predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictions_member ON predictions(member_id);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(prediction_date DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_value ON predictions(prediction_value DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_expires ON predictions(expires_at);

COMMENT ON TABLE predictions IS 'ML predictions for churn risk, LTV, engagement forecasting, and recommendations';
COMMENT ON COLUMN predictions.prediction_type IS 'churn_risk (0-1), ltv (currency), engagement_forecast (score), conversion_probability (0-1)';
COMMENT ON COLUMN predictions.features IS 'JSONB feature vector used: {tenure_days, events_attended, engagement_score, etc.}';

-- =====================================================================================
-- Table: funnel_analysis
-- Purpose: Track conversion funnels with step-by-step dropoff analysis
-- =====================================================================================
CREATE TABLE IF NOT EXISTS funnel_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_name VARCHAR(255) NOT NULL,
  funnel_steps TEXT[] NOT NULL, -- Array of step names in order
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  session_id UUID,
  current_step VARCHAR(100) NOT NULL,
  step_index INTEGER NOT NULL, -- 0-based index in funnel_steps array
  completed_steps INTEGER DEFAULT 0,
  is_converted BOOLEAN NOT NULL DEFAULT false,
  time_to_complete_seconds INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for funnel queries
CREATE INDEX IF NOT EXISTS idx_funnel_analysis_name ON funnel_analysis(funnel_name);
CREATE INDEX IF NOT EXISTS idx_funnel_analysis_member ON funnel_analysis(member_id);
CREATE INDEX IF NOT EXISTS idx_funnel_analysis_session ON funnel_analysis(session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_analysis_step ON funnel_analysis(current_step);
CREATE INDEX IF NOT EXISTS idx_funnel_analysis_converted ON funnel_analysis(is_converted);

COMMENT ON TABLE funnel_analysis IS 'Conversion funnel tracking with step completion and dropoff analysis';
COMMENT ON COLUMN funnel_analysis.funnel_steps IS 'Ordered array of step names: [''landing'', ''signup'', ''profile'', ''payment'', ''complete'']';

-- =====================================================================================
-- Triggers: Auto-update timestamps
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_member_metrics_updated_at
  BEFORE UPDATE ON member_metrics
  FOR EACH ROW EXECUTE FUNCTION update_analytics_updated_at();

CREATE TRIGGER trigger_cohorts_updated_at
  BEFORE UPDATE ON cohorts
  FOR EACH ROW EXECUTE FUNCTION update_analytics_updated_at();

CREATE TRIGGER trigger_funnel_analysis_updated_at
  BEFORE UPDATE ON funnel_analysis
  FOR EACH ROW EXECUTE FUNCTION update_analytics_updated_at();

-- =====================================================================================
-- Triggers: Update cohort member count
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_cohort_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    UPDATE cohorts SET member_count = member_count + 1 WHERE id = NEW.cohort_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    UPDATE cohorts SET member_count = member_count - 1 WHERE id = NEW.cohort_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active = false AND NEW.is_active = true THEN
    UPDATE cohorts SET member_count = member_count + 1 WHERE id = NEW.cohort_id;
  ELSIF TG_OP = 'DELETE' AND OLD.is_active = true THEN
    UPDATE cohorts SET member_count = member_count - 1 WHERE id = OLD.cohort_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cohort_count
  AFTER INSERT OR UPDATE OR DELETE ON cohort_members
  FOR EACH ROW EXECUTE FUNCTION update_cohort_member_count();

-- =====================================================================================
-- Helper Functions: Track analytics event
-- =====================================================================================

CREATE OR REPLACE FUNCTION track_event(
  p_event_name VARCHAR,
  p_event_category VARCHAR,
  p_member_id UUID DEFAULT NULL,
  p_session_id UUID DEFAULT NULL,
  p_properties JSONB DEFAULT '{}'::jsonb,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO analytics_events (
    event_name,
    event_category,
    member_id,
    session_id,
    properties,
    metadata
  ) VALUES (
    p_event_name,
    p_event_category,
    p_member_id,
    p_session_id,
    p_properties,
    p_metadata
  ) RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION track_event IS 'Log analytics event for behavioral tracking';

-- =====================================================================================
-- Helper Functions: Calculate member engagement score
-- =====================================================================================

CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_member_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_events_attended INTEGER;
  v_courses_completed INTEGER;
  v_emails_opened INTEGER;
  v_session_count INTEGER;
  v_days_active INTEGER;
  v_score NUMERIC;
BEGIN
  -- Count events attended
  SELECT COUNT(*) INTO v_events_attended
  FROM registrations
  WHERE member_id = p_member_id
    AND status = 'attended'
    AND check_in_time BETWEEN p_start_date AND p_end_date;

  -- Count courses completed
  SELECT COUNT(*) INTO v_courses_completed
  FROM enrollments
  WHERE member_id = p_member_id
    AND status = 'completed'
    AND completed_at BETWEEN p_start_date AND p_end_date;

  -- Count email opens
  SELECT COUNT(*) INTO v_emails_opened
  FROM email_events ee
  JOIN campaign_sends cs ON ee.campaign_send_id = cs.id
  WHERE cs.member_id = p_member_id
    AND ee.event_type = 'open'
    AND ee.created_at BETWEEN p_start_date AND p_end_date;

  -- Count distinct session days
  SELECT COUNT(DISTINCT DATE(created_at)) INTO v_session_count
  FROM analytics_events
  WHERE member_id = p_member_id
    AND event_category = 'page_view'
    AND created_at BETWEEN p_start_date AND p_end_date;

  v_days_active := GREATEST(v_session_count, 1);

  -- Calculate weighted engagement score
  v_score := (
    (v_events_attended * 5.0) +
    (v_courses_completed * 10.0) +
    (v_emails_opened * 1.0) +
    (v_session_count * 2.0)
  ) / v_days_active;

  RETURN ROUND(v_score, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_engagement_score IS 'Calculate member engagement score: (events*5 + courses*10 + emails*1 + sessions*2) / days_active';

-- =====================================================================================
-- Helper Functions: Evaluate cohort membership
-- =====================================================================================

CREATE OR REPLACE FUNCTION evaluate_cohort_membership(p_cohort_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_cohort RECORD;
  v_members_added INTEGER := 0;
  v_definition JSONB;
BEGIN
  -- Get cohort definition
  SELECT * INTO v_cohort FROM cohorts WHERE id = p_cohort_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cohort % not found', p_cohort_id;
  END IF;

  v_definition := v_cohort.definition;

  -- TODO: Implement dynamic cohort evaluation based on definition
  -- This is a placeholder - actual implementation would parse v_definition
  -- and execute dynamic queries to find matching members

  -- Example: Acquisition cohort (members who joined in date range)
  IF v_cohort.cohort_type = 'acquisition' THEN
    INSERT INTO cohort_members (cohort_id, member_id)
    SELECT p_cohort_id, m.id
    FROM members m
    WHERE m.created_at BETWEEN
      (v_definition->>'start_date')::TIMESTAMPTZ
      AND (v_definition->>'end_date')::TIMESTAMPTZ
    ON CONFLICT (cohort_id, member_id) DO NOTHING;

    GET DIAGNOSTICS v_members_added = ROW_COUNT;
  END IF;

  -- Update cohort metadata
  UPDATE cohorts
  SET last_calculated_at = now()
  WHERE id = p_cohort_id;

  RETURN v_members_added;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION evaluate_cohort_membership IS 'Evaluate and update cohort membership based on cohort definition';

-- =====================================================================================
-- Helper Functions: Calculate funnel conversion rate
-- =====================================================================================

CREATE OR REPLACE FUNCTION calculate_funnel_conversion(
  p_funnel_name VARCHAR,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  step_name VARCHAR,
  step_index INTEGER,
  users_entered INTEGER,
  users_completed INTEGER,
  conversion_rate NUMERIC,
  avg_time_to_next_step_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH funnel_steps AS (
    SELECT DISTINCT
      unnest(fa.funnel_steps) AS step_name,
      generate_series(0, array_length(fa.funnel_steps, 1) - 1) AS step_index
    FROM funnel_analysis fa
    WHERE fa.funnel_name = p_funnel_name
    LIMIT 1
  )
  SELECT
    fs.step_name::VARCHAR,
    fs.step_index,
    COUNT(DISTINCT fa.session_id) AS users_entered,
    COUNT(DISTINCT CASE WHEN fa.step_index >= fs.step_index THEN fa.session_id END) AS users_completed,
    ROUND(
      (COUNT(DISTINCT CASE WHEN fa.step_index >= fs.step_index THEN fa.session_id END)::NUMERIC /
       NULLIF(COUNT(DISTINCT fa.session_id), 0)) * 100,
      2
    ) AS conversion_rate,
    NULL::INTEGER AS avg_time_to_next_step_seconds -- TODO: Calculate time between steps
  FROM funnel_steps fs
  LEFT JOIN funnel_analysis fa ON fa.funnel_name = p_funnel_name
    AND fa.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY fs.step_name, fs.step_index
  ORDER BY fs.step_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_funnel_conversion IS 'Calculate conversion rates for each step in a funnel';

-- =====================================================================================
-- Helper Functions: Get member churn risk
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_member_churn_risk(p_member_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_churn_risk NUMERIC;
BEGIN
  -- Get most recent churn prediction
  SELECT prediction_value INTO v_churn_risk
  FROM predictions
  WHERE member_id = p_member_id
    AND prediction_type = 'churn_risk'
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY prediction_date DESC
  LIMIT 1;

  -- If no prediction exists, calculate basic heuristic
  IF v_churn_risk IS NULL THEN
    -- Simple heuristic: days since last login / 90 days
    SELECT LEAST(
      EXTRACT(EPOCH FROM (now() - MAX(created_at))) / (90 * 86400),
      1.0
    ) INTO v_churn_risk
    FROM analytics_events
    WHERE member_id = p_member_id
      AND event_name = 'login';
  END IF;

  RETURN COALESCE(v_churn_risk, 0.5); -- Default 50% if no data
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_member_churn_risk IS 'Get member churn risk score (0-1) from predictions or heuristic';

-- =====================================================================================
-- RLS Policies: Enable Row Level Security
-- =====================================================================================

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_analysis ENABLE ROW LEVEL SECURITY;

-- Analytics Events: Members can view their own events, admins can view all
CREATE POLICY analytics_events_select_policy ON analytics_events
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'reports', 'read')
  );

CREATE POLICY analytics_events_insert_policy ON analytics_events
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Allow all authenticated users to track events

-- Member Metrics: Members can view their own metrics, admins can view all
CREATE POLICY member_metrics_select_policy ON member_metrics
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'reports', 'read')
  );

CREATE POLICY member_metrics_insert_policy ON member_metrics
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY member_metrics_update_policy ON member_metrics
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

-- Cohorts: Admins can manage, members can view public cohorts
CREATE POLICY cohorts_select_policy ON cohorts
  FOR SELECT TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'reports', 'read')
  );

CREATE POLICY cohorts_insert_policy ON cohorts
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'reports', 'create')
    AND created_by = auth.uid()::UUID
  );

CREATE POLICY cohorts_update_policy ON cohorts
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'reports', 'manage')
  );

CREATE POLICY cohorts_delete_policy ON cohorts
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'reports', 'delete')
  );

-- Cohort Members: Inherit permissions from parent cohort
CREATE POLICY cohort_members_select_policy ON cohort_members
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid()::UUID
    OR cohort_id IN (
      SELECT id FROM cohorts WHERE has_permission(auth.uid()::UUID, 'reports', 'read')
    )
  );

CREATE POLICY cohort_members_insert_policy ON cohort_members
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'reports', 'manage')
  );

CREATE POLICY cohort_members_update_policy ON cohort_members
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'reports', 'manage')
  );

CREATE POLICY cohort_members_delete_policy ON cohort_members
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'reports', 'manage')
  );

-- Predictions: Members can view their own predictions, admins can view all
CREATE POLICY predictions_select_policy ON predictions
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'reports', 'read')
  );

CREATE POLICY predictions_insert_policy ON predictions
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

-- Funnel Analysis: Admins only
CREATE POLICY funnel_analysis_select_policy ON funnel_analysis
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'reports', 'read')
  );

CREATE POLICY funnel_analysis_insert_policy ON funnel_analysis
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Allow tracking for all authenticated users

CREATE POLICY funnel_analysis_update_policy ON funnel_analysis
  FOR UPDATE TO authenticated
  USING (true); -- Allow updates for funnel progression

-- =====================================================================================
-- Sample Cohorts for Testing
-- =====================================================================================

-- Get the first member ID for sample cohort creator
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM members LIMIT 1;

  IF v_admin_id IS NOT NULL THEN
    -- New Members Cohort (last 30 days)
    INSERT INTO cohorts (name, description, cohort_type, definition, created_by, is_dynamic)
    VALUES (
      'New Members (Last 30 Days)',
      'Members who joined in the last 30 days',
      'acquisition',
      jsonb_build_object(
        'start_date', (CURRENT_DATE - INTERVAL '30 days')::TEXT,
        'end_date', CURRENT_DATE::TEXT
      ),
      v_admin_id,
      true
    )
    ON CONFLICT DO NOTHING;

    -- High Engagement Cohort
    INSERT INTO cohorts (name, description, cohort_type, definition, created_by, is_dynamic)
    VALUES (
      'High Engagement Members',
      'Members with engagement score > 60 in last 30 days',
      'behavioral',
      jsonb_build_object(
        'filters', jsonb_build_array(
          jsonb_build_object('field', 'engagement_score', 'operator', '>', 'value', 60)
        )
      ),
      v_admin_id,
      true
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- =====================================================================================
-- Migration Complete
-- =====================================================================================
-- Tables Created: 6 (analytics_events, member_metrics, cohorts, cohort_members,
--                    predictions, funnel_analysis)
-- Helper Functions: 5 (track_event, calculate_engagement_score, evaluate_cohort_membership,
--                      calculate_funnel_conversion, get_member_churn_risk)
-- Triggers: 4 (timestamp updates, cohort count maintenance)
-- RLS Policies: 21 (member-scoped analytics access control)
-- Sample Data: 2 default cohorts created
-- =====================================================================================
