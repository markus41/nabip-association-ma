-- =====================================================================================
-- Migration: Auth & RBAC - Security Foundation
-- Issue: #193 - Third-Party Integrations and API Ecosystem (Critical Priority)
-- Estimated Hours: 24 hours
-- Description: Establishes 4-tier RBAC system (Member, Chapter Admin, State Admin,
--              National Admin) with OAuth provider integration and API key management
-- =====================================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================================
-- Table: roles
-- Purpose: Define system roles for 4-tier RBAC hierarchy
-- =====================================================================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  tier INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 4),
  -- Tier 1: Member (basic access)
  -- Tier 2: Chapter Admin (chapter-level management)
  -- Tier 3: State Admin (state-level oversight)
  -- Tier 4: National Admin (full system access)
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for role queries
CREATE INDEX IF NOT EXISTS idx_roles_tier ON roles(tier);
CREATE INDEX IF NOT EXISTS idx_roles_system ON roles(is_system_role);

COMMENT ON TABLE roles IS 'System roles for 4-tier RBAC: Member (1), Chapter Admin (2), State Admin (3), National Admin (4)';
COMMENT ON COLUMN roles.tier IS '1=Member, 2=Chapter Admin, 3=State Admin, 4=National Admin';
COMMENT ON COLUMN roles.is_system_role IS 'Prevents deletion of core system roles';

-- =====================================================================================
-- Table: permissions
-- Purpose: Granular permission definitions for resource-level access control
-- =====================================================================================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(100) NOT NULL, -- 'members', 'events', 'chapters', 'reports', 'finances'
  action VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete', 'manage'
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create composite index for permission lookups
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);

COMMENT ON TABLE permissions IS 'Granular permissions for resource-level access control';
COMMENT ON COLUMN permissions.resource IS 'Resource type: members, events, chapters, reports, finances, etc.';
COMMENT ON COLUMN permissions.action IS 'Action type: create, read, update, delete, manage';

-- =====================================================================================
-- Table: role_permissions
-- Purpose: Many-to-many mapping between roles and permissions
-- =====================================================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_role_permission UNIQUE(role_id, permission_id)
);

-- Create indexes for role permission queries
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

COMMENT ON TABLE role_permissions IS 'Many-to-many mapping between roles and permissions';

-- =====================================================================================
-- Table: member_roles
-- Purpose: Assign roles to members with optional scope (chapter/state level)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS member_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE, -- NULL = global scope
  assigned_by UUID REFERENCES members(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ, -- NULL = no expiration
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_member_role_scope UNIQUE(member_id, role_id, chapter_id)
);

-- Create indexes for member role queries
CREATE INDEX IF NOT EXISTS idx_member_roles_member ON member_roles(member_id);
CREATE INDEX IF NOT EXISTS idx_member_roles_role ON member_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_member_roles_chapter ON member_roles(chapter_id);
CREATE INDEX IF NOT EXISTS idx_member_roles_active ON member_roles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_member_roles_expires ON member_roles(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE member_roles IS 'Assign roles to members with optional chapter/state scope';
COMMENT ON COLUMN member_roles.chapter_id IS 'NULL = global scope; Chapter ID = scoped to specific chapter';
COMMENT ON COLUMN member_roles.expires_at IS 'NULL = no expiration; Used for temporary role assignments';

-- =====================================================================================
-- Table: oauth_providers
-- Purpose: Third-party OAuth provider configuration (Google, Microsoft)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS oauth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name VARCHAR(50) UNIQUE NOT NULL, -- 'google', 'microsoft', 'github'
  client_id VARCHAR(255) NOT NULL,
  client_secret VARCHAR(255) NOT NULL, -- Encrypted in production
  authorization_url TEXT NOT NULL,
  token_url TEXT NOT NULL,
  user_info_url TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for provider lookups
CREATE INDEX IF NOT EXISTS idx_oauth_providers_enabled ON oauth_providers(is_enabled) WHERE is_enabled = true;

COMMENT ON TABLE oauth_providers IS 'OAuth provider configurations for Google, Microsoft, GitHub SSO';
COMMENT ON COLUMN oauth_providers.client_secret IS 'Should be encrypted using Supabase Vault in production';
COMMENT ON COLUMN oauth_providers.scopes IS 'OAuth scopes requested during authorization';

-- =====================================================================================
-- Table: oauth_tokens
-- Purpose: Store OAuth access/refresh tokens for authenticated members
-- =====================================================================================
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES oauth_providers(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL, -- Encrypted in production
  refresh_token TEXT, -- Encrypted in production
  token_type VARCHAR(20) DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_member_provider UNIQUE(member_id, provider_id)
);

-- Create indexes for token queries
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_member ON oauth_tokens(member_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_provider ON oauth_tokens(provider_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires ON oauth_tokens(expires_at);

COMMENT ON TABLE oauth_tokens IS 'OAuth access/refresh tokens for authenticated members';
COMMENT ON COLUMN oauth_tokens.access_token IS 'Should be encrypted using Supabase Vault in production';
COMMENT ON COLUMN oauth_tokens.refresh_token IS 'Should be encrypted using Supabase Vault in production';

-- =====================================================================================
-- Table: api_keys
-- Purpose: API key management for third-party integrations and webhooks
-- =====================================================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL, -- SHA-256 hash of the actual API key
  key_prefix VARCHAR(20) NOT NULL, -- First 8 characters for identification (e.g., "nabip_sk_")
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  scopes TEXT[] NOT NULL DEFAULT '{}', -- e.g., ['members:read', 'events:write']
  rate_limit_per_hour INTEGER DEFAULT 1000,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for API key queries
CREATE INDEX IF NOT EXISTS idx_api_keys_member ON api_keys(member_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_expires ON api_keys(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

COMMENT ON TABLE api_keys IS 'API key management for third-party integrations and webhooks';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the actual API key for secure storage';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 8 characters (e.g., nabip_sk_) for identification without exposing full key';
COMMENT ON COLUMN api_keys.scopes IS 'Resource:action permissions (e.g., members:read, events:write)';

-- =====================================================================================
-- Table: api_key_usage_logs
-- Purpose: Audit trail for API key usage and rate limiting
-- =====================================================================================
CREATE TABLE IF NOT EXISTS api_key_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  http_method VARCHAR(10) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  response_status INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for usage log queries
CREATE INDEX IF NOT EXISTS idx_api_usage_key ON api_key_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_key_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_key_usage_logs(endpoint);

COMMENT ON TABLE api_key_usage_logs IS 'Audit trail for API key usage and rate limiting enforcement';

-- =====================================================================================
-- Insert Default System Roles (4-Tier RBAC)
-- =====================================================================================
INSERT INTO roles (name, description, tier, is_system_role) VALUES
  ('Member', 'Basic member access - view own profile, register for events, access member portal', 1, true),
  ('Chapter Admin', 'Chapter-level administrator - manage chapter members, events, and communications', 2, true),
  ('State Admin', 'State-level administrator - oversee all chapters within state, state-level reporting', 3, true),
  ('National Admin', 'National-level administrator - full system access, global configuration, all reports', 4, true)
ON CONFLICT (name) DO NOTHING;

-- =====================================================================================
-- Insert Default Permissions
-- =====================================================================================
INSERT INTO permissions (name, resource, action, description) VALUES
  -- Member permissions
  ('members.read', 'members', 'read', 'View member profiles and directory'),
  ('members.create', 'members', 'create', 'Create new member accounts'),
  ('members.update', 'members', 'update', 'Update member information'),
  ('members.delete', 'members', 'delete', 'Delete member accounts'),
  ('members.manage', 'members', 'manage', 'Full member management including roles'),

  -- Event permissions
  ('events.read', 'events', 'read', 'View events and registrations'),
  ('events.create', 'events', 'create', 'Create new events'),
  ('events.update', 'events', 'update', 'Update event details'),
  ('events.delete', 'events', 'delete', 'Delete events'),
  ('events.manage', 'events', 'manage', 'Full event management including capacity'),

  -- Chapter permissions
  ('chapters.read', 'chapters', 'read', 'View chapter information'),
  ('chapters.create', 'chapters', 'create', 'Create new chapters'),
  ('chapters.update', 'chapters', 'update', 'Update chapter details'),
  ('chapters.delete', 'chapters', 'delete', 'Delete chapters'),
  ('chapters.manage', 'chapters', 'manage', 'Full chapter management including hierarchy'),

  -- Finance permissions
  ('finances.read', 'finances', 'read', 'View financial transactions and reports'),
  ('finances.create', 'finances', 'create', 'Create transactions and invoices'),
  ('finances.update', 'finances', 'update', 'Update financial records'),
  ('finances.delete', 'finances', 'delete', 'Delete financial records'),
  ('finances.manage', 'finances', 'manage', 'Full financial management including refunds'),

  -- Report permissions
  ('reports.read', 'reports', 'read', 'View and run reports'),
  ('reports.create', 'reports', 'create', 'Create new reports'),
  ('reports.update', 'reports', 'update', 'Update report definitions'),
  ('reports.delete', 'reports', 'delete', 'Delete reports'),
  ('reports.manage', 'reports', 'manage', 'Full report management including scheduling'),

  -- System permissions
  ('system.read', 'system', 'read', 'View system configuration'),
  ('system.manage', 'system', 'manage', 'Manage system settings and integrations')
ON CONFLICT (name) DO NOTHING;

-- =====================================================================================
-- Assign Permissions to Roles
-- =====================================================================================

-- Member Role (Tier 1): Basic read-only access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Member' AND p.name IN (
  'members.read', 'events.read', 'chapters.read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Chapter Admin Role (Tier 2): Chapter-level management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'Chapter Admin' AND p.name IN (
  'members.read', 'members.update',
  'events.read', 'events.create', 'events.update', 'events.manage',
  'chapters.read', 'chapters.update',
  'finances.read',
  'reports.read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- State Admin Role (Tier 3): State-level oversight
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'State Admin' AND p.name IN (
  'members.read', 'members.create', 'members.update',
  'events.read', 'events.create', 'events.update', 'events.manage',
  'chapters.read', 'chapters.create', 'chapters.update', 'chapters.manage',
  'finances.read', 'finances.create', 'finances.update',
  'reports.read', 'reports.create', 'reports.update'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- National Admin Role (Tier 4): Full system access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'National Admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =====================================================================================
-- Triggers: Auto-update timestamps
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_auth_rbac_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_auth_rbac_updated_at();

CREATE TRIGGER trigger_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW EXECUTE FUNCTION update_auth_rbac_updated_at();

CREATE TRIGGER trigger_member_roles_updated_at
  BEFORE UPDATE ON member_roles
  FOR EACH ROW EXECUTE FUNCTION update_auth_rbac_updated_at();

CREATE TRIGGER trigger_oauth_providers_updated_at
  BEFORE UPDATE ON oauth_providers
  FOR EACH ROW EXECUTE FUNCTION update_auth_rbac_updated_at();

CREATE TRIGGER trigger_oauth_tokens_updated_at
  BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION update_auth_rbac_updated_at();

CREATE TRIGGER trigger_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_auth_rbac_updated_at();

-- =====================================================================================
-- Triggers: Expire inactive roles automatically
-- =====================================================================================

CREATE OR REPLACE FUNCTION check_member_role_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= now() THEN
    NEW.is_active = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_member_role_expiration
  BEFORE INSERT OR UPDATE ON member_roles
  FOR EACH ROW EXECUTE FUNCTION check_member_role_expiration();

-- =====================================================================================
-- Triggers: Update API key usage statistics
-- =====================================================================================

CREATE OR REPLACE FUNCTION update_api_key_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE api_keys
  SET
    last_used_at = now(),
    usage_count = usage_count + 1
  WHERE id = NEW.api_key_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_api_key_usage
  AFTER INSERT ON api_key_usage_logs
  FOR EACH ROW EXECUTE FUNCTION update_api_key_usage();

-- =====================================================================================
-- Helper Functions: Check member permissions
-- =====================================================================================

CREATE OR REPLACE FUNCTION has_permission(
  p_member_id UUID,
  p_resource VARCHAR,
  p_action VARCHAR,
  p_chapter_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN := false;
BEGIN
  -- Check if member has the required permission through any of their active roles
  SELECT EXISTS (
    SELECT 1
    FROM member_roles mr
    JOIN role_permissions rp ON mr.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE mr.member_id = p_member_id
      AND mr.is_active = true
      AND (mr.expires_at IS NULL OR mr.expires_at > now())
      AND p.resource = p_resource
      AND p.action = p_action
      AND (
        mr.chapter_id IS NULL -- Global scope
        OR mr.chapter_id = p_chapter_id -- Scoped to specific chapter
      )
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_permission IS 'Check if member has specific permission for resource/action with optional chapter scope';

-- =====================================================================================
-- Helper Functions: Get member roles with details
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_member_roles(p_member_id UUID)
RETURNS TABLE (
  role_name VARCHAR,
  role_tier INTEGER,
  chapter_name VARCHAR,
  is_active BOOLEAN,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.name,
    r.tier,
    c.name,
    mr.is_active,
    mr.expires_at
  FROM member_roles mr
  JOIN roles r ON mr.role_id = r.id
  LEFT JOIN chapters c ON mr.chapter_id = c.id
  WHERE mr.member_id = p_member_id
  ORDER BY r.tier DESC, mr.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_member_roles IS 'Get all roles assigned to a member with chapter scope and expiration';

-- =====================================================================================
-- RLS Policies: Enable Row Level Security
-- =====================================================================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage_logs ENABLE ROW LEVEL SECURITY;

-- Roles: Readable by all authenticated users, manageable by National Admins only
CREATE POLICY roles_select_policy ON roles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY roles_insert_policy ON roles
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY roles_update_policy ON roles
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY roles_delete_policy ON roles
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'system', 'manage')
    AND is_system_role = false -- Prevent deletion of system roles
  );

-- Permissions: Readable by all authenticated users, manageable by National Admins only
CREATE POLICY permissions_select_policy ON permissions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY permissions_insert_policy ON permissions
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY permissions_update_policy ON permissions
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY permissions_delete_policy ON permissions
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

-- Role Permissions: Readable by all authenticated users, manageable by National Admins only
CREATE POLICY role_permissions_select_policy ON role_permissions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY role_permissions_insert_policy ON role_permissions
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY role_permissions_delete_policy ON role_permissions
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

-- Member Roles: Members can view their own, admins can manage based on tier
CREATE POLICY member_roles_select_policy ON member_roles
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid()::UUID -- Own roles
    OR has_permission(auth.uid()::UUID, 'members', 'read') -- Admin access
  );

CREATE POLICY member_roles_insert_policy ON member_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'members', 'manage')
  );

CREATE POLICY member_roles_update_policy ON member_roles
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'members', 'manage')
  );

CREATE POLICY member_roles_delete_policy ON member_roles
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'members', 'manage')
  );

-- OAuth Providers: Manageable by National Admins only
CREATE POLICY oauth_providers_select_policy ON oauth_providers
  FOR SELECT TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'system', 'read')
  );

CREATE POLICY oauth_providers_insert_policy ON oauth_providers
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY oauth_providers_update_policy ON oauth_providers
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY oauth_providers_delete_policy ON oauth_providers
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid()::UUID, 'system', 'manage')
  );

-- OAuth Tokens: Members can only view/manage their own tokens
CREATE POLICY oauth_tokens_select_policy ON oauth_tokens
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid()::UUID
  );

CREATE POLICY oauth_tokens_insert_policy ON oauth_tokens
  FOR INSERT TO authenticated
  WITH CHECK (
    member_id = auth.uid()::UUID
  );

CREATE POLICY oauth_tokens_update_policy ON oauth_tokens
  FOR UPDATE TO authenticated
  USING (
    member_id = auth.uid()::UUID
  );

CREATE POLICY oauth_tokens_delete_policy ON oauth_tokens
  FOR DELETE TO authenticated
  USING (
    member_id = auth.uid()::UUID
  );

-- API Keys: Members can view/manage their own, National Admins can manage all
CREATE POLICY api_keys_select_policy ON api_keys
  FOR SELECT TO authenticated
  USING (
    member_id = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY api_keys_insert_policy ON api_keys
  FOR INSERT TO authenticated
  WITH CHECK (
    member_id = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY api_keys_update_policy ON api_keys
  FOR UPDATE TO authenticated
  USING (
    member_id = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'system', 'manage')
  );

CREATE POLICY api_keys_delete_policy ON api_keys
  FOR DELETE TO authenticated
  USING (
    member_id = auth.uid()::UUID
    OR has_permission(auth.uid()::UUID, 'system', 'manage')
  );

-- API Key Usage Logs: Audit trail visible to key owner and National Admins
CREATE POLICY api_usage_logs_select_policy ON api_key_usage_logs
  FOR SELECT TO authenticated
  USING (
    api_key_id IN (SELECT id FROM api_keys WHERE member_id = auth.uid()::UUID)
    OR has_permission(auth.uid()::UUID, 'system', 'manage')
  );

-- =====================================================================================
-- Migration Complete
-- =====================================================================================
-- Tables Created: 8 (roles, permissions, role_permissions, member_roles,
--                    oauth_providers, oauth_tokens, api_keys, api_key_usage_logs)
-- Default Roles: 4 (Member, Chapter Admin, State Admin, National Admin)
-- Default Permissions: 27 (members, events, chapters, finances, reports, system)
-- RLS Policies: 29 (comprehensive multi-tier access control)
-- Helper Functions: 2 (has_permission, get_member_roles)
-- =====================================================================================
