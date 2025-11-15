-- =====================================================================================
-- Migration: Design System - Theme Tokens & User Preferences
-- Issue: #191 - Complete Design System (High Priority)
-- Estimated Hours: 16 hours
-- Description: Centralized design token management and user preference storage
--              for Shadcn/ui v4 + Tailwind CSS v4 theming system
-- =====================================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================================
-- Table: design_tokens
-- Purpose: Centralized design token definitions (colors, typography, spacing)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS design_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_category VARCHAR(50) NOT NULL CHECK (token_category IN (
    'color', 'typography', 'spacing', 'border_radius', 'shadow', 'breakpoint', 'animation'
  )),
  token_name VARCHAR(100) NOT NULL,
  token_value TEXT NOT NULL,
  token_type VARCHAR(30) NOT NULL CHECK (token_type IN (
    'oklch', 'px', 'rem', 'em', 'ms', 'string', 'number'
  )),
  token_scope VARCHAR(30) DEFAULT 'global' CHECK (token_scope IN ('global', 'light', 'dark')),
  description TEXT,
  is_system_token BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_token_name_scope UNIQUE(token_name, token_scope)
);

-- Create indexes for design token queries
CREATE INDEX IF NOT EXISTS idx_design_tokens_category ON design_tokens(token_category);
CREATE INDEX IF NOT EXISTS idx_design_tokens_scope ON design_tokens(token_scope);
CREATE INDEX IF NOT EXISTS idx_design_tokens_system ON design_tokens(is_system_token);

COMMENT ON TABLE design_tokens IS 'Centralized design token definitions for theming system';
COMMENT ON COLUMN design_tokens.token_category IS 'color, typography, spacing, border_radius, shadow, breakpoint, animation';
COMMENT ON COLUMN design_tokens.token_value IS 'oklch(0.25 0.05 250), 16px, 1rem, etc.';
COMMENT ON COLUMN design_tokens.token_scope IS 'global (all themes), light (light mode only), dark (dark mode only)';
COMMENT ON COLUMN design_tokens.is_system_token IS 'Prevents deletion of core system tokens';

-- =====================================================================================
-- Table: user_preferences
-- Purpose: Member-specific UI preferences (theme, layout, accessibility)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,

  -- Theme preferences
  theme_mode VARCHAR(20) DEFAULT 'system' CHECK (theme_mode IN ('light', 'dark', 'system')),
  color_scheme VARCHAR(50) DEFAULT 'default', -- 'default', 'high_contrast', 'colorblind_friendly'
  font_scale NUMERIC(3,2) DEFAULT 1.0 CHECK (font_scale BETWEEN 0.75 AND 2.0),

  -- Layout preferences
  sidebar_collapsed BOOLEAN DEFAULT false,
  sidebar_position VARCHAR(10) DEFAULT 'left' CHECK (sidebar_position IN ('left', 'right')),
  content_width VARCHAR(20) DEFAULT 'comfortable' CHECK (content_width IN ('narrow', 'comfortable', 'wide', 'full')),

  -- Accessibility preferences
  reduce_motion BOOLEAN DEFAULT false,
  high_contrast BOOLEAN DEFAULT false,
  keyboard_navigation BOOLEAN DEFAULT true,
  screen_reader_optimized BOOLEAN DEFAULT false,

  -- Dashboard preferences
  default_dashboard_id UUID REFERENCES dashboards(id) ON DELETE SET NULL,
  dashboard_layout JSONB DEFAULT '{}'::jsonb,

  -- Notification preferences
  desktop_notifications BOOLEAN DEFAULT true,
  email_digest_frequency VARCHAR(20) DEFAULT 'daily' CHECK (email_digest_frequency IN ('none', 'daily', 'weekly', 'monthly')),

  -- Custom preferences (extensible)
  custom_settings JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for user preference queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_member ON user_preferences(member_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_theme ON user_preferences(theme_mode);
CREATE INDEX IF NOT EXISTS idx_user_preferences_dashboard ON user_preferences(default_dashboard_id);

COMMENT ON TABLE user_preferences IS 'Member-specific UI preferences for theme, layout, and accessibility';
COMMENT ON COLUMN user_preferences.theme_mode IS 'light, dark, system (follows OS preference)';
COMMENT ON COLUMN user_preferences.font_scale IS 'Multiplier for base font size (0.75 to 2.0)';
COMMENT ON COLUMN user_preferences.reduce_motion IS 'Disable animations for vestibular sensitivity';
COMMENT ON COLUMN user_preferences.custom_settings IS 'Extensible JSONB for feature-specific preferences';

-- =====================================================================================
-- Table: component_themes
-- Purpose: Theme overrides for specific components (buttons, cards, forms)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS component_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name VARCHAR(100) NOT NULL,
  variant_name VARCHAR(50) DEFAULT 'default',
  theme_tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_component_variant UNIQUE(component_name, variant_name)
);

-- Create indexes for component theme queries
CREATE INDEX IF NOT EXISTS idx_component_themes_component ON component_themes(component_name);
CREATE INDEX IF NOT EXISTS idx_component_themes_active ON component_themes(is_active) WHERE is_active = true;

COMMENT ON TABLE component_themes IS 'Component-specific theme token overrides';
COMMENT ON COLUMN component_themes.component_name IS 'button, card, input, select, dialog, etc.';
COMMENT ON COLUMN component_themes.variant_name IS 'default, primary, secondary, destructive, ghost, outline';
COMMENT ON COLUMN component_themes.theme_tokens IS 'JSONB token overrides: {background, foreground, border, etc.}';

-- =====================================================================================
-- Table: ui_feedback_logs
-- Purpose: Track UI interactions for usability analytics
-- =====================================================================================
CREATE TABLE IF NOT EXISTS ui_feedback_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN (
    'accessibility_issue', 'usability_issue', 'feature_request', 'bug_report', 'positive_feedback'
  )),
  component_name VARCHAR(100),
  page_url TEXT,
  description TEXT NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  screenshot_url TEXT,
  browser_info JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved', 'wont_fix')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for UI feedback queries
CREATE INDEX IF NOT EXISTS idx_ui_feedback_member ON ui_feedback_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_ui_feedback_type ON ui_feedback_logs(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ui_feedback_status ON ui_feedback_logs(status);
CREATE INDEX IF NOT EXISTS idx_ui_feedback_severity ON ui_feedback_logs(severity);
CREATE INDEX IF NOT EXISTS idx_ui_feedback_created ON ui_feedback_logs(created_at DESC);

COMMENT ON TABLE ui_feedback_logs IS 'User-submitted UI/UX feedback for continuous improvement';
COMMENT ON COLUMN ui_feedback_logs.feedback_type IS 'accessibility_issue, usability_issue, feature_request, bug_report, positive_feedback';

-- =====================================================================================
-- Triggers: Auto-update timestamps
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_design_system_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_design_tokens_updated_at
  BEFORE UPDATE ON design_tokens
  FOR EACH ROW EXECUTE FUNCTION update_design_system_updated_at();

CREATE TRIGGER trigger_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_design_system_updated_at();

CREATE TRIGGER trigger_component_themes_updated_at
  BEFORE UPDATE ON component_themes
  FOR EACH ROW EXECUTE FUNCTION update_design_system_updated_at();

CREATE TRIGGER trigger_ui_feedback_logs_updated_at
  BEFORE UPDATE ON ui_feedback_logs
  FOR EACH ROW EXECUTE FUNCTION update_design_system_updated_at();

-- =====================================================================================
-- Helper Functions: Get user theme preferences
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_user_theme_preferences(p_member_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_preferences JSONB;
BEGIN
  SELECT jsonb_build_object(
    'theme_mode', COALESCE(theme_mode, 'system'),
    'color_scheme', COALESCE(color_scheme, 'default'),
    'font_scale', COALESCE(font_scale, 1.0),
    'reduce_motion', COALESCE(reduce_motion, false),
    'high_contrast', COALESCE(high_contrast, false),
    'sidebar_collapsed', COALESCE(sidebar_collapsed, false),
    'content_width', COALESCE(content_width, 'comfortable'),
    'custom_settings', COALESCE(custom_settings, '{}'::jsonb)
  ) INTO v_preferences
  FROM user_preferences
  WHERE member_id = p_member_id;

  -- Return defaults if no preferences exist
  IF v_preferences IS NULL THEN
    v_preferences := jsonb_build_object(
      'theme_mode', 'system',
      'color_scheme', 'default',
      'font_scale', 1.0,
      'reduce_motion', false,
      'high_contrast', false,
      'sidebar_collapsed', false,
      'content_width', 'comfortable',
      'custom_settings', '{}'::jsonb
    );
  END IF;

  RETURN v_preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_theme_preferences IS 'Get user theme preferences with defaults';

-- =====================================================================================
-- Helper Functions: Export design tokens as CSS variables
-- =====================================================================================

CREATE OR REPLACE FUNCTION export_design_tokens_as_css(p_scope VARCHAR DEFAULT 'global')
RETURNS TEXT AS $$
DECLARE
  v_css TEXT := '';
  v_token RECORD;
BEGIN
  FOR v_token IN
    SELECT token_name, token_value
    FROM design_tokens
    WHERE token_scope = p_scope OR (p_scope = 'global' AND token_scope = 'global')
    ORDER BY token_category, token_name
  LOOP
    v_css := v_css || '--' || v_token.token_name || ': ' || v_token.token_value || ';' || E'\n';
  END LOOP;

  RETURN v_css;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION export_design_tokens_as_css IS 'Export design tokens as CSS custom properties';

-- =====================================================================================
-- Helper Functions: Get component theme tokens
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_component_theme(
  p_component_name VARCHAR,
  p_variant_name VARCHAR DEFAULT 'default'
)
RETURNS JSONB AS $$
DECLARE
  v_theme_tokens JSONB;
BEGIN
  SELECT theme_tokens INTO v_theme_tokens
  FROM component_themes
  WHERE component_name = p_component_name
    AND variant_name = p_variant_name
    AND is_active = true;

  RETURN COALESCE(v_theme_tokens, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_component_theme IS 'Get theme token overrides for specific component variant';

-- =====================================================================================
-- RLS Policies: Enable Row Level Security
-- =====================================================================================

ALTER TABLE design_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ui_feedback_logs ENABLE ROW LEVEL SECURITY;

-- Design Tokens: Readable by all, manageable by admins only
CREATE POLICY design_tokens_select_policy ON design_tokens
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY design_tokens_insert_policy ON design_tokens
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY design_tokens_update_policy ON design_tokens
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY design_tokens_delete_policy ON design_tokens
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'system', 'manage')
    AND is_system_token = false -- Prevent deletion of system tokens
  );

-- User Preferences: Members can only manage their own preferences
CREATE POLICY user_preferences_select_policy ON user_preferences
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid()::UUID
  );

CREATE POLICY user_preferences_insert_policy ON user_preferences
  FOR INSERT TO authenticated
  WITH CHECK (
    member_id = auth.uid()::UUID
  );

CREATE POLICY user_preferences_update_policy ON user_preferences
  FOR UPDATE TO authenticated
  USING (
    member_id = auth.uid()::UUID
  );

CREATE POLICY user_preferences_delete_policy ON user_preferences
  FOR DELETE TO authenticated
  USING (
    member_id = auth.uid()::UUID
  );

-- Component Themes: Readable by all, manageable by admins
CREATE POLICY component_themes_select_policy ON component_themes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY component_themes_insert_policy ON component_themes
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'system', 'manage')
    AND created_by = auth.uid()::UUID
  );

CREATE POLICY component_themes_update_policy ON component_themes
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY component_themes_delete_policy ON component_themes
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

-- UI Feedback Logs: Members can create and view their own, admins can view all
CREATE POLICY ui_feedback_logs_select_policy ON ui_feedback_logs
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY ui_feedback_logs_insert_policy ON ui_feedback_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    member_id = auth.uid()::UUID
  );

CREATE POLICY ui_feedback_logs_update_policy ON ui_feedback_logs
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

-- =====================================================================================
-- Insert Default Design Tokens (Brookside BI Brand)
-- =====================================================================================

INSERT INTO design_tokens (token_category, token_name, token_value, token_type, token_scope, description, is_system_token) VALUES
  -- Color Tokens (OKLCH color space)
  ('color', 'primary', 'oklch(0.25 0.05 250)', 'oklch', 'global', 'Deep Navy - Trust & authority', true),
  ('color', 'secondary', 'oklch(0.60 0.12 200)', 'oklch', 'global', 'Teal - Modern energy', true),
  ('color', 'accent', 'oklch(0.75 0.15 85)', 'oklch', 'global', 'Gold - Success & premium', true),
  ('color', 'background', 'oklch(1.0 0 0)', 'oklch', 'light', 'White background for light mode', true),
  ('color', 'background', 'oklch(0.15 0 0)', 'oklch', 'dark', 'Dark background for dark mode', true),
  ('color', 'foreground', 'oklch(0.15 0 0)', 'oklch', 'light', 'Dark text for light mode', true),
  ('color', 'foreground', 'oklch(0.95 0 0)', 'oklch', 'dark', 'Light text for dark mode', true),
  ('color', 'muted', 'oklch(0.95 0 0)', 'oklch', 'light', 'Muted background light', true),
  ('color', 'muted', 'oklch(0.20 0 0)', 'oklch', 'dark', 'Muted background dark', true),
  ('color', 'border', 'oklch(0.90 0 0)', 'oklch', 'light', 'Border color light', true),
  ('color', 'border', 'oklch(0.25 0 0)', 'oklch', 'dark', 'Border color dark', true),
  ('color', 'destructive', 'oklch(0.55 0.22 25)', 'oklch', 'global', 'Red - Error/danger', true),
  ('color', 'success', 'oklch(0.65 0.18 145)', 'oklch', 'global', 'Green - Success', true),
  ('color', 'warning', 'oklch(0.75 0.15 75)', 'oklch', 'global', 'Orange - Warning', true),

  -- Typography Tokens
  ('typography', 'font-sans', 'Inter, system-ui, -apple-system, sans-serif', 'string', 'global', 'Default sans-serif font stack', true),
  ('typography', 'font-mono', 'JetBrains Mono, Consolas, monospace', 'string', 'global', 'Monospace font for code', true),
  ('typography', 'text-xs', '0.75rem', 'rem', 'global', '12px', true),
  ('typography', 'text-sm', '0.875rem', 'rem', 'global', '14px', true),
  ('typography', 'text-base', '1rem', 'rem', 'global', '16px', true),
  ('typography', 'text-lg', '1.125rem', 'rem', 'global', '18px', true),
  ('typography', 'text-xl', '1.25rem', 'rem', 'global', '20px', true),
  ('typography', 'text-2xl', '1.5rem', 'rem', 'global', '24px', true),
  ('typography', 'text-3xl', '1.875rem', 'rem', 'global', '30px', true),

  -- Spacing Tokens
  ('spacing', 'spacing-0', '0px', 'px', 'global', '0px', true),
  ('spacing', 'spacing-1', '0.25rem', 'rem', 'global', '4px', true),
  ('spacing', 'spacing-2', '0.5rem', 'rem', 'global', '8px', true),
  ('spacing', 'spacing-3', '0.75rem', 'rem', 'global', '12px', true),
  ('spacing', 'spacing-4', '1rem', 'rem', 'global', '16px', true),
  ('spacing', 'spacing-6', '1.5rem', 'rem', 'global', '24px', true),
  ('spacing', 'spacing-8', '2rem', 'rem', 'global', '32px', true),
  ('spacing', 'spacing-12', '3rem', 'rem', 'global', '48px', true),

  -- Border Radius Tokens
  ('border_radius', 'radius-sm', '0.25rem', 'rem', 'global', '4px', true),
  ('border_radius', 'radius-md', '0.375rem', 'rem', 'global', '6px', true),
  ('border_radius', 'radius-lg', '0.5rem', 'rem', 'global', '8px', true),
  ('border_radius', 'radius-xl', '0.75rem', 'rem', 'global', '12px', true),
  ('border_radius', 'radius-full', '9999px', 'px', 'global', 'Fully rounded', true),

  -- Shadow Tokens
  ('shadow', 'shadow-sm', '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 'string', 'global', 'Small shadow', true),
  ('shadow', 'shadow-md', '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 'string', 'global', 'Medium shadow', true),
  ('shadow', 'shadow-lg', '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 'string', 'global', 'Large shadow', true),

  -- Animation Tokens
  ('animation', 'duration-fast', '150ms', 'ms', 'global', 'Fast animations', true),
  ('animation', 'duration-normal', '250ms', 'ms', 'global', 'Normal animations', true),
  ('animation', 'duration-slow', '350ms', 'ms', 'global', 'Slow animations', true),
  ('animation', 'easing-default', 'cubic-bezier(0.4, 0, 0.2, 1)', 'string', 'global', 'Default easing', true)
ON CONFLICT (token_name, token_scope) DO NOTHING;

-- =====================================================================================
-- Insert Default Component Themes
-- =====================================================================================

INSERT INTO component_themes (component_name, variant_name, theme_tokens) VALUES
  ('button', 'default', '{"background": "var(--muted)", "foreground": "var(--foreground)", "border": "var(--border)"}'::jsonb),
  ('button', 'primary', '{"background": "var(--primary)", "foreground": "white", "border": "var(--primary)"}'::jsonb),
  ('button', 'secondary', '{"background": "var(--secondary)", "foreground": "white", "border": "var(--secondary)"}'::jsonb),
  ('button', 'destructive', '{"background": "var(--destructive)", "foreground": "white", "border": "var(--destructive)"}'::jsonb),
  ('button', 'ghost', '{"background": "transparent", "foreground": "var(--foreground)", "hover_background": "var(--muted)"}'::jsonb),
  ('button', 'outline', '{"background": "transparent", "foreground": "var(--foreground)", "border": "var(--border)"}'::jsonb),

  ('card', 'default', '{"background": "var(--background)", "border": "var(--border)", "shadow": "var(--shadow-sm)"}'::jsonb),
  ('card', 'elevated', '{"background": "var(--background)", "border": "none", "shadow": "var(--shadow-lg)"}'::jsonb),

  ('input', 'default', '{"background": "var(--background)", "border": "var(--border)", "foreground": "var(--foreground)"}'::jsonb),
  ('input', 'error', '{"background": "var(--background)", "border": "var(--destructive)", "foreground": "var(--foreground)"}'::jsonb)
ON CONFLICT (component_name, variant_name) DO NOTHING;

-- =====================================================================================
-- Migration Complete
-- =====================================================================================
-- Tables Created: 4 (design_tokens, user_preferences, component_themes, ui_feedback_logs)
-- Default Design Tokens: 45 (colors, typography, spacing, borders, shadows, animations)
-- Default Component Themes: 10 (button variants, card variants, input variants)
-- Helper Functions: 3 (get_user_theme_preferences, export_design_tokens_as_css, get_component_theme)
-- Triggers: 4 (timestamp updates)
-- RLS Policies: 16 (user-specific preference management)
-- =====================================================================================
