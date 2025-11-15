# RBAC Entity-Relationship Diagram
## NABIP Association Management System

**Version:** 1.0
**Last Updated:** 2025-11-15

---

## Complete ER Diagram (Mermaid Format)

```mermaid
erDiagram
    members ||--o{ member_roles : "has assigned"
    roles ||--o{ member_roles : "assigned to"
    roles ||--o{ role_permissions : "has"
    permissions ||--o{ role_permissions : "granted to"
    chapters ||--o{ member_roles : "scopes"
    members ||--o{ audit_logs : "performs actions"
    members ||--o{ audit_logs : "grants roles"

    members {
        uuid id PK "Primary key"
        string email UK "Unique email"
        string firstName "Member first name"
        string lastName "Member last name"
        string memberType "individual|organizational|student|lifetime"
        string status "active|pending|expired|suspended"
        uuid chapterId FK "References chapters(id)"
        timestamptz joinedDate "Membership start date"
        timestamptz expiryDate "Membership expiration"
        timestamptz created_at "Record creation timestamp"
        timestamptz updated_at "Last update timestamp"
    }

    roles {
        uuid id PK "Primary key"
        string name UK "Unique role name (lowercase)"
        integer level "Hierarchy level (1-10)"
        text description "Role description"
        boolean is_system_role "Cannot be deleted if true"
        timestamptz created_at "Record creation timestamp"
        timestamptz updated_at "Last update timestamp"
    }

    permissions {
        uuid id PK "Primary key"
        string name UK "resource.action.scope format"
        string resource "member|chapter|event|campaign etc"
        string action "view|create|edit|delete|export"
        string scope "own|chapter|state|national|all|public"
        text description "Permission description"
        timestamptz created_at "Record creation timestamp"
    }

    role_permissions {
        uuid role_id FK "References roles(id)"
        uuid permission_id FK "References permissions(id)"
        timestamptz granted_at "When permission was granted"
        uuid granted_by FK "Member who granted (nullable)"
    }

    member_roles {
        uuid id PK "Primary key"
        uuid member_id FK "References members(id)"
        uuid role_id FK "References roles(id)"
        string scope_type "global|chapter|state"
        uuid scope_chapter_id FK "References chapters(id) - nullable"
        string scope_state "2-letter state code - nullable"
        timestamptz assigned_at "When role was assigned"
        uuid assigned_by FK "Member who assigned (nullable)"
        timestamptz expires_at "Expiration date (nullable)"
        boolean is_active "Active status"
    }

    chapters {
        uuid id PK "Primary key"
        string name "Chapter name"
        string type "national|state|local"
        uuid parent_chapter_id FK "Parent chapter (nullable)"
        string state "2-letter state code"
        string city "City name"
        timestamptz created_at "Record creation timestamp"
    }

    audit_logs {
        uuid id PK "Primary key (partitioned)"
        uuid actor_id FK "Member performing action"
        string action "action type (e.g., role.assign)"
        string resource_type "Resource being acted upon"
        uuid resource_id "ID of resource"
        jsonb old_value "Previous state (nullable)"
        jsonb new_value "New state (nullable)"
        inet ip_address "Client IP address"
        text user_agent "Client user agent"
        timestamptz timestamp PK "Action timestamp (partition key)"
        jsonb metadata "Additional context"
    }
```

---

## Simplified Core RBAC Diagram

```mermaid
erDiagram
    Member ||--o{ MemberRole : "has"
    Role ||--o{ MemberRole : "assigned as"
    Role ||--o{ RolePermission : "has"
    Permission ||--o{ RolePermission : "granted via"

    Member {
        uuid id
        string email
        string name
        uuid chapterId
    }

    Role {
        uuid id
        string name
        integer level
        boolean isSystemRole
    }

    Permission {
        uuid id
        string name
        string resource
        string action
        string scope
    }

    MemberRole {
        uuid id
        uuid memberId
        uuid roleId
        string scopeType
        uuid scopeChapterId
        string scopeState
        boolean isActive
        timestamptz expiresAt
    }

    RolePermission {
        uuid roleId
        uuid permissionId
        timestamptz grantedAt
    }
```

---

## Permission Inheritance Flow

```mermaid
graph TD
    A[National Admin<br/>Level 4] --> B[State Admin<br/>Level 3]
    B --> C[Chapter Admin<br/>Level 2]
    C --> D[Member<br/>Level 1]

    A -.inherits all.-> B
    A -.inherits all.-> C
    A -.inherits all.-> D
    B -.inherits all.-> C
    B -.inherits all.-> D
    C -.inherits all.-> D

    D --> D1[member.view.own]
    D --> D2[member.edit.own]
    D --> D3[event.view.public]

    C --> C1[member.view.chapter]
    C --> C2[event.create.chapter]
    C --> C3[campaign.create.chapter]

    B --> B1[member.view.state]
    B --> B2[event.view.state]
    B --> B3[role.assign.chapter]

    A --> A1[member.view.national]
    A --> A2[role.assign.national]
    A --> A3[system.configure.all]
```

---

## Scope Hierarchy Visualization

```mermaid
graph TB
    subgraph "Scope Hierarchy"
        Global["Global Scope<br/>(National Admin)<br/>All Chapters, All States"]
        State["State Scope<br/>(State Admin)<br/>All Chapters in State"]
        Chapter["Chapter Scope<br/>(Chapter Admin)<br/>Single Chapter"]
        Own["Own Scope<br/>(Member)<br/>Personal Data Only"]

        Global --> State
        State --> Chapter
        Chapter --> Own
    end

    subgraph "Example: California State Admin"
        CAState["State Admin<br/>State: CA"]
        LA["Los Angeles<br/>Chapter"]
        SF["San Francisco<br/>Chapter"]
        SD["San Diego<br/>Chapter"]

        CAState --> LA
        CAState --> SF
        CAState --> SD
    end

    subgraph "Example: Chapter Admin"
        LAAdmin["Chapter Admin<br/>Chapter: LA"]
        LAMembers["LA Chapter<br/>Members"]

        LAAdmin --> LAMembers
        LAAdmin -.cannot access.-> SF
    end
```

---

## Permission Check Flow

```mermaid
sequenceDiagram
    participant User
    participant App as Application
    participant Cache
    participant DB as Database
    participant RLS as Row-Level Security

    User->>App: Request to Edit Member
    App->>Cache: Check Permission Cache

    alt Cache Hit
        Cache-->>App: Cached Permissions
    else Cache Miss
        App->>DB: Query member_roles
        DB->>DB: JOIN roles, permissions
        DB-->>App: Member Roles + Permissions
        App->>Cache: Update Cache (5 min TTL)
    end

    App->>App: hasPermission('member', 'edit', scope)

    alt Permission Granted
        App->>DB: UPDATE members WHERE id = ?
        DB->>RLS: Evaluate RLS Policy

        alt RLS Allows
            RLS-->>DB: Policy Passes
            DB-->>App: Update Success
            App-->>User: Edit Saved
        else RLS Denies
            RLS-->>DB: Policy Fails
            DB-->>App: Permission Denied
            App->>DB: Log Audit Entry
            App-->>User: Access Denied
        end
    else Permission Denied
        App->>DB: Log Denial to Audit
        App-->>User: Insufficient Permissions
    end
```

---

## Role Assignment Workflow

```mermaid
stateDiagram-v2
    [*] --> Identify: Admin identifies member
    Identify --> ValidateAuthority: Check assigner authority

    ValidateAuthority --> CheckRoleLevel: Valid authority
    ValidateAuthority --> Denied: Insufficient authority

    CheckRoleLevel --> ValidateScope: Role level OK
    CheckRoleLevel --> Denied: Cannot assign higher level

    ValidateScope --> CreateAssignment: Scope valid
    ValidateScope --> Denied: Invalid scope

    CreateAssignment --> LogAudit: Insert member_role
    LogAudit --> NotifyMember: Log audit entry
    NotifyMember --> [*]: Send email notification

    Denied --> LogDenial: Log denial
    LogDenial --> [*]: Notify admin
```

---

## Multi-Scope Role Example

```mermaid
graph LR
    subgraph "John Doe's Roles"
        Member["Member Role<br/>Scope: Global<br/>Level: 1"]
        ChapterLA["Chapter Admin<br/>Scope: Los Angeles<br/>Level: 2"]
        StateCA["State Admin<br/>Scope: California<br/>Level: 3"]
    end

    subgraph "Effective Permissions"
        Member --> P1[member.view.own]
        Member --> P2[event.view.public]

        ChapterLA --> P3[member.view.chapter<br/>Los Angeles only]
        ChapterLA --> P4[event.create.chapter<br/>Los Angeles only]

        StateCA --> P5[member.view.state<br/>All CA chapters]
        StateCA --> P6[event.view.state<br/>All CA events]
        StateCA --> P7[role.assign.chapter<br/>Any CA chapter]
    end

    subgraph "Access Resolution"
        Query["Query: View member in SF"]
        Query --> ChapterLA
        Query --> StateCA

        ChapterLA -.NO.-> ChapterLA_Result[Different chapter]
        StateCA -.YES.-> StateCA_Result[Same state]

        StateCA_Result --> Granted["Access Granted<br/>(Broadest scope wins)"]
    end
```

---

## Audit Log Partitioning Strategy

```mermaid
graph TB
    subgraph "Audit Logs Table (Partitioned)"
        Main["audit_logs<br/>(Parent Table)"]

        Main --> Q1["audit_logs_2025_q4<br/>2025-10-01 to 2026-01-01"]
        Main --> Q2["audit_logs_2026_q1<br/>2026-01-01 to 2026-04-01"]
        Main --> Q3["audit_logs_2026_q2<br/>2026-04-01 to 2026-07-01"]
        Main --> Q4["Future partitions...<br/>Auto-created"]
    end

    subgraph "Query Performance"
        Query["Query: Last 30 days"]
        Query --> Index["Partitioned Index<br/>timestamp DESC"]
        Index --> Fast["Fast Query<br/>< 500ms"]
    end

    subgraph "Archival Process"
        Old["Old Partitions<br/>> 7 years"]
        Old --> Archive["Compress & Archive<br/>to Cold Storage"]
        Archive --> Drop["Drop Partition<br/>Free disk space"]
    end
```

---

## Permission Naming Convention

```mermaid
graph LR
    Permission["Permission Name"] --> Resource["Resource<br/>(member, event, chapter)"]
    Permission --> Action["Action<br/>(view, create, edit, delete)"]
    Permission --> Scope["Scope<br/>(own, chapter, state, national)"]

    Example["Example: member.view.chapter"] --> E1["Resource: member"]
    Example --> E2["Action: view"]
    Example --> E3["Scope: chapter"]

    E1 --> Meaning1["What you're accessing"]
    E2 --> Meaning2["What you can do"]
    E3 --> Meaning3["Where you can do it"]
```

---

## Chapter Hierarchy with RBAC Scopes

```mermaid
graph TD
    National["National Chapter<br/>Type: national"]

    National --> StateCA["California<br/>Type: state"]
    National --> StateTX["Texas<br/>Type: state"]

    StateCA --> LA["Los Angeles<br/>Type: local"]
    StateCA --> SF["San Francisco<br/>Type: local"]

    StateTX --> Houston["Houston<br/>Type: local"]
    StateTX --> Dallas["Dallas<br/>Type: local"]

    subgraph "RBAC Scopes"
        NationalAdmin["National Admin<br/>Scope: Global<br/>Access: All chapters"]
        StateAdminCA["State Admin CA<br/>Scope: State (CA)<br/>Access: LA + SF"]
        ChapterAdminLA["Chapter Admin LA<br/>Scope: Chapter (LA)<br/>Access: LA only"]
    end

    NationalAdmin -.manages.-> National
    StateAdminCA -.manages.-> StateCA
    ChapterAdminLA -.manages.-> LA
```

---

## Database Table Relationships Summary

| Table | Related To | Relationship Type | Purpose |
|-------|-----------|------------------|---------|
| **members** | member_roles | One-to-Many | Member has multiple role assignments |
| **members** | chapters | Many-to-One | Member belongs to one chapter |
| **members** | audit_logs | One-to-Many | Member performs actions |
| **roles** | member_roles | One-to-Many | Role assigned to multiple members |
| **roles** | role_permissions | One-to-Many | Role has multiple permissions |
| **permissions** | role_permissions | One-to-Many | Permission granted to multiple roles |
| **chapters** | member_roles | One-to-Many | Chapter scopes multiple role assignments |
| **chapters** | chapters | Self-Reference | Parent-child hierarchy |
| **member_roles** | members | Many-to-One | Role assignment belongs to member |
| **member_roles** | roles | Many-to-One | Assignment uses specific role |
| **member_roles** | chapters | Many-to-One | Assignment scoped to chapter |
| **role_permissions** | roles | Many-to-One | Permission mapping uses role |
| **role_permissions** | permissions | Many-to-One | Permission mapping uses permission |
| **audit_logs** | members | Many-to-One | Log entry created by member |

---

## Index Coverage Map

```mermaid
graph TB
    subgraph "member_roles Indexes"
        MR1["idx_member_roles_member<br/>(member_id) WHERE is_active"]
        MR2["idx_member_roles_role<br/>(role_id)"]
        MR3["idx_member_roles_chapter<br/>(scope_chapter_id)"]
        MR4["idx_member_roles_state<br/>(scope_state)"]
        MR5["idx_member_roles_active_lookup<br/>(member_id, is_active, expires_at)"]
    end

    subgraph "Common Queries"
        Q1["Get member's roles"] --> MR1
        Q2["Find all users with role"] --> MR2
        Q3["Chapter admin lookup"] --> MR3
        Q4["State admin lookup"] --> MR4
        Q5["Permission check"] --> MR5
    end

    subgraph "Performance"
        MR5 --> Fast["< 10ms<br/>Composite index optimization"]
    end
```

---

## Related Documentation

- **Database Schema:** `RBAC_DATABASE_SCHEMA.md`
- **Permission Matrix:** `RBAC_PERMISSION_MATRIX.md`
- **RLS Policies:** `RBAC_RLS_POLICIES.md`
- **Migration Guide:** `RBAC_MIGRATION_GUIDE.md`
- **Admin Guide:** `RBAC_ADMIN_GUIDE.md`
- **TypeScript Utilities:** `RBAC_TYPESCRIPT_UTILITIES.md`
- **Implementation Summary:** `RBAC_IMPLEMENTATION_SUMMARY.md`

---

## Notes

All diagrams are in Mermaid format and can be rendered in:
- GitHub (native support)
- Markdown viewers (with Mermaid plugin)
- Documentation sites (MkDocs, Docusaurus, etc.)
- Visual Studio Code (with Mermaid extension)

**Version:** 1.0
**Last Updated:** 2025-11-15
