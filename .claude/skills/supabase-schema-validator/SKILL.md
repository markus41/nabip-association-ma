---
name: supabase-schema-validator
description: Validates Supabase database schema changes for the NABIP AMS, ensuring migrations align with member management, event tracking, chapter hierarchy, and financial models. Use when working with Supabase tables, RLS policies, or database migrations for members, chapters, events, courses, or transactions.
---

# Supabase Schema Validator

Establish data integrity rules to ensure reliable database operations across the NABIP Association Management System.

## When to Use

Activate this skill when:
- Creating or modifying Supabase migration files
- Designing database schemas for members, chapters, events, or courses
- Implementing Row Level Security (RLS) policies
- Validating relationships between hierarchical data (National → State → Local)
- Working with financial transaction tables
- Adding indexes for query optimization

## Validation Checklist

### Schema Design Principles

1. **Member Tables**
   - Ensure `members` table includes: id, email, member_type, status, chapter_id, joined_date
   - Validate membership tier relationships (National, State, Local)
   - Check duplicate detection logic (email uniqueness)
   - Verify engagement scoring fields

2. **Chapter Hierarchy**
   - Confirm parent_chapter_id for hierarchical structure
   - Validate level field (national, state, local)
   - Check revenue_sharing_percentage constraints
   - Ensure geographic data (region, state, timezone)

3. **Event Management**
   - Validate event registration capacity constraints
   - Check pricing tier relationships
   - Ensure virtual/hybrid event support fields
   - Verify check-in tracking (QR code support)

4. **Financial Tables**
   - Enforce transaction_type enums (dues, event, donation)
   - Validate payment_status workflows
   - Check revenue source tracking
   - Ensure audit trail timestamps

5. **Row Level Security (RLS)**
   - National admins: full access
   - State admins: state chapter + children
   - Chapter admins: specific chapter only
   - Members: own data only

### Migration Best Practices

```sql
-- Example: Member table with proper constraints
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  member_type TEXT NOT NULL CHECK (member_type IN ('national', 'state', 'local')),
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'inactive', 'suspended')),
  chapter_id UUID REFERENCES chapters(id),
  engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  joined_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  renewal_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Example policy for member self-access
CREATE POLICY "Members can view own data"
  ON members FOR SELECT
  USING (auth.uid() = id);
```

### Performance Optimization

- Add indexes on frequently queried columns:
  - `chapter_id` for hierarchy queries
  - `email` for lookups
  - `status` for filtering
  - `member_type` for segmentation
  - `created_at` for temporal queries

### Common Pitfalls to Avoid

❌ **Avoid**: Missing foreign key constraints
✅ **Use**: Explicit REFERENCES with ON DELETE CASCADE/SET NULL

❌ **Avoid**: Unrestricted RLS policies
✅ **Use**: Role-based policies tied to auth.jwt()

❌ **Avoid**: Missing updated_at triggers
✅ **Use**: Automatic timestamp updates via triggers

## Output Format

When validating schemas, provide:
1. ✅ Validation summary (what's correct)
2. ⚠️ Warnings (potential issues)
3. ❌ Errors (must fix)
4. 💡 Optimization suggestions
5. 📝 Migration script (if needed)

## Integration with Other Skills

- Works with `member-workflow` for data model alignment
- Supports `rbac-validator` for permission checks
- Complements `analytics-helper` for optimized queries

---

**Best for**: Developers working on backend data models, database migrations, or multi-tenant access control in the NABIP AMS.
