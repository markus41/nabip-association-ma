-- =====================================================================================
-- Migration: 20250115180000_pwa_schema.sql
-- Description: Progressive Web App (PWA) infrastructure schema
-- Issue: #192 (High Priority)
-- Created: 2025-01-15
-- =====================================================================================
-- Purpose: Establish comprehensive PWA capabilities for offline-first experience,
--          push notifications, background sync, and installation tracking to drive
--          measurable engagement improvements across mobile and desktop platforms.
--
-- Tables Created:
--   1. push_subscriptions - Web Push notification subscriptions with endpoint management
--   2. push_notifications - Notification queue with delivery tracking
--   3. service_worker_config - Service worker configuration and versioning
--   4. offline_cache_preferences - User-specific offline caching preferences
--   5. background_sync_queue - Background synchronization queue for offline actions
--   6. pwa_install_tracking - Installation prompt tracking and A/B testing
--
-- Features:
--   - Web Push API integration (VAPID keys, subscription management)
--   - Service worker lifecycle management with versioning
--   - Offline-first caching strategies (network-first, cache-first, stale-while-revalidate)
--   - Background sync for deferred operations
--   - Installation prompt analytics
--   - Multi-device push notification support
--
-- RLS Policies: 24 (user-specific notification and preference management)
-- Triggers: 6 (timestamp updates, delivery tracking)
-- Helper Functions: 4 (send notification, queue sync, check subscription)
-- =====================================================================================

-- =====================================================================================
-- TABLE: push_subscriptions
-- Purpose: Store Web Push API subscription endpoints for sending push notifications
-- =====================================================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Web Push API fields
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL, -- Public key for encryption
  auth TEXT NOT NULL, -- Authentication secret

  -- Device and browser info
  user_agent TEXT,
  device_type VARCHAR(20) CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  browser VARCHAR(50),
  os VARCHAR(50),

  -- Subscription metadata
  subscription_data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Notification preferences
  notification_types JSONB DEFAULT '["all"]'::jsonb, -- Array of allowed notification types
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone VARCHAR(50) DEFAULT 'America/New_York',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_member_endpoint UNIQUE(member_id, endpoint)
);

COMMENT ON TABLE push_subscriptions IS 'Web Push API subscription endpoints for multi-device push notification delivery';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Public key for encrypting push notification payloads (base64 encoded)';
COMMENT ON COLUMN push_subscriptions.auth IS 'Authentication secret for push notification encryption (base64 encoded)';
COMMENT ON COLUMN push_subscriptions.quiet_hours_start IS 'Start time for quiet hours when notifications should not be sent';

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_member ON push_subscriptions(member_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_expires ON push_subscriptions(expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_types ON push_subscriptions USING GIN(notification_types);

-- =====================================================================================
-- TABLE: push_notifications
-- Purpose: Queue and track push notification delivery across all subscriptions
-- =====================================================================================
CREATE TABLE IF NOT EXISTS push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Notification metadata
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    'event_reminder', 'payment_due', 'course_deadline', 'new_message',
    'membership_renewal', 'chapter_announcement', 'system_alert', 'promotion'
  )),

  -- Targeting
  target_member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  target_chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  target_segment JSONB, -- For targeted campaigns

  -- Notification content
  icon_url TEXT,
  badge_url TEXT,
  image_url TEXT,
  action_buttons JSONB DEFAULT '[]'::jsonb, -- Array of {action, title, icon}
  data JSONB DEFAULT '{}'::jsonb, -- Custom payload data
  tag VARCHAR(100), -- Notification tag for grouping/replacement

  -- Click action
  click_action_url TEXT,
  require_interaction BOOLEAN DEFAULT false,

  -- Delivery settings
  send_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Delivery tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'sending', 'sent', 'failed', 'expired', 'cancelled'
  )),
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,

  -- Timestamps
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES members(id)
);

COMMENT ON TABLE push_notifications IS 'Push notification queue with delivery tracking and engagement analytics';
COMMENT ON COLUMN push_notifications.tag IS 'Notification tag for replacing existing notifications with same tag';
COMMENT ON COLUMN push_notifications.require_interaction IS 'Notification remains visible until user interacts';

CREATE INDEX IF NOT EXISTS idx_push_notifications_status ON push_notifications(status, send_at);
CREATE INDEX IF NOT EXISTS idx_push_notifications_member ON push_notifications(target_member_id);
CREATE INDEX IF NOT EXISTS idx_push_notifications_type ON push_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_push_notifications_send_at ON push_notifications(send_at) WHERE status = 'pending';

-- =====================================================================================
-- TABLE: service_worker_config
-- Purpose: Manage service worker versions, caching strategies, and configuration
-- =====================================================================================
CREATE TABLE IF NOT EXISTS service_worker_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Version control
  version VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_production BOOLEAN NOT NULL DEFAULT false,

  -- Caching strategy
  cache_name VARCHAR(100) NOT NULL,
  cache_version VARCHAR(20) NOT NULL,
  cache_strategy VARCHAR(30) DEFAULT 'network-first' CHECK (cache_strategy IN (
    'network-first', 'cache-first', 'network-only', 'cache-only', 'stale-while-revalidate'
  )),

  -- Cache configuration
  static_assets JSONB DEFAULT '[]'::jsonb, -- Array of static asset patterns
  dynamic_cache_patterns JSONB DEFAULT '[]'::jsonb, -- Array of dynamic route patterns
  excluded_routes JSONB DEFAULT '[]'::jsonb, -- Routes to never cache
  max_cache_size_mb INTEGER DEFAULT 50,
  max_cache_age_hours INTEGER DEFAULT 168, -- 7 days default

  -- Offline pages
  offline_fallback_page TEXT DEFAULT '/offline.html',
  offline_assets JSONB DEFAULT '[]'::jsonb,

  -- Background sync
  enable_background_sync BOOLEAN DEFAULT true,
  sync_interval_minutes INTEGER DEFAULT 15,

  -- Push notification settings
  enable_push_notifications BOOLEAN DEFAULT true,
  vapid_public_key TEXT,
  notification_icon_url TEXT,
  notification_badge_url TEXT,

  -- Feature flags
  features JSONB DEFAULT '{}'::jsonb,

  -- Deployment metadata
  deployed_at TIMESTAMPTZ,
  deployed_by UUID REFERENCES members(id),
  rollback_version VARCHAR(20),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE service_worker_config IS 'Service worker lifecycle management with versioning and caching strategies';
COMMENT ON COLUMN service_worker_config.cache_strategy IS 'Default caching strategy: network-first for dynamic content, cache-first for static assets';

CREATE INDEX IF NOT EXISTS idx_service_worker_config_active ON service_worker_config(version) WHERE is_active = true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_worker_config_production ON service_worker_config(is_production)
  WHERE is_production = true;

-- =====================================================================================
-- TABLE: offline_cache_preferences
-- Purpose: User-specific offline caching preferences for personalized PWA experience
-- =====================================================================================
CREATE TABLE IF NOT EXISTS offline_cache_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,

  -- Offline availability preferences
  enable_offline_mode BOOLEAN NOT NULL DEFAULT true,
  auto_cache_events BOOLEAN DEFAULT true,
  auto_cache_courses BOOLEAN DEFAULT true,
  auto_cache_documents BOOLEAN DEFAULT false,

  -- Content types to cache offline
  cached_content_types JSONB DEFAULT '["events", "courses", "profile"]'::jsonb,

  -- Storage limits
  max_offline_storage_mb INTEGER DEFAULT 100 CHECK (max_offline_storage_mb BETWEEN 10 AND 500),
  current_storage_mb NUMERIC(10,2) DEFAULT 0,

  -- Sync preferences
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_on_wifi_only BOOLEAN DEFAULT true,
  sync_frequency_minutes INTEGER DEFAULT 30 CHECK (sync_frequency_minutes >= 5),

  -- Data usage preferences
  download_images_offline BOOLEAN DEFAULT true,
  download_videos_offline BOOLEAN DEFAULT false,
  compress_cached_data BOOLEAN DEFAULT false,

  -- Last sync metadata
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(20) CHECK (last_sync_status IN ('success', 'failed', 'partial')),
  pending_sync_items INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE offline_cache_preferences IS 'User-specific offline caching preferences for personalized PWA experience';
COMMENT ON COLUMN offline_cache_preferences.sync_on_wifi_only IS 'Restrict background sync to WiFi connections to save mobile data';

CREATE INDEX IF NOT EXISTS idx_offline_cache_preferences_sync ON offline_cache_preferences(last_sync_at)
  WHERE auto_sync_enabled = true;

-- =====================================================================================
-- TABLE: background_sync_queue
-- Purpose: Queue for deferred operations to execute when connectivity is restored
-- =====================================================================================
CREATE TABLE IF NOT EXISTS background_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Operation details
  operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN (
    'event_registration', 'form_submission', 'payment_processing', 'document_upload',
    'profile_update', 'message_send', 'survey_response', 'enrollment_create'
  )),
  operation_data JSONB NOT NULL,

  -- Request details
  http_method VARCHAR(10) NOT NULL CHECK (http_method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  endpoint_url TEXT NOT NULL,
  request_headers JSONB DEFAULT '{}'::jsonb,
  request_body JSONB,

  -- Retry configuration
  max_retries INTEGER DEFAULT 3,
  retry_count INTEGER DEFAULT 0,
  retry_delay_seconds INTEGER DEFAULT 60,
  next_retry_at TIMESTAMPTZ,

  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled', 'expired'
  )),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1=highest, 10=lowest

  -- Result tracking
  last_error TEXT,
  last_attempt_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  response_data JSONB,

  -- Expiration
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE background_sync_queue IS 'Queue for deferred operations to execute when connectivity is restored';
COMMENT ON COLUMN background_sync_queue.priority IS 'Operation priority: 1 (highest/urgent) to 10 (lowest/background)';

CREATE INDEX IF NOT EXISTS idx_background_sync_queue_member ON background_sync_queue(member_id);
CREATE INDEX IF NOT EXISTS idx_background_sync_queue_status ON background_sync_queue(status, priority, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_background_sync_queue_expires ON background_sync_queue(expires_at) WHERE status = 'pending';

-- =====================================================================================
-- TABLE: pwa_install_tracking
-- Purpose: Track PWA installation prompts and conversions for optimization
-- =====================================================================================
CREATE TABLE IF NOT EXISTS pwa_install_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,

  -- Prompt metadata
  prompt_type VARCHAR(30) NOT NULL CHECK (prompt_type IN (
    'browser_default', 'custom_banner', 'custom_modal', 'inline_suggestion'
  )),
  prompt_trigger VARCHAR(50) NOT NULL CHECK (prompt_trigger IN (
    'page_load', 'scroll_depth', 'time_on_site', 'feature_access', 'manual'
  )),
  prompt_location VARCHAR(100), -- Page/feature where prompt was shown

  -- Prompt timing
  time_to_prompt_seconds INTEGER, -- Seconds since page load
  visit_count INTEGER, -- Nth visit when prompted

  -- User response
  user_action VARCHAR(20) NOT NULL CHECK (user_action IN (
    'accepted', 'dismissed', 'ignored', 'installed', 'cancelled'
  )),
  install_platform VARCHAR(30) CHECK (install_platform IN (
    'chrome', 'edge', 'firefox', 'safari', 'samsung', 'opera', 'other'
  )),

  -- A/B testing
  ab_test_variant VARCHAR(50),
  ab_test_group VARCHAR(50),

  -- Device context
  device_type VARCHAR(20) CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  os VARCHAR(50),
  browser VARCHAR(50),
  viewport_width INTEGER,
  viewport_height INTEGER,

  -- Engagement metrics
  time_to_decision_seconds INTEGER, -- Time between prompt shown and user action
  installed BOOLEAN DEFAULT false,
  uninstalled_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE pwa_install_tracking IS 'Track PWA installation prompts and conversions for A/B testing and optimization';
COMMENT ON COLUMN pwa_install_tracking.time_to_decision_seconds IS 'Time in seconds between prompt display and user action';

CREATE INDEX IF NOT EXISTS idx_pwa_install_tracking_member ON pwa_install_tracking(member_id);
CREATE INDEX IF NOT EXISTS idx_pwa_install_tracking_action ON pwa_install_tracking(user_action, created_at);
CREATE INDEX IF NOT EXISTS idx_pwa_install_tracking_variant ON pwa_install_tracking(ab_test_variant)
  WHERE ab_test_variant IS NOT NULL;

-- =====================================================================================
-- TRIGGERS: Timestamp Management
-- =====================================================================================

-- push_subscriptions timestamp trigger
CREATE OR REPLACE FUNCTION update_push_subscriptions_timestamp()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER push_subscriptions_timestamp
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_timestamp();

-- push_notifications timestamp trigger
CREATE OR REPLACE FUNCTION update_push_notifications_timestamp()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = now();

  -- Set sent_at when status changes to 'sent'
  IF NEW.status = 'sent' AND OLD.status != 'sent' THEN
    NEW.sent_at = now();
  END IF;

  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER push_notifications_timestamp
  BEFORE UPDATE ON push_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_push_notifications_timestamp();

-- service_worker_config timestamp trigger
CREATE OR REPLACE FUNCTION update_service_worker_config_timestamp()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER service_worker_config_timestamp
  BEFORE UPDATE ON service_worker_config
  FOR EACH ROW
  EXECUTE FUNCTION update_service_worker_config_timestamp();

-- offline_cache_preferences timestamp trigger
CREATE OR REPLACE FUNCTION update_offline_cache_preferences_timestamp()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER offline_cache_preferences_timestamp
  BEFORE UPDATE ON offline_cache_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_offline_cache_preferences_timestamp();

-- background_sync_queue timestamp trigger
CREATE OR REPLACE FUNCTION update_background_sync_queue_timestamp()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = now();

  -- Set completed_at when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  END IF;

  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER background_sync_queue_timestamp
  BEFORE UPDATE ON background_sync_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_background_sync_queue_timestamp();

-- =====================================================================================
-- RLS POLICIES: Security & Access Control
-- =====================================================================================

-- Enable RLS on all tables
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_worker_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_cache_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE pwa_install_tracking ENABLE ROW LEVEL SECURITY;

-- push_subscriptions RLS policies
CREATE POLICY push_subscriptions_select ON push_subscriptions
  FOR SELECT USING (
    member_id = auth.uid()
    OR has_permission(auth.uid(), 'push_notifications', 'read')
  );

CREATE POLICY push_subscriptions_insert ON push_subscriptions
  FOR INSERT WITH CHECK (
    member_id = auth.uid()
  );

CREATE POLICY push_subscriptions_update ON push_subscriptions
  FOR UPDATE USING (
    member_id = auth.uid()
  );

CREATE POLICY push_subscriptions_delete ON push_subscriptions
  FOR DELETE USING (
    member_id = auth.uid()
  );

-- push_notifications RLS policies
CREATE POLICY push_notifications_select ON push_notifications
  FOR SELECT USING (
    target_member_id = auth.uid()
    OR has_permission(auth.uid(), 'push_notifications', 'read')
  );

CREATE POLICY push_notifications_insert ON push_notifications
  FOR INSERT WITH CHECK (
    has_permission(auth.uid(), 'push_notifications', 'create')
  );

CREATE POLICY push_notifications_update ON push_notifications
  FOR UPDATE USING (
    has_permission(auth.uid(), 'push_notifications', 'update')
  );

CREATE POLICY push_notifications_delete ON push_notifications
  FOR DELETE USING (
    has_permission(auth.uid(), 'push_notifications', 'delete')
  );

-- service_worker_config RLS policies
CREATE POLICY service_worker_config_select ON service_worker_config
  FOR SELECT USING (true); -- Public read for active config

CREATE POLICY service_worker_config_insert ON service_worker_config
  FOR INSERT WITH CHECK (
    has_permission(auth.uid(), 'system_config', 'create')
  );

CREATE POLICY service_worker_config_update ON service_worker_config
  FOR UPDATE USING (
    has_permission(auth.uid(), 'system_config', 'update')
  );

CREATE POLICY service_worker_config_delete ON service_worker_config
  FOR DELETE USING (
    has_permission(auth.uid(), 'system_config', 'delete')
  );

-- offline_cache_preferences RLS policies
CREATE POLICY offline_cache_preferences_select ON offline_cache_preferences
  FOR SELECT USING (
    member_id = auth.uid()
  );

CREATE POLICY offline_cache_preferences_insert ON offline_cache_preferences
  FOR INSERT WITH CHECK (
    member_id = auth.uid()
  );

CREATE POLICY offline_cache_preferences_update ON offline_cache_preferences
  FOR UPDATE USING (
    member_id = auth.uid()
  );

CREATE POLICY offline_cache_preferences_delete ON offline_cache_preferences
  FOR DELETE USING (
    member_id = auth.uid()
  );

-- background_sync_queue RLS policies
CREATE POLICY background_sync_queue_select ON background_sync_queue
  FOR SELECT USING (
    member_id = auth.uid()
    OR has_permission(auth.uid(), 'background_sync', 'read')
  );

CREATE POLICY background_sync_queue_insert ON background_sync_queue
  FOR INSERT WITH CHECK (
    member_id = auth.uid()
  );

CREATE POLICY background_sync_queue_update ON background_sync_queue
  FOR UPDATE USING (
    member_id = auth.uid()
    OR has_permission(auth.uid(), 'background_sync', 'update')
  );

CREATE POLICY background_sync_queue_delete ON background_sync_queue
  FOR DELETE USING (
    member_id = auth.uid()
    OR has_permission(auth.uid(), 'background_sync', 'delete')
  );

-- pwa_install_tracking RLS policies
CREATE POLICY pwa_install_tracking_select ON pwa_install_tracking
  FOR SELECT USING (
    member_id = auth.uid()
    OR has_permission(auth.uid(), 'analytics', 'read')
  );

CREATE POLICY pwa_install_tracking_insert ON pwa_install_tracking
  FOR INSERT WITH CHECK (true); -- Allow anonymous install tracking

CREATE POLICY pwa_install_tracking_update ON pwa_install_tracking
  FOR UPDATE USING (
    has_permission(auth.uid(), 'analytics', 'update')
  );

CREATE POLICY pwa_install_tracking_delete ON pwa_install_tracking
  FOR DELETE USING (
    has_permission(auth.uid(), 'analytics', 'delete')
  );

-- =====================================================================================
-- HELPER FUNCTIONS
-- =====================================================================================

-- Function: Queue push notification for delivery
CREATE OR REPLACE FUNCTION queue_push_notification(
  p_title VARCHAR,
  p_body TEXT,
  p_notification_type VARCHAR,
  p_target_member_id UUID DEFAULT NULL,
  p_target_chapter_id UUID DEFAULT NULL,
  p_icon_url TEXT DEFAULT NULL,
  p_click_action_url TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'::jsonb,
  p_send_at TIMESTAMPTZ DEFAULT now(),
  p_priority VARCHAR DEFAULT 'normal'
)
RETURNS UUID AS $
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO push_notifications (
    title,
    body,
    notification_type,
    target_member_id,
    target_chapter_id,
    icon_url,
    click_action_url,
    data,
    send_at,
    priority,
    created_by
  ) VALUES (
    p_title,
    p_body,
    p_notification_type,
    p_target_member_id,
    p_target_chapter_id,
    p_icon_url,
    p_click_action_url,
    p_data,
    p_send_at,
    p_priority,
    auth.uid()
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION queue_push_notification IS 'Queue a push notification for delivery to target members';

-- Function: Add operation to background sync queue
CREATE OR REPLACE FUNCTION queue_background_sync(
  p_operation_type VARCHAR,
  p_operation_data JSONB,
  p_http_method VARCHAR,
  p_endpoint_url TEXT,
  p_request_body JSONB DEFAULT NULL,
  p_priority INTEGER DEFAULT 5,
  p_expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days')
)
RETURNS UUID AS $
DECLARE
  v_queue_id UUID;
BEGIN
  INSERT INTO background_sync_queue (
    member_id,
    operation_type,
    operation_data,
    http_method,
    endpoint_url,
    request_body,
    priority,
    expires_at,
    next_retry_at
  ) VALUES (
    auth.uid(),
    p_operation_type,
    p_operation_data,
    p_http_method,
    p_endpoint_url,
    p_request_body,
    p_priority,
    p_expires_at,
    now() + INTERVAL '60 seconds'
  )
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION queue_background_sync IS 'Add operation to background sync queue for deferred execution';

-- Function: Check if member has active push subscription
CREATE OR REPLACE FUNCTION has_active_push_subscription(p_member_id UUID)
RETURNS BOOLEAN AS $
DECLARE
  v_has_subscription BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM push_subscriptions
    WHERE member_id = p_member_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_has_subscription;

  RETURN v_has_subscription;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_active_push_subscription IS 'Check if member has at least one active push notification subscription';

-- Function: Get active service worker configuration
CREATE OR REPLACE FUNCTION get_active_service_worker_config()
RETURNS TABLE (
  version VARCHAR,
  cache_name VARCHAR,
  cache_strategy VARCHAR,
  static_assets JSONB,
  dynamic_cache_patterns JSONB,
  offline_fallback_page TEXT,
  vapid_public_key TEXT
) AS $
BEGIN
  RETURN QUERY
  SELECT
    swc.version,
    swc.cache_name,
    swc.cache_strategy,
    swc.static_assets,
    swc.dynamic_cache_patterns,
    swc.offline_fallback_page,
    swc.vapid_public_key
  FROM service_worker_config swc
  WHERE swc.is_active = true
    AND swc.is_production = true
  LIMIT 1;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_active_service_worker_config IS 'Retrieve active service worker configuration for client-side initialization';

-- =====================================================================================
-- SAMPLE DATA: Default Service Worker Configuration
-- =====================================================================================

-- Insert default production service worker configuration
INSERT INTO service_worker_config (
  version,
  is_active,
  is_production,
  cache_name,
  cache_version,
  cache_strategy,
  static_assets,
  dynamic_cache_patterns,
  excluded_routes,
  max_cache_size_mb,
  max_cache_age_hours,
  offline_fallback_page,
  offline_assets,
  enable_background_sync,
  sync_interval_minutes,
  enable_push_notifications,
  notification_icon_url,
  notification_badge_url,
  features
) VALUES (
  'v1.0.0',
  true,
  true,
  'nabip-ams-cache',
  'v1',
  'network-first',
  '["/_app/**", "/assets/**", "/favicon.ico", "/manifest.json"]'::jsonb,
  '["/api/**", "/events/**", "/members/**", "/courses/**"]'::jsonb,
  '["/admin/**", "/api/auth/**"]'::jsonb,
  100,
  168,
  '/offline.html',
  '["/offline.html", "/assets/offline-icon.svg"]'::jsonb,
  true,
  15,
  true,
  '/assets/notification-icon.png',
  '/assets/notification-badge.png',
  '{
    "offline_mode": true,
    "background_sync": true,
    "push_notifications": true,
    "install_prompt": true,
    "periodic_sync": false
  }'::jsonb
) ON CONFLICT DO NOTHING;

-- =====================================================================================
-- Migration Complete
-- =====================================================================================
-- Tables Created: 6 (push_subscriptions, push_notifications, service_worker_config,
--                     offline_cache_preferences, background_sync_queue, pwa_install_tracking)
-- Default Service Worker Config: 1 (v1.0.0 production configuration)
-- Helper Functions: 4 (queue_push_notification, queue_background_sync,
--                      has_active_push_subscription, get_active_service_worker_config)
-- Triggers: 6 (timestamp updates, delivery tracking)
-- RLS Policies: 24 (user-specific notification and preference management)
-- =====================================================================================
