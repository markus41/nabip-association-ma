-- ============================================================================
-- NABIP AMS Sample Test Data
-- ============================================================================
-- This script populates the database with realistic test data to validate
-- triggers, constraints, and business logic across all tables.
--
-- Execute this in your Supabase SQL Editor to test the schema.
-- ============================================================================

-- Clean up existing test data (optional - remove if you want to keep data)
-- DELETE FROM registrations;
-- DELETE FROM enrollments;
-- DELETE FROM member_designations;
-- DELETE FROM member_practice_areas;
-- DELETE FROM member_licenses;
-- DELETE FROM credentials;
-- DELETE FROM members;
-- DELETE FROM ticket_types;
-- DELETE FROM event_sessions;
-- DELETE FROM event_questions;
-- DELETE FROM discount_codes;
-- DELETE FROM events;
-- DELETE FROM courses;
-- DELETE FROM chapter_leaders;
-- DELETE FROM chapter_news;
-- DELETE FROM chapters;

BEGIN;

-- ============================================================================
-- 1. CHAPTERS - Hierarchical structure (National → State → Local)
-- ============================================================================

INSERT INTO chapters (id, name, chapter_type, parent_chapter_id, status, address) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'NABIP National',
    'national',
    NULL,
    'active',
    '{"street": "1212 New York Ave NW", "city": "Washington", "state": "DC", "zip": "20005"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'California',
    'state',
    '00000000-0000-0000-0000-000000000001',
    'active',
    '{"street": "1201 K Street", "city": "Sacramento", "state": "CA", "zip": "95814"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Texas',
    'state',
    '00000000-0000-0000-0000-000000000001',
    'active',
    '{"street": "1701 Congress Avenue", "city": "Austin", "state": "TX", "zip": "78701"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'New York',
    'state',
    '00000000-0000-0000-0000-000000000001',
    'active',
    '{"street": "Empire State Building", "city": "New York", "state": "NY", "zip": "10001"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'Los Angeles',
    'local',
    '00000000-0000-0000-0000-000000000002',
    'active',
    '{"street": "633 W 5th Street", "city": "Los Angeles", "state": "CA", "zip": "90071"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    'San Francisco',
    'local',
    '00000000-0000-0000-0000-000000000002',
    'active',
    '{"street": "1 Market Street", "city": "San Francisco", "state": "CA", "zip": "94105"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000007',
    'Houston',
    'local',
    '00000000-0000-0000-0000-000000000003',
    'active',
    '{"street": "901 Bagby Street", "city": "Houston", "state": "TX", "zip": "77002"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000008',
    'Dallas',
    'local',
    '00000000-0000-0000-0000-000000000003',
    'active',
    '{"street": "1500 Marilla Street", "city": "Dallas", "state": "TX", "zip": "75201"}'::jsonb
  );

-- ============================================================================
-- 2. MEMBERS - Various membership types and statuses
-- ============================================================================

INSERT INTO members (
  id, email, first_name, last_name, phone, member_type, chapter_id, status,
  member_since, address, preferences, engagement_score
) VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    'john.doe@healthinsurance.com',
    'John',
    'Doe',
    '555-123-4567',
    'individual',
    '00000000-0000-0000-0000-000000000005',
    'active',
    '2023-01-15',
    '{"street": "123 Main St", "city": "Los Angeles", "state": "CA", "zip": "90001"}'::jsonb,
    '{"emailNotifications": true, "language": "en", "timezone": "America/Los_Angeles"}'::jsonb,
    85
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'jane.smith@benefitspro.com',
    'Jane',
    'Smith',
    '555-987-6543',
    'individual',
    '00000000-0000-0000-0000-000000000006',
    'active',
    '2022-06-20',
    '{"street": "456 Market St", "city": "San Francisco", "state": "CA", "zip": "94102"}'::jsonb,
    '{"emailNotifications": true, "language": "en", "timezone": "America/Los_Angeles"}'::jsonb,
    92
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'robert.johnson@medicare-experts.com',
    'Robert',
    'Johnson',
    '555-456-7890',
    'organizational',
    '00000000-0000-0000-0000-000000000007',
    'active',
    '2021-03-10',
    '{"street": "789 Insurance Blvd", "city": "Houston", "state": "TX", "zip": "77001"}'::jsonb,
    '{"emailNotifications": false, "language": "en", "timezone": "America/Chicago"}'::jsonb,
    78
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    'emily.williams@grouphealth.com',
    'Emily',
    'Williams',
    '555-234-5678',
    'individual',
    '00000000-0000-0000-0000-000000000005',
    'active',
    '2020-11-05',
    '{"street": "321 Health Ave", "city": "Los Angeles", "state": "CA", "zip": "90015"}'::jsonb,
    '{"emailNotifications": true, "language": "en", "timezone": "America/Los_Angeles"}'::jsonb,
    95
  ),
  (
    '00000000-0000-0000-0000-000000000105',
    'michael.brown@lifeinsurance.com',
    'Michael',
    'Brown',
    '555-345-6789',
    'individual',
    '00000000-0000-0000-0000-000000000008',
    'active',
    '2024-01-01',
    '{"street": "654 Commerce St", "city": "Dallas", "state": "TX", "zip": "75201"}'::jsonb,
    '{"emailNotifications": true, "language": "en", "timezone": "America/Chicago"}'::jsonb,
    60
  ),
  (
    '00000000-0000-0000-0000-000000000106',
    'sarah.davis@pending-member.com',
    'Sarah',
    'Davis',
    '555-567-8901',
    'individual',
    '00000000-0000-0000-0000-000000000006',
    'pending',
    '2025-01-10',
    '{"street": "987 Pending Ln", "city": "San Francisco", "state": "CA", "zip": "94110"}'::jsonb,
    '{"emailNotifications": true, "language": "en", "timezone": "America/Los_Angeles"}'::jsonb,
    0
  );

-- ============================================================================
-- 3. MEMBER LICENSES - State insurance licenses
-- ============================================================================

INSERT INTO member_licenses (member_id, state, license_number, license_type, status, issue_date, expiry_date) VALUES
  ('00000000-0000-0000-0000-000000000101', 'CA', 'CA0123456', 'Health', 'active', '2023-01-15', '2026-01-15'),
  ('00000000-0000-0000-0000-000000000101', 'CA', 'CA0123457', 'Life', 'active', '2023-02-20', '2026-02-20'),
  ('00000000-0000-0000-0000-000000000102', 'CA', 'CA0234567', 'Health', 'active', '2022-06-20', '2025-06-20'),
  ('00000000-0000-0000-0000-000000000102', 'CA', 'CA0234568', 'Disability', 'active', '2022-06-20', '2025-06-20'),
  ('00000000-0000-0000-0000-000000000103', 'TX', 'TX1234567', 'Health', 'active', '2021-03-10', '2026-03-10'),
  ('00000000-0000-0000-0000-000000000103', 'TX', 'TX1234568', 'Life', 'active', '2021-03-10', '2026-03-10'),
  ('00000000-0000-0000-0000-000000000104', 'CA', 'CA0345678', 'Group Health', 'active', '2020-11-05', '2025-11-05'),
  ('00000000-0000-0000-0000-000000000105', 'TX', 'TX2345678', 'Life', 'active', '2024-01-01', '2027-01-01');

-- ============================================================================
-- 4. MEMBER PRACTICE AREAS
-- ============================================================================

INSERT INTO member_practice_areas (member_id, practice_area) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Health'),
  ('00000000-0000-0000-0000-000000000101', 'Life'),
  ('00000000-0000-0000-0000-000000000102', 'Health'),
  ('00000000-0000-0000-0000-000000000102', 'Disability'),
  ('00000000-0000-0000-0000-000000000103', 'Medicare'),
  ('00000000-0000-0000-0000-000000000103', 'Group Health'),
  ('00000000-0000-0000-0000-000000000104', 'Group Health'),
  ('00000000-0000-0000-0000-000000000104', 'Employee Benefits'),
  ('00000000-0000-0000-0000-000000000105', 'Life'),
  ('00000000-0000-0000-0000-000000000105', 'Long-Term Care');

-- ============================================================================
-- 5. MEMBER DESIGNATIONS - Professional certifications
-- ============================================================================

INSERT INTO member_designations (member_id, designation_type, awarded_date, expiry_date) VALUES
  ('00000000-0000-0000-0000-000000000101', 'REBC', '2023-05-15', '2028-05-15'),
  ('00000000-0000-0000-0000-000000000101', 'RHU', '2024-03-20', '2029-03-20'),
  ('00000000-0000-0000-0000-000000000102', 'REBC', '2023-08-10', '2028-08-10'),
  ('00000000-0000-0000-0000-000000000103', 'CLU', '2022-11-05', '2027-11-05'),
  ('00000000-0000-0000-0000-000000000104', 'ChFC', '2021-09-15', '2026-09-15'),
  ('00000000-0000-0000-0000-000000000104', 'RHU', '2022-03-10', '2027-03-10');

-- ============================================================================
-- 6. EVENTS - Various event types and formats
-- ============================================================================

INSERT INTO events (
  id, title, description, format, start_date, end_date, location_name,
  capacity, status, visibility, settings
) VALUES
  (
    '00000000-0000-0000-0000-000000000201',
    '2025 NABIP Annual Conference',
    'Join us for the premier event for health and benefits professionals. Network with industry leaders, earn CE credits, and discover the latest trends.',
    'in-person',
    '2025-06-15 09:00:00',
    '2025-06-17 17:00:00',
    'Austin Convention Center, Austin, TX',
    500,
    'published',
    'public',
    '{"enableQRCheckIn": true, "sendReminderEmails": true, "requireApproval": false}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    'CE Webinar: Medicare Advantage Updates 2025',
    'Stay current on the latest Medicare Advantage regulations and compliance requirements.',
    'virtual',
    '2025-02-20 14:00:00',
    '2025-02-20 16:00:00',
    'Online via Zoom',
    1000,
    'published',
    'public',
    '{"enableQRCheckIn": false, "sendReminderEmails": true, "requireApproval": false}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    'California Chapter Leadership Summit',
    'Leadership training for chapter officers. Learn best practices for member engagement and chapter growth.',
    'hybrid',
    '2025-03-10 09:00:00',
    '2025-03-10 17:00:00',
    'San Francisco Marriott Marquis',
    100,
    'published',
    'members_only',
    '{"enableQRCheckIn": true, "sendReminderEmails": true, "requireApproval": true}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000204',
    'Health Insurance Marketplace Strategies',
    'Advanced strategies for navigating the Health Insurance Marketplace.',
    'in-person',
    '2025-04-15 13:00:00',
    '2025-04-15 17:00:00',
    'Los Angeles Convention Center',
    200,
    'published',
    'public',
    '{"enableQRCheckIn": true, "sendReminderEmails": true, "requireApproval": false}'::jsonb
  );

-- ============================================================================
-- 7. TICKET TYPES - Event pricing tiers
-- ============================================================================

INSERT INTO ticket_types (event_id, ticket_name, description, price, member_price, quantity_available, status) VALUES
  (
    '00000000-0000-0000-0000-000000000201',
    'Full Conference Pass',
    'Access to all conference sessions, meals, and networking events',
    59900,
    49900,
    400,
    'available'
  ),
  (
    '00000000-0000-0000-0000-000000000201',
    'Single Day Pass',
    'Access to one day of conference sessions',
    24900,
    19900,
    100,
    'available'
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    'Webinar Registration',
    'Live webinar with Q&A session and recording access',
    0,
    0,
    1000,
    'available'
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    'In-Person Attendance',
    'Attend in person with lunch and materials',
    12900,
    9900,
    50,
    'available'
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    'Virtual Attendance',
    'Join remotely via video conference',
    4900,
    2900,
    50,
    'available'
  ),
  (
    '00000000-0000-0000-0000-000000000204',
    'Standard Registration',
    'Workshop attendance with materials',
    7900,
    4900,
    200,
    'available'
  );

-- ============================================================================
-- 8. EVENT SESSIONS - Multi-track scheduling
-- ============================================================================

INSERT INTO event_sessions (event_id, session_title, description, start_time, end_time, location, ce_credits) VALUES
  (
    '00000000-0000-0000-0000-000000000201',
    'Keynote: The Future of Employee Benefits',
    'Opening keynote address on emerging trends',
    '2025-06-15 09:00:00',
    '2025-06-15 10:30:00',
    'Main Ballroom',
    1.5
  ),
  (
    '00000000-0000-0000-0000-000000000201',
    'Medicare Supplement Sales Workshop',
    'Hands-on training for Medicare supplement sales',
    '2025-06-15 11:00:00',
    '2025-06-15 13:00:00',
    'Room 101',
    2.0
  ),
  (
    '00000000-0000-0000-0000-000000000201',
    'Group Health Underwriting Trends',
    'Latest trends in group health underwriting',
    '2025-06-15 14:00:00',
    '2025-06-15 16:00:00',
    'Room 102',
    2.0
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    'Chapter Growth Strategies',
    'Proven methods for growing chapter membership',
    '2025-03-10 10:00:00',
    '2025-03-10 12:00:00',
    'Conference Room A',
    2.0
  );

-- ============================================================================
-- 9. COURSES - Learning management
-- ============================================================================

INSERT INTO courses (
  id, title, description, course_type, credits, status, price, duration_hours
) VALUES
  (
    '00000000-0000-0000-0000-000000000301',
    'REBC Designation Program',
    'Comprehensive training for the Registered Employee Benefits Consultant designation. Covers group health, disability, life insurance, and retirement planning.',
    'designation',
    30,
    'published',
    149900,
    120
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    'Health Insurance Fundamentals',
    'Essential knowledge for selling health insurance products. Perfect for new agents.',
    'certification',
    10,
    'published',
    29900,
    40
  ),
  (
    '00000000-0000-0000-0000-000000000303',
    'Medicare Supplement Sales Strategies',
    'Advanced techniques for Medicare supplement sales and client retention.',
    'continuing_education',
    5,
    'published',
    9900,
    20
  ),
  (
    '00000000-0000-0000-0000-000000000304',
    'ACA Compliance for Employers',
    'Navigate ACA compliance requirements for employer-sponsored plans.',
    'continuing_education',
    8,
    'published',
    14900,
    32
  );

-- ============================================================================
-- 10. ENROLLMENTS - Course progress tracking
-- ============================================================================

INSERT INTO enrollments (member_id, course_id, enrollment_date, status, progress_percentage, completion_date) VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000301', '2024-01-15', 'in_progress', 65, NULL),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000302', '2024-11-01', 'completed', 100, '2024-12-15'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000303', '2024-12-10', 'in_progress', 40, NULL),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000301', '2023-06-01', 'completed', 100, '2024-01-20'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000304', '2024-12-01', 'in_progress', 25, NULL);

-- ============================================================================
-- 11. REGISTRATIONS - Event attendance
-- ============================================================================

INSERT INTO registrations (
  event_id, member_id, ticket_type_id, registration_status, registration_date
) VALUES
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000101',
    (SELECT id FROM ticket_types WHERE event_id = '00000000-0000-0000-0000-000000000201' AND ticket_name = 'Full Conference Pass'),
    'confirmed',
    '2025-01-10'
  ),
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000102',
    (SELECT id FROM ticket_types WHERE event_id = '00000000-0000-0000-0000-000000000201' AND ticket_name = 'Full Conference Pass'),
    'confirmed',
    '2025-01-12'
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000103',
    (SELECT id FROM ticket_types WHERE event_id = '00000000-0000-0000-0000-000000000202' AND ticket_name = 'Webinar Registration'),
    'confirmed',
    '2025-02-01'
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000104',
    (SELECT id FROM ticket_types WHERE event_id = '00000000-0000-0000-0000-000000000203' AND ticket_name = 'In-Person Attendance'),
    'confirmed',
    '2025-02-15'
  ),
  (
    '00000000-0000-0000-0000-000000000204',
    '00000000-0000-0000-0000-000000000105',
    (SELECT id FROM ticket_types WHERE event_id = '00000000-0000-0000-0000-000000000204' AND ticket_name = 'Standard Registration'),
    'waitlisted',
    '2025-03-01'
  );

-- ============================================================================
-- 12. CHAPTER LEADERS - Leadership roster
-- ============================================================================

INSERT INTO chapter_leaders (chapter_id, member_id, role, status, term_start, term_end) VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000102', 'President', 'active', '2024-01-01', '2025-12-31'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000103', 'President', 'active', '2024-01-01', '2025-12-31'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000101', 'Treasurer', 'active', '2024-01-01', '2025-12-31'),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000102', 'Vice President', 'active', '2024-01-01', '2025-12-31');

-- ============================================================================
-- 13. CHAPTER NEWS - Announcements
-- ============================================================================

INSERT INTO chapter_news (chapter_id, title, content, category, status, published_date, author_id) VALUES
  (
    '00000000-0000-0000-0000-000000000002',
    'California Chapter Exceeds Membership Goal',
    'We are thrilled to announce that our chapter has surpassed our 2024 membership goal by 15%! Thank you to all our dedicated members.',
    'announcement',
    'published',
    '2024-12-15',
    '00000000-0000-0000-0000-000000000102'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Texas CE Credit Opportunities',
    'Join us for our upcoming CE webinar series covering the latest ACA compliance updates.',
    'event',
    'published',
    '2025-01-05',
    '00000000-0000-0000-0000-000000000103'
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'Welcome New Los Angeles Members',
    'A warm welcome to our 12 new members who joined this quarter!',
    'announcement',
    'published',
    '2025-01-10',
    '00000000-0000-0000-0000-000000000101'
  );

-- ============================================================================
-- 14. CAMPAIGN TEMPLATES - Email templates
-- ============================================================================

INSERT INTO campaign_templates (
  id, template_name, subject_line, body_html, category, status
) VALUES
  (
    '00000000-0000-0000-0000-000000000401',
    'Event Reminder',
    'Don''t forget: {{eventTitle}} is coming up!',
    '<p>Hi {{firstName}},</p><p>This is a friendly reminder that <strong>{{eventTitle}}</strong> is scheduled for {{eventDate}}.</p><p>We look forward to seeing you there!</p>',
    'event',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000402',
    'Membership Renewal',
    'Time to renew your NABIP membership',
    '<p>Dear {{firstName}} {{lastName}},</p><p>Your NABIP membership expires on {{expiryDate}}. Renew today to continue enjoying member benefits!</p>',
    'membership',
    'active'
  );

-- ============================================================================
-- 15. CAMPAIGNS - Email marketing
-- ============================================================================

INSERT INTO campaigns (
  campaign_name, template_id, segment_criteria, status, scheduled_send_date,
  sent_count, unique_opens_count, unique_clicks_count
) VALUES
  (
    'Annual Conference Reminder - Week Before',
    '00000000-0000-0000-0000-000000000401',
    '{"chapterId": "00000000-0000-0000-0000-000000000002", "status": "active"}'::jsonb,
    'sent',
    '2025-06-08 10:00:00',
    245,
    189,
    67
  ),
  (
    'Q1 2025 Membership Renewals',
    '00000000-0000-0000-0000-000000000402',
    '{"membershipExpiry": "2025-03-31"}'::jsonb,
    'scheduled',
    '2025-02-01 09:00:00',
    0,
    0,
    0
  );

COMMIT;

-- ============================================================================
-- VALIDATION QUERIES - Run these to verify data was imported correctly
-- ============================================================================

-- Check chapter hierarchy and member counts (should auto-update via trigger)
SELECT
  c.name,
  c.chapter_type,
  c.member_count as counted_members,
  (SELECT COUNT(*) FROM members WHERE chapter_id = c.id) as actual_members,
  CASE
    WHEN c.member_count = (SELECT COUNT(*) FROM members WHERE chapter_id = c.id)
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as trigger_validation,
  p.name as parent_chapter
FROM chapters c
LEFT JOIN chapters p ON c.parent_chapter_id = p.id
ORDER BY c.chapter_type, c.name;

-- Check event registration counts (should auto-update via trigger)
SELECT
  e.title,
  e.format,
  e.capacity,
  e.registered_count as counted_registrations,
  (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as actual_registrations,
  CASE
    WHEN e.registered_count = (SELECT COUNT(*) FROM registrations WHERE event_id = e.id)
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as trigger_validation,
  CASE
    WHEN e.capacity IS NOT NULL
    THEN ROUND((e.registered_count::DECIMAL / e.capacity) * 100, 1) || '%'
    ELSE 'N/A'
  END as fill_percentage
FROM events e
ORDER BY e.start_date;

-- Check course enrollments (should auto-update via trigger)
SELECT
  c.title,
  c.enrolled_count as counted_enrollments,
  (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as actual_enrollments,
  CASE
    WHEN c.enrolled_count = (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id)
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as trigger_validation
FROM courses c
ORDER BY c.title;

-- Check auto-generated QR codes and confirmation numbers
SELECT
  'Registration QR Codes' as test,
  COUNT(*) as total,
  COUNT(DISTINCT qr_code) as unique_codes,
  MIN(qr_code) as sample_qr,
  MIN(confirmation_number) as sample_confirmation,
  CASE
    WHEN COUNT(*) = COUNT(DISTINCT qr_code)
      AND MIN(qr_code) LIKE 'REG-%'
      AND LENGTH(MIN(qr_code)) = 15
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as validation
FROM registrations;

-- Check member engagement scores
SELECT
  CONCAT(first_name, ' ', last_name) as member_name,
  engagement_score,
  (SELECT COUNT(*) FROM registrations WHERE member_id = m.id) as events_attended,
  (SELECT COUNT(*) FROM enrollments WHERE member_id = m.id AND status = 'completed') as courses_completed,
  status
FROM members m
ORDER BY engagement_score DESC;

-- Summary statistics
SELECT
  (SELECT COUNT(*) FROM chapters) as total_chapters,
  (SELECT COUNT(*) FROM members) as total_members,
  (SELECT COUNT(*) FROM members WHERE status = 'active') as active_members,
  (SELECT COUNT(*) FROM events) as total_events,
  (SELECT COUNT(*) FROM registrations) as total_registrations,
  (SELECT COUNT(*) FROM courses) as total_courses,
  (SELECT COUNT(*) FROM enrollments) as total_enrollments;
