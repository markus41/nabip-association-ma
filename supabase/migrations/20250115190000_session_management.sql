-- =====================================================================================
-- Migration: Session Management System
-- Issue: #39 - Implement Session Management
-- Estimated Hours: 2 hours
-- Description: Establishes secure session tracking to support multi-device
--              authentication workflows and suspicious activity monitoring across
--              the NABIP AMS platform
-- =====================================================================================
-- Feature Area: Auth/RBAC
-- Complexity: Low (1-2 tables)
-- Priority: P1 - High
-- Dependencies: Core auth schema (members table), uuid-ossp extension
-- =====================================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================================
-- Table: sessions
-- Purpose: Track active user sessions across multiple devices with security metadata
--
-- Business Value: Enables secure multi-device access while providing visibility into
--                 login patterns, suspicious activity detection, and session lifecycle
--                 management for 20,000+ members across the organization
-- =====================================================================================
CREATE TABLE IF NOT EXISTS sessions (
  -- Primary identifier
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User relationship (foreign key to auth.users, Supabase's built-in auth table)
  -- Note: In production, this references auth.users. For development, we allow NULL
  --       to support testing without full Supabase Auth integration
  user_id UUID NOT NULL,

  -- Session token (hashed for security - never store plaintext session tokens)
  -- This is the JWT token identifier, not the full JWT payload
  session_token_hash TEXT NOT NULL UNIQUE,

  -- Session lifecycle tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Security metadata for suspicious activity detection
  ip_address INET, -- PostgreSQL INET type for efficient IP storage and querying
  user_agent TEXT, -- Browser/device identification
  device_fingerprint TEXT, -- Optional device fingerprint for enhanced security

  -- Geographic context (optional, for location-based security policies)
  -- Example: Alert when login from new country
  country_code CHAR(2), -- ISO 3166-1 alpha-2 country code (US, CA, GB, etc.)
  city TEXT,

  -- Session status
  is_active BOOLEAN NOT NULL DEFAULT true,
  revoked_at TIMESTAMPTZ, -- Manual session termination timestamp
  revoked_by UUID REFERENCES members(id), -- Who revoked the session (admin action)
  revocation_reason TEXT, -- 'logout', 'admin_action', 'suspicious_activity', 'expired'

  -- Audit trail
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================================
-- Indexes: Optimize session lookup and security monitoring queries
-- =====================================================================================

-- Primary lookup: Find sessions by user (most common query)
-- Supports: "Show me all active sessions for user X"
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)
  WHERE is_active = true;

-- Security monitoring: Identify expired sessions for cleanup
-- Supports: Scheduled job to purge expired sessions
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)
  WHERE is_active = true;

-- Activity tracking: Find sessions by last activity for timeout detection
-- Supports: "Find sessions inactive for 30+ minutes"
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity_at)
  WHERE is_active = true;

-- Security analysis: Group sessions by IP address to detect unusual patterns
-- Supports: "Show me all sessions from this IP address"
CREATE INDEX IF NOT EXISTS idx_sessions_ip_address ON sessions(ip_address)
  WHERE is_active = true;

-- Token validation: Fast lookup by session token hash (authentication flow)
-- Unique index already created via UNIQUE constraint on session_token_hash

-- Composite index for session cleanup queries
-- Supports: "Find expired or inactive sessions for batch cleanup"
CREATE INDEX IF NOT EXISTS idx_sessions_status_expires ON sessions(is_active, expires_at);

-- =====================================================================================
-- Table Comments: Business context for database architects
-- =====================================================================================
COMMENT ON TABLE sessions IS
  'Active session tracking for multi-device authentication workflows. Supports suspicious activity detection through IP/device monitoring and provides session lifecycle management for secure user access across the NABIP AMS platform.';

COMMENT ON COLUMN sessions.session_token_hash IS
  'SHA-256 hash of session token (never store plaintext). Used for secure session validation without exposing actual tokens in database.';

COMMENT ON COLUMN sessions.expires_at IS
  'Session expiration timestamp. Default: 30 days for "remember me", 24 hours for standard login. Supports automatic session cleanup jobs.';

COMMENT ON COLUMN sessions.last_activity_at IS
  'Last user action timestamp. Updated on each authenticated request. Enables idle timeout detection (default: 30 minutes inactivity = force re-auth).';

COMMENT ON COLUMN sessions.ip_address IS
  'Client IP address (INET type for efficient storage). Enables location-based security policies and suspicious activity alerts (e.g., login from new country).';

COMMENT ON COLUMN sessions.user_agent IS
  'Browser/device identification string. Supports device management UI ("Your active sessions: Chrome on Windows, Safari on iPhone").';

COMMENT ON COLUMN sessions.device_fingerprint IS
  'Optional unique device identifier (browser fingerprint). Enhances security by detecting session hijacking across different physical devices.';

COMMENT ON COLUMN sessions.revocation_reason IS
  'Tracks why session ended: "logout" (user action), "admin_action" (forced logout), "suspicious_activity" (security event), "expired" (timeout).';

-- =====================================================================================
-- Helper Function: Update Last Activity Timestamp
-- Purpose: Efficiently update session activity without full row update
--
-- Business Value: Maintains accurate session timeout tracking while minimizing
--                 database write overhead for high-traffic authentication workflows
-- =====================================================================================
CREATE OR REPLACE FUNCTION update_session_activity(session_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE sessions
  SET
    last_activity_at = now(),
    updated_at = now()
  WHERE id = session_id_param
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_session_activity(UUID) IS
  'Updates session last_activity_at timestamp for timeout detection. Called on each authenticated request. SECURITY DEFINER allows session updates even with RLS enabled.';

-- =====================================================================================
-- Helper Function: Revoke Session
-- Purpose: Securely terminate sessions with audit trail
-- =====================================================================================
CREATE OR REPLACE FUNCTION revoke_session(
  session_id_param UUID,
  revoked_by_param UUID,
  reason_param TEXT DEFAULT 'logout'
)
RETURNS VOID AS $$
BEGIN
  UPDATE sessions
  SET
    is_active = false,
    revoked_at = now(),
    revoked_by = revoked_by_param,
    revocation_reason = reason_param,
    updated_at = now()
  WHERE id = session_id_param
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION revoke_session(UUID, UUID, TEXT) IS
  'Terminates session with audit trail. Reasons: "logout", "admin_action", "suspicious_activity", "expired". SECURITY DEFINER ensures admins can revoke any session.';

-- =====================================================================================
-- Helper Function: Cleanup Expired Sessions
-- Purpose: Batch cleanup for maintenance jobs
-- =====================================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE sessions
  SET
    is_active = false,
    revoked_at = now(),
    revocation_reason = 'expired',
    updated_at = now()
  WHERE is_active = true
    AND expires_at < now();

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_sessions() IS
  'Batch cleanup for expired sessions. Run via scheduled job (recommended: hourly). Returns count of sessions terminated.';

-- =====================================================================================
-- Trigger: Auto-update updated_at timestamp
-- Purpose: Maintain audit trail without manual timestamp management
-- =====================================================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

COMMENT ON TRIGGER set_sessions_updated_at ON sessions IS
  'Automatically updates updated_at timestamp on any session modification. Supports audit trail and change tracking.';

-- =====================================================================================
-- Row Level Security (RLS) Policies
-- Purpose: Enforce multi-tenant security with user-scoped access control
--
-- Security Model:
-- - Users can view/manage their own sessions
-- - Admins can view/manage all sessions (for security monitoring)
-- - Sessions are automatically scoped to authenticated user
-- =====================================================================================

-- Enable RLS on sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sessions
-- Supports: "Show my active sessions" UI, device management
CREATE POLICY sessions_select_own ON sessions
  FOR SELECT
  USING (
    user_id = auth.uid() -- Supabase built-in function for current authenticated user
  );

-- Policy: Admins can view all sessions (security monitoring)
-- Supports: Admin dashboard, suspicious activity investigation
CREATE POLICY sessions_select_admin ON sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM member_roles mr
      JOIN roles r ON mr.role_id = r.id
      WHERE mr.member_id = auth.uid()
        AND mr.is_active = true
        AND r.tier >= 3 -- State Admin (3) or National Admin (4)
        AND (mr.expires_at IS NULL OR mr.expires_at > now())
    )
  );

-- Policy: System can insert sessions during authentication
-- Supports: Login flow, session creation by auth service
CREATE POLICY sessions_insert_system ON sessions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() -- Only create sessions for authenticated user
  );

-- Policy: Users can update their own session activity
-- Supports: Activity tracking, session timeout refresh
CREATE POLICY sessions_update_own ON sessions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Admins can revoke any session (security action)
-- Supports: "Force logout user" admin action, suspicious activity response
CREATE POLICY sessions_update_admin ON sessions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM member_roles mr
      JOIN roles r ON mr.role_id = r.id
      WHERE mr.member_id = auth.uid()
        AND mr.is_active = true
        AND r.tier >= 3 -- State Admin (3) or National Admin (4)
        AND (mr.expires_at IS NULL OR mr.expires_at > now())
    )
  );

-- Policy: Users can delete their own sessions (logout)
-- Supports: "Log out of this device" action
CREATE POLICY sessions_delete_own ON sessions
  FOR DELETE
  USING (user_id = auth.uid());

-- Policy: Admins can delete any session (cleanup/security)
CREATE POLICY sessions_delete_admin ON sessions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM member_roles mr
      JOIN roles r ON mr.role_id = r.id
      WHERE mr.member_id = auth.uid()
        AND mr.is_active = true
        AND r.tier >= 3 -- State Admin (3) or National Admin (4)
        AND (mr.expires_at IS NULL OR mr.expires_at > now())
    )
  );

-- =====================================================================================
-- Sample Data: Default session for testing
-- Purpose: Validate schema structure in development environment
-- =====================================================================================

-- Uncomment below to insert sample session (requires existing user_id)
/*
INSERT INTO sessions (
  user_id,
  session_token_hash,
  expires_at,
  ip_address,
  user_agent,
  country_code,
  city
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual user UUID
  'sample_token_hash_sha256', -- In production, use SHA-256 hash of actual token
  now() + INTERVAL '30 days',
  '192.168.1.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'US',
  'Los Angeles'
);
*/

-- =====================================================================================
-- Migration Verification Queries
-- Purpose: Validate successful deployment
-- =====================================================================================

-- Verify table created
-- SELECT COUNT(*) FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name = 'sessions';

-- Verify indexes created
-- SELECT indexname FROM pg_indexes
-- WHERE tablename = 'sessions' ORDER BY indexname;

-- Verify RLS policies created
-- SELECT policyname FROM pg_policies
-- WHERE tablename = 'sessions' ORDER BY policyname;

-- Verify helper functions created
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_schema = 'public'
--   AND routine_name IN ('update_session_activity', 'revoke_session', 'cleanup_expired_sessions');

-- =====================================================================================
-- Performance Benchmarks (Target Metrics)
-- =====================================================================================
-- Query Type                    | Target Latency | Notes
-- ------------------------------|----------------|----------------------------------
-- Session lookup by token       | <10ms          | Single index scan on unique token
-- Active sessions by user       | <50ms          | Index scan on user_id + is_active
-- Expired session cleanup       | <200ms         | Batch update via expires_at index
-- Admin security monitoring     | <100ms         | Composite index on status + expires
-- Session activity update       | <5ms           | Minimal row update (2 columns)

-- =====================================================================================
-- Maintenance Schedule (Recommended)
-- =====================================================================================
-- Task                          | Frequency      | Command/Function
-- ------------------------------|----------------|----------------------------------
-- Cleanup expired sessions      | Hourly         | SELECT cleanup_expired_sessions();
-- Monitor session count         | Daily          | SELECT COUNT(*) FROM sessions WHERE is_active = true;
-- Analyze suspicious activity   | Weekly         | Review sessions with multiple IPs
-- Vacuum sessions table         | Weekly         | VACUUM ANALYZE sessions;
-- Archive old sessions          | Monthly        | Move revoked sessions to archive table

-- =====================================================================================
-- Security Considerations
-- =====================================================================================
-- 1. NEVER store plaintext session tokens - always use SHA-256 hashing
-- 2. Set appropriate session expiration based on risk profile:
--    - Standard login: 24 hours
--    - "Remember me": 30 days
--    - High-security operations: 1 hour with re-auth required
-- 3. Implement rate limiting on session creation (prevent session fixation attacks)
-- 4. Log all admin session revocations for compliance audit trails
-- 5. Consider IP whitelist policies for highly privileged admin accounts
-- 6. Monitor for suspicious patterns:
--    - Multiple sessions from different countries simultaneously
--    - Rapid session creation from same IP (possible brute force)
--    - Session token reuse after revocation (session hijacking attempt)

-- =====================================================================================
-- Integration Notes
-- =====================================================================================
-- Frontend Implementation:
-- 1. On login: Create session record with hashed token
-- 2. On each request: Call update_session_activity(session_id)
-- 3. On logout: Call revoke_session(session_id, user_id, 'logout')
-- 4. Display active sessions: Query sessions WHERE user_id = X AND is_active = true
-- 5. "Log out all devices": Revoke all user sessions except current
--
-- Backend Implementation:
-- 1. Middleware: Validate session token on each protected route
-- 2. Scheduled Job: Run cleanup_expired_sessions() hourly
-- 3. Security Monitoring: Alert on sessions with anomalous IP/country patterns
-- 4. Admin Tools: Provide UI for session management (view/revoke user sessions)

-- =====================================================================================
-- Compliance & Audit
-- =====================================================================================
-- This schema supports:
-- - GDPR Article 32 (Security of Processing): Encrypted token storage, session logging
-- - SOC 2 Trust Services: Access control, session timeout, audit trails
-- - HIPAA Security Rule: Session management, user activity tracking
-- - PCI DSS Requirement 8: Multi-factor capable (via device fingerprinting)
--
-- Audit Trail Includes:
-- - created_at: When session started
-- - last_activity_at: Last user action
-- - revoked_at: When/how session ended
-- - revoked_by: Who terminated session (for admin actions)
-- - ip_address, user_agent: Where/how user authenticated

-- =====================================================================================
-- End of Migration: Session Management System
-- =====================================================================================
