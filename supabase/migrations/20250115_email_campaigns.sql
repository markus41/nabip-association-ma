-- =====================================================================
-- Email Campaign Management System
-- Establishes scalable email marketing platform for member communications
-- =====================================================================

-- Email Templates: Reusable content templates for campaigns
CREATE TABLE email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text,
  html_content text NOT NULL,
  text_content text,
  thumbnail_url text,
  category text DEFAULT 'general' CHECK (category IN ('general', 'events', 'newsletters', 'transactional', 'announcements')),
  is_public boolean DEFAULT false,
  merge_fields jsonb DEFAULT '[]'::jsonb, -- [{name: 'member.name', description: 'Member first name'}]
  preview_text text, -- Email preview/preheader text
  created_by uuid REFERENCES members(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Campaigns: Email marketing campaigns
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  preview_text text,
  template_id uuid REFERENCES email_templates(id) ON DELETE SET NULL,
  html_content text, -- Rendered HTML from template
  text_content text, -- Plain text version
  from_name text DEFAULT 'NABIP' NOT NULL,
  from_email text DEFAULT 'noreply@nabip.org' NOT NULL,
  reply_to text,

  -- Audience targeting
  audience_filter jsonb NOT NULL DEFAULT '{}'::jsonb, -- {chapterIds: [], memberTypes: [], engagementMin: 0}
  excluded_member_ids uuid[] DEFAULT ARRAY[]::uuid[], -- Manual exclusions
  recipient_count integer DEFAULT 0,

  -- Scheduling
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled', 'failed')),
  scheduled_at timestamptz,
  send_at_local_time boolean DEFAULT false, -- Send at member's local time zone
  local_send_hour integer DEFAULT 10 CHECK (local_send_hour >= 0 AND local_send_hour <= 23),

  -- A/B Testing
  is_ab_test boolean DEFAULT false,
  ab_test_percentage integer CHECK (ab_test_percentage >= 0 AND ab_test_percentage <= 50),
  ab_variant_subject text, -- Alternative subject line
  ab_winner_metric text CHECK (ab_winner_metric IN ('open_rate', 'click_rate', 'conversion_rate')),
  ab_test_duration_hours integer DEFAULT 24,

  -- Tracking
  sent_at timestamptz,
  completed_at timestamptz,
  sendgrid_batch_id text,

  -- Analytics (computed from campaign_sends and email_events)
  total_sent integer DEFAULT 0,
  total_delivered integer DEFAULT 0,
  total_opened integer DEFAULT 0,
  total_clicked integer DEFAULT 0,
  total_bounced integer DEFAULT 0,
  total_spam_reports integer DEFAULT 0,
  total_unsubscribes integer DEFAULT 0,

  -- Metadata
  tags text[] DEFAULT ARRAY[]::text[],
  notes text,
  created_by uuid REFERENCES members(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Campaign Sends: Individual email deliveries
CREATE TABLE campaign_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,

  -- SendGrid integration
  sendgrid_message_id text UNIQUE,

  -- Delivery tracking
  status text DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'failed', 'deferred')),
  error_message text,

  -- A/B test variant
  is_ab_variant boolean DEFAULT false,

  -- Timestamps
  queued_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  delivered_at timestamptz,

  -- Engagement tracking (denormalized for performance)
  opened_at timestamptz,
  first_clicked_at timestamptz,
  total_opens integer DEFAULT 0,
  total_clicks integer DEFAULT 0,

  UNIQUE(campaign_id, member_id)
);

-- Email Events: Detailed engagement tracking from SendGrid webhooks
CREATE TABLE email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_send_id uuid REFERENCES campaign_sends(id) ON DELETE CASCADE NOT NULL,
  sendgrid_message_id text,

  -- Event details
  event_type text NOT NULL CHECK (event_type IN ('delivered', 'open', 'click', 'bounce', 'spam', 'unsubscribe', 'deferred', 'processed')),
  event_data jsonb DEFAULT '{}'::jsonb, -- Raw webhook payload

  -- Click tracking
  url text, -- Clicked URL
  url_index integer, -- Position of link in email

  -- Bounce details
  bounce_reason text,
  bounce_type text CHECK (bounce_type IN ('hard', 'soft', 'blocked')),

  -- User context
  user_agent text,
  ip_address inet,
  geo_location jsonb, -- {city, state, country, lat, lon}

  occurred_at timestamptz DEFAULT now(),

  -- Webhook verification
  webhook_signature text,
  processed_at timestamptz DEFAULT now()
);

-- Unsubscribes: Global unsubscribe list
CREATE TABLE unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,

  -- Unsubscribe details
  reason text,
  unsubscribe_type text DEFAULT 'global' CHECK (unsubscribe_type IN ('global', 'marketing', 'newsletters', 'events')),

  -- Source tracking
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  unsubscribed_from text, -- 'campaign', 'preference_center', 'complaint'

  unsubscribed_at timestamptz DEFAULT now(),

  -- Resubscribe tracking
  resubscribed_at timestamptz,
  resubscribe_notes text
);

-- Saved Audiences: Reusable audience segments
CREATE TABLE saved_audiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  filter_criteria jsonb NOT NULL, -- Same format as campaigns.audience_filter
  member_count integer DEFAULT 0, -- Cached count
  is_dynamic boolean DEFAULT true, -- Recalculate on use vs. static snapshot
  created_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================================
-- Indexes for Performance
-- =====================================================================

CREATE INDEX idx_email_templates_created_by ON email_templates(created_by);
CREATE INDEX idx_email_templates_category ON email_templates(category) WHERE is_public = true;

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_scheduled_at ON campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_campaigns_tags ON campaigns USING gin(tags);

CREATE INDEX idx_campaign_sends_campaign_id ON campaign_sends(campaign_id);
CREATE INDEX idx_campaign_sends_member_id ON campaign_sends(member_id);
CREATE INDEX idx_campaign_sends_status ON campaign_sends(status);
CREATE INDEX idx_campaign_sends_sendgrid_message_id ON campaign_sends(sendgrid_message_id);

CREATE INDEX idx_email_events_campaign_send_id ON email_events(campaign_send_id);
CREATE INDEX idx_email_events_event_type ON email_events(event_type);
CREATE INDEX idx_email_events_occurred_at ON email_events(occurred_at);
CREATE INDEX idx_email_events_sendgrid_message_id ON email_events(sendgrid_message_id);

CREATE INDEX idx_unsubscribes_email ON unsubscribes(email);
CREATE INDEX idx_unsubscribes_member_id ON unsubscribes(member_id);

CREATE INDEX idx_saved_audiences_created_by ON saved_audiences(created_by);

-- =====================================================================
-- Row-Level Security (RLS) Policies
-- =====================================================================

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsubscribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_audiences ENABLE ROW LEVEL SECURITY;

-- Email Templates Policies
CREATE POLICY "Public templates viewable by all authenticated users"
  ON email_templates FOR SELECT
  USING (is_public = true AND auth.role() = 'authenticated');

CREATE POLICY "Users can view own templates"
  ON email_templates FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Chapter admins can create templates"
  ON email_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE id = auth.uid()
      AND role IN ('chapter_admin', 'state_admin', 'national_admin')
    )
  );

CREATE POLICY "Users can update own templates"
  ON email_templates FOR UPDATE
  USING (created_by = auth.uid());

-- Campaigns Policies
CREATE POLICY "Users can view campaigns they created"
  ON campaigns FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Chapter admins can view chapter campaigns"
  ON campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND m.role IN ('chapter_admin', 'state_admin', 'national_admin')
    )
  );

CREATE POLICY "Chapter admins can create campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE id = auth.uid()
      AND role IN ('chapter_admin', 'state_admin', 'national_admin')
    )
  );

CREATE POLICY "Users can update own campaigns in draft"
  ON campaigns FOR UPDATE
  USING (created_by = auth.uid() AND status = 'draft');

-- Campaign Sends Policies
CREATE POLICY "Members can view own campaign sends"
  ON campaign_sends FOR SELECT
  USING (member_id = auth.uid());

CREATE POLICY "Campaign creators can view all sends"
  ON campaign_sends FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_sends.campaign_id
      AND c.created_by = auth.uid()
    )
  );

-- Email Events Policies
CREATE POLICY "Members can view own email events"
  ON email_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaign_sends cs
      WHERE cs.id = email_events.campaign_send_id
      AND cs.member_id = auth.uid()
    )
  );

CREATE POLICY "Campaign creators can view events"
  ON email_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaign_sends cs
      JOIN campaigns c ON c.id = cs.campaign_id
      WHERE cs.id = email_events.campaign_send_id
      AND c.created_by = auth.uid()
    )
  );

-- Unsubscribes Policies
CREATE POLICY "Members can view own unsubscribe status"
  ON unsubscribes FOR SELECT
  USING (member_id = auth.uid());

CREATE POLICY "Members can unsubscribe themselves"
  ON unsubscribes FOR INSERT
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "Admins can view all unsubscribes"
  ON unsubscribes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE id = auth.uid()
      AND role IN ('national_admin', 'state_admin')
    )
  );

-- Saved Audiences Policies
CREATE POLICY "Users can view own saved audiences"
  ON saved_audiences FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Chapter admins can create saved audiences"
  ON saved_audiences FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE id = auth.uid()
      AND role IN ('chapter_admin', 'state_admin', 'national_admin')
    )
  );

-- =====================================================================
-- Triggers & Functions
-- =====================================================================

-- Update campaign analytics on email events
CREATE OR REPLACE FUNCTION update_campaign_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update campaign_sends denormalized counters
  IF NEW.event_type = 'open' THEN
    UPDATE campaign_sends
    SET
      opened_at = COALESCE(opened_at, NEW.occurred_at),
      total_opens = total_opens + 1
    WHERE id = NEW.campaign_send_id;

  ELSIF NEW.event_type = 'click' THEN
    UPDATE campaign_sends
    SET
      first_clicked_at = COALESCE(first_clicked_at, NEW.occurred_at),
      total_clicks = total_clicks + 1
    WHERE id = NEW.campaign_send_id;
  END IF;

  -- Update campaign totals
  UPDATE campaigns c
  SET
    total_opened = (
      SELECT COUNT(DISTINCT cs.id)
      FROM campaign_sends cs
      WHERE cs.campaign_id = c.id AND cs.opened_at IS NOT NULL
    ),
    total_clicked = (
      SELECT COUNT(DISTINCT cs.id)
      FROM campaign_sends cs
      WHERE cs.campaign_id = c.id AND cs.first_clicked_at IS NOT NULL
    ),
    updated_at = now()
  WHERE c.id = (SELECT campaign_id FROM campaign_sends WHERE id = NEW.campaign_send_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER email_events_update_analytics
AFTER INSERT ON email_events
FOR EACH ROW
EXECUTE FUNCTION update_campaign_analytics();

-- Update campaign send status on delivery/bounce
CREATE OR REPLACE FUNCTION update_campaign_send_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'delivered' THEN
    UPDATE campaign_sends
    SET
      status = 'delivered',
      delivered_at = NEW.occurred_at
    WHERE id = NEW.campaign_send_id;

    UPDATE campaigns c
    SET total_delivered = total_delivered + 1
    WHERE c.id = (SELECT campaign_id FROM campaign_sends WHERE id = NEW.campaign_send_id);

  ELSIF NEW.event_type = 'bounce' THEN
    UPDATE campaign_sends
    SET status = 'bounced'
    WHERE id = NEW.campaign_send_id;

    UPDATE campaigns c
    SET total_bounced = total_bounced + 1
    WHERE c.id = (SELECT campaign_id FROM campaign_sends WHERE id = NEW.campaign_send_id);

  ELSIF NEW.event_type = 'spam' THEN
    UPDATE campaigns c
    SET total_spam_reports = total_spam_reports + 1
    WHERE c.id = (SELECT campaign_id FROM campaign_sends WHERE id = NEW.campaign_send_id);

  ELSIF NEW.event_type = 'unsubscribe' THEN
    UPDATE campaigns c
    SET total_unsubscribes = total_unsubscribes + 1
    WHERE c.id = (SELECT campaign_id FROM campaign_sends WHERE id = NEW.campaign_send_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER email_events_update_send_status
AFTER INSERT ON email_events
FOR EACH ROW
EXECUTE FUNCTION update_campaign_send_status();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_templates_updated_at BEFORE UPDATE ON email_templates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON campaigns
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER saved_audiences_updated_at BEFORE UPDATE ON saved_audiences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- Utility Functions
-- =====================================================================

-- Check if email is unsubscribed
CREATE OR REPLACE FUNCTION is_email_unsubscribed(email_address text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM unsubscribes
    WHERE email = email_address
    AND resubscribed_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get campaign engagement stats
CREATE OR REPLACE FUNCTION get_campaign_stats(campaign_uuid uuid)
RETURNS TABLE (
  total_sent bigint,
  total_delivered bigint,
  total_opened bigint,
  total_clicked bigint,
  total_bounced bigint,
  open_rate numeric,
  click_rate numeric,
  bounce_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_sent,
    COUNT(*) FILTER (WHERE cs.status = 'delivered') as total_delivered,
    COUNT(*) FILTER (WHERE cs.opened_at IS NOT NULL) as total_opened,
    COUNT(*) FILTER (WHERE cs.first_clicked_at IS NOT NULL) as total_clicked,
    COUNT(*) FILTER (WHERE cs.status = 'bounced') as total_bounced,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE cs.opened_at IS NOT NULL) / NULLIF(COUNT(*) FILTER (WHERE cs.status = 'delivered'), 0),
      2
    ) as open_rate,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE cs.first_clicked_at IS NOT NULL) / NULLIF(COUNT(*) FILTER (WHERE cs.opened_at IS NOT NULL), 0),
      2
    ) as click_rate,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE cs.status = 'bounced') / NULLIF(COUNT(*), 0),
      2
    ) as bounce_rate
  FROM campaign_sends cs
  WHERE cs.campaign_id = campaign_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE email_templates IS 'Reusable email templates for campaigns with merge field support';
COMMENT ON TABLE campaigns IS 'Email marketing campaigns with scheduling, A/B testing, and analytics';
COMMENT ON TABLE campaign_sends IS 'Individual email deliveries with SendGrid tracking';
COMMENT ON TABLE email_events IS 'Detailed engagement events from SendGrid webhooks';
COMMENT ON TABLE unsubscribes IS 'Global unsubscribe list enforced across all campaigns';
COMMENT ON TABLE saved_audiences IS 'Reusable audience segments for targeted campaigns';
