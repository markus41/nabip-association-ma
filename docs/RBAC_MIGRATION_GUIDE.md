# RBAC Migration Guide
## NABIP Association Management System

**Version:** 1.0
**Last Updated:** 2025-11-15
**Estimated Duration:** 2-3 weeks
**Risk Level:** Medium

---

## Executive Summary

This guide provides step-by-step instructions for migrating the NABIP AMS from zero access control to a comprehensive 4-tier RBAC system. The migration follows a phased approach to minimize disruption and enable thorough testing at each stage.

### Migration Goals
- Implement database-level RBAC schema in Supabase
- Migrate existing member data with default role assignments
- Enable Row-Level Security (RLS) policies
- Deploy application-level permission checks
- Provide admin tools for role management

### Success Criteria
- Zero data loss during migration
- < 5 second downtime during RLS enablement
- All existing functionality preserved
- Role assignments validated by business stakeholders
- Complete rollback plan available

---

## Pre-Migration Checklist

### Infrastructure Prerequisites
- [ ] Supabase project created or existing project accessible
- [ ] Database backups automated and verified
- [ ] Staging environment configured
- [ ] CI/CD pipeline supports database migrations
- [ ] Monitoring and alerting configured

### Team Readiness
- [ ] Migration plan reviewed with stakeholders
- [ ] National admin accounts identified
- [ ] State admin accounts identified
- [ ] Chapter admin accounts identified (chapter presidents)
- [ ] Migration window scheduled (low-traffic period)
- [ ] Rollback team designated and trained

### Code Preparation
- [ ] RBAC TypeScript utilities implemented (`src/lib/rbac/`)
- [ ] Permission checks integrated in application code
- [ ] UI components support conditional rendering based on permissions
- [ ] Admin interface for role management built

---

## Phase 1: Schema Creation (Day 1-2)

### Step 1.1: Create Migration File

```bash
# Create new migration
npx supabase migration new rbac_schema_initial

# Migration file location: supabase/migrations/YYYYMMDDHHMMSS_rbac_schema_initial.sql
```

### Step 1.2: Execute Schema DDL

**File:** `supabase/migrations/YYYYMMDDHHMMSS_rbac_schema_initial.sql`

```sql
-- ============================================================================
-- RBAC SCHEMA MIGRATION - PHASE 1: CORE TABLES
-- Author: [Your Name]
-- Date: 2025-11-15
-- Description: Create roles, permissions, and audit tables for RBAC system
-- ============================================================================

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 10),
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT roles_name_lowercase CHECK (name = LOWER(name)),
    CONSTRAINT roles_level_positive CHECK (level > 0)
);

CREATE INDEX idx_roles_level ON roles(level);
CREATE INDEX idx_roles_system ON roles(is_system_role) WHERE is_system_role = true;

COMMENT ON TABLE roles IS 'Defines system and custom roles with hierarchical levels';

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL UNIQUE,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    scope VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT permissions_name_format CHECK (
        name = LOWER(resource || '.' || action || '.' || scope)
    ),
    CONSTRAINT permissions_valid_resource CHECK (
        resource IN ('member', 'chapter', 'event', 'campaign', 'course',
                     'report', 'transaction', 'role', 'permission', 'audit', 'system')
    ),
    CONSTRAINT permissions_valid_action CHECK (
        action IN ('view', 'create', 'edit', 'delete', 'export', 'manage', 'assign')
    ),
    CONSTRAINT permissions_valid_scope CHECK (
        scope IN ('own', 'chapter', 'state', 'national', 'all', 'public')
    )
);

CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX idx_permissions_scope ON permissions(scope);

COMMENT ON TABLE permissions IS 'Granular permission definitions using resource.action.scope pattern';

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by UUID REFERENCES members(id) ON DELETE SET NULL,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

COMMENT ON TABLE role_permissions IS 'Maps permissions to roles with audit trail';

-- Create member_roles table
CREATE TABLE IF NOT EXISTS member_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN ('global', 'chapter', 'state')),
    scope_chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    scope_state VARCHAR(2),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES members(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT member_roles_unique_assignment UNIQUE (
        member_id, role_id, scope_type,
        COALESCE(scope_chapter_id::text, ''),
        COALESCE(scope_state, '')
    ),
    CONSTRAINT member_roles_chapter_scope CHECK (
        (scope_type = 'chapter' AND scope_chapter_id IS NOT NULL AND scope_state IS NULL) OR
        (scope_type = 'state' AND scope_state IS NOT NULL AND scope_chapter_id IS NULL) OR
        (scope_type = 'global' AND scope_chapter_id IS NULL AND scope_state IS NULL)
    ),
    CONSTRAINT member_roles_valid_state CHECK (
        scope_state IS NULL OR LENGTH(scope_state) = 2
    )
);

CREATE INDEX idx_member_roles_member ON member_roles(member_id) WHERE is_active = true;
CREATE INDEX idx_member_roles_role ON member_roles(role_id);
CREATE INDEX idx_member_roles_chapter ON member_roles(scope_chapter_id) WHERE scope_chapter_id IS NOT NULL;
CREATE INDEX idx_member_roles_state ON member_roles(scope_state) WHERE scope_state IS NOT NULL;
CREATE INDEX idx_member_roles_active_lookup ON member_roles(member_id, is_active, expires_at);

COMMENT ON TABLE member_roles IS 'Assigns roles to members with scope and temporal controls';

-- Create audit_logs table (partitioned)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES members(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB,
    CONSTRAINT audit_logs_valid_action CHECK (
        action ~ '^[a-z_]+\.[a-z_]+$'
    ),
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id, timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id, timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, timestamp DESC);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING gin(metadata);

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail with 7-year retention';

-- Create initial quarterly partitions
CREATE TABLE audit_logs_2025_q4 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');

CREATE TABLE audit_logs_2026_q1 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');

-- Helper function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to roles table
CREATE TRIGGER roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log migration completion
INSERT INTO audit_logs (action, resource_type, metadata)
VALUES (
    'migration.completed',
    'system',
    '{"phase": "1", "description": "RBAC schema creation"}'::jsonb
);
```

### Step 1.3: Verify Schema Creation

```sql
-- Verify all tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('roles', 'permissions', 'role_permissions', 'member_roles', 'audit_logs');

-- Expected result: 5 tables

-- Verify indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('roles', 'permissions', 'member_roles');

-- Expected result: 10+ indexes
```

---

## Phase 2: Seed System Data (Day 2-3)

### Step 2.1: Seed System Roles

```bash
npx supabase migration new rbac_seed_roles
```

**File:** `supabase/migrations/YYYYMMDDHHMMSS_rbac_seed_roles.sql`

```sql
-- ============================================================================
-- RBAC MIGRATION - PHASE 2A: SEED SYSTEM ROLES
-- ============================================================================

INSERT INTO roles (name, level, description, is_system_role) VALUES
    ('member', 1, 'Standard member with access to own profile and public resources', true),
    ('chapter_admin', 2, 'Chapter administrator with management rights for a specific chapter', true),
    ('state_admin', 3, 'State administrator with oversight of all chapters in a state', true),
    ('national_admin', 4, 'National administrator with full system access', true)
ON CONFLICT (name) DO NOTHING;

-- Verify roles created
DO $$
DECLARE
    v_role_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_role_count FROM roles WHERE is_system_role = true;
    IF v_role_count < 4 THEN
        RAISE EXCEPTION 'Expected 4 system roles, found %', v_role_count;
    END IF;
    RAISE NOTICE 'System roles verified: % roles created', v_role_count;
END $$;
```

### Step 2.2: Seed Permissions

```bash
npx supabase migration new rbac_seed_permissions
```

**File:** `supabase/migrations/YYYYMMDDHHMMSS_rbac_seed_permissions.sql`

```sql
-- ============================================================================
-- RBAC MIGRATION - PHASE 2B: SEED PERMISSIONS
-- ============================================================================

-- Member permissions
INSERT INTO permissions (name, resource, action, scope, description) VALUES
    ('member.view.own', 'member', 'view', 'own', 'View own member profile'),
    ('member.edit.own', 'member', 'edit', 'own', 'Edit own member profile'),
    ('member.view.chapter', 'member', 'view', 'chapter', 'View members in same chapter'),
    ('member.edit.chapter', 'member', 'edit', 'chapter', 'Edit members in same chapter'),
    ('member.create.chapter', 'member', 'create', 'chapter', 'Create members in chapter'),
    ('member.view.state', 'member', 'view', 'state', 'View members across state'),
    ('member.edit.state', 'member', 'edit', 'state', 'Edit members in state'),
    ('member.export.state', 'member', 'export', 'state', 'Export state member data'),
    ('member.view.national', 'member', 'view', 'national', 'View all members'),
    ('member.edit.national', 'member', 'edit', 'national', 'Edit any member')
ON CONFLICT (name) DO NOTHING;

-- Event permissions
INSERT INTO permissions (name, resource, action, scope, description) VALUES
    ('event.view.public', 'event', 'view', 'public', 'View public events'),
    ('event.register.own', 'event', 'register', 'own', 'Register for events'),
    ('event.view.chapter', 'event', 'view', 'chapter', 'View chapter events'),
    ('event.create.chapter', 'event', 'create', 'chapter', 'Create chapter events'),
    ('event.edit.chapter', 'event', 'edit', 'chapter', 'Edit chapter events'),
    ('event.delete.chapter', 'event', 'delete', 'chapter', 'Delete chapter events'),
    ('event.view.state', 'event', 'view', 'state', 'View state events'),
    ('event.view.national', 'event', 'view', 'national', 'View all events')
ON CONFLICT (name) DO NOTHING;

-- Campaign permissions
INSERT INTO permissions (name, resource, action, scope, description) VALUES
    ('campaign.view.chapter', 'campaign', 'view', 'chapter', 'View chapter campaigns'),
    ('campaign.create.chapter', 'campaign', 'create', 'chapter', 'Create chapter campaigns'),
    ('campaign.edit.chapter', 'campaign', 'edit', 'chapter', 'Edit chapter campaigns'),
    ('campaign.view.state', 'campaign', 'view', 'state', 'View state campaigns'),
    ('campaign.create.national', 'campaign', 'create', 'national', 'Create national campaigns')
ON CONFLICT (name) DO NOTHING;

-- Report permissions
INSERT INTO permissions (name, resource, action, scope, description) VALUES
    ('report.view.own', 'report', 'view', 'own', 'View own reports'),
    ('report.view.chapter', 'report', 'view', 'chapter', 'View chapter reports'),
    ('report.export.chapter', 'report', 'export', 'chapter', 'Export chapter reports'),
    ('report.view.state', 'report', 'view', 'state', 'View state analytics')
ON CONFLICT (name) DO NOTHING;

-- Role management permissions
INSERT INTO permissions (name, resource, action, scope, description) VALUES
    ('role.view.all', 'role', 'view', 'all', 'View all roles'),
    ('role.assign.chapter', 'role', 'assign', 'chapter', 'Assign chapter admin roles'),
    ('role.assign.national', 'role', 'assign', 'national', 'Assign any role'),
    ('role.create.national', 'role', 'create', 'national', 'Create custom roles')
ON CONFLICT (name) DO NOTHING;

-- Audit permissions
INSERT INTO permissions (name, resource, action, scope, description) VALUES
    ('audit.view.own', 'audit', 'view', 'own', 'View own audit logs'),
    ('audit.view.chapter', 'audit', 'view', 'chapter', 'View chapter audit logs'),
    ('audit.view.state', 'audit', 'view', 'state', 'View state audit logs'),
    ('audit.view.all', 'audit', 'view', 'all', 'View all audit logs')
ON CONFLICT (name) DO NOTHING;

-- Verify permissions created
DO $$
DECLARE
    v_perm_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_perm_count FROM permissions;
    RAISE NOTICE 'Permissions created: %', v_perm_count;
END $$;
```

### Step 2.3: Map Permissions to Roles

```bash
npx supabase migration new rbac_map_role_permissions
```

**File:** `supabase/migrations/YYYYMMDDHHMMSS_rbac_map_role_permissions.sql`

```sql
-- ============================================================================
-- RBAC MIGRATION - PHASE 2C: MAP PERMISSIONS TO ROLES
-- ============================================================================

-- Member role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'member'
  AND p.name IN (
    'member.view.own',
    'member.edit.own',
    'event.view.public',
    'event.register.own',
    'report.view.own',
    'audit.view.own'
  )
ON CONFLICT DO NOTHING;

-- Chapter admin role permissions (inherits member + adds chapter management)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'chapter_admin'
  AND p.name IN (
    -- Inherited from member
    'member.view.own', 'member.edit.own', 'event.view.public', 'event.register.own',
    'report.view.own', 'audit.view.own',
    -- Chapter-specific
    'member.view.chapter', 'member.edit.chapter', 'member.create.chapter',
    'event.view.chapter', 'event.create.chapter', 'event.edit.chapter', 'event.delete.chapter',
    'campaign.view.chapter', 'campaign.create.chapter', 'campaign.edit.chapter',
    'report.view.chapter', 'report.export.chapter',
    'audit.view.chapter'
  )
ON CONFLICT DO NOTHING;

-- State admin role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'state_admin'
  AND p.scope IN ('own', 'chapter', 'state')
ON CONFLICT DO NOTHING;

-- National admin role permissions (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'national_admin'
ON CONFLICT DO NOTHING;

-- Verify mappings
SELECT r.name, COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.is_system_role = true
GROUP BY r.name
ORDER BY r.level;
```

---

## Phase 3: Data Migration (Day 3-5)

### Step 3.1: Assign Default Member Role

```bash
npx supabase migration new rbac_assign_default_roles
```

**File:** `supabase/migrations/YYYYMMDDHHMMSS_rbac_assign_default_roles.sql`

```sql
-- ============================================================================
-- RBAC MIGRATION - PHASE 3: ASSIGN DEFAULT MEMBER ROLES
-- ============================================================================

-- Assign "member" role to all existing members (global scope)
INSERT INTO member_roles (member_id, role_id, scope_type, assigned_by)
SELECT
    m.id,
    (SELECT id FROM roles WHERE name = 'member'),
    'global',
    NULL  -- System assignment, no assigned_by
FROM members m
WHERE NOT EXISTS (
    SELECT 1 FROM member_roles mr
    WHERE mr.member_id = m.id
      AND mr.role_id = (SELECT id FROM roles WHERE name = 'member')
)
ON CONFLICT DO NOTHING;

-- Verify all members have default role
DO $$
DECLARE
    v_member_count INTEGER;
    v_role_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_member_count FROM members;
    SELECT COUNT(DISTINCT member_id) INTO v_role_count
    FROM member_roles
    WHERE role_id = (SELECT id FROM roles WHERE name = 'member');

    IF v_member_count != v_role_count THEN
        RAISE EXCEPTION 'Member role assignment incomplete: % members, % role assignments',
            v_member_count, v_role_count;
    END IF;

    RAISE NOTICE 'Default member role assigned to % members', v_role_count;
END $$;

-- Log migration event
INSERT INTO audit_logs (action, resource_type, metadata)
VALUES (
    'migration.completed',
    'system',
    jsonb_build_object(
        'phase', '3',
        'description', 'Default member role assignment',
        'affected_members', (SELECT COUNT(*) FROM member_roles WHERE role_id = (SELECT id FROM roles WHERE name = 'member'))
    )
);
```

### Step 3.2: Identify Chapter Admins

**Option A: Automated Identification (Based on Chapter Leadership Data)**

```sql
-- ============================================================================
-- RBAC MIGRATION - PHASE 3B: AUTO-ASSIGN CHAPTER ADMIN ROLES
-- ============================================================================

-- Assign chapter_admin role to chapter presidents (if stored in chapters.president field)
INSERT INTO member_roles (member_id, role_id, scope_type, scope_chapter_id, assigned_by)
SELECT
    m.id,
    (SELECT id FROM roles WHERE name = 'chapter_admin'),
    'chapter',
    c.id,
    NULL  -- System assignment
FROM chapters c
INNER JOIN members m ON m.email = c.contact_email  -- Match by email
WHERE c.contact_email IS NOT NULL
ON CONFLICT DO NOTHING;

-- Alternative: Match by leadership array (if available)
INSERT INTO member_roles (member_id, role_id, scope_type, scope_chapter_id, assigned_by)
SELECT
    m.id,
    (SELECT id FROM roles WHERE name = 'chapter_admin'),
    'chapter',
    c.id,
    NULL
FROM chapters c
CROSS JOIN LATERAL jsonb_array_elements(c.leadership::jsonb) AS leader
INNER JOIN members m ON m.email = (leader->>'email')
WHERE leader->>'role' ILIKE '%president%'
ON CONFLICT DO NOTHING;
```

**Option B: Manual CSV Import**

```sql
-- Create temporary staging table
CREATE TEMP TABLE chapter_admin_staging (
    member_email VARCHAR(255),
    chapter_name VARCHAR(255)
);

-- Import CSV (via Supabase Studio or COPY command)
-- CSV format: member_email,chapter_name
-- john.doe@example.com,Los Angeles Chapter

-- Assign roles from staging table
INSERT INTO member_roles (member_id, role_id, scope_type, scope_chapter_id, assigned_by)
SELECT
    m.id,
    (SELECT id FROM roles WHERE name = 'chapter_admin'),
    'chapter',
    c.id,
    NULL
FROM chapter_admin_staging s
INNER JOIN members m ON LOWER(m.email) = LOWER(s.member_email)
INNER JOIN chapters c ON LOWER(c.name) = LOWER(s.chapter_name)
ON CONFLICT DO NOTHING;

-- Verify chapter admin assignments
SELECT
    c.name as chapter,
    c.state,
    m.first_name || ' ' || m.last_name as admin_name,
    m.email
FROM member_roles mr
INNER JOIN members m ON mr.member_id = m.id
INNER JOIN chapters c ON mr.scope_chapter_id = c.id
WHERE mr.role_id = (SELECT id FROM roles WHERE name = 'chapter_admin')
ORDER BY c.state, c.name;
```

### Step 3.3: Assign State Admin Roles

**Manual assignment via SQL (National Admin performs this)**

```sql
-- Example: Assign state admin for California
INSERT INTO member_roles (member_id, role_id, scope_type, scope_state, assigned_by)
VALUES (
    (SELECT id FROM members WHERE email = 'state.coordinator@california.nabip.org'),
    (SELECT id FROM roles WHERE name = 'state_admin'),
    'state',
    'CA',
    (SELECT id FROM members WHERE email = 'national.admin@nabip.org')  -- National admin who assigns
);

-- Verify state admin assignments
SELECT
    m.first_name || ' ' || m.last_name as admin_name,
    m.email,
    mr.scope_state as state
FROM member_roles mr
INNER JOIN members m ON mr.member_id = m.id
WHERE mr.role_id = (SELECT id FROM roles WHERE name = 'state_admin')
ORDER BY mr.scope_state;
```

### Step 3.4: Assign National Admin Roles

```sql
-- Assign national admin roles (founder, executive director, CTO)
INSERT INTO member_roles (member_id, role_id, scope_type, assigned_by)
VALUES
    (
        (SELECT id FROM members WHERE email = 'executive.director@nabip.org'),
        (SELECT id FROM roles WHERE name = 'national_admin'),
        'global',
        NULL  -- Founder self-assignment
    ),
    (
        (SELECT id FROM members WHERE email = 'cto@nabip.org'),
        (SELECT id FROM roles WHERE name = 'national_admin'),
        'global',
        (SELECT id FROM members WHERE email = 'executive.director@nabip.org')
    )
ON CONFLICT DO NOTHING;
```

---

## Phase 4: Enable Row-Level Security (Day 5-7)

**CRITICAL: This is the most sensitive phase. Schedule during maintenance window.**

### Step 4.1: Create Helper Functions

```bash
npx supabase migration new rbac_helper_functions
```

See complete helper functions in `RBAC_RLS_POLICIES.md` (auth.current_member_id, auth.has_permission, etc.)

### Step 4.2: Enable RLS on Core Tables

```bash
npx supabase migration new rbac_enable_rls
```

**File:** `supabase/migrations/YYYYMMDDHHMMSS_rbac_enable_rls.sql`

```sql
-- ============================================================================
-- RBAC MIGRATION - PHASE 4: ENABLE ROW-LEVEL SECURITY
-- WARNING: This will restrict data access immediately
-- ============================================================================

-- Enable RLS on members table
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Create policies (see RBAC_RLS_POLICIES.md for complete policy definitions)
-- Member SELECT policies
CREATE POLICY "members_select_own" ON members FOR SELECT
USING (id = auth.current_member_id());

CREATE POLICY "members_select_chapter" ON members FOR SELECT
USING (
    chapter_id = ANY(auth.get_member_chapter_ids())
    AND auth.get_member_role_level() >= 2
);

-- ... (continue with remaining policies)

-- Enable RLS on other core tables
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Log RLS enablement
INSERT INTO audit_logs (action, resource_type, metadata)
VALUES (
    'migration.completed',
    'system',
    '{"phase": "4", "description": "RLS enabled on core tables"}'::jsonb
);
```

### Step 4.3: Validate RLS Policies

```sql
-- Test as different user roles
BEGIN;
    SET LOCAL auth.uid = (SELECT id FROM members WHERE email = 'test.member@example.com');
    SELECT COUNT(*) as visible_members FROM members;
    -- Should only see 1 (own profile)
ROLLBACK;

BEGIN;
    SET LOCAL auth.uid = (SELECT id FROM members WHERE email = 'chapter.admin@example.com');
    SELECT COUNT(*) as visible_members FROM members;
    -- Should see all members in their chapter
ROLLBACK;
```

---

## Phase 5: Application Code Deployment (Day 7-10)

### Step 5.1: Deploy Permission Utilities

Deploy TypeScript RBAC utilities (see next section for complete code):

- `src/lib/rbac/types.ts`
- `src/lib/rbac/permissions.ts`
- `src/lib/rbac/hooks.ts`

### Step 5.2: Integrate Permission Checks

**Example: Conditional rendering in React components**

```typescript
// Before migration
<button onClick={handleDeleteMember}>Delete Member</button>

// After migration
{hasPermission('member', 'delete', 'chapter', member.chapterId) && (
  <button onClick={handleDeleteMember}>Delete Member</button>
)}
```

### Step 5.3: Deploy Admin Interface

Deploy role management UI:
- `src/components/features/RoleManagementView.tsx`
- `src/components/features/PermissionMatrixView.tsx`

---

## Phase 6: Testing & Validation (Day 10-14)

### Step 6.1: Automated Tests

```typescript
// Test suite: src/__tests__/rbac.test.ts
describe('RBAC System', () => {
  test('Member can view own profile', async () => {
    const member = await loginAsMember()
    const profile = await fetchMemberProfile(member.id)
    expect(profile).toBeDefined()
  })

  test('Member cannot view other profiles', async () => {
    const member = await loginAsMember()
    const otherMemberId = 'other-member-uuid'
    await expect(fetchMemberProfile(otherMemberId)).rejects.toThrow()
  })

  test('Chapter admin can view chapter members', async () => {
    const chapterAdmin = await loginAsChapterAdmin()
    const chapterMembers = await fetchChapterMembers(chapterAdmin.chapterId)
    expect(chapterMembers.length).toBeGreaterThan(0)
  })
})
```

### Step 6.2: Manual Testing Checklist

**Member Role:**
- [ ] Can view own profile
- [ ] Can edit own profile
- [ ] Can view public events
- [ ] Can register for events
- [ ] Cannot view other member profiles
- [ ] Cannot access admin features

**Chapter Admin Role:**
- [ ] Can view all chapter members
- [ ] Can edit chapter member profiles
- [ ] Can create chapter events
- [ ] Can send chapter email campaigns
- [ ] Cannot view members from other chapters
- [ ] Cannot access state/national features

**State Admin Role:**
- [ ] Can view all members in state
- [ ] Can edit members across all state chapters
- [ ] Can view state-level reports
- [ ] Can assign chapter admin roles
- [ ] Cannot access members from other states

**National Admin Role:**
- [ ] Can view all members nationwide
- [ ] Can access all system features
- [ ] Can assign any role
- [ ] Can view complete audit logs

### Step 6.3: Performance Testing

```sql
-- Benchmark permission check query
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM members WHERE chapter_id = 'chapter-uuid'
  AND auth.get_member_role_level() >= 2;

-- Target: < 50ms execution time
```

---

## Rollback Plan

### Scenario 1: Pre-RLS Enablement Rollback

If issues discovered before Phase 4 (RLS enablement):

```sql
-- Drop RBAC tables (safe - no RLS enforcement yet)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS member_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Revert to pre-migration state
```

### Scenario 2: Post-RLS Rollback

If critical issues after RLS enablement:

```sql
-- EMERGENCY: Disable RLS on all tables
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Log rollback event
INSERT INTO audit_logs (action, resource_type, metadata)
VALUES (
    'migration.rolled_back',
    'system',
    '{"phase": "4", "reason": "Critical issue - RLS disabled"}'::jsonb
);

-- Notify stakeholders immediately
```

### Scenario 3: Partial Feature Rollback

If specific permission checks cause issues:

```typescript
// Temporarily bypass permission check
const RBAC_MIGRATION_BYPASS = process.env.RBAC_BYPASS_ENABLED === 'true'

function hasPermission(...args) {
  if (RBAC_MIGRATION_BYPASS) {
    console.warn('RBAC bypass enabled - permission check skipped')
    return true
  }
  // Normal permission check
}
```

---

## Post-Migration Tasks

### Week 1 Post-Migration
- [ ] Monitor error rates and user support tickets
- [ ] Review audit logs for permission denial patterns
- [ ] Validate all role assignments with business stakeholders
- [ ] Collect user feedback on new permission constraints

### Week 2-4 Post-Migration
- [ ] Optimize slow queries identified in monitoring
- [ ] Create custom roles as requested by departments
- [ ] Train administrators on role management interface
- [ ] Document common permission scenarios

### Ongoing Maintenance
- [ ] Quarterly audit log review (compliance)
- [ ] Annual role assignment validation
- [ ] Performance tuning as data scales
- [ ] Security patches and updates

---

## Troubleshooting Common Issues

### Issue: "Permission denied for table members"
**Cause:** RLS enabled but policies missing or incorrect
**Solution:**
```sql
-- Check if policies exist
SELECT * FROM pg_policies WHERE tablename = 'members';

-- Verify user role assignments
SELECT * FROM member_roles WHERE member_id = auth.current_member_id();
```

### Issue: Slow permission checks
**Cause:** Missing indexes or inefficient policy queries
**Solution:**
```sql
-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_members_chapter ON members(chapter_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM members WHERE chapter_id = 'uuid';
```

### Issue: Users missing expected access
**Cause:** Role assignment incomplete or expired
**Solution:**
```sql
-- Check user's active roles
SELECT r.name, mr.scope_type, mr.expires_at
FROM member_roles mr
INNER JOIN roles r ON mr.role_id = r.id
WHERE mr.member_id = 'user-uuid'
  AND mr.is_active = true;
```

---

## Success Metrics

### Technical Metrics
- RLS policy query performance < 50ms average
- Zero data access violations post-migration
- 100% uptime during migration (excluding planned maintenance)
- All automated tests passing

### Business Metrics
- All chapter admins successfully assigned
- All state admins successfully assigned
- < 5% support ticket increase post-migration
- 100% critical workflows functional

---

## Appendix: Migration Timeline

| Phase | Duration | Risk | Dependencies |
|-------|----------|------|--------------|
| Phase 1: Schema Creation | 1-2 days | Low | Database backup |
| Phase 2: Seed Data | 1 day | Low | Phase 1 complete |
| Phase 3: Data Migration | 2-3 days | Medium | Business stakeholder input |
| Phase 4: Enable RLS | 1-2 days | High | Maintenance window |
| Phase 5: App Deployment | 3 days | Medium | QA environment testing |
| Phase 6: Testing | 4 days | Low | All phases complete |
| **Total** | **12-15 days** | **Medium** | - |

---

## Related Documentation
- Database Schema: `RBAC_DATABASE_SCHEMA.md`
- Permission Matrix: `RBAC_PERMISSION_MATRIX.md`
- RLS Policies: `RBAC_RLS_POLICIES.md`
- Admin Guide: `RBAC_ADMIN_GUIDE.md`
- TypeScript Utilities: (Next section)
