-- =====================================================
-- Fix Markus Ahling Member ID to Match Auth User ID
-- =====================================================
-- Issue: Member record ID must match Supabase auth.uid() for RLS policies
-- Auth User ID from logs: 6bc35c24-bcd2-4261-83b0-b3553ee7e4a1

BEGIN;

-- Delete old member record with wrong ID
DELETE FROM members WHERE email = 'markus@brooksidebi.com';

-- Insert with correct auth user ID
INSERT INTO members (
    id,
    email,
    first_name,
    last_name,
    member_type,
    status,
    chapter_id,
    joined_date,
    expiry_date,
    engagement_score,
    company,
    job_title,
    custom_fields,
    created_at,
    updated_at
) VALUES (
    '6bc35c24-bcd2-4261-83b0-b3553ee7e4a1'::uuid, -- Match auth.uid()
    'markus@brooksidebi.com',
    'Markus',
    'Ahling',
    'individual',
    'active',
    '10000000-0000-0000-0000-000000000001'::uuid, -- National chapter
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year',
    100,
    'Brookside BI',
    'System Administrator',
    jsonb_build_object('role', 'national_admin', 'bio', 'National administrator for NABIP AMS platform.'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE SET
    id = '6bc35c24-bcd2-4261-83b0-b3553ee7e4a1'::uuid,
    custom_fields = jsonb_build_object('role', 'national_admin', 'bio', 'National administrator for NABIP AMS platform.'),
    status = 'active',
    chapter_id = '10000000-0000-0000-0000-000000000001'::uuid,
    updated_at = CURRENT_TIMESTAMP;

COMMIT;
