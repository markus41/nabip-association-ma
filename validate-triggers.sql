-- ============================================================================
-- NABIP AMS Trigger Validation Script
-- ============================================================================
-- This script validates that all triggers and auto-calculations work correctly
-- Run this AFTER sample-data.sql to verify the database schema
-- ============================================================================

BEGIN;

-- ============================================================================
-- TEST 1: Chapter Member Count Auto-Update
-- ============================================================================

SELECT '=== TEST 1: Chapter Member Count Trigger ===' as test_header;

-- Get initial counts
CREATE TEMP TABLE initial_chapter_counts AS
SELECT
  c.id as chapter_id,
  c.name as chapter_name,
  c.member_count as initial_count,
  COUNT(m.id) as actual_members
FROM chapters c
LEFT JOIN members m ON m.chapter_id = c.id
GROUP BY c.id, c.name, c.member_count;

SELECT * FROM initial_chapter_counts ORDER BY chapter_name;

-- Validate initial state
SELECT
  'Initial Chapter Counts' as test_name,
  CASE
    WHEN COUNT(*) = COUNT(CASE WHEN initial_count = actual_members THEN 1 END)
    THEN '✓ PASS - All chapter counts accurate'
    ELSE '✗ FAIL - ' || (COUNT(*) - COUNT(CASE WHEN initial_count = actual_members THEN 1 END))::text || ' chapters have incorrect counts'
  END as result,
  COUNT(*) as total_chapters,
  SUM(initial_count) as reported_total_members,
  SUM(actual_members) as actual_total_members
FROM initial_chapter_counts;

-- Test INSERT: Add new member and verify count increases
INSERT INTO members (
  email, first_name, last_name, member_type, chapter_id, status
) VALUES (
  'trigger-test-insert@example.com',
  'Trigger',
  'Test',
  'individual',
  (SELECT id FROM chapters WHERE name = 'California' LIMIT 1),
  'active'
);

SELECT
  'After INSERT Test' as test_name,
  c.name,
  c.member_count as current_count,
  icc.initial_count as previous_count,
  c.member_count - icc.initial_count as change,
  CASE
    WHEN c.member_count = icc.initial_count + 1 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as result
FROM chapters c
JOIN initial_chapter_counts icc ON icc.chapter_id = c.id
WHERE c.name = 'California';

-- Test UPDATE: Move member to different chapter
UPDATE members
SET chapter_id = (SELECT id FROM chapters WHERE name = 'Texas' LIMIT 1)
WHERE email = 'trigger-test-insert@example.com';

SELECT
  'After UPDATE (Move Chapter) Test' as test_name,
  c.name,
  c.member_count as current_count,
  icc.initial_count as initial_count,
  CASE
    WHEN c.name = 'California' AND c.member_count = icc.initial_count THEN '✓ PASS - California count restored'
    WHEN c.name = 'Texas' AND c.member_count = icc.initial_count + 1 THEN '✓ PASS - Texas count increased'
    ELSE '✗ FAIL'
  END as result
FROM chapters c
JOIN initial_chapter_counts icc ON icc.chapter_id = c.id
WHERE c.name IN ('California', 'Texas')
ORDER BY c.name;

-- Test DELETE: Remove member and verify count decreases
DELETE FROM members WHERE email = 'trigger-test-insert@example.com';

SELECT
  'After DELETE Test' as test_name,
  c.name,
  c.member_count as current_count,
  icc.initial_count as initial_count,
  CASE
    WHEN c.member_count = icc.initial_count THEN '✓ PASS - Count restored to initial'
    ELSE '✗ FAIL'
  END as result
FROM chapters c
JOIN initial_chapter_counts icc ON icc.chapter_id = c.id
WHERE c.name = 'Texas';

-- ============================================================================
-- TEST 2: Event Registration Count Auto-Update
-- ============================================================================

SELECT '=== TEST 2: Event Registration Count Trigger ===' as test_header;

-- Get initial event counts
CREATE TEMP TABLE initial_event_counts AS
SELECT
  e.id as event_id,
  e.title as event_title,
  e.registered_count as initial_count,
  e.capacity,
  COUNT(r.id) as actual_registrations
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id
GROUP BY e.id, e.title, e.registered_count, e.capacity;

SELECT
  event_title,
  initial_count,
  actual_registrations,
  capacity,
  CASE
    WHEN capacity IS NOT NULL
    THEN ROUND((initial_count::DECIMAL / capacity) * 100, 1) || '%'
    ELSE 'Unlimited'
  END as fill_percentage
FROM initial_event_counts
ORDER BY event_title;

-- Validate initial state
SELECT
  'Initial Event Counts' as test_name,
  CASE
    WHEN COUNT(*) = COUNT(CASE WHEN initial_count = actual_registrations THEN 1 END)
    THEN '✓ PASS - All event counts accurate'
    ELSE '✗ FAIL - ' || (COUNT(*) - COUNT(CASE WHEN initial_count = actual_registrations THEN 1 END))::text || ' events have incorrect counts'
  END as result
FROM initial_event_counts;

-- Test registration INSERT
INSERT INTO registrations (
  event_id,
  member_id,
  ticket_type_id,
  registration_status
) VALUES (
  (SELECT id FROM events WHERE title LIKE '%Medicare Advantage%' LIMIT 1),
  (SELECT id FROM members WHERE email = 'john.doe@healthinsurance.com' LIMIT 1),
  (SELECT id FROM ticket_types WHERE ticket_name = 'Webinar Registration' LIMIT 1),
  'confirmed'
);

SELECT
  'After Registration INSERT' as test_name,
  e.title,
  e.registered_count as current_count,
  iec.initial_count as previous_count,
  e.registered_count - iec.initial_count as change,
  CASE
    WHEN e.registered_count = iec.initial_count + 1 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as result
FROM events e
JOIN initial_event_counts iec ON iec.event_id = e.id
WHERE e.title LIKE '%Medicare Advantage%';

-- Cleanup test registration
DELETE FROM registrations
WHERE event_id = (SELECT id FROM events WHERE title LIKE '%Medicare Advantage%' LIMIT 1)
  AND member_id = (SELECT id FROM members WHERE email = 'john.doe@healthinsurance.com' LIMIT 1);

-- ============================================================================
-- TEST 3: Course Enrollment Count Auto-Update
-- ============================================================================

SELECT '=== TEST 3: Course Enrollment Count Trigger ===' as test_header;

-- Get initial course counts
CREATE TEMP TABLE initial_course_counts AS
SELECT
  c.id as course_id,
  c.title as course_title,
  c.enrolled_count as initial_count,
  COUNT(e.id) as actual_enrollments
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
GROUP BY c.id, c.title, c.enrolled_count;

SELECT
  course_title,
  initial_count,
  actual_enrollments
FROM initial_course_counts
ORDER BY course_title;

-- Validate initial state
SELECT
  'Initial Course Counts' as test_name,
  CASE
    WHEN COUNT(*) = COUNT(CASE WHEN initial_count = actual_enrollments THEN 1 END)
    THEN '✓ PASS - All course counts accurate'
    ELSE '✗ FAIL - ' || (COUNT(*) - COUNT(CASE WHEN initial_count = actual_enrollments THEN 1 END))::text || ' courses have incorrect counts'
  END as result
FROM initial_course_counts;

-- Test enrollment INSERT
INSERT INTO enrollments (
  member_id,
  course_id,
  enrollment_date,
  status,
  progress_percentage
) VALUES (
  (SELECT id FROM members WHERE email = 'jane.smith@benefitspro.com' LIMIT 1),
  (SELECT id FROM courses WHERE title LIKE '%ACA Compliance%' LIMIT 1),
  CURRENT_DATE,
  'in_progress',
  15
);

SELECT
  'After Enrollment INSERT' as test_name,
  c.title,
  c.enrolled_count as current_count,
  icc.initial_count as previous_count,
  c.enrolled_count - icc.initial_count as change,
  CASE
    WHEN c.enrolled_count = icc.initial_count + 1 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as result
FROM courses c
JOIN initial_course_counts icc ON icc.course_id = c.id
WHERE c.title LIKE '%ACA Compliance%';

-- Cleanup test enrollment
DELETE FROM enrollments
WHERE course_id = (SELECT id FROM courses WHERE title LIKE '%ACA Compliance%' LIMIT 1)
  AND member_id = (SELECT id FROM members WHERE email = 'jane.smith@benefitspro.com' LIMIT 1)
  AND enrollment_date = CURRENT_DATE;

-- ============================================================================
-- TEST 4: Auto-Generated Identifiers
-- ============================================================================

SELECT '=== TEST 4: Auto-Generated Identifiers ===' as test_header;

-- Test QR Code and Confirmation Number generation
INSERT INTO registrations (
  event_id,
  member_id,
  ticket_type_id,
  registration_status
) VALUES (
  (SELECT id FROM events LIMIT 1),
  (SELECT id FROM members LIMIT 1),
  (SELECT id FROM ticket_types LIMIT 1),
  'confirmed'
)
RETURNING
  qr_code,
  confirmation_number,
  CASE
    WHEN qr_code LIKE 'REG-%' AND LENGTH(qr_code) = 15 THEN '✓ QR Code Format Valid'
    ELSE '✗ QR Code Format Invalid'
  END as qr_validation,
  CASE
    WHEN confirmation_number LIKE 'CONF-%' AND LENGTH(confirmation_number) = 14 THEN '✓ Confirmation Format Valid'
    ELSE '✗ Confirmation Format Invalid'
  END as confirmation_validation;

-- Cleanup
DELETE FROM registrations
WHERE qr_code IN (
  SELECT qr_code FROM registrations
  ORDER BY created_at DESC
  LIMIT 1
);

-- ============================================================================
-- TEST 5: Invoice Total Auto-Calculation
-- ============================================================================

SELECT '=== TEST 5: Invoice Total Auto-Calculation ===' as test_header;

-- Create test invoice
INSERT INTO invoices (
  member_id,
  invoice_number,
  status,
  due_date
) VALUES (
  (SELECT id FROM members LIMIT 1),
  'TEST-INV-001',
  'draft',
  CURRENT_DATE + INTERVAL '30 days'
)
RETURNING
  id,
  invoice_number,
  subtotal,
  tax_amount,
  total_amount;

-- Add line items
INSERT INTO invoice_line_items (
  invoice_id,
  description,
  quantity,
  unit_price,
  line_total,
  tax_amount
) VALUES
  (
    (SELECT id FROM invoices WHERE invoice_number = 'TEST-INV-001'),
    'Test Item 1',
    2,
    5000, -- $50.00
    10000, -- 2 * $50.00
    800 -- 8% tax
  ),
  (
    (SELECT id FROM invoices WHERE invoice_number = 'TEST-INV-001'),
    'Test Item 2',
    1,
    12500, -- $125.00
    12500,
    1000 -- 8% tax
  );

-- Verify invoice totals were auto-calculated
SELECT
  'Invoice Total Calculation' as test_name,
  invoice_number,
  subtotal,
  tax_amount,
  total_amount,
  CASE
    WHEN subtotal = 22500 AND tax_amount = 1800 AND total_amount = 24300
    THEN '✓ PASS - Totals calculated correctly'
    ELSE '✗ FAIL - Expected subtotal=22500, tax=1800, total=24300'
  END as result
FROM invoices
WHERE invoice_number = 'TEST-INV-001';

-- Cleanup
DELETE FROM invoice_line_items
WHERE invoice_id = (SELECT id FROM invoices WHERE invoice_number = 'TEST-INV-001');
DELETE FROM invoices WHERE invoice_number = 'TEST-INV-001';

-- ============================================================================
-- TEST 6: Updated_at Timestamp Auto-Update
-- ============================================================================

SELECT '=== TEST 6: Updated_at Timestamp Auto-Update ===' as test_header;

-- Get initial timestamp
CREATE TEMP TABLE initial_timestamps AS
SELECT
  id,
  email,
  first_name,
  updated_at as initial_updated_at
FROM members
WHERE email = 'john.doe@healthinsurance.com';

-- Wait a moment and update
SELECT pg_sleep(1);

UPDATE members
SET first_name = 'John-Updated'
WHERE email = 'john.doe@healthinsurance.com';

-- Verify timestamp was updated
SELECT
  'Updated_at Trigger' as test_name,
  m.email,
  it.initial_updated_at,
  m.updated_at as current_updated_at,
  CASE
    WHEN m.updated_at > it.initial_updated_at
    THEN '✓ PASS - Timestamp auto-updated'
    ELSE '✗ FAIL - Timestamp not updated'
  END as result
FROM members m
JOIN initial_timestamps it ON it.id = m.id;

-- Restore original value
UPDATE members
SET first_name = 'John'
WHERE email = 'john.doe@healthinsurance.com';

-- ============================================================================
-- TEST 7: Campaign Metrics Auto-Calculation
-- ============================================================================

SELECT '=== TEST 7: Campaign Metrics Auto-Calculation ===' as test_header;

-- Update campaign with engagement data
UPDATE campaigns
SET
  sent_count = 1000,
  unique_opens_count = 450,
  unique_clicks_count = 120
WHERE campaign_name LIKE '%Annual Conference%';

-- Verify metrics were auto-calculated
SELECT
  'Campaign Metrics' as test_name,
  campaign_name,
  sent_count,
  unique_opens_count,
  unique_clicks_count,
  open_rate,
  click_rate,
  click_to_open_rate,
  CASE
    WHEN open_rate = 45.00 AND click_rate = 12.00 AND click_to_open_rate = 26.67
    THEN '✓ PASS - Metrics calculated correctly'
    WHEN open_rate IS NULL
    THEN '⚠ WARNING - Metrics not calculated (trigger may not have fired)'
    ELSE '✗ FAIL - Incorrect calculations'
  END as result
FROM campaigns
WHERE campaign_name LIKE '%Annual Conference%';

-- ============================================================================
-- TEST 8: Slug Auto-Generation
-- ============================================================================

SELECT '=== TEST 8: Slug Auto-Generation ===' as test_header;

-- Test course slug generation
INSERT INTO courses (
  title,
  description,
  course_type,
  credits,
  status,
  price
) VALUES (
  'Test Course: Advanced Medicare Planning',
  'Test course description',
  'continuing_education',
  5,
  'draft',
  9900
)
RETURNING
  title,
  slug,
  CASE
    WHEN slug = 'test-course-advanced-medicare-planning'
    THEN '✓ PASS - Slug generated correctly'
    ELSE '✗ FAIL - Expected slug: test-course-advanced-medicare-planning, Got: ' || slug
  END as result;

-- Cleanup
DELETE FROM courses WHERE title = 'Test Course: Advanced Medicare Planning';

-- Test chapter news slug generation
INSERT INTO chapter_news (
  chapter_id,
  title,
  content,
  category,
  status,
  author_id
) VALUES (
  (SELECT id FROM chapters WHERE name = 'California' LIMIT 1),
  'Test News: Important Announcement!',
  'Test content',
  'announcement',
  'draft',
  (SELECT id FROM members LIMIT 1)
)
RETURNING
  title,
  slug,
  CASE
    WHEN slug LIKE 'test-news-important-announcement%'
    THEN '✓ PASS - Slug generated correctly'
    ELSE '✗ FAIL - Unexpected slug: ' || slug
  END as result;

-- Cleanup
DELETE FROM chapter_news WHERE title = 'Test News: Important Announcement!';

ROLLBACK; -- Rollback all test changes

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

SELECT '=== TRIGGER VALIDATION SUMMARY ===' as summary_header;

SELECT
  'All validation tests completed!' as message,
  'Review the results above to ensure all triggers are working correctly.' as instruction,
  'If any tests failed, check the trigger definitions and function implementations.' as troubleshooting;

-- Run this final check on ACTUAL data (not rolled back)
SELECT
  'Production Data Health Check' as check_name,
  (SELECT COUNT(*) FROM chapters) as total_chapters,
  (SELECT SUM(member_count) FROM chapters) as reported_members,
  (SELECT COUNT(*) FROM members) as actual_members,
  CASE
    WHEN (SELECT SUM(member_count) FROM chapters) = (SELECT COUNT(*) FROM members)
    THEN '✓ PASS - Chapter counts accurate'
    ELSE '✗ FAIL - Chapter counts mismatch'
  END as chapter_count_validation,
  (SELECT SUM(registered_count) FROM events) as reported_registrations,
  (SELECT COUNT(*) FROM registrations) as actual_registrations,
  CASE
    WHEN (SELECT SUM(registered_count) FROM events) = (SELECT COUNT(*) FROM registrations)
    THEN '✓ PASS - Event counts accurate'
    ELSE '✗ FAIL - Event counts mismatch'
  END as event_count_validation,
  (SELECT SUM(enrolled_count) FROM courses) as reported_enrollments,
  (SELECT COUNT(*) FROM enrollments) as actual_enrollments,
  CASE
    WHEN (SELECT SUM(enrolled_count) FROM courses) = (SELECT COUNT(*) FROM enrollments)
    THEN '✓ PASS - Course counts accurate'
    ELSE '✗ FAIL - Course counts mismatch'
  END as course_count_validation;
