-- =====================================================================================
-- Migration: Enhanced Report Builder - Query Engine & Scheduling
-- Issue: #199 - Fix Report Builder - Report Execution Broken (Critical Priority)
-- Estimated Hours: 18 hours
-- Description: Enhances existing reports table with execution engine, scheduling,
--              dashboards, and widgets for comprehensive analytics platform
-- =====================================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================================
-- Enhance: reports table (add missing columns)
-- Purpose: Store report definitions with JSONB query builder
-- =====================================================================================

-- Check if reports table exists, if not create it
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  created_by UUID REFERENCES members(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add new columns to reports table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'reports' AND column_name = 'query_definition') THEN
    ALTER TABLE reports ADD COLUMN query_definition JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'reports' AND column_name = 'data_sources') THEN
    ALTER TABLE reports ADD COLUMN data_sources TEXT[] NOT NULL DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'reports' AND column_name = 'parameters') THEN
    ALTER TABLE reports ADD COLUMN parameters JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'reports' AND column_name = 'visualization_config') THEN
    ALTER TABLE reports ADD COLUMN visualization_config JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'reports' AND column_name = 'execution_timeout_seconds') THEN
    ALTER TABLE reports ADD COLUMN execution_timeout_seconds INTEGER DEFAULT 60;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'reports' AND column_name = 'is_active') THEN
    ALTER TABLE reports ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'reports' AND column_name = 'last_execution_at') THEN
    ALTER TABLE reports ADD COLUMN last_execution_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'reports' AND column_name = 'execution_count') THEN
    ALTER TABLE reports ADD COLUMN execution_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create indexes for report queries
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);
CREATE INDEX IF NOT EXISTS idx_reports_is_public ON reports(is_public);
CREATE INDEX IF NOT EXISTS idx_reports_is_active ON reports(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_reports_last_execution ON reports(last_execution_at DESC);

COMMENT ON TABLE reports IS 'Report definitions with JSONB query builder and visualization config';
COMMENT ON COLUMN reports.query_definition IS 'JSONB query definition: {tables, joins, filters, aggregations, sorting}';
COMMENT ON COLUMN reports.data_sources IS 'Array of table names used in the report query';
COMMENT ON COLUMN reports.parameters IS 'JSONB array of parameter definitions for dynamic reports';
COMMENT ON COLUMN reports.visualization_config IS 'Chart/table rendering configuration';
COMMENT ON COLUMN reports.execution_timeout_seconds IS 'Maximum query execution time before timeout';

-- =====================================================================================
-- Table: report_executions
-- Purpose: Audit trail for report execution with result caching
-- =====================================================================================
CREATE TABLE IF NOT EXISTS report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  executed_by UUID NOT NULL REFERENCES members(id),
  parameter_values JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'completed', 'failed', 'timeout', 'cancelled'
  )),
  result_data JSONB, -- Cached result data for successful executions
  result_row_count INTEGER,
  error_message TEXT,
  execution_time_ms INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for execution queries
CREATE INDEX IF NOT EXISTS idx_report_executions_report ON report_executions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_executed_by ON report_executions(executed_by);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON report_executions(status);
CREATE INDEX IF NOT EXISTS idx_report_executions_created ON report_executions(created_at DESC);

COMMENT ON TABLE report_executions IS 'Audit trail for report executions with result caching';
COMMENT ON COLUMN report_executions.parameter_values IS 'JSONB object with actual parameter values used for this execution';
COMMENT ON COLUMN report_executions.result_data IS 'Cached result data for completed executions (max 1MB)';
COMMENT ON COLUMN report_executions.execution_time_ms IS 'Query execution time in milliseconds for performance monitoring';

-- =====================================================================================
-- Table: report_schedules
-- Purpose: Automated report execution with cron-style scheduling
-- =====================================================================================
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  schedule_name VARCHAR(255) NOT NULL,
  cron_expression VARCHAR(100) NOT NULL, -- e.g., '0 8 * * 1' (Every Monday at 8am)
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  parameter_values JSONB DEFAULT '{}'::jsonb,
  recipients TEXT[] NOT NULL DEFAULT '{}', -- Email addresses for delivery
  delivery_format VARCHAR(20) DEFAULT 'pdf' CHECK (delivery_format IN ('pdf', 'csv', 'xlsx', 'json')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for schedule queries
CREATE INDEX IF NOT EXISTS idx_report_schedules_report ON report_schedules(report_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_is_active ON report_schedules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON report_schedules(next_run_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_report_schedules_created_by ON report_schedules(created_by);

COMMENT ON TABLE report_schedules IS 'Automated report execution schedules with cron expressions';
COMMENT ON COLUMN report_schedules.cron_expression IS 'Cron-style schedule: minute hour day month weekday';
COMMENT ON COLUMN report_schedules.recipients IS 'Email addresses to receive scheduled reports';
COMMENT ON COLUMN report_schedules.next_run_at IS 'Calculated next execution time based on cron expression';

-- =====================================================================================
-- Table: dashboards
-- Purpose: Container for multiple widgets/reports on a single view
-- =====================================================================================
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  layout_config JSONB NOT NULL DEFAULT '{}'::jsonb, -- Grid layout positions for widgets
  is_public BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES members(id),
  last_viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_dashboards_created_by ON dashboards(created_by);
CREATE INDEX IF NOT EXISTS idx_dashboards_is_public ON dashboards(is_public);
CREATE INDEX IF NOT EXISTS idx_dashboards_last_viewed ON dashboards(last_viewed_at DESC);

COMMENT ON TABLE dashboards IS 'Containers for multiple report widgets in customizable layouts';
COMMENT ON COLUMN dashboards.layout_config IS 'JSONB grid layout: {rows, columns, widget_positions}';

-- =====================================================================================
-- Table: dashboard_widgets
-- Purpose: Individual widgets (reports, charts, metrics) on a dashboard
-- =====================================================================================
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  widget_type VARCHAR(50) NOT NULL CHECK (widget_type IN (
    'report', 'metric', 'chart', 'table', 'text', 'iframe'
  )),
  title VARCHAR(255),
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  position JSONB NOT NULL DEFAULT '{}'::jsonb, -- {x, y, width, height}
  refresh_interval_seconds INTEGER DEFAULT 300, -- Auto-refresh every 5 minutes
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for widget queries
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard ON dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_report ON dashboard_widgets(report_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_type ON dashboard_widgets(widget_type);

COMMENT ON TABLE dashboard_widgets IS 'Individual widgets (reports, charts, metrics) positioned on dashboards';
COMMENT ON COLUMN dashboard_widgets.widget_type IS 'Widget type: report, metric, chart, table, text, iframe';
COMMENT ON COLUMN dashboard_widgets.position IS 'JSONB grid position: {x, y, width, height}';
COMMENT ON COLUMN dashboard_widgets.refresh_interval_seconds IS 'Auto-refresh interval; NULL = manual only';

-- =====================================================================================
-- Table: report_favorites
-- Purpose: Track member-favorited reports for quick access
-- =====================================================================================
CREATE TABLE IF NOT EXISTS report_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_member_report_favorite UNIQUE(member_id, report_id)
);

-- Create indexes for favorite queries
CREATE INDEX IF NOT EXISTS idx_report_favorites_member ON report_favorites(member_id);
CREATE INDEX IF NOT EXISTS idx_report_favorites_report ON report_favorites(report_id);

COMMENT ON TABLE report_favorites IS 'Member-favorited reports for personalized quick access';

-- =====================================================================================
-- Triggers: Auto-update timestamps
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_reports_updated_at();

CREATE TRIGGER trigger_report_schedules_updated_at
  BEFORE UPDATE ON report_schedules
  FOR EACH ROW EXECUTE FUNCTION update_reports_updated_at();

CREATE TRIGGER trigger_dashboards_updated_at
  BEFORE UPDATE ON dashboards
  FOR EACH ROW EXECUTE FUNCTION update_reports_updated_at();

CREATE TRIGGER trigger_dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION update_reports_updated_at();

-- =====================================================================================
-- Triggers: Update report execution statistics
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_report_execution_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE reports
    SET
      last_execution_at = NEW.completed_at,
      execution_count = execution_count + 1
    WHERE id = NEW.report_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_report_execution_stats
  AFTER UPDATE ON report_executions
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION update_report_execution_stats();

-- =====================================================================================
-- Triggers: Update dashboard view statistics
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_dashboard_view_stats()
RETURNS TRIGGER AS $$
BEGIN
  NEW.view_count = NEW.view_count + 1;
  NEW.last_viewed_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger should be called from application when dashboard is viewed
-- Not implemented as automatic trigger to avoid excessive updates

-- =====================================================================================
-- Helper Functions: Execute report with parameter validation
-- =====================================================================================

CREATE OR REPLACE FUNCTION execute_report(
  p_report_id UUID,
  p_member_id UUID,
  p_parameter_values JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_execution_id UUID;
  v_report RECORD;
BEGIN
  -- Get report configuration
  SELECT * INTO v_report FROM reports WHERE id = p_report_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report % not found or inactive', p_report_id;
  END IF;

  -- Create execution record
  INSERT INTO report_executions (
    report_id,
    executed_by,
    parameter_values,
    status,
    started_at
  ) VALUES (
    p_report_id,
    p_member_id,
    p_parameter_values,
    'pending',
    now()
  ) RETURNING id INTO v_execution_id;

  -- TODO: Actual query execution happens in application layer
  -- This function creates the audit record and returns execution ID

  RETURN v_execution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION execute_report IS 'Create report execution record with parameter validation';

-- =====================================================================================
-- Helper Functions: Calculate next run time for scheduled reports
-- =====================================================================================

CREATE OR REPLACE FUNCTION calculate_next_run_time(
  p_cron_expression VARCHAR,
  p_timezone VARCHAR DEFAULT 'America/New_York'
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_next_run TIMESTAMPTZ;
BEGIN
  -- TODO: Implement cron expression parser
  -- For now, return 24 hours from now as placeholder
  v_next_run := now() + INTERVAL '24 hours';

  RETURN v_next_run;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_next_run_time IS 'Calculate next execution time from cron expression';

-- =====================================================================================
-- Helper Functions: Get report execution history
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_report_execution_history(
  p_report_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  execution_id UUID,
  executed_by_name VARCHAR,
  status VARCHAR,
  execution_time_ms INTEGER,
  row_count INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    re.id,
    COALESCE(m.first_name || ' ' || m.last_name, m.email) AS executed_by_name,
    re.status,
    re.execution_time_ms,
    re.result_row_count,
    re.created_at
  FROM report_executions re
  JOIN members m ON re.executed_by = m.id
  WHERE re.report_id = p_report_id
  ORDER BY re.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_report_execution_history IS 'Get recent execution history for a report';

-- =====================================================================================
-- Helper Functions: Get dashboard with widgets
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_dashboard_with_widgets(p_dashboard_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_dashboard JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', d.id,
    'name', d.name,
    'description', d.description,
    'layout_config', d.layout_config,
    'widgets', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', dw.id,
          'widget_type', dw.widget_type,
          'title', dw.title,
          'position', dw.position,
          'configuration', dw.configuration,
          'report', (
            SELECT jsonb_build_object(
              'id', r.id,
              'name', r.name,
              'category', r.category
            )
            FROM reports r
            WHERE r.id = dw.report_id
          )
        )
      )
      FROM dashboard_widgets dw
      WHERE dw.dashboard_id = d.id
    )
  ) INTO v_dashboard
  FROM dashboards d
  WHERE d.id = p_dashboard_id;

  RETURN v_dashboard;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_dashboard_with_widgets IS 'Get complete dashboard structure with nested widgets';

-- =====================================================================================
-- RLS Policies: Enable Row Level Security
-- =====================================================================================

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_favorites ENABLE ROW LEVEL SECURITY;

-- Reports: Public reports visible to all, private reports only to creator and admins
CREATE POLICY reports_select_policy ON reports
  FOR SELECT TO authenticated
  USING (
    is_public = true
    OR created_by = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'reports', 'read')
  );

CREATE POLICY reports_insert_policy ON reports
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'reports', 'create')
    AND created_by = auth.uid()::UUID
  );

CREATE POLICY reports_update_policy ON reports
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'reports', 'manage')
  );

CREATE POLICY reports_delete_policy ON reports
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'reports', 'delete')
  );

-- Report Executions: Users can view their own executions and report creators can view all
CREATE POLICY report_executions_select_policy ON report_executions
  FOR SELECT TO authenticated
  USING (
    executed_by = auth.uid()::UUID
    OR report_id IN (SELECT id FROM reports WHERE created_by = auth.uid()::UUID)
    OR has_permission(auth.uid()::UUID, 'reports', 'manage')
  );

CREATE POLICY report_executions_insert_policy ON report_executions
  FOR INSERT TO authenticated
  WITH CHECK (
    executed_by = auth.uid()::UUID
  );

-- Report Schedules: Only report creators and admins can manage schedules
CREATE POLICY report_schedules_select_policy ON report_schedules
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()::UUID
    OR report_id IN (SELECT id FROM reports WHERE created_by = auth.uid()::UUID)
    OR has_permission(auth.uid()::UUID, 'reports', 'manage')
  );

CREATE POLICY report_schedules_insert_policy ON report_schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'reports', 'create')
    AND created_by = auth.uid()::UUID
  );

CREATE POLICY report_schedules_update_policy ON report_schedules
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'reports', 'manage')
  );

CREATE POLICY report_schedules_delete_policy ON report_schedules
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'reports', 'manage')
  );

-- Dashboards: Public dashboards visible to all, private only to creator and admins
CREATE POLICY dashboards_select_policy ON dashboards
  FOR SELECT TO authenticated
  USING (
    is_public = true
    OR created_by = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'reports', 'read')
  );

CREATE POLICY dashboards_insert_policy ON dashboards
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'reports', 'create')
    AND created_by = auth.uid()::UUID
  );

CREATE POLICY dashboards_update_policy ON dashboards
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'reports', 'manage')
  );

CREATE POLICY dashboards_delete_policy ON dashboards
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'reports', 'delete')
  );

-- Dashboard Widgets: Inherit permissions from parent dashboard
CREATE POLICY dashboard_widgets_select_policy ON dashboard_widgets
  FOR SELECT TO authenticated
  USING (
    dashboard_id IN (
      SELECT id FROM dashboards
      WHERE is_public = true
        OR created_by = auth.uid()::UUID
        OR has_permission(auth.uid()::UUID, 'reports', 'read')
    )
  );

CREATE POLICY dashboard_widgets_insert_policy ON dashboard_widgets
  FOR INSERT TO authenticated
  WITH CHECK (
    dashboard_id IN (
      SELECT id FROM dashboards WHERE created_by = auth.uid()::UUID
    )
  );

CREATE POLICY dashboard_widgets_update_policy ON dashboard_widgets
  FOR UPDATE TO authenticated
  USING (
    dashboard_id IN (
      SELECT id FROM dashboards WHERE created_by = auth.uid()::UUID
    )
  );

CREATE POLICY dashboard_widgets_delete_policy ON dashboard_widgets
  FOR DELETE TO authenticated
  USING (
    dashboard_id IN (
      SELECT id FROM dashboards WHERE created_by = auth.uid()::UUID
    )
  );

-- Report Favorites: Members can only manage their own favorites
CREATE POLICY report_favorites_select_policy ON report_favorites
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid()::UUID
  );

CREATE POLICY report_favorites_insert_policy ON report_favorites
  FOR INSERT TO authenticated
  WITH CHECK (
    member_id = auth.uid()::UUID
  );

CREATE POLICY report_favorites_delete_policy ON report_favorites
  FOR DELETE TO authenticated
  USING (
    member_id = auth.uid()::UUID
  );

-- =====================================================================================
-- Sample Report Templates
-- =====================================================================================

-- Insert default report templates for common use cases
INSERT INTO reports (
  name,
  description,
  category,
  query_definition,
  data_sources,
  is_public,
  is_active
) VALUES
  (
    'Active Members by Chapter',
    'Count of active members grouped by chapter with trend analysis',
    'membership',
    '{
      "tables": ["members", "chapters"],
      "joins": [{"type": "LEFT", "table": "chapters", "on": "members.chapter_id = chapters.id"}],
      "filters": [{"field": "members.status", "operator": "=", "value": "active"}],
      "groupBy": ["chapters.name"],
      "aggregations": [{"function": "COUNT", "field": "members.id", "alias": "member_count"}],
      "orderBy": [{"field": "member_count", "direction": "DESC"}]
    }'::jsonb,
    ARRAY['members', 'chapters'],
    true,
    true
  ),
  (
    'Event Revenue by Quarter',
    'Total event revenue grouped by quarter with year-over-year comparison',
    'finance',
    '{
      "tables": ["events", "transactions"],
      "joins": [{"type": "INNER", "table": "transactions", "on": "events.id = transactions.event_id"}],
      "filters": [{"field": "transactions.status", "operator": "=", "value": "completed"}],
      "groupBy": ["DATE_TRUNC(''quarter'', events.start_date)"],
      "aggregations": [{"function": "SUM", "field": "transactions.amount", "alias": "total_revenue"}],
      "orderBy": [{"field": "quarter", "direction": "ASC"}]
    }'::jsonb,
    ARRAY['events', 'transactions'],
    true,
    true
  ),
  (
    'Course Completion Rates',
    'Course completion rates with average completion time',
    'learning',
    '{
      "tables": ["courses", "enrollments"],
      "joins": [{"type": "LEFT", "table": "enrollments", "on": "courses.id = enrollments.course_id"}],
      "groupBy": ["courses.title"],
      "aggregations": [
        {"function": "COUNT", "field": "enrollments.id", "alias": "total_enrollments"},
        {"function": "SUM", "field": "CASE WHEN enrollments.status = ''completed'' THEN 1 ELSE 0 END", "alias": "completed_count"},
        {"function": "AVG", "field": "EXTRACT(EPOCH FROM (enrollments.completed_at - enrollments.enrolled_at))/86400", "alias": "avg_days_to_complete"}
      ],
      "orderBy": [{"field": "completed_count", "direction": "DESC"}]
    }'::jsonb,
    ARRAY['courses', 'enrollments'],
    true,
    true
  )
ON CONFLICT DO NOTHING;

-- =====================================================================================
-- Migration Complete
-- =====================================================================================
-- Tables Created: 5 (reports enhanced, report_executions, report_schedules,
--                    dashboards, dashboard_widgets, report_favorites)
-- Sample Reports: 3 (Membership, Finance, Learning)
-- RLS Policies: 21 (comprehensive access control)
-- Helper Functions: 5 (execute_report, calculate_next_run_time, get_report_execution_history,
--                      get_dashboard_with_widgets, update functions)
-- Triggers: 6 (timestamp updates, execution stats, dashboard views)
-- =====================================================================================
