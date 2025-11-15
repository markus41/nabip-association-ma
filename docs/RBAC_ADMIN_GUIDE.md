# RBAC Admin Guide
## NABIP Association Management System

**Version:** 1.0
**Last Updated:** 2025-11-15
**Audience:** National Admins, State Admins

---

## Overview

This guide provides comprehensive instructions for managing the NABIP AMS Role-Based Access Control (RBAC) system. It covers role assignments, permission management, security best practices, and troubleshooting.

### Key Responsibilities

**National Administrators:**
- Assign state and national admin roles
- Create custom roles for special use cases
- Modify system permissions
- Review system-wide audit logs
- Handle escalated permission requests

**State Administrators:**
- Assign chapter admin roles within their state
- Review state-level audit logs
- Monitor chapter admin activity
- Handle state-level permission requests

---

## Role Management

### Assigning Roles

#### Via Admin Interface

**Step 1: Access Role Management**
1. Log in as National or State Admin
2. Navigate to Settings → Role Management
3. Search for member by name or email

**Step 2: Assign Role**
1. Click "Assign Role" button
2. Select role type: Member, Chapter Admin, State Admin, National Admin
3. Define scope:
   - **Global:** Full access (National Admin only)
   - **State:** Select state code (CA, TX, NY, etc.)
   - **Chapter:** Select specific chapter
4. Set expiration date (optional for term-limited roles)
5. Click "Assign Role"

**Step 3: Verify Assignment**
- Role appears in member's "Active Roles" list
- Audit log entry created automatically
- Member receives email notification (if configured)

#### Via SQL (Advanced)

**Assign Chapter Admin Role:**
```sql
INSERT INTO member_roles (
    member_id,
    role_id,
    scope_type,
    scope_chapter_id,
    assigned_by
)
VALUES (
    '123e4567-e89b-12d3-a456-426614174000',  -- Member UUID
    (SELECT id FROM roles WHERE name = 'chapter_admin'),
    'chapter',
    'chapter-uuid-here',
    auth.current_member_id()  -- Your UUID as assigner
);
```

**Assign State Admin Role:**
```sql
INSERT INTO member_roles (
    member_id,
    role_id,
    scope_type,
    scope_state,
    assigned_by
)
VALUES (
    '223e4567-e89b-12d3-a456-426614174000',
    (SELECT id FROM roles WHERE name = 'state_admin'),
    'state',
    'CA',
    auth.current_member_id()
);
```

**Assign Temporary Role (Expires After 1 Year):**
```sql
INSERT INTO member_roles (
    member_id,
    role_id,
    scope_type,
    scope_chapter_id,
    expires_at,
    assigned_by
)
VALUES (
    '323e4567-e89b-12d3-a456-426614174000',
    (SELECT id FROM roles WHERE name = 'chapter_admin'),
    'chapter',
    'chapter-uuid-here',
    NOW() + INTERVAL '1 year',
    auth.current_member_id()
);
```

---

### Revoking Roles

#### Via Admin Interface

**Step 1: Find Member**
1. Navigate to Settings → Role Management
2. Search for member

**Step 2: Revoke Role**
1. In "Active Roles" section, click "Revoke" next to role
2. Confirm revocation
3. Optionally add revocation reason

**Step 3: Verify Revocation**
- Role moves to "Inactive Roles" list
- Audit log entry created
- Member access is immediately updated

#### Via SQL

**Soft Revoke (Recommended - Preserves History):**
```sql
UPDATE member_roles
SET is_active = false
WHERE member_id = '123e4567-e89b-12d3-a456-426614174000'
  AND role_id = (SELECT id FROM roles WHERE name = 'chapter_admin')
  AND scope_chapter_id = 'chapter-uuid';
```

**Hard Delete (Not Recommended - Loses Audit Trail):**
```sql
DELETE FROM member_roles
WHERE member_id = '123e4567-e89b-12d3-a456-426614174000'
  AND role_id = (SELECT id FROM roles WHERE name = 'chapter_admin');
```

---

### Bulk Role Management

#### Bulk Assignment via CSV

**Step 1: Prepare CSV File**
```csv
member_email,role_name,scope_type,scope_value
john.doe@example.com,chapter_admin,chapter,Los Angeles Chapter
jane.smith@example.com,chapter_admin,chapter,San Francisco Chapter
bob.johnson@example.com,state_admin,state,CA
```

**Step 2: Import via Admin Interface**
1. Navigate to Settings → Role Management → Bulk Import
2. Upload CSV file
3. Review preview of assignments
4. Confirm bulk assignment

**Step 3: Validate Results**
- Review summary report (successful, failed, skipped)
- Check audit logs for all assignments
- Notify affected members

#### Bulk Revocation

**Revoke All Expired Roles:**
```sql
UPDATE member_roles
SET is_active = false
WHERE expires_at IS NOT NULL
  AND expires_at <= NOW()
  AND is_active = true;
```

**Revoke All Roles for Inactive Members:**
```sql
UPDATE member_roles
SET is_active = false
WHERE member_id IN (
    SELECT id FROM members WHERE status = 'suspended'
)
AND is_active = true;
```

---

## Permission Management

### Viewing Permissions

#### View All Permissions for a Role

**Via Admin Interface:**
1. Navigate to Settings → Permission Matrix
2. Select role from dropdown
3. View permission grid (87 total permissions)

**Via SQL:**
```sql
SELECT
    p.name,
    p.resource,
    p.action,
    p.scope,
    p.description
FROM role_permissions rp
INNER JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'chapter_admin')
ORDER BY p.resource, p.action;
```

#### View Member's Effective Permissions

**Via Admin Interface:**
1. Navigate to Members → Member Detail
2. Click "View Permissions" tab
3. See inherited and direct permissions

**Via SQL:**
```sql
SELECT DISTINCT
    p.name,
    p.resource,
    p.action,
    p.scope,
    mr.scope_type,
    mr.scope_chapter_id,
    mr.scope_state
FROM member_roles mr
INNER JOIN role_permissions rp ON mr.role_id = rp.role_id
INNER JOIN permissions p ON rp.permission_id = p.id
WHERE mr.member_id = '123e4567-e89b-12d3-a456-426614174000'
  AND mr.is_active = true
  AND (mr.expires_at IS NULL OR mr.expires_at > NOW())
ORDER BY p.resource, p.action;
```

---

### Granting/Revoking Permissions

**WARNING:** Modifying system role permissions affects all users with that role. Only National Admins should perform these operations.

#### Grant Permission to Role

**Via Admin Interface:**
1. Navigate to Settings → Permission Matrix
2. Select role
3. Check permission checkbox
4. Confirm change

**Via SQL:**
```sql
INSERT INTO role_permissions (role_id, permission_id, granted_by)
VALUES (
    (SELECT id FROM roles WHERE name = 'chapter_admin'),
    (SELECT id FROM permissions WHERE name = 'member.export.chapter'),
    auth.current_member_id()
);
```

#### Revoke Permission from Role

**Via SQL:**
```sql
DELETE FROM role_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'chapter_admin')
  AND permission_id = (SELECT id FROM permissions WHERE name = 'member.export.chapter');
```

---

## Creating Custom Roles

**Use Case:** Department-specific roles (e.g., "Marketing Director", "Compliance Officer")

### Step 1: Create Role

**Via Admin Interface:**
1. Navigate to Settings → Role Management → Create Custom Role
2. Enter role name (lowercase, underscores only): `marketing_director`
3. Set level (1-10, typically 2-3 for custom roles)
4. Add description
5. Click "Create Role"

**Via SQL:**
```sql
INSERT INTO roles (name, level, description, is_system_role)
VALUES (
    'marketing_director',
    3,
    'Marketing director with campaign and report access across all chapters',
    false  -- Custom role, can be deleted
);
```

### Step 2: Assign Permissions

**Via Permission Matrix:**
1. Navigate to Settings → Permission Matrix
2. Select new custom role
3. Check desired permissions:
   - campaign.create.national
   - campaign.edit.national
   - report.view.national
   - member.view.national (for segmentation)
4. Save changes

**Via SQL:**
```sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'marketing_director'),
    p.id
FROM permissions p
WHERE p.name IN (
    'campaign.create.national',
    'campaign.edit.national',
    'report.view.national',
    'member.view.national'
);
```

### Step 3: Assign to Members

```sql
INSERT INTO member_roles (member_id, role_id, scope_type, assigned_by)
VALUES (
    (SELECT id FROM members WHERE email = 'marketing.director@nabip.org'),
    (SELECT id FROM roles WHERE name = 'marketing_director'),
    'global',
    auth.current_member_id()
);
```

---

## Audit Log Review

### Viewing Audit Logs

#### Recent Role Assignments

**Via Admin Interface:**
1. Navigate to Settings → Audit Logs
2. Filter by action: "role.assign"
3. Set date range (default: last 30 days)

**Via SQL:**
```sql
SELECT
    al.timestamp,
    m_actor.first_name || ' ' || m_actor.last_name as actor,
    al.action,
    al.new_value->>'role' as role_assigned,
    al.new_value->>'scope' as scope,
    m_target.first_name || ' ' || m_target.last_name as target_member
FROM audit_logs al
INNER JOIN members m_actor ON al.actor_id = m_actor.id
LEFT JOIN members m_target ON al.resource_id::uuid = m_target.id
WHERE al.action = 'role.assign'
  AND al.timestamp >= NOW() - INTERVAL '30 days'
ORDER BY al.timestamp DESC
LIMIT 100;
```

#### Permission Denial Events (Security Monitoring)

**Via SQL:**
```sql
SELECT
    al.timestamp,
    m.first_name || ' ' || m.last_name as member,
    m.email,
    al.metadata->>'attempted_action' as attempted_action,
    al.metadata->>'resource_type' as resource,
    al.ip_address
FROM audit_logs al
INNER JOIN members m ON al.actor_id = m.id
WHERE al.action = 'permission.denied'
  AND al.timestamp >= NOW() - INTERVAL '7 days'
ORDER BY al.timestamp DESC;
```

#### Member Activity Summary

```sql
SELECT
    m.first_name || ' ' || m.last_name as member,
    COUNT(*) as action_count,
    MAX(al.timestamp) as last_activity
FROM audit_logs al
INNER JOIN members m ON al.actor_id = m.id
WHERE al.timestamp >= NOW() - INTERVAL '30 days'
GROUP BY m.id, m.first_name, m.last_name
ORDER BY action_count DESC
LIMIT 50;
```

---

## Common Administrative Tasks

### 1. Chapter Leadership Transition

**Scenario:** New chapter president elected, revoke old president's admin access

**Step 1: Verify New President**
```sql
SELECT id, email, first_name, last_name, chapter_id
FROM members
WHERE email = 'new.president@example.com';
```

**Step 2: Revoke Old President's Role**
```sql
UPDATE member_roles
SET is_active = false
WHERE member_id = (SELECT id FROM members WHERE email = 'old.president@example.com')
  AND role_id = (SELECT id FROM roles WHERE name = 'chapter_admin')
  AND scope_chapter_id = 'chapter-uuid';
```

**Step 3: Assign New President**
```sql
INSERT INTO member_roles (
    member_id,
    role_id,
    scope_type,
    scope_chapter_id,
    assigned_by
)
VALUES (
    (SELECT id FROM members WHERE email = 'new.president@example.com'),
    (SELECT id FROM roles WHERE name = 'chapter_admin'),
    'chapter',
    'chapter-uuid',
    auth.current_member_id()
);
```

**Step 4: Notify Both Members**
- Send email to old president (thank you, access revoked)
- Send email to new president (welcome, access granted)

---

### 2. Temporary Administrative Assignment

**Scenario:** Grant temporary admin access for event coordinator during conference

```sql
-- Grant chapter admin role for 2 weeks
INSERT INTO member_roles (
    member_id,
    role_id,
    scope_type,
    scope_chapter_id,
    expires_at,
    assigned_by
)
VALUES (
    (SELECT id FROM members WHERE email = 'event.coordinator@example.com'),
    (SELECT id FROM roles WHERE name = 'chapter_admin'),
    'chapter',
    'chapter-uuid',
    NOW() + INTERVAL '14 days',
    auth.current_member_id()
);

-- Verify expiration
SELECT
    m.first_name || ' ' || m.last_name as member,
    r.name as role,
    mr.expires_at
FROM member_roles mr
INNER JOIN members m ON mr.member_id = m.id
INNER JOIN roles r ON mr.role_id = r.id
WHERE m.email = 'event.coordinator@example.com'
  AND mr.is_active = true;
```

---

### 3. State Administrator Delegation

**Scenario:** State admin delegates chapter oversight to regional coordinator

**Option A: Create Custom "Regional Coordinator" Role**

```sql
-- Create regional coordinator role (between chapter_admin and state_admin)
INSERT INTO roles (name, level, description, is_system_role)
VALUES (
    'regional_coordinator',
    2.5,  -- Between chapter_admin (2) and state_admin (3)
    'Regional coordinator with oversight of multiple chapters in a region',
    false
);

-- Assign permissions (similar to state_admin but limited scope)
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'regional_coordinator'),
    p.id
FROM permissions p
WHERE p.scope IN ('own', 'chapter')
  OR p.name LIKE 'report.view.state';

-- Assign to coordinator with multi-chapter scope
-- Note: May require custom application logic to handle multi-chapter scope
```

**Option B: Assign Multiple Chapter Admin Roles**

```sql
-- Assign chapter admin for each chapter in region
INSERT INTO member_roles (member_id, role_id, scope_type, scope_chapter_id, assigned_by)
SELECT
    (SELECT id FROM members WHERE email = 'regional.coordinator@example.com'),
    (SELECT id FROM roles WHERE name = 'chapter_admin'),
    'chapter',
    c.id,
    auth.current_member_id()
FROM chapters c
WHERE c.state = 'CA'
  AND c.region = 'Southern California';
```

---

### 4. Member Suspension Access Control

**Scenario:** Member suspended for policy violation, revoke all admin access

```sql
-- Revoke all active roles for suspended member
UPDATE member_roles
SET is_active = false
WHERE member_id = (SELECT id FROM members WHERE email = 'suspended.member@example.com')
  AND is_active = true;

-- Verify suspension
SELECT
    m.first_name || ' ' || m.last_name as member,
    m.status,
    COUNT(mr.id) as active_role_count
FROM members m
LEFT JOIN member_roles mr ON m.id = mr.member_id AND mr.is_active = true
WHERE m.email = 'suspended.member@example.com'
GROUP BY m.id, m.first_name, m.last_name, m.status;
-- Expected: active_role_count = 0
```

---

## Security Best Practices

### 1. Principle of Least Privilege
- Assign minimum permissions needed for job function
- Review role assignments quarterly
- Revoke access immediately when member leaves organization or changes role

### 2. Separation of Duties
- Do not assign both financial transaction permissions AND approval permissions to same member
- Rotate audit log reviewers
- Require dual approval for national admin assignments (implement via workflow)

### 3. Audit Trail Integrity
- Never delete audit log entries
- Review unusual access patterns weekly
- Investigate all permission denial events for potential security issues

### 4. Strong Authentication
- Enable two-factor authentication for all admin accounts
- Enforce strong password policies (12+ characters, complexity requirements)
- Rotate admin credentials every 90 days

### 5. Regular Access Reviews

**Quarterly Review Process:**

```sql
-- List all admin role assignments by state
SELECT
    c.state,
    r.name as role,
    COUNT(DISTINCT mr.member_id) as admin_count
FROM member_roles mr
INNER JOIN roles r ON mr.role_id = r.id
INNER JOIN members m ON mr.member_id = m.id
LEFT JOIN chapters c ON m.chapter_id = c.id
WHERE r.level >= 2  -- Admin roles
  AND mr.is_active = true
GROUP BY c.state, r.name
ORDER BY c.state, r.level DESC;

-- List all national admins (should be < 10)
SELECT
    m.first_name || ' ' || m.last_name as member,
    m.email,
    mr.assigned_at,
    m_assigner.first_name || ' ' || m_assigner.last_name as assigned_by
FROM member_roles mr
INNER JOIN members m ON mr.member_id = m.id
LEFT JOIN members m_assigner ON mr.assigned_by = m_assigner.id
WHERE mr.role_id = (SELECT id FROM roles WHERE name = 'national_admin')
  AND mr.is_active = true
ORDER BY mr.assigned_at;
```

---

## Troubleshooting

### Issue: User Reports Missing Access

**Step 1: Verify Role Assignment**
```sql
SELECT
    r.name as role,
    mr.scope_type,
    CASE
        WHEN mr.scope_type = 'chapter' THEN c.name
        WHEN mr.scope_type = 'state' THEN mr.scope_state
        ELSE 'Global'
    END as scope,
    mr.is_active,
    mr.expires_at
FROM member_roles mr
INNER JOIN roles r ON mr.role_id = r.id
LEFT JOIN chapters c ON mr.scope_chapter_id = c.id
WHERE mr.member_id = (SELECT id FROM members WHERE email = 'user@example.com');
```

**Step 2: Check Permission Assignment**
```sql
SELECT p.name, p.description
FROM member_roles mr
INNER JOIN role_permissions rp ON mr.role_id = rp.role_id
INNER JOIN permissions p ON rp.permission_id = p.id
WHERE mr.member_id = (SELECT id FROM members WHERE email = 'user@example.com')
  AND mr.is_active = true
ORDER BY p.name;
```

**Step 3: Test RLS Policy**
```sql
BEGIN;
    SET LOCAL auth.uid = (SELECT id FROM members WHERE email = 'user@example.com');
    SELECT * FROM members;  -- Test if user can see expected data
ROLLBACK;
```

---

### Issue: Role Assignment Fails

**Common Causes:**

1. **Insufficient authority**
   - State admins cannot assign state admin or national admin roles
   - Chapter admins cannot assign any roles
   - Solution: Escalate to higher-level admin

2. **Invalid scope**
   - Trying to assign chapter admin without specifying chapter
   - Trying to assign state admin without specifying state
   - Solution: Provide valid scope_chapter_id or scope_state

3. **Duplicate assignment**
   - Member already has same role with same scope
   - Solution: Revoke existing assignment first or modify expiration

**Diagnostic Query:**
```sql
-- Check for conflicting assignments
SELECT
    r.name as role,
    mr.scope_type,
    mr.is_active,
    mr.expires_at
FROM member_roles mr
INNER JOIN roles r ON mr.role_id = r.id
WHERE mr.member_id = (SELECT id FROM members WHERE email = 'user@example.com')
ORDER BY r.level DESC, mr.assigned_at DESC;
```

---

### Issue: Permission Denied Despite Correct Role

**Step 1: Verify RLS Policy**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'members';
-- Expected: rowsecurity = true

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'members';
```

**Step 2: Check Scope Alignment**
```sql
-- Example: Chapter admin trying to access member from different chapter
SELECT
    m.chapter_id as member_chapter,
    mr.scope_chapter_id as admin_scope_chapter,
    CASE
        WHEN m.chapter_id = mr.scope_chapter_id THEN 'MATCH'
        ELSE 'MISMATCH - ACCESS DENIED'
    END as scope_check
FROM members m
CROSS JOIN member_roles mr
WHERE m.id = 'target-member-uuid'
  AND mr.member_id = 'admin-member-uuid'
  AND mr.role_id = (SELECT id FROM roles WHERE name = 'chapter_admin');
```

**Step 3: Clear Cached Permissions**
```typescript
// In application code
import { clearPermissionCache } from '@/lib/rbac/cache'

// Force refresh user permissions
await clearPermissionCache(userId)
```

---

## Monitoring & Alerts

### Recommended Alert Rules

**1. Unusual Role Assignment Activity**
```sql
-- Alert if > 10 role assignments in 1 hour
SELECT COUNT(*) as assignment_count
FROM audit_logs
WHERE action = 'role.assign'
  AND timestamp >= NOW() - INTERVAL '1 hour';
-- Trigger alert if assignment_count > 10
```

**2. Failed Permission Checks**
```sql
-- Alert if > 100 permission denials in 1 hour
SELECT COUNT(*) as denial_count
FROM audit_logs
WHERE action = 'permission.denied'
  AND timestamp >= NOW() - INTERVAL '1 hour';
-- Trigger alert if denial_count > 100
```

**3. National Admin Assignment**
```sql
-- Alert on any national admin assignment (should be rare)
SELECT
    timestamp,
    m.email as new_admin,
    m_assigner.email as assigned_by
FROM audit_logs al
INNER JOIN members m ON al.resource_id::uuid = m.id
INNER JOIN members m_assigner ON al.actor_id = m_assigner.id
WHERE al.action = 'role.assign'
  AND al.new_value->>'role' = 'national_admin'
  AND al.timestamp >= NOW() - INTERVAL '24 hours';
-- Always trigger alert (critical security event)
```

---

## FAQ

### Q: Can a member have multiple roles?
**A:** Yes, members can have multiple role assignments with different scopes. For example, a member could be:
- `chapter_admin` for Los Angeles Chapter
- `state_admin` for California
- `member` globally (default)

The most permissive scope applies for any given permission check.

---

### Q: What happens when a role expires?
**A:** When `expires_at` timestamp is reached:
1. Automated job sets `is_active = false`
2. User immediately loses associated permissions
3. Audit log entry created
4. Optional email notification sent
5. Admin can manually re-assign if needed

---

### Q: Can I create a role with permissions from multiple existing roles?
**A:** Yes, create a custom role and assign specific permissions from different role levels. For example, a "Content Manager" role might have:
- `campaign.create.national` (from national_admin)
- `event.edit.state` (from state_admin)
- `member.view.chapter` (from chapter_admin)

---

### Q: How do I export a list of all chapter admins?
**A:** Use this query:

```sql
SELECT
    c.state,
    c.name as chapter,
    m.first_name || ' ' || m.last_name as admin_name,
    m.email,
    mr.assigned_at
FROM member_roles mr
INNER JOIN members m ON mr.member_id = m.id
INNER JOIN chapters c ON mr.scope_chapter_id = c.id
WHERE mr.role_id = (SELECT id FROM roles WHERE name = 'chapter_admin')
  AND mr.is_active = true
ORDER BY c.state, c.name;
```

---

## Related Documentation
- Database Schema: `RBAC_DATABASE_SCHEMA.md`
- Permission Matrix: `RBAC_PERMISSION_MATRIX.md`
- RLS Policies: `RBAC_RLS_POLICIES.md`
- Migration Guide: `RBAC_MIGRATION_GUIDE.md`

---

## Support Contacts

**Technical Issues:**
- Email: tech-support@nabip.org
- Slack: #rbac-support

**Security Incidents:**
- Email: security@nabip.org (monitored 24/7)
- Phone: (555) 123-4567

**General Questions:**
- Documentation: https://docs.nabip.org/rbac
- Community Forum: https://community.nabip.org
