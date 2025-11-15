# Row-Level Security (RLS) Policies
## NABIP Association Management System

**Version:** 1.0
**Last Updated:** 2025-11-15
**Database:** PostgreSQL 14+ (Supabase)

---

## Overview

Row-Level Security (RLS) policies enforce database-level access control, ensuring users only access data they're authorized to see. RLS acts as a critical security layer that complements application-level permission checks.

### Key Principles
- **Defense in Depth:** RLS provides security even if application logic is bypassed
- **Performance:** Policies use indexed columns for efficient filtering
- **Maintainability:** Policies mirror application permission logic
- **Auditability:** All data access is logged and traceable

---

## Policy Architecture

### Policy Evaluation Order
1. **Enable RLS on table** (blocks all access by default)
2. **USING clause** - Determines which rows are visible
3. **WITH CHECK clause** - Validates inserts/updates
4. **Multiple policies** - Combined with OR logic (any matching policy grants access)

### Helper Functions

Before creating policies, we establish reusable functions:

```sql
-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current member's UUID from Supabase auth
CREATE OR REPLACE FUNCTION auth.current_member_id()
RETURNS UUID AS $$
BEGIN
    RETURN (auth.uid())::uuid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current member has permission
CREATE OR REPLACE FUNCTION auth.has_permission(
    p_resource VARCHAR,
    p_action VARCHAR,
    p_scope VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_member_id UUID;
    v_has_perm BOOLEAN;
BEGIN
    v_member_id := auth.current_member_id();

    SELECT EXISTS (
        SELECT 1
        FROM member_roles mr
        INNER JOIN role_permissions rp ON mr.role_id = rp.role_id
        INNER JOIN permissions p ON rp.permission_id = p.id
        WHERE mr.member_id = v_member_id
          AND mr.is_active = true
          AND (mr.expires_at IS NULL OR mr.expires_at > NOW())
          AND p.resource = p_resource
          AND p.action = p_action
          AND (p_scope IS NULL OR p.scope = p_scope OR p.scope IN ('all', 'public'))
    ) INTO v_has_perm;

    RETURN v_has_perm;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get member's highest role level
CREATE OR REPLACE FUNCTION auth.get_member_role_level()
RETURNS INTEGER AS $$
DECLARE
    v_member_id UUID;
    v_level INTEGER;
BEGIN
    v_member_id := auth.current_member_id();

    SELECT COALESCE(MAX(r.level), 0)
    INTO v_level
    FROM member_roles mr
    INNER JOIN roles r ON mr.role_id = r.id
    WHERE mr.member_id = v_member_id
      AND mr.is_active = true
      AND (mr.expires_at IS NULL OR mr.expires_at > NOW());

    RETURN v_level;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get member's chapter IDs (for chapter-scoped permissions)
CREATE OR REPLACE FUNCTION auth.get_member_chapter_ids()
RETURNS UUID[] AS $$
DECLARE
    v_member_id UUID;
    v_chapter_ids UUID[];
BEGIN
    v_member_id := auth.current_member_id();

    SELECT ARRAY_AGG(DISTINCT scope_chapter_id)
    INTO v_chapter_ids
    FROM member_roles
    WHERE member_id = v_member_id
      AND scope_type = 'chapter'
      AND scope_chapter_id IS NOT NULL
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW());

    RETURN v_chapter_ids;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get member's state codes (for state-scoped permissions)
CREATE OR REPLACE FUNCTION auth.get_member_states()
RETURNS VARCHAR[] AS $$
DECLARE
    v_member_id UUID;
    v_states VARCHAR[];
BEGIN
    v_member_id := auth.current_member_id();

    SELECT ARRAY_AGG(DISTINCT scope_state)
    INTO v_states
    FROM member_roles
    WHERE member_id = v_member_id
      AND scope_type = 'state'
      AND scope_state IS NOT NULL
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW());

    RETURN v_states;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if member has global scope role
CREATE OR REPLACE FUNCTION auth.has_global_scope()
RETURNS BOOLEAN AS $$
DECLARE
    v_member_id UUID;
BEGIN
    v_member_id := auth.current_member_id();

    RETURN EXISTS (
        SELECT 1
        FROM member_roles mr
        INNER JOIN roles r ON mr.role_id = r.id
        WHERE mr.member_id = v_member_id
          AND mr.scope_type = 'global'
          AND r.level >= 4  -- National admin
          AND mr.is_active = true
          AND (mr.expires_at IS NULL OR mr.expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

---

## Core Table Policies

### 1. `members` Table

**Business Logic:**
- Members can view/edit their own profile
- Chapter admins can view/edit members in their chapter
- State admins can view/edit members in their state
- National admins can view/edit all members

```sql
-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Policy: Members can view their own profile
CREATE POLICY "members_select_own"
ON members
FOR SELECT
USING (id = auth.current_member_id());

-- Policy: Chapter admins can view members in their chapters
CREATE POLICY "members_select_chapter"
ON members
FOR SELECT
USING (
    chapter_id = ANY(auth.get_member_chapter_ids())
    AND auth.get_member_role_level() >= 2
);

-- Policy: State admins can view members in their state
CREATE POLICY "members_select_state"
ON members
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM chapters c
        WHERE c.id = members.chapter_id
          AND c.state = ANY(auth.get_member_states())
    )
    AND auth.get_member_role_level() >= 3
);

-- Policy: National admins can view all members
CREATE POLICY "members_select_national"
ON members
FOR SELECT
USING (auth.has_global_scope());

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Policy: Members can update their own profile
CREATE POLICY "members_update_own"
ON members
FOR UPDATE
USING (id = auth.current_member_id())
WITH CHECK (id = auth.current_member_id());

-- Policy: Chapter admins can update members in their chapters
CREATE POLICY "members_update_chapter"
ON members
FOR UPDATE
USING (
    chapter_id = ANY(auth.get_member_chapter_ids())
    AND auth.get_member_role_level() >= 2
)
WITH CHECK (
    chapter_id = ANY(auth.get_member_chapter_ids())
    AND auth.get_member_role_level() >= 2
);

-- Policy: State admins can update members in their state
CREATE POLICY "members_update_state"
ON members
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM chapters c
        WHERE c.id = members.chapter_id
          AND c.state = ANY(auth.get_member_states())
    )
    AND auth.get_member_role_level() >= 3
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM chapters c
        WHERE c.id = members.chapter_id
          AND c.state = ANY(auth.get_member_states())
    )
    AND auth.get_member_role_level() >= 3
);

-- Policy: National admins can update any member
CREATE POLICY "members_update_national"
ON members
FOR UPDATE
USING (auth.has_global_scope())
WITH CHECK (auth.has_global_scope());

-- ============================================================================
-- INSERT Policies
-- ============================================================================

-- Policy: Chapter admins can create members in their chapters
CREATE POLICY "members_insert_chapter"
ON members
FOR INSERT
WITH CHECK (
    chapter_id = ANY(auth.get_member_chapter_ids())
    AND auth.get_member_role_level() >= 2
);

-- Policy: State admins can create members in their state
CREATE POLICY "members_insert_state"
ON members
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM chapters c
        WHERE c.id = members.chapter_id
          AND c.state = ANY(auth.get_member_states())
    )
    AND auth.get_member_role_level() >= 3
);

-- Policy: National admins can create any member
CREATE POLICY "members_insert_national"
ON members
FOR INSERT
WITH CHECK (auth.has_global_scope());

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Policy: Only national admins can delete members (soft delete)
CREATE POLICY "members_delete_national"
ON members
FOR DELETE
USING (auth.has_global_scope());
```

---

### 2. `chapters` Table

**Business Logic:**
- All authenticated users can view chapters
- Chapter admins can edit their own chapter
- State admins can edit chapters in their state
- National admins can edit/delete all chapters

```sql
-- Enable RLS
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Policy: All authenticated users can view chapters
CREATE POLICY "chapters_select_authenticated"
ON chapters
FOR SELECT
USING (auth.current_member_id() IS NOT NULL);

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Policy: Chapter admins can update their own chapter
CREATE POLICY "chapters_update_own"
ON chapters
FOR UPDATE
USING (
    id = ANY(auth.get_member_chapter_ids())
    AND auth.get_member_role_level() >= 2
)
WITH CHECK (
    id = ANY(auth.get_member_chapter_ids())
    AND auth.get_member_role_level() >= 2
);

-- Policy: State admins can update chapters in their state
CREATE POLICY "chapters_update_state"
ON chapters
FOR UPDATE
USING (
    state = ANY(auth.get_member_states())
    AND auth.get_member_role_level() >= 3
)
WITH CHECK (
    state = ANY(auth.get_member_states())
    AND auth.get_member_role_level() >= 3
);

-- Policy: National admins can update any chapter
CREATE POLICY "chapters_update_national"
ON chapters
FOR UPDATE
USING (auth.has_global_scope())
WITH CHECK (auth.has_global_scope());

-- ============================================================================
-- INSERT Policies
-- ============================================================================

-- Policy: State admins can create chapters in their state
CREATE POLICY "chapters_insert_state"
ON chapters
FOR INSERT
WITH CHECK (
    state = ANY(auth.get_member_states())
    AND auth.get_member_role_level() >= 3
);

-- Policy: National admins can create any chapter
CREATE POLICY "chapters_insert_national"
ON chapters
FOR INSERT
WITH CHECK (auth.has_global_scope());

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Policy: Only national admins can delete chapters
CREATE POLICY "chapters_delete_national"
ON chapters
FOR DELETE
USING (auth.has_global_scope());
```

---

### 3. `events` Table

**Business Logic:**
- All users can view published events
- Chapter admins can manage events for their chapter
- State admins can view all state events
- National admins can manage all events

```sql
-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Policy: All users can view published events
CREATE POLICY "events_select_published"
ON events
FOR SELECT
USING (
    status = 'published'
    AND auth.current_member_id() IS NOT NULL
);

-- Policy: Chapter admins can view all events in their chapter (including drafts)
CREATE POLICY "events_select_chapter"
ON events
FOR SELECT
USING (
    chapter_id = ANY(auth.get_member_chapter_ids())
    AND auth.get_member_role_level() >= 2
);

-- Policy: State admins can view events in their state
CREATE POLICY "events_select_state"
ON events
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM chapters c
        WHERE c.id = events.chapter_id
          AND c.state = ANY(auth.get_member_states())
    )
    AND auth.get_member_role_level() >= 3
);

-- Policy: National admins can view all events
CREATE POLICY "events_select_national"
ON events
FOR SELECT
USING (auth.has_global_scope());

-- ============================================================================
-- INSERT Policies
-- ============================================================================

-- Policy: Chapter admins can create events in their chapter
CREATE POLICY "events_insert_chapter"
ON events
FOR INSERT
WITH CHECK (
    chapter_id = ANY(auth.get_member_chapter_ids())
    AND auth.get_member_role_level() >= 2
);

-- Policy: State admins can create events in their state
CREATE POLICY "events_insert_state"
ON events
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM chapters c
        WHERE c.id = events.chapter_id
          AND c.state = ANY(auth.get_member_states())
    )
    AND auth.get_member_role_level() >= 3
);

-- Policy: National admins can create any event
CREATE POLICY "events_insert_national"
ON events
FOR INSERT
WITH CHECK (auth.has_global_scope());

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Policy: Chapter admins can update events in their chapter
CREATE POLICY "events_update_chapter"
ON events
FOR UPDATE
USING (
    chapter_id = ANY(auth.get_member_chapter_ids())
    AND auth.get_member_role_level() >= 2
)
WITH CHECK (
    chapter_id = ANY(auth.get_member_chapter_ids())
    AND auth.get_member_role_level() >= 2
);

-- Policy: State admins can update events in their state
CREATE POLICY "events_update_state"
ON events
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM chapters c
        WHERE c.id = events.chapter_id
          AND c.state = ANY(auth.get_member_states())
    )
    AND auth.get_member_role_level() >= 3
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM chapters c
        WHERE c.id = events.chapter_id
          AND c.state = ANY(auth.get_member_states())
    )
    AND auth.get_member_role_level() >= 3
);

-- Policy: National admins can update any event
CREATE POLICY "events_update_national"
ON events
FOR UPDATE
USING (auth.has_global_scope())
WITH CHECK (auth.has_global_scope());

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Policy: Chapter admins can delete events in their chapter
CREATE POLICY "events_delete_chapter"
ON events
FOR DELETE
USING (
    chapter_id = ANY(auth.get_member_chapter_ids())
    AND auth.get_member_role_level() >= 2
);

-- Policy: National admins can delete any event
CREATE POLICY "events_delete_national"
ON events
FOR DELETE
USING (auth.has_global_scope());
```

---

### 4. `registrations` Table

**Business Logic:**
- Members can view their own registrations
- Chapter admins can view registrations for their chapter's events
- State admins can view registrations for state events
- National admins can view all registrations

```sql
-- Enable RLS
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Policy: Members can view their own registrations
CREATE POLICY "registrations_select_own"
ON registrations
FOR SELECT
USING (member_id = auth.current_member_id());

-- Policy: Chapter admins can view registrations for their chapter's events
CREATE POLICY "registrations_select_chapter"
ON registrations
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM events e
        WHERE e.id = registrations.event_id
          AND e.chapter_id = ANY(auth.get_member_chapter_ids())
    )
    AND auth.get_member_role_level() >= 2
);

-- Policy: State admins can view registrations for state events
CREATE POLICY "registrations_select_state"
ON registrations
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM events e
        INNER JOIN chapters c ON e.chapter_id = c.id
        WHERE e.id = registrations.event_id
          AND c.state = ANY(auth.get_member_states())
    )
    AND auth.get_member_role_level() >= 3
);

-- Policy: National admins can view all registrations
CREATE POLICY "registrations_select_national"
ON registrations
FOR SELECT
USING (auth.has_global_scope());

-- ============================================================================
-- INSERT Policies
-- ============================================================================

-- Policy: Members can register for events
CREATE POLICY "registrations_insert_own"
ON registrations
FOR INSERT
WITH CHECK (member_id = auth.current_member_id());

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Policy: Members can update their own registrations
CREATE POLICY "registrations_update_own"
ON registrations
FOR UPDATE
USING (member_id = auth.current_member_id())
WITH CHECK (member_id = auth.current_member_id());

-- Policy: Chapter admins can update registrations for their events
CREATE POLICY "registrations_update_chapter"
ON registrations
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM events e
        WHERE e.id = registrations.event_id
          AND e.chapter_id = ANY(auth.get_member_chapter_ids())
    )
    AND auth.get_member_role_level() >= 2
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM events e
        WHERE e.id = registrations.event_id
          AND e.chapter_id = ANY(auth.get_member_chapter_ids())
    )
    AND auth.get_member_role_level() >= 2
);

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Policy: Members can cancel their own registrations
CREATE POLICY "registrations_delete_own"
ON registrations
FOR DELETE
USING (member_id = auth.current_member_id());

-- Policy: National admins can delete any registration
CREATE POLICY "registrations_delete_national"
ON registrations
FOR DELETE
USING (auth.has_global_scope());
```

---

### 5. `campaigns` Table

**Business Logic:**
- Chapter admins can manage campaigns for their chapter
- State admins can manage state-level campaigns
- National admins can manage all campaigns

```sql
-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Policy: Chapter admins can view chapter campaigns
CREATE POLICY "campaigns_select_chapter"
ON campaigns
FOR SELECT
USING (
    metadata->>'chapter_id' IN (
        SELECT id::text FROM chapters WHERE id = ANY(auth.get_member_chapter_ids())
    )
    AND auth.get_member_role_level() >= 2
);

-- Policy: State admins can view state campaigns
CREATE POLICY "campaigns_select_state"
ON campaigns
FOR SELECT
USING (
    metadata->>'scope' = 'state'
    AND metadata->>'state' IN (
        SELECT unnest(auth.get_member_states())
    )
    AND auth.get_member_role_level() >= 3
);

-- Policy: National admins can view all campaigns
CREATE POLICY "campaigns_select_national"
ON campaigns
FOR SELECT
USING (auth.has_global_scope());

-- ============================================================================
-- INSERT/UPDATE/DELETE Policies
-- ============================================================================

-- Similar pattern for INSERT, UPDATE, DELETE operations
-- Scope validation based on metadata->>'scope' and metadata->>'chapter_id' or metadata->>'state'
```

---

### 6. `transactions` Table

**Business Logic:**
- Members can view their own transactions
- Chapter admins can view chapter transactions
- State admins can view state transactions
- National admins can view/edit all transactions

```sql
-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Policy: Members can view their own transactions
CREATE POLICY "transactions_select_own"
ON transactions
FOR SELECT
USING (member_id = auth.current_member_id());

-- Policy: Chapter admins can view transactions for their chapter members
CREATE POLICY "transactions_select_chapter"
ON transactions
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM members m
        WHERE m.id = transactions.member_id
          AND m.chapter_id = ANY(auth.get_member_chapter_ids())
    )
    AND auth.get_member_role_level() >= 2
);

-- Policy: State admins can view transactions for their state
CREATE POLICY "transactions_select_state"
ON transactions
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM members m
        INNER JOIN chapters c ON m.chapter_id = c.id
        WHERE m.id = transactions.member_id
          AND c.state = ANY(auth.get_member_states())
    )
    AND auth.get_member_role_level() >= 3
);

-- Policy: National admins can view all transactions
CREATE POLICY "transactions_select_national"
ON transactions
FOR SELECT
USING (auth.has_global_scope());

-- ============================================================================
-- UPDATE/DELETE Policies
-- ============================================================================

-- Only national admins can modify transactions
CREATE POLICY "transactions_update_national"
ON transactions
FOR UPDATE
USING (auth.has_global_scope())
WITH CHECK (auth.has_global_scope());

CREATE POLICY "transactions_delete_national"
ON transactions
FOR DELETE
USING (auth.has_global_scope());
```

---

## RBAC-Specific Table Policies

### 7. `roles` Table

**Business Logic:**
- All authenticated users can view roles
- Only national admins can modify roles

```sql
-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view roles
CREATE POLICY "roles_select_authenticated"
ON roles
FOR SELECT
USING (auth.current_member_id() IS NOT NULL);

-- Policy: Only national admins can modify roles
CREATE POLICY "roles_modify_national"
ON roles
FOR ALL
USING (auth.has_global_scope())
WITH CHECK (auth.has_global_scope());
```

---

### 8. `permissions` Table

**Business Logic:**
- All authenticated users can view permissions
- Only national admins can modify permissions

```sql
-- Enable RLS
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view permissions
CREATE POLICY "permissions_select_authenticated"
ON permissions
FOR SELECT
USING (auth.current_member_id() IS NOT NULL);

-- Policy: Only national admins can modify permissions
CREATE POLICY "permissions_modify_national"
ON permissions
FOR ALL
USING (auth.has_global_scope())
WITH CHECK (auth.has_global_scope());
```

---

### 9. `member_roles` Table

**Business Logic:**
- Members can view their own role assignments
- State admins can view/assign chapter admin roles in their state
- National admins can view/assign all roles

```sql
-- Enable RLS
ALTER TABLE member_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Policy: Members can view their own roles
CREATE POLICY "member_roles_select_own"
ON member_roles
FOR SELECT
USING (member_id = auth.current_member_id());

-- Policy: State admins can view role assignments in their scope
CREATE POLICY "member_roles_select_state"
ON member_roles
FOR SELECT
USING (
    (
        scope_type = 'chapter'
        AND EXISTS (
            SELECT 1
            FROM chapters c
            WHERE c.id = member_roles.scope_chapter_id
              AND c.state = ANY(auth.get_member_states())
        )
    ) OR (
        scope_type = 'state'
        AND scope_state = ANY(auth.get_member_states())
    )
    AND auth.get_member_role_level() >= 3
);

-- Policy: National admins can view all role assignments
CREATE POLICY "member_roles_select_national"
ON member_roles
FOR SELECT
USING (auth.has_global_scope());

-- ============================================================================
-- INSERT Policies
-- ============================================================================

-- Policy: State admins can assign chapter admin roles in their state
CREATE POLICY "member_roles_insert_state"
ON member_roles
FOR INSERT
WITH CHECK (
    (
        -- Assigning chapter admin role
        role_id IN (SELECT id FROM roles WHERE name = 'chapter_admin')
        AND scope_type = 'chapter'
        AND EXISTS (
            SELECT 1
            FROM chapters c
            WHERE c.id = member_roles.scope_chapter_id
              AND c.state = ANY(auth.get_member_states())
        )
    )
    AND auth.get_member_role_level() >= 3
);

-- Policy: National admins can assign any role
CREATE POLICY "member_roles_insert_national"
ON member_roles
FOR INSERT
WITH CHECK (auth.has_global_scope());

-- ============================================================================
-- UPDATE/DELETE Policies
-- ============================================================================

-- Policy: State admins can revoke chapter admin roles in their state
CREATE POLICY "member_roles_update_state"
ON member_roles
FOR UPDATE
USING (
    role_id IN (SELECT id FROM roles WHERE name = 'chapter_admin')
    AND scope_type = 'chapter'
    AND EXISTS (
        SELECT 1
        FROM chapters c
        WHERE c.id = member_roles.scope_chapter_id
          AND c.state = ANY(auth.get_member_states())
    )
    AND auth.get_member_role_level() >= 3
)
WITH CHECK (
    role_id IN (SELECT id FROM roles WHERE name = 'chapter_admin')
    AND scope_type = 'chapter'
    AND EXISTS (
        SELECT 1
        FROM chapters c
        WHERE c.id = member_roles.scope_chapter_id
          AND c.state = ANY(auth.get_member_states())
    )
    AND auth.get_member_role_level() >= 3
);

-- Policy: National admins can modify any role assignment
CREATE POLICY "member_roles_modify_national"
ON member_roles
FOR ALL
USING (auth.has_global_scope())
WITH CHECK (auth.has_global_scope());
```

---

### 10. `audit_logs` Table

**Business Logic:**
- Members can view their own audit logs
- Chapter admins can view audit logs for their chapter
- State admins can view audit logs for their state
- National admins can view all audit logs

```sql
-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Policy: Members can view their own audit logs
CREATE POLICY "audit_logs_select_own"
ON audit_logs
FOR SELECT
USING (actor_id = auth.current_member_id());

-- Policy: Chapter admins can view audit logs for their chapter
CREATE POLICY "audit_logs_select_chapter"
ON audit_logs
FOR SELECT
USING (
    (
        resource_type = 'member'
        AND resource_id IN (
            SELECT id::text FROM members WHERE chapter_id = ANY(auth.get_member_chapter_ids())
        )
    ) OR (
        resource_type = 'chapter'
        AND resource_id IN (
            SELECT id::text FROM unnest(auth.get_member_chapter_ids())
        )
    ) OR (
        resource_type = 'event'
        AND resource_id IN (
            SELECT id::text FROM events WHERE chapter_id = ANY(auth.get_member_chapter_ids())
        )
    )
    AND auth.get_member_role_level() >= 2
);

-- Policy: State admins can view audit logs for their state
CREATE POLICY "audit_logs_select_state"
ON audit_logs
FOR SELECT
USING (
    (
        resource_type IN ('member', 'chapter', 'event')
        AND metadata->>'state' IN (SELECT unnest(auth.get_member_states()))
    )
    AND auth.get_member_role_level() >= 3
);

-- Policy: National admins can view all audit logs
CREATE POLICY "audit_logs_select_national"
ON audit_logs
FOR SELECT
USING (auth.has_global_scope());

-- ============================================================================
-- INSERT Policy
-- ============================================================================

-- Policy: System can insert audit logs (no manual inserts by users)
CREATE POLICY "audit_logs_insert_system"
ON audit_logs
FOR INSERT
WITH CHECK (true);  -- Audit logs are inserted by database triggers
```

---

## Performance Optimization

### Indexed Columns Used in Policies

```sql
-- Member lookups
CREATE INDEX idx_members_chapter_id ON members(chapter_id);

-- Chapter state lookups
CREATE INDEX idx_chapters_state ON chapters(state);

-- Event chapter lookups
CREATE INDEX idx_events_chapter_id ON events(chapter_id);

-- Registration member/event lookups
CREATE INDEX idx_registrations_member_id ON registrations(member_id);
CREATE INDEX idx_registrations_event_id ON registrations(event_id);

-- Transaction member lookups
CREATE INDEX idx_transactions_member_id ON transactions(member_id);

-- Audit log resource lookups
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
```

### Policy Performance Benchmarks

| Operation | Target Latency | Optimization Strategy |
|-----------|---------------|---------------------|
| Member SELECT (own) | < 5ms | Direct ID match, indexed |
| Member SELECT (chapter) | < 50ms | Indexed chapter_id lookup |
| Member SELECT (state) | < 100ms | State join, indexed |
| Event SELECT (published) | < 10ms | Indexed status filter |
| Audit SELECT (chapter) | < 200ms | Partitioned table, indexed resource |

---

## Testing RLS Policies

### Test as Different Users

```sql
-- Test as regular member
SET LOCAL auth.uid = 'member-uuid';
SELECT * FROM members;  -- Should only see own profile

-- Test as chapter admin
SET LOCAL auth.uid = 'chapter-admin-uuid';
SELECT * FROM members WHERE chapter_id = 'chapter-uuid';  -- Should see chapter members

-- Test as state admin
SET LOCAL auth.uid = 'state-admin-uuid';
SELECT * FROM chapters WHERE state = 'CA';  -- Should see all CA chapters

-- Test as national admin
SET LOCAL auth.uid = 'national-admin-uuid';
SELECT * FROM members;  -- Should see all members

-- Reset
RESET auth.uid;
```

### Automated Policy Tests

```sql
-- Test suite function
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE (
    test_name TEXT,
    result TEXT,
    details TEXT
) AS $$
BEGIN
    -- Test 1: Member can view own profile
    RETURN QUERY
    SELECT
        'member_view_own'::TEXT,
        CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END,
        'Member should see only their profile'::TEXT
    FROM (
        SELECT * FROM members WHERE id = auth.current_member_id()
    ) t;

    -- Test 2: Chapter admin can view chapter members
    -- ... (additional tests)
END;
$$ LANGUAGE plpgsql;
```

---

## Security Considerations

### SQL Injection Protection
All policies use parameterized functions (`auth.current_member_id()`, etc.) that prevent SQL injection.

### Bypass Prevention
- RLS is enforced at the database level (cannot be bypassed via API)
- `SECURITY DEFINER` functions run with elevated privileges but validate inputs
- Regular security audits using `pg_policies` system catalog

### Performance Impact
- Helper functions marked `STABLE` for query optimization
- Indexed columns used in WHERE clauses
- Policies use EXISTS subqueries (short-circuit evaluation)

---

## Troubleshooting

### Common Issues

**Issue:** User cannot see data they should have access to
```sql
-- Check user's active roles
SELECT * FROM member_roles WHERE member_id = 'user-uuid' AND is_active = true;

-- Check user's permissions
SELECT * FROM get_member_permissions('user-uuid');

-- Check policy evaluation
EXPLAIN ANALYZE SELECT * FROM members WHERE id = 'member-uuid';
```

**Issue:** RLS policy too slow
```sql
-- Check if indexes are being used
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM members WHERE chapter_id = 'chapter-uuid';

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_members_chapter ON members(chapter_id);
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-15 | Initial RLS policies for all core tables |

---

## Related Documentation
- Database Schema: `RBAC_DATABASE_SCHEMA.md`
- Permission Matrix: `RBAC_PERMISSION_MATRIX.md`
- Migration Guide: `RBAC_MIGRATION_GUIDE.md`
