# NABIP AMS Data Import Guide

## Overview

This guide establishes the process for importing web-scraped data into the NABIP AMS database. The Discovery-First architecture allows flexible ingestion of data with unknown structures while ensuring data quality and preventing loss.

---

## Import Strategy

### Phase 1: Discovery Import (Recommended for Initial Load)
Use this for web-scraped data where you're uncertain about field consistency.

### Phase 2: Direct Import (For Known Structures)
Once schemas are validated, import directly into target tables.

---

## Step-by-Step Import Process

### Step 1: Register Data Sources

First, register each web scraping source to track data lineage:

```sql
-- Register member directory source
INSERT INTO scraped_data_sources (
  source_name,
  source_type,
  source_url,
  scraping_frequency,
  status
) VALUES
  ('NABIP Member Directory', 'member_directory', 'https://nabip.org/members', 'monthly', 'active'),
  ('NABIP Chapter Directory', 'chapter_directory', 'https://nabip.org/chapters', 'weekly', 'active'),
  ('NABIP Events Calendar', 'event_listing', 'https://nabip.org/events', 'daily', 'active'),
  ('NABIP Course Catalog', 'course_catalog', 'https://nabip.org/courses', 'weekly', 'active');

-- Capture source IDs for next steps
SELECT id, source_name FROM scraped_data_sources ORDER BY created_at DESC;
```

### Step 2: Load Raw Scraped Data

Insert your scraped JSON data into the `scraped_data_raw` table. The discovery trigger will automatically calculate schema fingerprints and update the `discovered_schemas` table.

```sql
-- Example: Import member data
-- Replace 'YOUR_SOURCE_ID' with actual UUID from Step 1

INSERT INTO scraped_data_raw (source_id, source_reference, parsed_data)
VALUES
  -- Member 1
  (
    'YOUR_SOURCE_ID',
    'member-page-1',
    '{
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "memberType": "individual",
      "chapterName": "California",
      "phone": "555-123-4567",
      "status": "Active",
      "joinDate": "2023-01-15",
      "licenses": [
        {"state": "CA", "licenseNumber": "CA12345", "type": "Health"}
      ],
      "practiceAreas": ["Health", "Life"],
      "designations": ["REBC", "RHU"]
    }'::jsonb
  ),
  -- Member 2
  (
    'YOUR_SOURCE_ID',
    'member-page-2',
    '{
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "memberType": "individual",
      "chapterName": "Texas",
      "phone": "555-987-6543",
      "status": "Active",
      "joinDate": "2022-06-20"
    }'::jsonb
  );

-- Verify data was inserted and fingerprinted
SELECT
  id,
  source_reference,
  schema_fingerprint,
  processing_status,
  parsed_data
FROM scraped_data_raw
WHERE source_id = 'YOUR_SOURCE_ID'
ORDER BY created_at DESC
LIMIT 10;
```

### Step 3: Review Discovered Schemas

Check what field structures were automatically detected:

```sql
-- View all discovered schemas
SELECT
  field_path,
  field_type,
  example_value,
  occurrence_count,
  mapping_status,
  target_table,
  target_column
FROM discovered_schemas
WHERE source_id = 'YOUR_SOURCE_ID'
ORDER BY occurrence_count DESC;

-- Find unmapped fields that need transformation rules
SELECT
  field_path,
  field_type,
  example_value,
  occurrence_count
FROM discovered_schemas
WHERE mapping_status = 'unmapped'
  AND source_id = 'YOUR_SOURCE_ID'
ORDER BY occurrence_count DESC;
```

### Step 4: Create Transformation Rules

Define how to map discovered fields to target tables:

```sql
-- Transformation rules for member data
INSERT INTO transformation_rules (
  schema_id,
  rule_type,
  input_path,
  output_table,
  output_column,
  validation_rules,
  transform_function,
  status
)
SELECT
  ds.id,
  'extract',
  ds.field_path,
  'members',
  CASE ds.field_path
    WHEN '$.firstName' THEN 'first_name'
    WHEN '$.lastName' THEN 'last_name'
    WHEN '$.email' THEN 'email'
    WHEN '$.phone' THEN 'phone'
    WHEN '$.memberType' THEN 'member_type'
    WHEN '$.status' THEN 'status'
  END,
  CASE ds.field_path
    WHEN '$.email' THEN '{"required": true, "format": "email"}'::jsonb
    WHEN '$.phone' THEN '{"format": "phone"}'::jsonb
    ELSE '{}'::jsonb
  END,
  CASE ds.field_path
    WHEN '$.status' THEN 'LOWER(value)'
    WHEN '$.memberType' THEN 'LOWER(value)'
    ELSE NULL
  END,
  'active'
FROM discovered_schemas ds
WHERE ds.source_id = 'YOUR_SOURCE_ID'
  AND ds.field_path IN ('$.firstName', '$.lastName', '$.email', '$.phone', '$.memberType', '$.status')
  AND ds.mapping_status = 'unmapped';

-- Mark schemas as mapped
UPDATE discovered_schemas
SET
  mapping_status = 'mapped',
  target_table = 'members'
WHERE source_id = 'YOUR_SOURCE_ID'
  AND field_path IN ('$.firstName', '$.lastName', '$.email', '$.phone', '$.memberType', '$.status');
```

### Step 5: Execute Direct Import

Once transformation rules are established, import data directly into target tables:

```sql
-- Import chapters first (required for member.chapter_id foreign key)
INSERT INTO chapters (name, chapter_type, status)
SELECT DISTINCT
  scraped->>'chapterName' AS name,
  'state' AS chapter_type,
  'active' AS status
FROM scraped_data_raw
WHERE source_id = 'YOUR_SOURCE_ID'
  AND scraped->>'chapterName' IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- Import members
INSERT INTO members (
  email,
  first_name,
  last_name,
  phone,
  member_type,
  chapter_id,
  status,
  member_since
)
SELECT
  scraped->>'email',
  scraped->>'firstName',
  scraped->>'lastName',
  scraped->>'phone',
  LOWER(scraped->>'memberType')::member_type_enum,
  (SELECT id FROM chapters WHERE name = scraped->>'chapterName' LIMIT 1),
  CASE LOWER(scraped->>'status')
    WHEN 'active' THEN 'active'
    WHEN 'pending' THEN 'pending'
    ELSE 'suspended'
  END::member_status_enum,
  COALESCE((scraped->>'joinDate')::date, CURRENT_DATE)
FROM scraped_data_raw
WHERE source_id = 'YOUR_SOURCE_ID'
  AND processing_status = 'pending'
  AND scraped->>'email' IS NOT NULL
ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  updated_at = now();

-- Mark raw data as processed
UPDATE scraped_data_raw
SET
  processing_status = 'processed',
  mapped_to_table = 'members',
  processed_at = now()
WHERE source_id = 'YOUR_SOURCE_ID'
  AND processing_status = 'pending'
  AND scraped->>'email' IS NOT NULL;

-- Verify import
SELECT
  COUNT(*) as total_members,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_members,
  COUNT(DISTINCT chapter_id) as chapters_with_members
FROM members;
```

---

## Sample Test Data

Use this SQL to create sample data for testing the schema, triggers, and RLS policies:

```sql
-- ============================================================================
-- SAMPLE TEST DATA FOR NABIP AMS
-- ============================================================================

-- 1. Create National, State, and Local Chapters
-- ============================================================================

INSERT INTO chapters (id, name, chapter_type, parent_chapter_id, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'NABIP National', 'national', NULL, 'active'),
  ('00000000-0000-0000-0000-000000000002', 'California', 'state', '00000000-0000-0000-0000-000000000001', 'active'),
  ('00000000-0000-0000-0000-000000000003', 'Texas', 'state', '00000000-0000-0000-0000-000000000001', 'active'),
  ('00000000-0000-0000-0000-000000000004', 'Los Angeles', 'local', '00000000-0000-0000-0000-000000000002', 'active'),
  ('00000000-0000-0000-0000-000000000005', 'San Francisco', 'local', '00000000-0000-0000-0000-000000000002', 'active'),
  ('00000000-0000-0000-0000-000000000006', 'Houston', 'local', '00000000-0000-0000-0000-000000000003', 'active');

-- 2. Create Sample Members
-- ============================================================================

INSERT INTO members (
  id, email, first_name, last_name, phone, member_type, chapter_id, status, member_since
) VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    'john.doe@example.com',
    'John',
    'Doe',
    '555-123-4567',
    'individual',
    '00000000-0000-0000-0000-000000000004',
    'active',
    '2023-01-15'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'jane.smith@example.com',
    'Jane',
    'Smith',
    '555-987-6543',
    'individual',
    '00000000-0000-0000-0000-000000000005',
    'active',
    '2022-06-20'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'robert.johnson@example.com',
    'Robert',
    'Johnson',
    '555-456-7890',
    'organizational',
    '00000000-0000-0000-0000-000000000006',
    'active',
    '2021-03-10'
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    'emily.williams@example.com',
    'Emily',
    'Williams',
    '555-234-5678',
    'individual',
    '00000000-0000-0000-0000-000000000004',
    'pending',
    '2024-12-01'
  );

-- 3. Add Member Licenses
-- ============================================================================

INSERT INTO member_licenses (member_id, state, license_number, license_type, status) VALUES
  ('00000000-0000-0000-0000-000000000101', 'CA', 'CA12345', 'Health', 'active'),
  ('00000000-0000-0000-0000-000000000101', 'CA', 'CA12346', 'Life', 'active'),
  ('00000000-0000-0000-0000-000000000102', 'CA', 'CA67890', 'Health', 'active'),
  ('00000000-0000-0000-0000-000000000103', 'TX', 'TX11111', 'Health', 'active');

-- 4. Add Member Practice Areas
-- ============================================================================

INSERT INTO member_practice_areas (member_id, practice_area) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Health'),
  ('00000000-0000-0000-0000-000000000101', 'Life'),
  ('00000000-0000-0000-0000-000000000102', 'Health'),
  ('00000000-0000-0000-0000-000000000102', 'Disability'),
  ('00000000-0000-0000-0000-000000000103', 'Group Health');

-- 5. Add Member Designations
-- ============================================================================

INSERT INTO member_designations (member_id, designation_type, awarded_date) VALUES
  ('00000000-0000-0000-0000-000000000101', 'REBC', '2023-05-15'),
  ('00000000-0000-0000-0000-000000000101', 'RHU', '2024-03-20'),
  ('00000000-0000-0000-0000-000000000102', 'REBC', '2023-08-10'),
  ('00000000-0000-0000-0000-000000000103', 'CLU', '2022-11-05');

-- 6. Create Sample Events
-- ============================================================================

INSERT INTO events (
  id, title, description, format, start_date, end_date, capacity, status, visibility
) VALUES
  (
    '00000000-0000-0000-0000-000000000201',
    '2025 NABIP Annual Conference',
    'Join us for the premier event for health and benefits professionals.',
    'in-person',
    '2025-06-15 09:00:00',
    '2025-06-17 17:00:00',
    500,
    'published',
    'public'
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    'CE Webinar: Medicare Advantage Updates',
    'Stay current on the latest Medicare Advantage regulations.',
    'virtual',
    '2025-02-20 14:00:00',
    '2025-02-20 16:00:00',
    1000,
    'published',
    'public'
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    'California Chapter Leadership Summit',
    'Leadership training for chapter officers.',
    'hybrid',
    '2025-03-10 09:00:00',
    '2025-03-10 17:00:00',
    100,
    'published',
    'members_only'
  );

-- 7. Create Ticket Types
-- ============================================================================

INSERT INTO ticket_types (event_id, ticket_name, price, member_price, quantity_available) VALUES
  ('00000000-0000-0000-0000-000000000201', 'Full Conference Pass', 59900, 49900, 400),
  ('00000000-0000-0000-0000-000000000201', 'Single Day Pass', 24900, 19900, 100),
  ('00000000-0000-0000-0000-000000000202', 'Webinar Registration', 0, 0, 1000),
  ('00000000-0000-0000-0000-000000000203', 'In-Person Attendance', 12900, 9900, 50),
  ('00000000-0000-0000-0000-000000000203', 'Virtual Attendance', 4900, 2900, 50);

-- 8. Create Sample Courses
-- ============================================================================

INSERT INTO courses (
  id, title, description, course_type, credits, status, price
) VALUES
  (
    '00000000-0000-0000-0000-000000000301',
    'REBC Designation Program',
    'Comprehensive training for the Registered Employee Benefits Consultant designation.',
    'designation',
    30,
    'published',
    149900
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    'Health Insurance Fundamentals',
    'Essential knowledge for selling health insurance products.',
    'certification',
    10,
    'published',
    29900
  ),
  (
    '00000000-0000-0000-0000-000000000303',
    'Medicare Supplement Sales Strategies',
    'Advanced techniques for Medicare supplement sales.',
    'continuing_education',
    5,
    'published',
    9900
  );

-- 9. Create Sample Enrollments
-- ============================================================================

INSERT INTO enrollments (member_id, course_id, enrollment_date, status, progress_percentage) VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000301', '2024-01-15', 'in_progress', 65),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000302', '2024-11-01', 'completed', 100),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000303', '2024-12-10', 'in_progress', 40);

-- 10. Verify Sample Data
-- ============================================================================

-- Check chapter hierarchy and member counts (auto-updated by trigger)
SELECT
  c.name,
  c.chapter_type,
  c.member_count,
  p.name as parent_chapter
FROM chapters c
LEFT JOIN chapters p ON c.parent_chapter_id = p.id
ORDER BY c.chapter_type, c.name;

-- Check member distribution
SELECT
  c.name as chapter,
  COUNT(m.id) as member_count,
  COUNT(CASE WHEN m.status = 'active' THEN 1 END) as active_members
FROM chapters c
LEFT JOIN members m ON m.chapter_id = c.id
GROUP BY c.id, c.name
ORDER BY member_count DESC;

-- Check event capacity and registration counts
SELECT
  title,
  format,
  capacity,
  registered_count,
  CASE
    WHEN capacity IS NOT NULL THEN ROUND((registered_count::DECIMAL / capacity) * 100, 1)
    ELSE NULL
  END as fill_percentage
FROM events
ORDER BY start_date;

-- Check course enrollment
SELECT
  c.title,
  c.enrolled_count,
  COUNT(e.id) as actual_enrollments
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
GROUP BY c.id, c.title, c.enrolled_count;
```

---

## Testing Discovery System

Test the discovery system with sample scraped data:

```sql
-- Register test source
INSERT INTO scraped_data_sources (source_name, source_type, status)
VALUES ('Test Member Scrape', 'member_directory', 'active')
RETURNING id;

-- Insert test data with varying schemas
INSERT INTO scraped_data_raw (source_id, source_reference, parsed_data) VALUES
  (
    'YOUR_TEST_SOURCE_ID',
    'test-1',
    '{
      "name": "Test User 1",
      "email": "test1@example.com",
      "chapter": "California"
    }'::jsonb
  ),
  (
    'YOUR_TEST_SOURCE_ID',
    'test-2',
    '{
      "firstName": "Test",
      "lastName": "User 2",
      "emailAddress": "test2@example.com",
      "chapterName": "Texas",
      "phone": "555-0000"
    }'::jsonb
  );

-- Check if schema changes were detected
SELECT * FROM schema_changes
WHERE source_id = 'YOUR_TEST_SOURCE_ID'
ORDER BY detected_at DESC;

-- View discovered schemas
SELECT
  field_path,
  field_type,
  example_value,
  occurrence_count
FROM discovered_schemas
WHERE source_id = 'YOUR_TEST_SOURCE_ID'
ORDER BY occurrence_count DESC;
```

---

## Validation Queries

After importing data, run these queries to validate everything is working:

```sql
-- 1. Verify triggers updated counts correctly
SELECT
  'chapters.member_count' as test,
  CASE
    WHEN (SELECT SUM(member_count) FROM chapters) = (SELECT COUNT(*) FROM members)
    THEN 'PASS'
    ELSE 'FAIL'
  END as result;

-- 2. Verify auto-generated codes
SELECT
  'registration QR codes' as test,
  CASE
    WHEN COUNT(*) = COUNT(DISTINCT qr_code) AND MIN(qr_code) LIKE 'REG-%'
    THEN 'PASS'
    ELSE 'FAIL'
  END as result
FROM registrations;

-- 3. Verify RLS policies (requires auth context)
-- This should return 0 for unauthenticated users
SELECT COUNT(*) FROM members WHERE status = 'pending';

-- 4. Check data quality
SELECT
  'duplicate emails' as test,
  CASE
    WHEN COUNT(*) = COUNT(DISTINCT email)
    THEN 'PASS'
    ELSE 'FAIL - ' || (COUNT(*) - COUNT(DISTINCT email))::text || ' duplicates found'
  END as result
FROM members;

-- 5. Verify foreign key integrity
SELECT
  'orphaned members' as test,
  CASE
    WHEN COUNT(*) = 0
    THEN 'PASS'
    ELSE 'FAIL - ' || COUNT(*)::text || ' members without chapters'
  END as result
FROM members
WHERE chapter_id NOT IN (SELECT id FROM chapters);
```

---

## Common Import Scenarios

### Scenario 1: Incremental Member Updates

```sql
-- Use UPSERT to update existing members or insert new ones
INSERT INTO members (email, first_name, last_name, chapter_id, status)
SELECT
  scraped->>'email',
  scraped->>'firstName',
  scraped->>'lastName',
  (SELECT id FROM chapters WHERE name = scraped->>'chapterName'),
  'active'::member_status_enum
FROM scraped_data_raw
WHERE source_id = 'YOUR_SOURCE_ID'
  AND processing_status = 'pending'
ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  chapter_id = EXCLUDED.chapter_id,
  updated_at = now();
```

### Scenario 2: Bulk Event Registration Import

```sql
-- Import event registrations from scraped data
INSERT INTO registrations (
  event_id,
  member_id,
  ticket_type_id,
  registration_status
)
SELECT
  (SELECT id FROM events WHERE title = scraped->>'eventTitle'),
  (SELECT id FROM members WHERE email = scraped->>'attendeeEmail'),
  (SELECT id FROM ticket_types WHERE ticket_name = scraped->>'ticketType' LIMIT 1),
  'confirmed'::registration_status_enum
FROM scraped_data_raw
WHERE source_id = 'YOUR_EVENT_SOURCE_ID'
  AND processing_status = 'pending'
ON CONFLICT DO NOTHING;
```

### Scenario 3: Handling Missing Foreign Keys

```sql
-- Create chapters on-the-fly during member import
WITH new_chapters AS (
  INSERT INTO chapters (name, chapter_type, status)
  SELECT DISTINCT
    scraped->>'chapterName',
    'local',
    'active'
  FROM scraped_data_raw
  WHERE source_id = 'YOUR_SOURCE_ID'
    AND processing_status = 'pending'
    AND scraped->>'chapterName' IS NOT NULL
  ON CONFLICT (name) DO NOTHING
  RETURNING id, name
)
INSERT INTO members (email, first_name, last_name, chapter_id, status)
SELECT
  s.scraped->>'email',
  s.scraped->>'firstName',
  s.scraped->>'lastName',
  COALESCE(
    nc.id,
    (SELECT id FROM chapters WHERE name = s.scraped->>'chapterName')
  ),
  'active'::member_status_enum
FROM scraped_data_raw s
LEFT JOIN new_chapters nc ON nc.name = s.scraped->>'chapterName'
WHERE s.source_id = 'YOUR_SOURCE_ID'
  AND s.processing_status = 'pending';
```

---

## Troubleshooting

### Issue: Schema Fingerprints Not Generated

```sql
-- Check if trigger exists
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'scraped_data_raw';

-- Manually recalculate fingerprints
UPDATE scraped_data_raw
SET schema_fingerprint = md5(
  array_to_string(
    ARRAY(SELECT jsonb_object_keys(parsed_data) ORDER BY 1),
    ','
  )
)
WHERE schema_fingerprint IS NULL;
```

### Issue: Transformation Rules Not Working

```sql
-- Check rule status
SELECT * FROM transformation_rules
WHERE status = 'error'
ORDER BY last_execution DESC;

-- Test transformation function
SELECT
  input_path,
  transform_function,
  parsed_data #> string_to_array(trim(input_path, '$.'), '.') as extracted_value
FROM transformation_rules tr
CROSS JOIN scraped_data_raw sdr
WHERE tr.schema_id IN (
  SELECT id FROM discovered_schemas WHERE source_id = sdr.source_id
)
LIMIT 5;
```

### Issue: Duplicate Detection

```sql
-- Find potential duplicates by email
SELECT
  email,
  COUNT(*) as count,
  array_agg(id) as member_ids,
  array_agg(first_name || ' ' || last_name) as names
FROM members
GROUP BY email
HAVING COUNT(*) > 1;

-- Find potential duplicates by name and chapter
SELECT
  first_name,
  last_name,
  chapter_id,
  COUNT(*) as count,
  array_agg(email) as emails
FROM members
GROUP BY first_name, last_name, chapter_id
HAVING COUNT(*) > 1;
```

---

## Next Steps

1. **Replace YOUR_SOURCE_ID** with actual source IDs from step 1
2. **Prepare your scraped data** in JSON format
3. **Insert into scraped_data_raw** table
4. **Review discovered schemas** and create transformation rules
5. **Execute direct import** once mappings are validated
6. **Run validation queries** to ensure data quality
7. **Configure Supabase Auth** to map authenticated users to members table

For questions or assistance, refer to the [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) documentation.
