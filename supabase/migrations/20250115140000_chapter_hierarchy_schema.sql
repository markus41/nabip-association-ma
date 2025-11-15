-- =====================================================================================
-- Migration: Chapter Hierarchy Optimization
-- Estimated Hours: 14 hours
-- Description: Optimizes hierarchical chapter structure using materialized path pattern
--              for National → State → Local chapter navigation with leadership tracking
-- =====================================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree"; -- PostgreSQL hierarchical tree data type

-- =====================================================================================
-- Table: chapter_hierarchy
-- Purpose: Optimized hierarchical structure using materialized path for fast queries
-- =====================================================================================
CREATE TABLE IF NOT EXISTS chapter_hierarchy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL UNIQUE REFERENCES chapters(id) ON DELETE CASCADE,
  path LTREE NOT NULL, -- Materialized path: '1.23.456' (national_id.state_id.local_id)
  level INTEGER NOT NULL CHECK (level BETWEEN 0 AND 2), -- 0=National, 1=State, 2=Local
  parent_chapter_id UUID REFERENCES chapters(id),
  national_chapter_id UUID REFERENCES chapters(id), -- Denormalized for fast queries
  state_chapter_id UUID REFERENCES chapters(id), -- Denormalized for fast queries
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_chapter_hierarchy_path ON chapter_hierarchy USING GIST(path);
CREATE INDEX IF NOT EXISTS idx_chapter_hierarchy_level ON chapter_hierarchy(level);
CREATE INDEX IF NOT EXISTS idx_chapter_hierarchy_parent ON chapter_hierarchy(parent_chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_hierarchy_national ON chapter_hierarchy(national_chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_hierarchy_state ON chapter_hierarchy(state_chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_hierarchy_is_active ON chapter_hierarchy(is_active) WHERE is_active = true;

COMMENT ON TABLE chapter_hierarchy IS 'Optimized hierarchical chapter structure using ltree materialized path';
COMMENT ON COLUMN chapter_hierarchy.path IS 'Ltree materialized path for fast ancestor/descendant queries';
COMMENT ON COLUMN chapter_hierarchy.level IS '0=National (root), 1=State, 2=Local (leaf)';
COMMENT ON COLUMN chapter_hierarchy.national_chapter_id IS 'Denormalized national chapter ID for all levels';
COMMENT ON COLUMN chapter_hierarchy.state_chapter_id IS 'Denormalized state chapter ID for local chapters';

-- =====================================================================================
-- Table: chapter_leadership
-- Purpose: Track leadership positions with term limits and succession planning
-- =====================================================================================
CREATE TABLE IF NOT EXISTS chapter_leadership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  position VARCHAR(100) NOT NULL, -- 'president', 'vice_president', 'secretary', 'treasurer', 'board_member'
  term_start_date DATE NOT NULL,
  term_end_date DATE, -- NULL = indefinite term
  is_current BOOLEAN NOT NULL DEFAULT true,
  appointed_by UUID REFERENCES members(id),
  responsibilities TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_chapter_position UNIQUE(chapter_id, position, member_id, term_start_date)
);

-- Create indexes for leadership queries
CREATE INDEX IF NOT EXISTS idx_chapter_leadership_chapter ON chapter_leadership(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_leadership_member ON chapter_leadership(member_id);
CREATE INDEX IF NOT EXISTS idx_chapter_leadership_position ON chapter_leadership(position);
CREATE INDEX IF NOT EXISTS idx_chapter_leadership_current ON chapter_leadership(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_chapter_leadership_term_end ON chapter_leadership(term_end_date);

COMMENT ON TABLE chapter_leadership IS 'Chapter leadership positions with term tracking and succession planning';
COMMENT ON COLUMN chapter_leadership.position IS 'Leadership position: president, vice_president, secretary, treasurer, board_member';
COMMENT ON COLUMN chapter_leadership.is_current IS 'Auto-updated when term_end_date passes';

-- =====================================================================================
-- Table: chapter_metrics
-- Purpose: Aggregated chapter performance metrics with monthly snapshots
-- =====================================================================================
CREATE TABLE IF NOT EXISTS chapter_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Monthly snapshot date
  total_members INTEGER DEFAULT 0,
  active_members INTEGER DEFAULT 0,
  new_members_mtd INTEGER DEFAULT 0, -- Month-to-date new members
  churned_members_mtd INTEGER DEFAULT 0,
  retention_rate NUMERIC(5,2), -- Percentage
  total_events_mtd INTEGER DEFAULT 0,
  event_attendance_mtd INTEGER DEFAULT 0,
  revenue_mtd NUMERIC(12,2) DEFAULT 0,
  expenses_mtd NUMERIC(12,2) DEFAULT 0,
  net_income_mtd NUMERIC(12,2) DEFAULT 0,
  engagement_score NUMERIC(5,2), -- Calculated engagement metric
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_chapter_metric_date UNIQUE(chapter_id, metric_date)
);

-- Create indexes for metrics queries
CREATE INDEX IF NOT EXISTS idx_chapter_metrics_chapter ON chapter_metrics(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_metrics_date ON chapter_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_chapter_metrics_revenue ON chapter_metrics(revenue_mtd DESC);
CREATE INDEX IF NOT EXISTS idx_chapter_metrics_engagement ON chapter_metrics(engagement_score DESC);

COMMENT ON TABLE chapter_metrics IS 'Monthly aggregated chapter performance metrics for trend analysis';
COMMENT ON COLUMN chapter_metrics.metric_date IS 'Snapshot date (typically first day of month)';
COMMENT ON COLUMN chapter_metrics.engagement_score IS 'Calculated: (event_attendance + email_opens + portal_logins) / active_members';

-- =====================================================================================
-- Table: chapter_relationships
-- Purpose: Track inter-chapter collaborations and partnerships
-- =====================================================================================
CREATE TABLE IF NOT EXISTS chapter_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id_1 UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  chapter_id_2 UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL, -- 'collaboration', 'joint_event', 'resource_sharing', 'mentorship'
  description TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_chapter_relationship UNIQUE(chapter_id_1, chapter_id_2, relationship_type),
  CONSTRAINT check_different_chapters CHECK (chapter_id_1 != chapter_id_2)
);

-- Create indexes for relationship queries
CREATE INDEX IF NOT EXISTS idx_chapter_relationships_chapter1 ON chapter_relationships(chapter_id_1);
CREATE INDEX IF NOT EXISTS idx_chapter_relationships_chapter2 ON chapter_relationships(chapter_id_2);
CREATE INDEX IF NOT EXISTS idx_chapter_relationships_type ON chapter_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_chapter_relationships_active ON chapter_relationships(is_active) WHERE is_active = true;

COMMENT ON TABLE chapter_relationships IS 'Inter-chapter collaborations and partnerships';
COMMENT ON COLUMN chapter_relationships.relationship_type IS 'collaboration, joint_event, resource_sharing, mentorship';

-- =====================================================================================
-- Triggers: Auto-update timestamps
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_chapter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_chapter_hierarchy_updated_at
  BEFORE UPDATE ON chapter_hierarchy
  FOR EACH ROW EXECUTE FUNCTION update_chapter_updated_at();

CREATE TRIGGER trigger_chapter_leadership_updated_at
  BEFORE UPDATE ON chapter_leadership
  FOR EACH ROW EXECUTE FUNCTION update_chapter_updated_at();

CREATE TRIGGER trigger_chapter_metrics_updated_at
  BEFORE UPDATE ON chapter_metrics
  FOR EACH ROW EXECUTE FUNCTION update_chapter_updated_at();

CREATE TRIGGER trigger_chapter_relationships_updated_at
  BEFORE UPDATE ON chapter_relationships
  FOR EACH ROW EXECUTE FUNCTION update_chapter_updated_at();

-- =====================================================================================
-- Triggers: Auto-expire leadership terms
-- =====================================================================================

CREATE OR REPLACE FUNCTION check_leadership_term_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.term_end_date IS NOT NULL AND NEW.term_end_date <= CURRENT_DATE THEN
    NEW.is_current = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_leadership_term_expiration
  BEFORE INSERT OR UPDATE ON chapter_leadership
  FOR EACH ROW EXECUTE FUNCTION check_leadership_term_expiration();

-- =====================================================================================
-- Triggers: Maintain chapter hierarchy denormalization
-- =====================================================================================

CREATE OR REPLACE FUNCTION maintain_chapter_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_path LTREE;
  v_national_id UUID;
  v_state_id UUID;
BEGIN
  -- Get parent path if exists
  IF NEW.parent_chapter_id IS NOT NULL THEN
    SELECT path, national_chapter_id, state_chapter_id
    INTO v_parent_path, v_national_id, v_state_id
    FROM chapter_hierarchy
    WHERE chapter_id = NEW.parent_chapter_id;

    -- Build new path
    NEW.path = v_parent_path || NEW.chapter_id::TEXT;

    -- Set denormalized IDs based on level
    IF NEW.level = 1 THEN
      -- State chapter: national_chapter_id = parent
      NEW.national_chapter_id = NEW.parent_chapter_id;
      NEW.state_chapter_id = NULL;
    ELSIF NEW.level = 2 THEN
      -- Local chapter: inherit from parent state
      NEW.national_chapter_id = v_national_id;
      NEW.state_chapter_id = NEW.parent_chapter_id;
    END IF;
  ELSE
    -- Root level (national chapter)
    NEW.path = NEW.chapter_id::TEXT;
    NEW.level = 0;
    NEW.national_chapter_id = NEW.chapter_id;
    NEW.state_chapter_id = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_maintain_chapter_hierarchy
  BEFORE INSERT OR UPDATE ON chapter_hierarchy
  FOR EACH ROW EXECUTE FUNCTION maintain_chapter_hierarchy();

-- =====================================================================================
-- Helper Functions: Get chapter descendants (all children recursively)
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_chapter_descendants(p_chapter_id UUID)
RETURNS TABLE (
  chapter_id UUID,
  chapter_name VARCHAR,
  level INTEGER,
  member_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    ch.level,
    (SELECT COUNT(*) FROM members m WHERE m.chapter_id = c.id) AS member_count
  FROM chapter_hierarchy ch
  JOIN chapters c ON ch.chapter_id = c.id
  WHERE ch.path <@ (
    SELECT path FROM chapter_hierarchy WHERE chapter_id = p_chapter_id
  )
  AND ch.chapter_id != p_chapter_id
  ORDER BY ch.path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_chapter_descendants IS 'Get all descendant chapters (children, grandchildren, etc.)';

-- =====================================================================================
-- Helper Functions: Get chapter ancestors (parent, grandparent, etc.)
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_chapter_ancestors(p_chapter_id UUID)
RETURNS TABLE (
  chapter_id UUID,
  chapter_name VARCHAR,
  level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    ch.level
  FROM chapter_hierarchy ch
  JOIN chapters c ON ch.chapter_id = c.id
  WHERE ch.path @> (
    SELECT path FROM chapter_hierarchy WHERE chapter_id = p_chapter_id
  )
  AND ch.chapter_id != p_chapter_id
  ORDER BY ch.level ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_chapter_ancestors IS 'Get all ancestor chapters (parent, grandparent up to national)';

-- =====================================================================================
-- Helper Functions: Calculate chapter engagement score
-- =====================================================================================

CREATE OR REPLACE FUNCTION calculate_chapter_engagement(
  p_chapter_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_active_members INTEGER;
  v_event_attendance INTEGER;
  v_email_opens INTEGER;
  v_portal_logins INTEGER;
  v_engagement_score NUMERIC;
BEGIN
  -- Get active member count
  SELECT COUNT(*) INTO v_active_members
  FROM members
  WHERE chapter_id = p_chapter_id AND status = 'active';

  IF v_active_members = 0 THEN
    RETURN 0;
  END IF;

  -- Get event attendance
  SELECT COUNT(*) INTO v_event_attendance
  FROM registrations r
  JOIN events e ON r.event_id = e.id
  WHERE e.chapter_id = p_chapter_id
    AND r.status = 'attended'
    AND r.check_in_time BETWEEN p_start_date AND p_end_date;

  -- Get email engagement (assuming email_events table exists)
  SELECT COUNT(*) INTO v_email_opens
  FROM email_events ee
  JOIN campaign_sends cs ON ee.campaign_send_id = cs.id
  JOIN members m ON cs.member_id = m.id
  WHERE m.chapter_id = p_chapter_id
    AND ee.event_type = 'open'
    AND ee.created_at BETWEEN p_start_date AND p_end_date;

  -- Get portal login count (assuming audit_logs table exists)
  SELECT COUNT(*) INTO v_portal_logins
  FROM audit_logs al
  JOIN members m ON al.user_id::UUID = m.id
  WHERE m.chapter_id = p_chapter_id
    AND al.action = 'login'
    AND al.timestamp BETWEEN p_start_date AND p_end_date;

  -- Calculate weighted engagement score
  v_engagement_score := (
    (v_event_attendance * 3.0) +
    (v_email_opens * 1.0) +
    (v_portal_logins * 2.0)
  ) / v_active_members;

  RETURN ROUND(v_engagement_score, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_chapter_engagement IS 'Calculate chapter engagement score: (events*3 + emails*1 + logins*2) / active_members';

-- =====================================================================================
-- Helper Functions: Get chapter leadership roster
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_chapter_leadership_roster(p_chapter_id UUID)
RETURNS TABLE (
  position VARCHAR,
  member_name VARCHAR,
  member_email VARCHAR,
  term_start DATE,
  term_end DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cl.position,
    COALESCE(m.first_name || ' ' || m.last_name, m.email) AS member_name,
    m.email,
    cl.term_start_date,
    cl.term_end_date
  FROM chapter_leadership cl
  JOIN members m ON cl.member_id = m.id
  WHERE cl.chapter_id = p_chapter_id
    AND cl.is_current = true
  ORDER BY
    CASE cl.position
      WHEN 'president' THEN 1
      WHEN 'vice_president' THEN 2
      WHEN 'secretary' THEN 3
      WHEN 'treasurer' THEN 4
      ELSE 5
    END,
    cl.term_start_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_chapter_leadership_roster IS 'Get current chapter leadership with ordered positions';

-- =====================================================================================
-- Helper Functions: Calculate chapter retention rate
-- =====================================================================================

CREATE OR REPLACE FUNCTION calculate_chapter_retention(
  p_chapter_id UUID,
  p_period_months INTEGER DEFAULT 12
)
RETURNS NUMERIC AS $$
DECLARE
  v_members_start INTEGER;
  v_members_end INTEGER;
  v_retention_rate NUMERIC;
BEGIN
  -- Count members at start of period
  SELECT COUNT(*) INTO v_members_start
  FROM members
  WHERE chapter_id = p_chapter_id
    AND created_at <= (CURRENT_DATE - (p_period_months || ' months')::INTERVAL);

  IF v_members_start = 0 THEN
    RETURN 0;
  END IF;

  -- Count how many are still active
  SELECT COUNT(*) INTO v_members_end
  FROM members
  WHERE chapter_id = p_chapter_id
    AND created_at <= (CURRENT_DATE - (p_period_months || ' months')::INTERVAL)
    AND status = 'active';

  v_retention_rate := (v_members_end::NUMERIC / v_members_start::NUMERIC) * 100;

  RETURN ROUND(v_retention_rate, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_chapter_retention IS 'Calculate chapter member retention rate over specified period';

-- =====================================================================================
-- RLS Policies: Enable Row Level Security
-- =====================================================================================

ALTER TABLE chapter_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_leadership ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_relationships ENABLE ROW LEVEL SECURITY;

-- Chapter Hierarchy: Readable by all authenticated users
CREATE POLICY chapter_hierarchy_select_policy ON chapter_hierarchy
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY chapter_hierarchy_insert_policy ON chapter_hierarchy
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'chapters', 'create')
  );

CREATE POLICY chapter_hierarchy_update_policy ON chapter_hierarchy
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'chapters', 'manage')
  );

CREATE POLICY chapter_hierarchy_delete_policy ON chapter_hierarchy
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'chapters', 'delete')
  );

-- Chapter Leadership: Chapter members can view, admins can manage
CREATE POLICY chapter_leadership_select_policy ON chapter_leadership
  FOR SELECT TO authenticated
  USING (
    chapter_id IN (SELECT chapter_id FROM members WHERE id = auth.uid()::UUID)
    OR has_permission(auth.uid()::UUID, 'chapters', 'read')
  );

CREATE POLICY chapter_leadership_insert_policy ON chapter_leadership
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'chapters', 'manage')
  );

CREATE POLICY chapter_leadership_update_policy ON chapter_leadership
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'chapters', 'manage')
  );

CREATE POLICY chapter_leadership_delete_policy ON chapter_leadership
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'chapters', 'manage')
  );

-- Chapter Metrics: Visible to chapter members and admins
CREATE POLICY chapter_metrics_select_policy ON chapter_metrics
  FOR SELECT TO authenticated
  USING (
    chapter_id IN (SELECT chapter_id FROM members WHERE id = auth.uid()::UUID)
    OR has_permission(auth.uid()::UUID, 'chapters', 'read')
  );

CREATE POLICY chapter_metrics_insert_policy ON chapter_metrics
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'chapters', 'manage')
  );

CREATE POLICY chapter_metrics_update_policy ON chapter_metrics
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'chapters', 'manage')
  );

-- Chapter Relationships: Visible to involved chapters and admins
CREATE POLICY chapter_relationships_select_policy ON chapter_relationships
  FOR SELECT TO authenticated
  USING (
    chapter_id_1 IN (SELECT chapter_id FROM members WHERE id = auth.uid()::UUID)
    OR chapter_id_2 IN (SELECT chapter_id FROM members WHERE id = auth.uid()::UUID)
    OR has_permission(auth.uid()::UUID, 'chapters', 'read')
  );

CREATE POLICY chapter_relationships_insert_policy ON chapter_relationships
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'chapters', 'manage')
  );

CREATE POLICY chapter_relationships_update_policy ON chapter_relationships
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'chapters', 'manage')
  );

CREATE POLICY chapter_relationships_delete_policy ON chapter_relationships
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'chapters', 'manage')
  );

-- =====================================================================================
-- Populate Initial Chapter Hierarchy from Existing Chapters
-- =====================================================================================

-- Migrate existing chapters to hierarchy table
INSERT INTO chapter_hierarchy (chapter_id, parent_chapter_id, level)
SELECT
  c.id,
  c.parent_chapter_id,
  CASE c.type
    WHEN 'national' THEN 0
    WHEN 'state' THEN 1
    WHEN 'local' THEN 2
    ELSE 0
  END
FROM chapters c
ON CONFLICT (chapter_id) DO NOTHING;

-- =====================================================================================
-- Migration Complete
-- =====================================================================================
-- Tables Created: 4 (chapter_hierarchy, chapter_leadership, chapter_metrics,
--                    chapter_relationships)
-- Extension Enabled: ltree (PostgreSQL hierarchical tree data type)
-- Helper Functions: 5 (get_descendants, get_ancestors, calculate_engagement,
--                      get_leadership_roster, calculate_retention)
-- Triggers: 6 (timestamp updates, leadership expiration, hierarchy maintenance)
-- RLS Policies: 16 (chapter-scoped access control)
-- =====================================================================================
