-- ============================================================================
-- NABIP AMS Discovery System Test
-- ============================================================================
-- This script tests the Discovery-First architecture with realistic
-- web-scraped data containing varying schemas and field names.
--
-- Execute this in your Supabase SQL Editor after running sample-data.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Register Test Data Sources
-- ============================================================================

INSERT INTO scraped_data_sources (
  source_name,
  source_type,
  source_url,
  scraping_frequency,
  status
) VALUES
  (
    'NABIP Member Directory - Test',
    'member_directory',
    'https://nabip.org/members',
    'monthly',
    'active'
  ),
  (
    'NABIP Events Calendar - Test',
    'event_listing',
    'https://nabip.org/events',
    'daily',
    'active'
  )
RETURNING id, source_name;

-- Store the source IDs (you'll need to replace these in subsequent queries)
-- Example: First source might be UUID like 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

-- ============================================================================
-- STEP 2: Insert Member Data with VARYING SCHEMAS
-- ============================================================================
-- This simulates web scraping where different pages have different field names

-- First member - Schema variant 1 (firstName, lastName, email)
INSERT INTO scraped_data_raw (
  source_id,
  source_reference,
  parsed_data
) VALUES
  (
    (SELECT id FROM scraped_data_sources WHERE source_name = 'NABIP Member Directory - Test'),
    'member-page-001',
    '{
      "firstName": "Amanda",
      "lastName": "Martinez",
      "email": "amanda.martinez@insurance-pro.com",
      "memberType": "individual",
      "chapterName": "Florida",
      "phone": "555-111-2222",
      "status": "Active",
      "joinDate": "2024-03-15",
      "licenses": [
        {
          "state": "FL",
          "licenseNumber": "FL98765",
          "type": "Health"
        },
        {
          "state": "FL",
          "licenseNumber": "FL98766",
          "type": "Life"
        }
      ],
      "practiceAreas": ["Health", "Medicare"],
      "designations": ["REBC"]
    }'::jsonb
  );

-- Second member - Schema variant 2 (first_name, last_name, email_address)
INSERT INTO scraped_data_raw (
  source_id,
  source_reference,
  parsed_data
) VALUES
  (
    (SELECT id FROM scraped_data_sources WHERE source_name = 'NABIP Member Directory - Test'),
    'member-page-002',
    '{
      "first_name": "David",
      "last_name": "Thompson",
      "email_address": "david.t@benefits-agency.com",
      "membership_type": "organizational",
      "chapter": "Illinois",
      "contact_phone": "555-333-4444",
      "member_status": "Active",
      "member_since": "2023-07-20",
      "insurance_licenses": [
        {
          "state": "IL",
          "license_id": "IL12345",
          "license_category": "Group Health"
        }
      ],
      "specialty_areas": ["Group Health", "Employee Benefits"],
      "professional_designations": ["ChFC", "RHU"]
    }'::jsonb
  );

-- Third member - Schema variant 3 (full_name combined, different structure)
INSERT INTO scraped_data_raw (
  source_id,
  source_reference,
  parsed_data
) VALUES
  (
    (SELECT id FROM scraped_data_sources WHERE source_name = 'NABIP Member Directory - Test'),
    'member-page-003',
    '{
      "full_name": "Jennifer Lee",
      "primary_email": "jennifer.lee@health-advisors.com",
      "type": "individual",
      "home_chapter": "Washington",
      "telephone": "555-555-6666",
      "active": true,
      "registration_date": "2022-11-10",
      "state_licenses": ["WA45678 - Health", "WA45679 - Life"],
      "focus_areas": ["Health", "Life", "Disability"]
    }'::jsonb
  );

-- Fourth member - Schema variant 4 (minimal fields)
INSERT INTO scraped_data_raw (
  source_id,
  source_reference,
  parsed_data
) VALUES
  (
    (SELECT id FROM scraped_data_sources WHERE source_name = 'NABIP Member Directory - Test'),
    'member-page-004',
    '{
      "name": "Robert Wilson",
      "email": "r.wilson@medicare-experts.com",
      "chapter": "Arizona"
    }'::jsonb
  );

-- ============================================================================
-- STEP 3: Insert Event Data with VARYING SCHEMAS
-- ============================================================================

-- First event - Schema variant 1
INSERT INTO scraped_data_raw (
  source_id,
  source_reference,
  parsed_data
) VALUES
  (
    (SELECT id FROM scraped_data_sources WHERE source_name = 'NABIP Events Calendar - Test'),
    'event-001',
    '{
      "eventTitle": "Medicare Planning Workshop 2025",
      "eventDescription": "Comprehensive Medicare planning strategies",
      "eventType": "in-person",
      "startDateTime": "2025-04-10T09:00:00",
      "endDateTime": "2025-04-10T17:00:00",
      "venue": "Phoenix Convention Center",
      "maxAttendees": 150,
      "registrationFee": 129.00,
      "memberPrice": 99.00,
      "ceCredits": 8
    }'::jsonb
  );

-- Second event - Schema variant 2
INSERT INTO scraped_data_raw (
  source_id,
  source_reference,
  parsed_data
) VALUES
  (
    (SELECT id FROM scraped_data_sources WHERE source_name = 'NABIP Events Calendar - Test'),
    'event-002',
    '{
      "title": "Virtual CE Webinar: ACA Updates",
      "description": "Latest Affordable Care Act compliance updates",
      "format": "virtual",
      "date": "2025-03-15",
      "time": "14:00",
      "duration_hours": 2,
      "capacity": 500,
      "cost": 0,
      "continuing_education_credits": 2
    }'::jsonb
  );

COMMIT;

-- ============================================================================
-- STEP 4: VERIFY DISCOVERY SYSTEM WORKED
-- ============================================================================

-- Check that schema fingerprints were auto-calculated
SELECT
  source_reference,
  schema_fingerprint,
  processing_status,
  jsonb_object_keys(parsed_data) as detected_fields
FROM scraped_data_raw
WHERE source_id IN (
  SELECT id FROM scraped_data_sources
  WHERE source_name LIKE '%Test%'
)
ORDER BY created_at;

-- View all discovered schemas (should show all field variations)
SELECT
  ds.field_path,
  ds.field_type,
  ds.example_value,
  ds.occurrence_count,
  ds.mapping_status,
  ds.target_table,
  ds.target_column,
  sds.source_name
FROM discovered_schemas ds
JOIN scraped_data_sources sds ON ds.source_id = sds.id
WHERE sds.source_name LIKE '%Test%'
ORDER BY ds.occurrence_count DESC, ds.field_path;

-- Check for schema changes detected (should show when fields vary)
SELECT
  sc.change_type,
  sc.field_path,
  sc.old_value,
  sc.new_value,
  sc.review_status,
  sc.detected_at,
  sds.source_name
FROM schema_changes sc
JOIN scraped_data_sources sds ON sc.source_id = sds.id
WHERE sds.source_name LIKE '%Test%'
ORDER BY sc.detected_at DESC;

-- Find unmapped fields that need transformation rules
SELECT
  sds.source_name,
  ds.field_path,
  ds.field_type,
  ds.example_value,
  ds.occurrence_count,
  CASE
    WHEN ds.field_path ILIKE '%email%' THEN 'members.email'
    WHEN ds.field_path ILIKE '%first%name%' OR ds.field_path = '$.full_name' THEN 'members.first_name'
    WHEN ds.field_path ILIKE '%last%name%' THEN 'members.last_name'
    WHEN ds.field_path ILIKE '%phone%' OR ds.field_path ILIKE '%telephone%' THEN 'members.phone'
    WHEN ds.field_path ILIKE '%chapter%' THEN 'members.chapter_id (lookup)'
    WHEN ds.field_path ILIKE '%status%' OR ds.field_path = '$.active' THEN 'members.status'
    WHEN ds.field_path ILIKE '%type%' AND NOT ds.field_path ILIKE '%license%' THEN 'members.member_type'
    ELSE 'UNMAPPED - needs review'
  END as suggested_mapping
FROM discovered_schemas ds
JOIN scraped_data_sources sds ON ds.source_id = sds.id
WHERE sds.source_name LIKE '%Test%'
  AND ds.mapping_status = 'unmapped'
ORDER BY ds.occurrence_count DESC;

-- ============================================================================
-- STEP 5: CREATE TRANSFORMATION RULES
-- ============================================================================

-- Create transformation rules for the most common fields
-- NOTE: This assumes the schema discovery populated the discovered_schemas table

-- Email field transformations (handles: email, email_address, primary_email)
INSERT INTO transformation_rules (
  schema_id,
  rule_type,
  input_path,
  output_table,
  output_column,
  validation_rules,
  status
)
SELECT
  id,
  'extract',
  field_path,
  'members',
  'email',
  '{"required": true, "format": "email"}'::jsonb,
  'active'
FROM discovered_schemas
WHERE source_id IN (SELECT id FROM scraped_data_sources WHERE source_name LIKE '%Test%')
  AND (field_path ILIKE '%email%')
  AND mapping_status = 'unmapped'
ON CONFLICT DO NOTHING;

-- First name transformations
INSERT INTO transformation_rules (
  schema_id,
  rule_type,
  input_path,
  output_table,
  output_column,
  transform_function,
  status
)
SELECT
  id,
  'extract',
  field_path,
  'members',
  'first_name',
  CASE
    WHEN field_path = '$.full_name' THEN 'SPLIT_PART(value, '' '', 1)'
    ELSE NULL
  END,
  'active'
FROM discovered_schemas
WHERE source_id IN (SELECT id FROM scraped_data_sources WHERE source_name LIKE '%Test%')
  AND (
    field_path ILIKE '%first%name%'
    OR field_path = '$.full_name'
  )
  AND mapping_status = 'unmapped'
ON CONFLICT DO NOTHING;

-- Mark schemas as mapped
UPDATE discovered_schemas
SET
  mapping_status = 'mapped',
  target_table = 'members',
  target_column = CASE
    WHEN field_path ILIKE '%email%' THEN 'email'
    WHEN field_path ILIKE '%first%name%' OR field_path = '$.full_name' THEN 'first_name'
    WHEN field_path ILIKE '%last%name%' THEN 'last_name'
    WHEN field_path ILIKE '%phone%' OR field_path ILIKE '%telephone%' THEN 'phone'
    ELSE NULL
  END
WHERE source_id IN (SELECT id FROM scraped_data_sources WHERE source_name LIKE '%Test%')
  AND (
    field_path ILIKE '%email%'
    OR field_path ILIKE '%name%'
    OR field_path ILIKE '%phone%'
    OR field_path ILIKE '%telephone%'
  );

-- ============================================================================
-- STEP 6: TEST DIRECT IMPORT FROM DISCOVERED DATA
-- ============================================================================

-- Create Florida and Illinois chapters if they don't exist
INSERT INTO chapters (name, chapter_type, status)
VALUES
  ('Florida', 'state', 'active'),
  ('Illinois', 'state', 'active'),
  ('Washington', 'state', 'active'),
  ('Arizona', 'state', 'active')
ON CONFLICT (name) DO NOTHING;

-- Import members using discovered field mappings
-- This demonstrates how to handle varying field names
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
  COALESCE(
    parsed_data->>'email',
    parsed_data->>'email_address',
    parsed_data->>'primary_email'
  ) as email,
  COALESCE(
    parsed_data->>'firstName',
    parsed_data->>'first_name',
    SPLIT_PART(parsed_data->>'full_name', ' ', 1),
    parsed_data->>'name'
  ) as first_name,
  COALESCE(
    parsed_data->>'lastName',
    parsed_data->>'last_name',
    SPLIT_PART(parsed_data->>'full_name', ' ', 2)
  ) as last_name,
  COALESCE(
    parsed_data->>'phone',
    parsed_data->>'contact_phone',
    parsed_data->>'telephone'
  ) as phone,
  CASE
    WHEN LOWER(COALESCE(parsed_data->>'memberType', parsed_data->>'membership_type', parsed_data->>'type', 'individual')) = 'organizational'
    THEN 'organizational'::member_type_enum
    ELSE 'individual'::member_type_enum
  END as member_type,
  (
    SELECT id FROM chapters
    WHERE name = COALESCE(
      parsed_data->>'chapterName',
      parsed_data->>'chapter',
      parsed_data->>'home_chapter'
    )
    LIMIT 1
  ) as chapter_id,
  CASE
    WHEN LOWER(COALESCE(parsed_data->>'status', parsed_data->>'member_status', 'active')) = 'active'
      OR (parsed_data->>'active')::boolean = true
    THEN 'active'::member_status_enum
    ELSE 'pending'::member_status_enum
  END as status,
  COALESCE(
    (parsed_data->>'joinDate')::date,
    (parsed_data->>'member_since')::date,
    (parsed_data->>'registration_date')::date,
    CURRENT_DATE
  ) as member_since
FROM scraped_data_raw
WHERE source_id IN (
  SELECT id FROM scraped_data_sources WHERE source_name LIKE '%Member Directory%Test%'
)
  AND processing_status = 'pending'
  AND COALESCE(
    parsed_data->>'email',
    parsed_data->>'email_address',
    parsed_data->>'primary_email'
  ) IS NOT NULL
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
WHERE source_id IN (
  SELECT id FROM scraped_data_sources WHERE source_name LIKE '%Member Directory%Test%'
)
  AND processing_status = 'pending';

-- ============================================================================
-- STEP 7: VALIDATION REPORT
-- ============================================================================

-- Test Results Summary
SELECT
  'Discovery System Test Results' as test_category,
  '---' as separator;

-- 1. Verify raw data was fingerprinted
SELECT
  'Schema Fingerprinting' as test_name,
  COUNT(*) as total_records,
  COUNT(schema_fingerprint) as fingerprinted_records,
  COUNT(DISTINCT schema_fingerprint) as unique_schemas,
  CASE
    WHEN COUNT(*) = COUNT(schema_fingerprint) THEN '✓ PASS - All records fingerprinted'
    ELSE '✗ FAIL - Some records missing fingerprints'
  END as result
FROM scraped_data_raw
WHERE source_id IN (
  SELECT id FROM scraped_data_sources WHERE source_name LIKE '%Test%'
);

-- 2. Verify schemas were discovered
SELECT
  'Schema Discovery' as test_name,
  COUNT(DISTINCT field_path) as total_fields_discovered,
  COUNT(DISTINCT CASE WHEN mapping_status = 'mapped' THEN field_path END) as mapped_fields,
  COUNT(DISTINCT CASE WHEN mapping_status = 'unmapped' THEN field_path END) as unmapped_fields,
  CASE
    WHEN COUNT(DISTINCT field_path) > 0 THEN '✓ PASS - Schemas auto-discovered'
    ELSE '✗ FAIL - No schemas discovered'
  END as result
FROM discovered_schemas
WHERE source_id IN (
  SELECT id FROM scraped_data_sources WHERE source_name LIKE '%Test%'
);

-- 3. Verify transformation rules were created
SELECT
  'Transformation Rules' as test_name,
  COUNT(*) as total_rules,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_rules,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ PASS - Rules created'
    ELSE '✗ FAIL - No rules created'
  END as result
FROM transformation_rules
WHERE schema_id IN (
  SELECT id FROM discovered_schemas
  WHERE source_id IN (
    SELECT id FROM scraped_data_sources WHERE source_name LIKE '%Test%'
  )
);

-- 4. Verify members were imported
SELECT
  'Member Import' as test_name,
  COUNT(*) as members_imported,
  COUNT(CASE WHEN email LIKE '%insurance-pro.com' THEN 1 END) +
  COUNT(CASE WHEN email LIKE '%benefits-agency.com' THEN 1 END) +
  COUNT(CASE WHEN email LIKE '%health-advisors.com' THEN 1 END) +
  COUNT(CASE WHEN email LIKE '%medicare-experts.com' THEN 1 END) as test_members_found,
  CASE
    WHEN COUNT(*) >= 4 THEN '✓ PASS - Test members imported'
    ELSE '✗ FAIL - Some members not imported'
  END as result
FROM members
WHERE email IN (
  'amanda.martinez@insurance-pro.com',
  'david.t@benefits-agency.com',
  'jennifer.lee@health-advisors.com',
  'r.wilson@medicare-experts.com'
);

-- 5. Show discovered field variations
SELECT
  'Field Name Variations Detected:' as analysis,
  field_path,
  field_type,
  occurrence_count,
  mapping_status,
  COALESCE(target_table || '.' || target_column, 'UNMAPPED') as mapped_to
FROM discovered_schemas
WHERE source_id IN (
  SELECT id FROM scraped_data_sources WHERE source_name LIKE '%Test%'
)
ORDER BY
  CASE
    WHEN field_path ILIKE '%email%' THEN 1
    WHEN field_path ILIKE '%name%' THEN 2
    WHEN field_path ILIKE '%phone%' THEN 3
    WHEN field_path ILIKE '%chapter%' THEN 4
    ELSE 5
  END,
  occurrence_count DESC;

-- 6. Schema change detection
SELECT
  'Schema Changes Detected:' as analysis,
  change_type,
  field_path,
  detected_at,
  review_status
FROM schema_changes
WHERE source_id IN (
  SELECT id FROM scraped_data_sources WHERE source_name LIKE '%Test%'
)
ORDER BY detected_at DESC;

-- ============================================================================
-- CLEANUP (optional - uncomment to remove test data)
-- ============================================================================

-- DELETE FROM members WHERE email IN (
--   'amanda.martinez@insurance-pro.com',
--   'david.t@benefits-agency.com',
--   'jennifer.lee@health-advisors.com',
--   'r.wilson@medicare-experts.com'
-- );
--
-- DELETE FROM transformation_rules
-- WHERE schema_id IN (
--   SELECT id FROM discovered_schemas
--   WHERE source_id IN (
--     SELECT id FROM scraped_data_sources WHERE source_name LIKE '%Test%'
--   )
-- );
--
-- DELETE FROM schema_changes
-- WHERE source_id IN (
--   SELECT id FROM scraped_data_sources WHERE source_name LIKE '%Test%'
-- );
--
-- DELETE FROM discovered_schemas
-- WHERE source_id IN (
--   SELECT id FROM scraped_data_sources WHERE source_name LIKE '%Test%'
-- );
--
-- DELETE FROM scraped_data_raw
-- WHERE source_id IN (
--   SELECT id FROM scraped_data_sources WHERE source_name LIKE '%Test%'
-- );
--
-- DELETE FROM scraped_data_sources
-- WHERE source_name LIKE '%Test%';
