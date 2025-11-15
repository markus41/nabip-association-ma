-- =====================================================
-- Add Markus Ahling as National Admin
-- =====================================================

BEGIN;

-- Insert Markus as a member with national admin role
INSERT INTO members (
    id,
    email,
    name,
    first_name,
    last_name,
    phone,
    address_line1,
    city,
    state,
    zip_code,
    country,
    chapter_id,
    status,
    member_since,
    renewal_date,
    engagement_score,
    total_ce_credits,
    specialties,
    company_name,
    job_title,
    bio,
    metadata,
    created_at
) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'markus@brooksidebi.com',
    'Markus Ahling',
    'Markus',
    'Ahling',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'USA',
    '10000000-0000-0001-0000-000000000000'::uuid, -- National chapter
    'active',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 year',
    100,
    150.0,
    '{"Business Intelligence","Data Analytics","System Administration"}',
    'Brookside BI',
    'System Administrator',
    'National administrator for NABIP AMS platform.',
    jsonb_build_object('role', 'national_admin'),
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE SET
    metadata = jsonb_build_object('role', 'national_admin'),
    status = 'active',
    chapter_id = '10000000-0000-0001-0000-000000000000'::uuid;

COMMIT;
