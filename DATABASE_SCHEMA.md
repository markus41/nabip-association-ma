# NABIP AMS Database Schema Documentation

## Overview

The NABIP Association Management System (AMS) database schema establishes a scalable, multi-tenant architecture designed to support 20,000+ members across national, state, and local chapters. This schema implements a Discovery-First approach to accommodate web-scraped data with unknown structures while providing comprehensive tracking of members, events, courses, financials, and communications.

**Total Tables**: 30 core tables + 5 discovery tables
**Database**: PostgreSQL (Supabase)
**Authentication**: Supabase Auth with Row Level Security (RLS)
**Created**: 2025-01-15

---

## Schema Categories

### 1. Discovery System (5 tables)
**Purpose**: Flexible ingestion of web-scraped data with unknown schemas

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `scraped_data_sources` | Tracks scraping sources and schedules | Source type, frequency, status |
| `scraped_data_raw` | Stores raw scraped data in JSONB | Schema fingerprinting, processing status |
| `discovered_schemas` | Auto-detected data structures | Field paths, mapping status, target tables |
| `transformation_rules` | Data transformation logic | Extract, transform, validate rules |
| `schema_changes` | Schema evolution alerts | New fields, removed fields, review status |

**Key Innovation**: MD5 fingerprinting of JSON structures enables automatic detection of schema changes, preventing data loss when scraping unknown sources.

---

### 2. Core Member & Chapter Management (6 tables)

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `chapters` | Hierarchical chapter structure | Self-referencing parent, member count tracking |
| `members` | Unified member database | Flexible tiers, engagement scoring, JSONB preferences |
| `credentials` | Professional certifications | Issue/expiry dates, credential type |
| `member_licenses` | State insurance licenses | NABIP-specific license tracking |
| `member_practice_areas` | Insurance specializations | Health, life, disability, etc. |
| `member_designations` | Professional designations | REBC, RHU, CLU, ChFC tracking |

**Hierarchical Structure**: National → State → Local chapters via `parent_chapter_id`

---

### 3. Events & Registration Management (8 tables)

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `events` | Event catalog | Virtual/hybrid support, capacity management, QR check-in |
| `ticket_types` | Pricing tiers | Early bird discounts, member pricing |
| `event_sessions` | Breakout sessions | Multi-track scheduling, CE credits |
| `event_questions` | Custom registration fields | Dynamic validation, conditional display |
| `discount_codes` | Promotional pricing | Usage limits, scope restrictions, A/B testing |
| `registrations` | Attendance tracking | QR codes (auto-generated), guest management |
| `chapter_leaders` | Leadership roster | Term tracking, role-specific permissions |
| `chapter_news` | Announcements | Categorized news, engagement tracking |

**Auto-Generated IDs**:
- QR codes: `REG-XXXXXXXXXXXX` (12 chars)
- Confirmation: `CONF-XXXXXXXXXX` (10 chars)

---

### 4. Financial Management (4 tables)

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `transactions` | Financial tracking | Multi-gateway support, refund handling, reconciliation |
| `invoices` | Billing management | Recurring billing, partial payments, auto-numbering |
| `invoice_line_items` | Itemized billing | Auto-updates invoice totals via triggers |
| `payment_gateway_logs` | Audit trail | Request/response logging, error tracking |

**Invoice Numbering**: `INV-YYYY-######` (auto-generated sequence)

---

### 5. Learning Management (2 tables)

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `courses` | Course catalog | CE credits, designation tracking, multi-format delivery |
| `enrollments` | Progress tracking | Completion monitoring, certificate generation |

**Certificate Numbering**: `CERT-YYYY-XXXXXXXX` (auto-generated on issuance)

---

### 6. Communications (2 tables)

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `campaign_templates` | Reusable email templates | Dynamic variables, versioning, usage tracking |
| `campaigns` | Email marketing | Segmentation, A/B testing, engagement analytics |

**Engagement Metrics**: Open rate, click rate, click-to-open rate (auto-calculated)

---

### 7. System & Audit (2 tables)

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `reports` | Custom report configs | Scheduled generation, multi-format export |
| `audit_logs` | Comprehensive audit trail | Field-level change tracking, 7-year retention |

---

## Key Design Patterns

### 1. Discovery-First Architecture
```sql
-- Web-scraped data flows through discovery system
INSERT INTO scraped_data_raw (source_id, parsed_data)
VALUES (uuid, '{"firstName": "John", "email": "john@example.com"}');

-- Trigger auto-calculates schema fingerprint
-- Inserts/updates discovered_schemas table
-- Alerts on schema changes via schema_changes table
```

### 2. Auto-Generated Identifiers
All tables use UUID primary keys with `gen_random_uuid()` default. Specific patterns:
- Invoices: `INV-YYYY-######` via sequence
- Confirmations: `CONF-XXXXXXXXXX` via MD5 hash
- QR Codes: `REG-XXXXXXXXXXXX` via MD5 hash
- Certificates: `CERT-YYYY-XXXXXXXX` via MD5 hash

### 3. Automatic Count Tracking
Triggers maintain counts across relationships:
```sql
-- chapters.member_count auto-updated when members change chapter
-- events.registered_count auto-updated when registrations created
-- courses.enrolled_count auto-updated when enrollments created
-- invoices.subtotal auto-updated when line items change
```

### 4. Row Level Security (RLS)
All tables have RLS enabled. Key policies:
- **Public**: Can view published events, courses, news
- **Members**: Can view own data, update own profile
- **Chapter Leaders**: Can manage chapter content
- **Admins**: Full access (via service role key)

Helper functions:
```sql
get_current_member_id() -- Returns UUID of authenticated user
is_chapter_leader(chapter_id) -- Boolean check
is_authenticated_member() -- Boolean check
```

---

## Common Patterns

### JSONB Flexible Storage
Used throughout for extensible data:
```sql
members.address         -- {street, city, state, zip, country}
members.preferences     -- {emailNotifications, language, timezone}
events.agenda           -- Array of agenda items
events.settings         -- {enableQRCheckIn, sendReminderEmails}
```

All JSONB columns have GIN indexes for fast querying.

### Timestamp Tracking
Every table includes:
```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

`updated_at` auto-updated via trigger on all tables.

### Soft Delete Pattern
Key tables use status fields instead of hard deletes:
```sql
members.status          -- 'active', 'suspended', 'expired'
events.status           -- 'draft', 'published', 'cancelled'
campaigns.status        -- 'draft', 'sent', 'cancelled'
```

### Hierarchical Data
```sql
chapters.parent_chapter_id  -- Self-referencing for National → State → Local
campaign_templates.parent_template_id  -- Template versioning
```

---

## Data Import Process

### Phase 1: Discovery (Recommended for Unknown Data)

```sql
-- 1. Register data source
INSERT INTO scraped_data_sources (source_name, source_type, source_url)
VALUES ('NABIP Member Directory', 'member_directory', 'https://nabip.org/members');

-- 2. Insert raw scraped data
INSERT INTO scraped_data_raw (source_id, parsed_data)
VALUES (
  'uuid-from-step-1',
  '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "memberType": "individual",
    "chapterName": "California"
  }'::jsonb
);

-- 3. Discovery trigger auto-detects schema and stores in discovered_schemas

-- 4. Review discovered schemas
SELECT * FROM discovered_schemas WHERE mapping_status = 'unmapped';

-- 5. Create transformation rules
INSERT INTO transformation_rules (
  rule_type, input_path, output_table, output_column
) VALUES
  ('extract', '$.firstName', 'members', 'first_name'),
  ('extract', '$.lastName', 'members', 'last_name'),
  ('extract', '$.email', 'members', 'email');
```

### Phase 2: Direct Import (For Known Schemas)

```sql
-- Import members directly
INSERT INTO members (
  email, first_name, last_name, member_type, chapter_id, status
)
SELECT
  scraped->>'email',
  scraped->>'firstName',
  scraped->>'lastName',
  'individual',
  (SELECT id FROM chapters WHERE name = scraped->>'chapterName'),
  'active'
FROM scraped_data_raw
WHERE source_id = 'uuid' AND processing_status = 'pending';

-- Mark as processed
UPDATE scraped_data_raw
SET
  processing_status = 'processed',
  mapped_to_table = 'members'
WHERE source_id = 'uuid';
```

---

## Sample Queries

### Member Analytics
```sql
-- Members by chapter with engagement scores
SELECT
  c.name AS chapter_name,
  COUNT(m.id) AS member_count,
  AVG(m.engagement_score) AS avg_engagement
FROM chapters c
LEFT JOIN members m ON m.chapter_id = c.id
WHERE m.status = 'active'
GROUP BY c.id, c.name
ORDER BY member_count DESC;
```

### Event Capacity Status
```sql
-- Events with capacity warnings
SELECT
  title,
  registered_count,
  capacity,
  ROUND((registered_count::DECIMAL / capacity) * 100, 1) AS fill_percentage,
  CASE
    WHEN registered_count >= capacity THEN 'Full'
    WHEN registered_count >= capacity * 0.9 THEN 'Nearly Full'
    ELSE 'Available'
  END AS status
FROM events
WHERE capacity IS NOT NULL
AND status = 'published'
ORDER BY fill_percentage DESC;
```

### Financial Summary
```sql
-- Revenue by source (last 30 days)
SELECT
  transaction_type,
  COUNT(*) AS transaction_count,
  SUM(amount) AS total_revenue
FROM transactions
WHERE payment_status = 'completed'
AND transaction_date >= NOW() - INTERVAL '30 days'
GROUP BY transaction_type
ORDER BY total_revenue DESC;
```

---

## Maintenance & Optimization

### Regular Maintenance Tasks

```sql
-- 1. Update member engagement scores (monthly)
UPDATE members
SET engagement_score = calculate_engagement_score(id)
WHERE status = 'active';

-- 2. Archive old audit logs (annual)
UPDATE audit_logs
SET archived = true
WHERE created_at < NOW() - INTERVAL '7 years';

-- 3. Clean up processed scraped data (weekly)
DELETE FROM scraped_data_raw
WHERE processing_status = 'processed'
AND created_at < NOW() - INTERVAL '90 days';

-- 4. Update campaign metrics (after sends)
-- Auto-calculated via triggers, but can manually refresh:
UPDATE campaigns
SET
  open_rate = ROUND((unique_opens_count::DECIMAL / sent_count) * 100, 2),
  click_rate = ROUND((unique_clicks_count::DECIMAL / sent_count) * 100, 2)
WHERE status = 'sent' AND sent_count > 0;
```

### Performance Monitoring

```sql
-- Find slow queries in reports
SELECT
  name,
  avg_execution_time_ms,
  execution_count
FROM reports
WHERE avg_execution_time_ms > 5000
ORDER BY avg_execution_time_ms DESC;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Migration History

| Migration | Tables Created | Description |
|-----------|----------------|-------------|
| 001-005 | Discovery System | Flexible data ingestion with schema detection |
| 006 | Discovery Triggers | Auto-fingerprinting and schema discovery |
| 007-012 | Members & Chapters | Core member management with NABIP-specific fields |
| 013-020 | Events & Registration | Complete event lifecycle with QR check-in |
| 021-024 | Financial | Transaction tracking with multi-gateway support |
| 025-026 | Learning | Course catalog and enrollment management |
| 027-028 | Communications | Email campaigns with A/B testing |
| 029-030 | System & Audit | Custom reports and comprehensive audit trail |
| 031 | Foreign Keys | Deferred constraints for circular dependencies |
| 032-033 | RLS Policies | Secure multi-tenant data access |
| 034 | Helper Functions | Business logic and auto-count management |

---

## Next Steps

1. **Import Web-Scraped Data**
   - Use discovery system for initial import
   - Review discovered schemas
   - Create transformation rules
   - Validate data quality

2. **Configure Authentication**
   - Set up Supabase Auth providers
   - Map auth.users to members table
   - Test RLS policies

3. **Migrate from GitHub Spark**
   - Replace useKV with Supabase queries
   - Update authentication flows
   - Deploy to independent hosting

4. **Testing**
   - Insert sample data for all tables
   - Test triggers and auto-calculations
   - Validate RLS policies
   - Performance testing with 20K+ members

---

## Support & References

- **Supabase Documentation**: https://supabase.com/docs
- **PostgreSQL JSONB**: https://www.postgresql.org/docs/current/datatype-json.html
- **RLS Best Practices**: https://supabase.com/docs/guides/auth/row-level-security

For questions or issues with this schema, contact the development team.
