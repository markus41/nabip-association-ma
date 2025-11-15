/**
 * Email Campaign Management Supabase Schema
 *
 * Establishes scalable database structure for production email campaigns
 * with SendGrid integration, engagement tracking, and preference management.
 *
 * Designed for: Organizations requiring reliable email delivery with analytics
 * Best for: Multi-channel communication platforms with detailed tracking
 *
 * Features:
 * - Email templates with dynamic merge fields
 * - Campaign management with A/B testing
 * - Real-time delivery and engagement tracking
 * - Granular unsubscribe preferences
 * - Email lists and segmentation
 * - Webhook event processing
 * - Row-Level Security (RLS) policies
 */

-- ============================================================================
-- EMAIL TEMPLATES
-- ============================================================================

CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'welcome', 'renewal_reminder', 'event_invitation',
        'newsletter', 'payment_receipt', 'course_enrollment', 'custom'
    )),
    subject TEXT NOT NULL,
    preview_text TEXT,
    html_content TEXT NOT NULL,
    plain_text_content TEXT,
    sendgrid_template_id TEXT,
    thumbnail_url TEXT,
    category TEXT NOT NULL,
    merge_fields JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    CONSTRAINT valid_merge_fields CHECK (jsonb_typeof(merge_fields) = 'array')
);

CREATE INDEX idx_email_templates_type ON email_templates(type);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_active ON email_templates(is_active);

-- ============================================================================
-- EMAIL CAMPAIGNS
-- ============================================================================

CREATE TABLE email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,

    -- Email content
    subject TEXT NOT NULL,
    preview_text TEXT,
    from_name TEXT NOT NULL DEFAULT 'NABIP',
    from_email TEXT NOT NULL DEFAULT 'noreply@nabip.org',
    reply_to TEXT,

    -- Segmentation
    segment_rules JSONB DEFAULT '[]'::jsonb,
    estimated_recipients INTEGER DEFAULT 0,
    actual_recipients INTEGER,

    -- Scheduling
    schedule_type TEXT NOT NULL CHECK (schedule_type IN ('immediate', 'scheduled', 'recurring')),
    scheduled_at TIMESTAMPTZ,
    timezone TEXT DEFAULT 'America/New_York',
    recurring_config JSONB,

    -- A/B Testing
    ab_test_enabled BOOLEAN DEFAULT false,
    ab_test_config JSONB,
    winning_variant TEXT CHECK (winning_variant IN ('A', 'B')),

    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'
    )),
    sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    tags TEXT[],
    notes TEXT,

    CONSTRAINT valid_segment_rules CHECK (jsonb_typeof(segment_rules) = 'array'),
    CONSTRAINT valid_scheduled_time CHECK (
        (schedule_type = 'immediate') OR
        (schedule_type IN ('scheduled', 'recurring') AND scheduled_at IS NOT NULL)
    ),
    CONSTRAINT valid_ab_test CHECK (
        (NOT ab_test_enabled) OR
        (ab_test_enabled AND ab_test_config IS NOT NULL)
    )
);

CREATE INDEX idx_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_campaigns_template ON email_campaigns(template_id);
CREATE INDEX idx_campaigns_scheduled ON email_campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_campaigns_created_by ON email_campaigns(created_by);
CREATE INDEX idx_campaigns_tags ON email_campaigns USING GIN(tags);

-- ============================================================================
-- CAMPAIGN SENDS (Individual Email Records)
-- ============================================================================

CREATE TABLE campaign_sends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
    member_id UUID NOT NULL,
    email_address TEXT NOT NULL,

    -- SendGrid tracking
    sendgrid_message_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'queued', 'sent', 'delivered', 'bounced', 'dropped'
    )),

    -- Engagement events
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    first_clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,

    -- Engagement counts
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,

    -- A/B test variant
    variant TEXT CHECK (variant IN ('A', 'B')),

    -- Error handling
    error_message TEXT,

    -- Metadata
    sent_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_open_count CHECK (open_count >= 0),
    CONSTRAINT valid_click_count CHECK (click_count >= 0)
);

CREATE INDEX idx_sends_campaign ON campaign_sends(campaign_id);
CREATE INDEX idx_sends_member ON campaign_sends(member_id);
CREATE INDEX idx_sends_status ON campaign_sends(status);
CREATE INDEX idx_sends_sendgrid_id ON campaign_sends(sendgrid_message_id);
CREATE INDEX idx_sends_delivered ON campaign_sends(delivered_at) WHERE delivered_at IS NOT NULL;
CREATE INDEX idx_sends_opened ON campaign_sends(opened_at) WHERE opened_at IS NOT NULL;

-- ============================================================================
-- EMAIL EVENTS (SendGrid Webhooks)
-- ============================================================================

CREATE TABLE email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    send_id UUID REFERENCES campaign_sends(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
    member_id UUID,
    email_address TEXT NOT NULL,

    -- Event details
    event_type TEXT NOT NULL CHECK (event_type IN (
        'delivered', 'opened', 'clicked', 'bounced',
        'spam_report', 'unsubscribed', 'deferred', 'dropped'
    )),
    timestamp TIMESTAMPTZ NOT NULL,

    -- Event-specific data
    url TEXT, -- For click events
    user_agent TEXT,
    ip_address INET,
    reason TEXT, -- For bounces/drops
    bounce_type TEXT CHECK (bounce_type IN ('soft', 'hard', 'blocked')),

    -- SendGrid metadata
    sendgrid_event_id TEXT UNIQUE NOT NULL,
    sendgrid_message_id TEXT NOT NULL,

    -- Metadata
    received_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT click_has_url CHECK (
        event_type != 'clicked' OR url IS NOT NULL
    )
);

CREATE INDEX idx_events_send ON email_events(send_id);
CREATE INDEX idx_events_campaign ON email_events(campaign_id);
CREATE INDEX idx_events_member ON email_events(member_id);
CREATE INDEX idx_events_type ON email_events(event_type);
CREATE INDEX idx_events_timestamp ON email_events(timestamp);
CREATE INDEX idx_events_sendgrid_event ON email_events(sendgrid_event_id);

-- ============================================================================
-- UNSUBSCRIBES & PREFERENCES
-- ============================================================================

CREATE TABLE unsubscribes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL,
    email_address TEXT NOT NULL,

    -- Scope
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
    unsubscribe_all BOOLEAN DEFAULT false,

    -- Preferences (granular controls)
    newsletters BOOLEAN DEFAULT true,
    event_announcements BOOLEAN DEFAULT true,
    renewal_reminders BOOLEAN DEFAULT true,
    course_updates BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT true,
    transactional_emails BOOLEAN DEFAULT true,

    -- Feedback
    reason TEXT CHECK (reason IN (
        'too_frequent', 'not_relevant', 'no_longer_member',
        'privacy_concerns', 'other'
    )),
    feedback TEXT,

    -- Metadata
    unsubscribed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,

    CONSTRAINT unique_member_unsubscribe UNIQUE (member_id, email_address)
);

CREATE INDEX idx_unsubscribes_member ON unsubscribes(member_id);
CREATE INDEX idx_unsubscribes_email ON unsubscribes(email_address);
CREATE INDEX idx_unsubscribes_all ON unsubscribes(unsubscribe_all) WHERE unsubscribe_all = true;

-- ============================================================================
-- EMAIL LISTS (For Segmentation)
-- ============================================================================

CREATE TABLE email_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,

    -- Members
    member_ids UUID[] DEFAULT ARRAY[]::UUID[],
    member_count INTEGER DEFAULT 0,

    -- Automation
    auto_update BOOLEAN DEFAULT false,
    update_rules JSONB,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    tags TEXT[],

    CONSTRAINT valid_update_rules CHECK (
        (NOT auto_update) OR
        (auto_update AND update_rules IS NOT NULL)
    )
);

CREATE INDEX idx_lists_created_by ON email_lists(created_by);
CREATE INDEX idx_lists_tags ON email_lists USING GIN(tags);
CREATE INDEX idx_lists_member_ids ON email_lists USING GIN(member_ids);

-- ============================================================================
-- CAMPAIGN METRICS (Materialized View for Fast Analytics)
-- ============================================================================

CREATE MATERIALIZED VIEW campaign_metrics AS
SELECT
    c.id AS campaign_id,
    c.name AS campaign_name,
    c.status,
    c.sent_at,

    -- Send metrics
    COUNT(DISTINCT s.id) AS sent,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'delivered') AS delivered,
    COUNT(DISTINCT s.id) FILTER (WHERE s.opened_at IS NOT NULL) AS unique_opens,
    COUNT(DISTINCT s.id) FILTER (WHERE s.first_clicked_at IS NOT NULL) AS unique_clicks,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'bounced') AS bounced,
    SUM(s.open_count) AS total_opens,
    SUM(s.click_count) AS total_clicks,

    -- Event metrics
    COUNT(DISTINCT e.id) FILTER (WHERE e.event_type = 'spam_report') AS spam_reports,
    COUNT(DISTINCT e.id) FILTER (WHERE e.event_type = 'unsubscribed') AS unsubscribed,

    -- Calculated rates
    ROUND(
        CAST(COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'delivered') AS DECIMAL) /
        NULLIF(COUNT(DISTINCT s.id), 0),
        4
    ) AS delivery_rate,
    ROUND(
        CAST(COUNT(DISTINCT s.id) FILTER (WHERE s.opened_at IS NOT NULL) AS DECIMAL) /
        NULLIF(COUNT(DISTINCT s.id), 0),
        4
    ) AS open_rate,
    ROUND(
        CAST(COUNT(DISTINCT s.id) FILTER (WHERE s.first_clicked_at IS NOT NULL) AS DECIMAL) /
        NULLIF(COUNT(DISTINCT s.id), 0),
        4
    ) AS click_rate,
    ROUND(
        CAST(COUNT(DISTINCT s.id) FILTER (WHERE s.first_clicked_at IS NOT NULL) AS DECIMAL) /
        NULLIF(COUNT(DISTINCT s.id) FILTER (WHERE s.opened_at IS NOT NULL), 0),
        4
    ) AS click_to_open_rate,
    ROUND(
        CAST(COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'bounced') AS DECIMAL) /
        NULLIF(COUNT(DISTINCT s.id), 0),
        4
    ) AS bounce_rate,

    -- Timing
    MIN(s.opened_at) AS first_open_at,
    MAX(s.opened_at) AS last_open_at,
    MIN(s.first_clicked_at) AS first_click_at,
    MAX(s.first_clicked_at) AS last_click_at

FROM email_campaigns c
LEFT JOIN campaign_sends s ON c.id = s.campaign_id
LEFT JOIN email_events e ON c.id = e.campaign_id
WHERE c.status IN ('sending', 'sent')
GROUP BY c.id, c.name, c.status, c.sent_at;

CREATE UNIQUE INDEX idx_campaign_metrics_id ON campaign_metrics(campaign_id);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_campaign_metrics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY campaign_metrics;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsubscribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_lists ENABLE ROW LEVEL SECURITY;

-- Email Templates Policies
CREATE POLICY "Email templates viewable by authenticated users"
    ON email_templates FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "Email templates manageable by admins"
    ON email_templates FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('national_admin', 'state_admin')
        )
    );

-- Email Campaigns Policies
CREATE POLICY "Campaigns viewable by creators and admins"
    ON email_campaigns FOR SELECT
    TO authenticated
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('national_admin', 'state_admin')
        )
    );

CREATE POLICY "Campaigns manageable by creators and admins"
    ON email_campaigns FOR ALL
    TO authenticated
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('national_admin', 'state_admin')
        )
    );

-- Campaign Sends Policies (Admin only for data protection)
CREATE POLICY "Campaign sends viewable by admins"
    ON campaign_sends FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('national_admin', 'state_admin')
        )
    );

-- Email Events Policies (Admin only)
CREATE POLICY "Email events viewable by admins"
    ON email_events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('national_admin', 'state_admin')
        )
    );

-- Unsubscribes Policies (Users can manage their own)
CREATE POLICY "Users can view their own unsubscribe preferences"
    ON unsubscribes FOR SELECT
    TO authenticated
    USING (member_id = auth.uid());

CREATE POLICY "Users can update their own unsubscribe preferences"
    ON unsubscribes FOR INSERT
    TO authenticated
    WITH CHECK (member_id = auth.uid());

CREATE POLICY "Users can modify their own unsubscribe preferences"
    ON unsubscribes FOR UPDATE
    TO authenticated
    USING (member_id = auth.uid());

-- Email Lists Policies
CREATE POLICY "Email lists viewable by creators and admins"
    ON email_lists FOR SELECT
    TO authenticated
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('national_admin', 'state_admin')
        )
    );

CREATE POLICY "Email lists manageable by creators and admins"
    ON email_lists FOR ALL
    TO authenticated
    USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role IN ('national_admin', 'state_admin')
        )
    );

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at
    BEFORE UPDATE ON email_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_lists_updated_at
    BEFORE UPDATE ON email_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update email list member count
CREATE OR REPLACE FUNCTION update_list_member_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.member_count = array_length(NEW.member_ids, 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_list_count
    BEFORE INSERT OR UPDATE ON email_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_list_member_count();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to check if member is unsubscribed
CREATE OR REPLACE FUNCTION is_member_unsubscribed(
    p_member_id UUID,
    p_email_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_unsubscribed BOOLEAN;
BEGIN
    -- Check if unsubscribed from all
    SELECT unsubscribe_all INTO v_unsubscribed
    FROM unsubscribes
    WHERE member_id = p_member_id
    LIMIT 1;

    IF v_unsubscribed THEN
        RETURN TRUE;
    END IF;

    -- Check specific email type if provided
    IF p_email_type IS NOT NULL THEN
        EXECUTE format(
            'SELECT NOT %I FROM unsubscribes WHERE member_id = $1 LIMIT 1',
            p_email_type
        ) INTO v_unsubscribed USING p_member_id;

        RETURN COALESCE(v_unsubscribed, FALSE);
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get campaign performance
CREATE OR REPLACE FUNCTION get_campaign_performance(p_campaign_id UUID)
RETURNS TABLE (
    metric TEXT,
    value NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'sent'::TEXT, sent::NUMERIC FROM campaign_metrics WHERE campaign_id = p_campaign_id
    UNION ALL
    SELECT 'delivered'::TEXT, delivered::NUMERIC FROM campaign_metrics WHERE campaign_id = p_campaign_id
    UNION ALL
    SELECT 'unique_opens'::TEXT, unique_opens::NUMERIC FROM campaign_metrics WHERE campaign_id = p_campaign_id
    UNION ALL
    SELECT 'unique_clicks'::TEXT, unique_clicks::NUMERIC FROM campaign_metrics WHERE campaign_id = p_campaign_id
    UNION ALL
    SELECT 'open_rate'::TEXT, open_rate::NUMERIC FROM campaign_metrics WHERE campaign_id = p_campaign_id
    UNION ALL
    SELECT 'click_rate'::TEXT, click_rate::NUMERIC FROM campaign_metrics WHERE campaign_id = p_campaign_id
    UNION ALL
    SELECT 'click_to_open_rate'::TEXT, click_to_open_rate::NUMERIC FROM campaign_metrics WHERE campaign_id = p_campaign_id
    UNION ALL
    SELECT 'bounce_rate'::TEXT, bounce_rate::NUMERIC FROM campaign_metrics WHERE campaign_id = p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA (Optional - for development)
-- ============================================================================

-- Insert welcome email template
INSERT INTO email_templates (name, type, subject, category, html_content, plain_text_content, is_active)
VALUES (
    'Welcome Email',
    'welcome',
    'Welcome to NABIP, {{firstName}}!',
    'Onboarding',
    '<h1>Welcome to NABIP!</h1><p>We''re excited to have you join us.</p>',
    'Welcome to NABIP! We''re excited to have you join us.',
    true
);

-- Grant permissions for webhook user (for SendGrid webhook processing)
-- CREATE USER sendgrid_webhook WITH PASSWORD 'your-secure-password';
-- GRANT INSERT ON email_events TO sendgrid_webhook;
-- GRANT UPDATE ON campaign_sends TO sendgrid_webhook;
