-- =====================================================
-- NABIP AMS Email Campaign Management System
-- =====================================================
-- Establish scalable email marketing platform to streamline member
-- communications and drive measurable engagement outcomes.
--
-- Features:
-- - Template builder with personalization
-- - Audience segmentation with advanced filtering
-- - Multi-channel campaign scheduling
-- - Comprehensive analytics and tracking
-- - Unsubscribe management with compliance
--
-- Created: 2025-01-15
-- =====================================================

-- Email Templates Table
-- Stores reusable email templates with HTML/text content
CREATE TABLE email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text,
  html_content text NOT NULL,
  text_content text,
  thumbnail_url text,
  category text CHECK (category IN ('event', 'newsletter', 'transactional', 'promotional', 'announcement')),
  merge_fields jsonb DEFAULT '[]'::jsonb, -- Array of available merge fields
  is_public boolean DEFAULT false,
  created_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_created_by ON email_templates(created_by);

-- Campaigns Table
-- Main campaign configuration and metadata
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  preheader text, -- Email preview text
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  from_name text DEFAULT 'NABIP',
  from_email text DEFAULT 'noreply@nabip.org',
  reply_to text,

  -- Audience configuration
  audience_filter jsonb NOT NULL DEFAULT '{}'::jsonb, -- Segment criteria
  audience_snapshot jsonb, -- Cached recipient list at send time
  recipient_count integer DEFAULT 0,

  -- Scheduling and status
  status text CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled', 'failed')) DEFAULT 'draft',
  scheduled_at timestamptz,
  send_started_at timestamptz,
  send_completed_at timestamptz,

  -- A/B Testing
  ab_test_enabled boolean DEFAULT false,
  ab_test_variant text CHECK (ab_test_variant IN ('A', 'B')),
  ab_test_subject_b text,
  ab_test_winner text,

  -- Tracking configuration
  track_opens boolean DEFAULT true,
  track_clicks boolean DEFAULT true,
  utm_campaign text,
  utm_source text DEFAULT 'email',
  utm_medium text DEFAULT 'nabip-ams',

  -- Metadata
  created_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_schedule CHECK (
    status != 'scheduled' OR scheduled_at IS NOT NULL
  )
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_campaigns_scheduled_at ON campaigns(scheduled_at) WHERE status = 'scheduled';

-- Campaign Sends Table
-- Individual send records per recipient
CREATE TABLE campaign_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,

  -- SendGrid tracking
  sendgrid_message_id text UNIQUE,
  sendgrid_batch_id text,

  -- Delivery status
  status text CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'failed', 'blocked')) DEFAULT 'queued',
  error_message text,

  -- Timestamps
  queued_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  bounced_at timestamptz,

  -- Personalization data snapshot
  personalization_data jsonb,

  CONSTRAINT unique_campaign_member UNIQUE(campaign_id, member_id)
);

CREATE INDEX idx_campaign_sends_campaign ON campaign_sends(campaign_id);
CREATE INDEX idx_campaign_sends_member ON campaign_sends(member_id);
CREATE INDEX idx_campaign_sends_status ON campaign_sends(status);
CREATE INDEX idx_campaign_sends_sendgrid_message_id ON campaign_sends(sendgrid_message_id);

-- Email Events Table
-- Tracks email engagement (opens, clicks, bounces, etc.)
CREATE TABLE email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_send_id uuid REFERENCES campaign_sends(id) ON DELETE CASCADE NOT NULL,

  -- Event details
  event_type text CHECK (event_type IN ('delivered', 'open', 'click', 'bounce', 'spam', 'unsubscribe', 'deferred', 'dropped')) NOT NULL,
  event_data jsonb, -- Raw event payload from SendGrid

  -- Click tracking
  url text,
  url_offset integer, -- Position of link in email

  -- User context
  user_agent text,
  ip_address inet,
  geo_location jsonb, -- Country, city, region from IP

  occurred_at timestamptz DEFAULT now(),

  -- Prevent duplicate event processing
  sendgrid_event_id text UNIQUE
);

CREATE INDEX idx_email_events_campaign_send ON email_events(campaign_send_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);
CREATE INDEX idx_email_events_occurred_at ON email_events(occurred_at);

-- Unsubscribes Table
-- Manages opt-out preferences and compliance
CREATE TABLE unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  email text NOT NULL,

  -- Opt-out scope
  unsubscribe_type text CHECK (unsubscribe_type IN ('all', 'marketing', 'newsletters', 'event_updates')) DEFAULT 'all',

  -- Source tracking
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  reason text,
  feedback text,

  unsubscribed_at timestamptz DEFAULT now(),

  -- Allow re-subscription
  resubscribed_at timestamptz,
  resubscribed_by uuid REFERENCES members(id) ON DELETE SET NULL,

  CONSTRAINT unique_email_unsubscribe UNIQUE(email, unsubscribe_type)
);

CREATE INDEX idx_unsubscribes_email ON unsubscribes(email);
CREATE INDEX idx_unsubscribes_member ON unsubscribes(member_id);
CREATE INDEX idx_unsubscribes_type ON unsubscribes(unsubscribe_type);

-- Saved Audience Segments Table
-- Reusable audience definitions
CREATE TABLE audience_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  filter_criteria jsonb NOT NULL,

  -- Cached counts (updated periodically)
  member_count integer DEFAULT 0,
  last_count_updated_at timestamptz,

  created_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  is_public boolean DEFAULT false
);

CREATE INDEX idx_audience_segments_created_by ON audience_segments(created_by);

-- Suppression Lists Table
-- Additional email suppression beyond unsubscribes
CREATE TABLE suppression_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,

  -- Suppression entries
  emails text[] NOT NULL DEFAULT ARRAY[]::text[],

  created_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Link Tracking Table
-- Shortened/tracked links for campaigns
CREATE TABLE campaign_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  original_url text NOT NULL,
  short_code text NOT NULL UNIQUE,

  -- Click analytics
  click_count integer DEFAULT 0,
  unique_click_count integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),

  CONSTRAINT unique_campaign_url UNIQUE(campaign_id, original_url)
);

CREATE INDEX idx_campaign_links_campaign ON campaign_links(campaign_id);
CREATE INDEX idx_campaign_links_short_code ON campaign_links(short_code);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsubscribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppression_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_links ENABLE ROW LEVEL SECURITY;

-- Email Templates Policies
CREATE POLICY "Members can view public templates"
  ON email_templates FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Members can create templates"
  ON email_templates FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Members can update own templates"
  ON email_templates FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Members can delete own templates"
  ON email_templates FOR DELETE
  USING (created_by = auth.uid());

-- Campaigns Policies
-- Note: In production, add role-based access control
-- For now, members can only manage campaigns they created
CREATE POLICY "Members can view own campaigns"
  ON campaigns FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Members can create campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Members can update own campaigns"
  ON campaigns FOR UPDATE
  USING (created_by = auth.uid() AND status = 'draft');

CREATE POLICY "Members can delete draft campaigns"
  ON campaigns FOR DELETE
  USING (created_by = auth.uid() AND status = 'draft');

-- Campaign Sends Policies
-- Members can view their own email history
CREATE POLICY "Members can view own email history"
  ON campaign_sends FOR SELECT
  USING (member_id = auth.uid());

-- Email Events Policies
CREATE POLICY "Members can view events for own emails"
  ON email_events FOR SELECT
  USING (
    campaign_send_id IN (
      SELECT id FROM campaign_sends WHERE member_id = auth.uid()
    )
  );

-- Unsubscribes Policies
CREATE POLICY "Members can manage own unsubscribe preferences"
  ON unsubscribes FOR ALL
  USING (member_id = auth.uid());

-- Audience Segments Policies
CREATE POLICY "Members can view public segments or own segments"
  ON audience_segments FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Members can create segments"
  ON audience_segments FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Members can update own segments"
  ON audience_segments FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Members can delete own segments"
  ON audience_segments FOR DELETE
  USING (created_by = auth.uid());

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function to calculate campaign analytics
CREATE OR REPLACE FUNCTION calculate_campaign_analytics(p_campaign_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_analytics jsonb;
  v_total_sent integer;
  v_total_delivered integer;
  v_total_bounced integer;
  v_total_opened integer;
  v_total_clicked integer;
  v_total_unsubscribed integer;
BEGIN
  -- Count sends
  SELECT COUNT(*) INTO v_total_sent
  FROM campaign_sends
  WHERE campaign_id = p_campaign_id AND status IN ('sent', 'delivered');

  -- Count delivered
  SELECT COUNT(*) INTO v_total_delivered
  FROM campaign_sends
  WHERE campaign_id = p_campaign_id AND status = 'delivered';

  -- Count bounced
  SELECT COUNT(*) INTO v_total_bounced
  FROM campaign_sends
  WHERE campaign_id = p_campaign_id AND status = 'bounced';

  -- Count unique opens
  SELECT COUNT(DISTINCT campaign_send_id) INTO v_total_opened
  FROM email_events
  WHERE campaign_send_id IN (
    SELECT id FROM campaign_sends WHERE campaign_id = p_campaign_id
  ) AND event_type = 'open';

  -- Count unique clicks
  SELECT COUNT(DISTINCT campaign_send_id) INTO v_total_clicked
  FROM email_events
  WHERE campaign_send_id IN (
    SELECT id FROM campaign_sends WHERE campaign_id = p_campaign_id
  ) AND event_type = 'click';

  -- Count unsubscribes
  SELECT COUNT(*) INTO v_total_unsubscribed
  FROM unsubscribes
  WHERE campaign_id = p_campaign_id;

  -- Build analytics JSON
  v_analytics := jsonb_build_object(
    'total_sent', v_total_sent,
    'total_delivered', v_total_delivered,
    'total_bounced', v_total_bounced,
    'total_opened', v_total_opened,
    'total_clicked', v_total_clicked,
    'total_unsubscribed', v_total_unsubscribed,
    'delivery_rate', CASE WHEN v_total_sent > 0 THEN ROUND((v_total_delivered::numeric / v_total_sent::numeric) * 100, 2) ELSE 0 END,
    'bounce_rate', CASE WHEN v_total_sent > 0 THEN ROUND((v_total_bounced::numeric / v_total_sent::numeric) * 100, 2) ELSE 0 END,
    'open_rate', CASE WHEN v_total_delivered > 0 THEN ROUND((v_total_opened::numeric / v_total_delivered::numeric) * 100, 2) ELSE 0 END,
    'click_rate', CASE WHEN v_total_delivered > 0 THEN ROUND((v_total_clicked::numeric / v_total_delivered::numeric) * 100, 2) ELSE 0 END,
    'click_to_open_rate', CASE WHEN v_total_opened > 0 THEN ROUND((v_total_clicked::numeric / v_total_opened::numeric) * 100, 2) ELSE 0 END,
    'unsubscribe_rate', CASE WHEN v_total_delivered > 0 THEN ROUND((v_total_unsubscribed::numeric / v_total_delivered::numeric) * 100, 2) ELSE 0 END
  );

  RETURN v_analytics;
END;
$$;

-- Function to check if email is suppressed
CREATE OR REPLACE FUNCTION is_email_suppressed(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_suppressed boolean;
BEGIN
  -- Check unsubscribes
  SELECT EXISTS(
    SELECT 1 FROM unsubscribes
    WHERE email = p_email
      AND unsubscribe_type = 'all'
      AND resubscribed_at IS NULL
  ) INTO v_is_suppressed;

  IF v_is_suppressed THEN
    RETURN true;
  END IF;

  -- Check suppression lists
  SELECT EXISTS(
    SELECT 1 FROM suppression_lists
    WHERE p_email = ANY(emails)
  ) INTO v_is_suppressed;

  RETURN v_is_suppressed;
END;
$$;

-- Function to update audience segment counts
CREATE OR REPLACE FUNCTION update_segment_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_segment RECORD;
  v_count integer;
BEGIN
  FOR v_segment IN SELECT id, filter_criteria FROM audience_segments LOOP
    -- This would require dynamic SQL based on filter_criteria
    -- Simplified for now - would need more complex logic in production
    UPDATE audience_segments
    SET last_count_updated_at = now()
    WHERE id = v_segment.id;
  END LOOP;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audience_segments_updated_at
  BEFORE UPDATE ON audience_segments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to increment link click counts
CREATE OR REPLACE FUNCTION increment_link_clicks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'click' AND NEW.url IS NOT NULL THEN
    UPDATE campaign_links
    SET click_count = click_count + 1
    WHERE campaign_id = (
      SELECT campaign_id FROM campaign_sends WHERE id = NEW.campaign_send_id
    ) AND original_url = NEW.url;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_link_clicks
  AFTER INSERT ON email_events
  FOR EACH ROW
  EXECUTE FUNCTION increment_link_clicks();

-- =====================================================
-- INITIAL DATA / SEED
-- =====================================================

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, text_content, category, is_public, merge_fields)
VALUES
  (
    'Event Invitation',
    '{{event.name}} - You''re Invited!',
    '<html><body><h1>{{event.name}}</h1><p>Join us for {{event.name}} on {{event.date}}!</p><a href="{{event.registration_url}}">Register Now</a></body></html>',
    '{{event.name}}\n\nJoin us for {{event.name}} on {{event.date}}!\n\nRegister: {{event.registration_url}}',
    'event',
    true,
    '["event.name", "event.date", "event.location", "event.registration_url", "member.firstName", "member.lastName"]'::jsonb
  ),
  (
    'Monthly Newsletter',
    'NABIP Monthly Update - {{month}} {{year}}',
    '<html><body><h1>Monthly Update</h1><p>Dear {{member.firstName}},</p><p>Here are this month''s highlights...</p></body></html>',
    'Monthly Update\n\nDear {{member.firstName}},\n\nHere are this month''s highlights...',
    'newsletter',
    true,
    '["member.firstName", "member.lastName", "month", "year", "chapter.name"]'::jsonb
  ),
  (
    'Renewal Reminder',
    'Time to Renew Your NABIP Membership',
    '<html><body><h1>Membership Renewal</h1><p>Hi {{member.firstName}},</p><p>Your membership expires on {{member.expiryDate}}. Renew now to continue enjoying member benefits.</p><a href="{{renewal.url}}">Renew Now</a></body></html>',
    'Membership Renewal\n\nHi {{member.firstName}},\n\nYour membership expires on {{member.expiryDate}}. Renew now to continue enjoying member benefits.\n\nRenew: {{renewal.url}}',
    'transactional',
    true,
    '["member.firstName", "member.expiryDate", "renewal.url", "renewal.amount"]'::jsonb
  );

-- Grant necessary permissions
-- Note: Adjust based on your authentication setup
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE email_templates IS 'Stores reusable email templates with merge field support for personalized campaigns';
COMMENT ON TABLE campaigns IS 'Main campaign configuration including audience targeting, scheduling, and A/B testing';
COMMENT ON TABLE campaign_sends IS 'Individual send records tracking delivery status per recipient';
COMMENT ON TABLE email_events IS 'Email engagement tracking (opens, clicks, bounces) via SendGrid webhooks';
COMMENT ON TABLE unsubscribes IS 'Manages opt-out preferences and ensures email compliance';
COMMENT ON TABLE audience_segments IS 'Reusable audience definitions with complex filtering logic';
COMMENT ON TABLE campaign_links IS 'Link tracking and analytics for campaign engagement measurement';
