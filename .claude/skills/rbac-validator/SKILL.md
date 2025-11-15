---
name: rbac-validator
description: Validates role-based access control (RBAC) implementation for four-tier permissions in the NABIP AMS (Member, Chapter Admin, State Admin, National Admin). Use when implementing permission checks, RLS policies, UI access controls, or audit logging for multi-tenant association management.
---

# RBAC Validator

Establish comprehensive access control rules to ensure secure, scalable permission management across the NABIP association's hierarchical structure.

## When to Use

Activate this skill when:
- Implementing role-based permissions (Member, Chapter Admin, State Admin, National Admin)
- Creating Supabase Row Level Security (RLS) policies
- Designing permission middleware for API routes
- Building conditional UI rendering based on roles
- Implementing audit logging for privileged actions
- Working on chapter hierarchy access control
- Creating permission management interfaces
- Validating data access patterns

## NABIP RBAC Structure

### Four-Tier Role Hierarchy

```typescript
type UserRole = "member" | "chapter_admin" | "state_admin" | "national_admin"

interface RolePermissions {
  role: UserRole
  permissions: Permission[]
  dataScope: DataScope
}

interface Permission {
  resource: string // "members", "chapters", "events", "finances", etc.
  actions: Action[] // "create", "read", "update", "delete"
}

type Action = "create" | "read" | "update" | "delete" | "approve" | "export"

interface DataScope {
  level: "self" | "chapter" | "state" | "national"
  chapterIds?: string[]
  stateIds?: string[]
}
```

### Permission Matrix

| Resource | Member | Chapter Admin | State Admin | National Admin |
|----------|--------|---------------|-------------|----------------|
| **Own Profile** | Read, Update | Read, Update | Read, Update | Read, Update |
| **Other Members** | Read (public) | Read, Update (chapter) | Read, Update (state) | Full Access |
| **Chapters** | Read (own) | Read, Update (own) | Read, Update (state) | Full Access |
| **Events** | Read, Register | Create, Manage (chapter) | Create, Manage (state) | Full Access |
| **Finances** | Read (own transactions) | Read (chapter) | Read, Export (state) | Full Access |
| **Reports** | None | Chapter reports | State reports | Full Access |
| **System Settings** | None | None | None | Full Access |

## Role Definitions

### 1. Member (Base Role)
- **Data Scope**: Self only
- **Permissions**:
  - Read own profile and membership details
  - Update own contact information and preferences
  - Register for events
  - View own transaction history
  - Enroll in courses
  - View chapter public information

### 2. Chapter Admin
- **Data Scope**: Specific chapter(s)
- **Permissions**:
  - All Member permissions
  - Manage chapter members (view, edit, approve)
  - Create and manage chapter events
  - View chapter financial reports
  - Send communications to chapter members
  - Approve/deny chapter membership requests
  - Assign chapter roles

### 3. State Admin
- **Data Scope**: All chapters within state(s)
- **Permissions**:
  - All Chapter Admin permissions (across state)
  - Manage state-level chapters
  - Create state-wide events
  - View/export state financial reports
  - Approve chapter creation requests
  - Manage chapter admins within state
  - Access state-wide analytics

### 4. National Admin
- **Data Scope**: All data (unrestricted)
- **Permissions**:
  - All State Admin permissions (across all states)
  - Manage national organization settings
  - Create/modify roles and permissions
  - Access all financial data
  - Manage system configurations
  - View audit logs
  - Export all data

## Implementation Patterns

### Supabase RLS Policies

```sql
-- Example: Members table RLS policies

-- 1. Members can view own data
CREATE POLICY "members_select_own"
  ON members FOR SELECT
  USING (auth.uid() = id);

-- 2. Chapter admins can view chapter members
CREATE POLICY "members_select_chapter_admin"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'chapter_admin'
      AND members.chapter_id = ANY(ur.chapter_ids)
    )
  );

-- 3. State admins can view state members
CREATE POLICY "members_select_state_admin"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN chapters c ON c.id = members.chapter_id
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'state_admin'
      AND c.state = ANY(ur.state_ids)
    )
  );

-- 4. National admins can view all members
CREATE POLICY "members_select_national_admin"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'national_admin'
    )
  );

-- Similar patterns for UPDATE, INSERT, DELETE
CREATE POLICY "members_update_own"
  ON members FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "members_update_chapter_admin"
  ON members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('chapter_admin', 'state_admin', 'national_admin')
      AND members.chapter_id = ANY(ur.chapter_ids)
    )
  );
```

### React Permission Hooks

```typescript
// usePermissions.ts
import { useKV } from "@github/spark"

interface UserRole {
  role: UserRole
  chapterIds?: string[]
  stateIds?: string[]
}

export function usePermissions() {
  const [currentUser] = useKV("currentUser")

  const hasPermission = (
    resource: string,
    action: Action,
    targetData?: { chapterId?: string; stateId?: string; ownerId?: string }
  ): boolean => {
    if (!currentUser?.role) return false

    // National admin has full access
    if (currentUser.role === "national_admin") return true

    // Check based on role and data scope
    switch (currentUser.role) {
      case "state_admin":
        if (targetData?.stateId && currentUser.stateIds?.includes(targetData.stateId)) {
          return hasStateAdminPermission(resource, action)
        }
        break

      case "chapter_admin":
        if (targetData?.chapterId && currentUser.chapterIds?.includes(targetData.chapterId)) {
          return hasChapterAdminPermission(resource, action)
        }
        break

      case "member":
        if (targetData?.ownerId === currentUser.id) {
          return hasMemberPermission(resource, action)
        }
        break
    }

    return false
  }

  const canAccessChapter = (chapterId: string): boolean => {
    if (currentUser.role === "national_admin") return true
    if (currentUser.role === "state_admin") {
      // Check if chapter belongs to admin's state(s)
      return checkChapterInStates(chapterId, currentUser.stateIds)
    }
    if (currentUser.role === "chapter_admin") {
      return currentUser.chapterIds?.includes(chapterId) || false
    }
    return false
  }

  const canAccessState = (stateId: string): boolean => {
    if (currentUser.role === "national_admin") return true
    if (currentUser.role === "state_admin") {
      return currentUser.stateIds?.includes(stateId) || false
    }
    return false
  }

  return {
    hasPermission,
    canAccessChapter,
    canAccessState,
    role: currentUser.role,
    isNationalAdmin: currentUser.role === "national_admin",
    isStateAdmin: currentUser.role === "state_admin",
    isChapterAdmin: currentUser.role === "chapter_admin",
    isMember: currentUser.role === "member"
  }
}

// Usage in components
export function MemberListPage() {
  const permissions = usePermissions()

  if (!permissions.hasPermission("members", "read")) {
    return <UnauthorizedPage />
  }

  return (
    <div>
      <h1>Member Directory</h1>
      {permissions.hasPermission("members", "create") && (
        <Button>Add New Member</Button>
      )}
      {/* ... */}
    </div>
  )
}
```

### API Route Protection

```typescript
// middleware/rbac.ts
import { createClient } from "@/lib/supabase/server"

interface ProtectedRouteOptions {
  resource: string
  action: Action
  requiredRole?: UserRole | UserRole[]
}

export async function withRBAC(
  handler: (req: Request, context: any) => Promise<Response>,
  options: ProtectedRouteOptions
) {
  return async (req: Request, context: any) => {
    const supabase = createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Get user roles
    const { data: userRoles, error: roleError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (roleError || !userRoles) {
      return new Response("No role assigned", { status: 403 })
    }

    // Check required role
    if (options.requiredRole) {
      const requiredRoles = Array.isArray(options.requiredRole)
        ? options.requiredRole
        : [options.requiredRole]

      if (!requiredRoles.includes(userRoles.role)) {
        return new Response("Insufficient permissions", { status: 403 })
      }
    }

    // Check resource-action permission
    const hasPermission = checkPermission(
      userRoles.role,
      options.resource,
      options.action
    )

    if (!hasPermission) {
      // Log unauthorized access attempt
      await logAuditEvent({
        userId: user.id,
        action: "access_denied",
        resource: options.resource,
        requestedAction: options.action,
        timestamp: new Date()
      })

      return new Response("Forbidden", { status: 403 })
    }

    // Add user context to request
    context.user = user
    context.role = userRoles.role
    context.permissions = userRoles

    return handler(req, context)
  }
}

// Usage in API routes
export const POST = withRBAC(
  async (req, context) => {
    // Handler has access to context.user and context.role
    const member = await createMember(await req.json())
    return Response.json(member)
  },
  {
    resource: "members",
    action: "create",
    requiredRole: ["chapter_admin", "state_admin", "national_admin"]
  }
)
```

### Conditional UI Rendering

```typescript
// PermissionGate component
interface PermissionGateProps {
  resource: string
  action: Action
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGate({
  resource,
  action,
  fallback = null,
  children
}: PermissionGateProps) {
  const permissions = usePermissions()

  if (!permissions.hasPermission(resource, action)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Usage
<PermissionGate resource="events" action="create">
  <Button>Create Event</Button>
</PermissionGate>

<PermissionGate
  resource="finances"
  action="export"
  fallback={<p className="text-muted-foreground">Export restricted to admins</p>}
>
  <ExportButton />
</PermissionGate>
```

## Audit Logging

### Comprehensive Audit Trail

```typescript
interface AuditLog {
  id: string
  userId: string
  userRole: UserRole
  action: string
  resource: string
  resourceId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  success: boolean
  errorMessage?: string
}

async function logAuditEvent(event: Omit<AuditLog, "id" | "timestamp">) {
  await db.insert(auditLogs).values({
    ...event,
    timestamp: new Date()
  })
}

// Automatic audit logging for sensitive operations
async function updateMemberWithAudit(
  memberId: string,
  updates: Partial<Member>,
  actorId: string,
  actorRole: UserRole
) {
  // Get current state
  const currentMember = await getMember(memberId)

  try {
    // Perform update
    const updatedMember = await db
      .update(members)
      .set(updates)
      .where(eq(members.id, memberId))
      .returning()

    // Log successful update
    await logAuditEvent({
      userId: actorId,
      userRole: actorRole,
      action: "update",
      resource: "member",
      resourceId: memberId,
      oldValues: currentMember,
      newValues: updatedMember[0],
      success: true
    })

    return updatedMember[0]
  } catch (error) {
    // Log failed update attempt
    await logAuditEvent({
      userId: actorId,
      userRole: actorRole,
      action: "update",
      resource: "member",
      resourceId: memberId,
      success: false,
      errorMessage: error.message
    })

    throw error
  }
}

// Audit log viewer (National Admin only)
export function AuditLogViewer() {
  const permissions = usePermissions()

  if (!permissions.isNationalAdmin) {
    return <UnauthorizedPage />
  }

  return (
    <div>
      <h1>Audit Logs</h1>
      {/* Display filterable audit log table */}
    </div>
  )
}
```

## Permission Testing Checklist

✅ **RLS Policies**: Every table has appropriate policies for all roles
✅ **API Routes**: All endpoints protected with RBAC middleware
✅ **UI Components**: Conditional rendering based on permissions
✅ **Audit Logging**: All privileged actions logged
✅ **Role Assignment**: Secure role management (admin-only)
✅ **Data Scope**: Queries respect hierarchical boundaries
✅ **Error Handling**: Clear messages for unauthorized access

## Common RBAC Patterns

### Hierarchical Data Access

```typescript
// Get members accessible by current user
async function getAccessibleMembers(userId: string) {
  const userRole = await getUserRole(userId)

  if (userRole.role === "national_admin") {
    return await db.select().from(members)
  }

  if (userRole.role === "state_admin") {
    return await db
      .select()
      .from(members)
      .innerJoin(chapters, eq(members.chapterId, chapters.id))
      .where(inArray(chapters.state, userRole.stateIds))
  }

  if (userRole.role === "chapter_admin") {
    return await db
      .select()
      .from(members)
      .where(inArray(members.chapterId, userRole.chapterIds))
  }

  // Member role: only own data
  return await db
    .select()
    .from(members)
    .where(eq(members.id, userId))
}
```

## Integration with Other Skills

- Use with `supabase-schema-validator` for RLS policy design
- Combine with `member-workflow` for role-based actions
- Works with `event-management` for event access control
- Supports `analytics-helper` for role-based reporting

---

**Best for**: Developers implementing secure, scalable access control across the NABIP AMS's multi-tier organizational structure with comprehensive audit trails.
