-- =====================================================
-- NABIP AMS - Complete Database Schema with Seed Data
-- Migration: 20250115_complete_schema_seed_data.sql
-- Generated: 2025-01-15
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- =====================================================
-- FOUNDATION TABLES
-- =====================================================

-- Chapters Table (Hierarchical Structure)
CREATE TABLE IF NOT EXISTS chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('national', 'state', 'local')),
    parent_chapter_id UUID REFERENCES chapters(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    contact_email TEXT,
    website TEXT,
    city TEXT,
    state TEXT,
    region INTEGER CHECK (region BETWEEN 1 AND 8),
    region_name TEXT,
    certification_level TEXT CHECK (certification_level IN ('None', 'Silver', 'Gold', 'Platinum')),
    actual_member_count INTEGER DEFAULT 0,
    dues_local DECIMAL(10,2) DEFAULT 0,
    dues_state DECIMAL(10,2) DEFAULT 0,
    annual_dues DECIMAL(10,2) DEFAULT 0,
    size_category TEXT,
    territory TEXT,
    president_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles Table (RBAC Foundation)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members Table (Core User Data)
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'USA',
    chapter_id UUID REFERENCES chapters(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended', 'lapsed')),
    member_since DATE,
    renewal_date DATE,
    engagement_score INTEGER DEFAULT 0,
    total_ce_credits DECIMAL(5,2) DEFAULT 0,
    profile_image_url TEXT,
    bio TEXT,
    specialties TEXT[],
    company_name TEXT,
    job_title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member Roles (Many-to-Many with Chapters)
CREATE TABLE IF NOT EXISTS member_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES members(id),
    UNIQUE(member_id, role_id, chapter_id)
);

-- =====================================================
-- EVENTS TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    chapter_id UUID REFERENCES chapters(id),
    event_type TEXT CHECK (event_type IN ('conference', 'webinar', 'workshop', 'networking', 'training', 'meeting')),
    format TEXT CHECK (format IN ('in-person', 'virtual', 'hybrid')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    registration_deadline TIMESTAMPTZ,
    capacity INTEGER,
    current_registrations INTEGER DEFAULT 0,
    waitlist_enabled BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    location_name TEXT,
    location_address TEXT,
    virtual_platform TEXT,
    virtual_link TEXT,
    ce_credits DECIMAL(5,2) DEFAULT 0,
    member_price DECIMAL(10,2) DEFAULT 0,
    non_member_price DECIMAL(10,2) DEFAULT 0,
    early_bird_price DECIMAL(10,2),
    early_bird_deadline TIMESTAMPTZ,
    speaker_names TEXT[],
    sponsor_names TEXT[],
    banner_image_url TEXT,
    created_by UUID REFERENCES members(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    registration_tier TEXT NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled')),
    payment_amount DECIMAL(10,2),
    checked_in_at TIMESTAMPTZ,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    special_requests TEXT,
    UNIQUE(event_id, member_id)
);

CREATE TABLE IF NOT EXISTS event_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    speaker_name TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    room_name TEXT,
    capacity INTEGER,
    session_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CERTIFICATIONS & LEARNING TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('REBC', 'Medicare', 'LPRT', 'CE', 'General')),
    delivery_method TEXT CHECK (delivery_method IN ('Online Self-Paced', 'Live Webinar', 'Hybrid', 'In-Person', 'Video Recording')),
    hours_required DECIMAL(5,2) NOT NULL,
    ce_credits DECIMAL(5,2) DEFAULT 0,
    fee DECIMAL(10,2) DEFAULT 0,
    instructor_name TEXT,
    prerequisites TEXT,
    state_compliance TEXT[],
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    thumbnail_url TEXT,
    lms_integration BOOLEAN DEFAULT false,
    pass_rate DECIMAL(5,2),
    gamification_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    completion_date DATE,
    status TEXT DEFAULT 'not_enrolled' CHECK (status IN ('not_enrolled', 'enrolled', 'in_progress', 'completed', 'failed')),
    credits_earned DECIMAL(5,2) DEFAULT 0,
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    final_score DECIMAL(5,2),
    certificate_url TEXT,
    UNIQUE(course_id, member_id)
);

-- =====================================================
-- EMAIL CAMPAIGNS TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT,
    plain_text_content TEXT,
    category TEXT,
    created_by UUID REFERENCES members(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    from_email TEXT NOT NULL,
    from_name TEXT NOT NULL,
    template_id UUID REFERENCES email_templates(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    total_recipients INTEGER DEFAULT 0,
    created_by UUID REFERENCES members(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_sends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    sendgrid_message_id TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'bounced', 'failed'))
);

CREATE TABLE IF NOT EXISTS email_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_send_id UUID NOT NULL REFERENCES campaign_sends(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('delivered', 'open', 'click', 'bounce', 'spam', 'unsubscribe')),
    url TEXT,
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FINANCE & ECOMMERCE TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_product_id TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    product_type TEXT CHECK (product_type IN ('membership_dues', 'event_ticket', 'course_enrollment', 'merchandise')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_price_id TEXT UNIQUE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    unit_amount INTEGER NOT NULL, -- In cents
    currency TEXT DEFAULT 'usd',
    recurring_interval TEXT CHECK (recurring_interval IN ('month', 'year', 'one_time')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    member_id UUID NOT NULL REFERENCES members(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'void', 'overdue')),
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    due_date DATE,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id),
    member_id UUID NOT NULL REFERENCES members(id),
    stripe_payment_intent_id TEXT UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REPORTS & ANALYTICS TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    query_definition JSONB NOT NULL,
    visualization_config JSONB,
    created_by UUID REFERENCES members(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    layout_config JSONB,
    created_by UUID REFERENCES members(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT & SECURITY TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_hash TEXT UNIQUE NOT NULL,
    member_id UUID REFERENCES members(id),
    name TEXT NOT NULL,
    scopes TEXT[],
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_chapter ON members(chapter_id);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_chapter ON events(chapter_id);
CREATE INDEX idx_event_registrations_member ON event_registrations(member_id);
CREATE INDEX idx_enrollments_member ON enrollments(member_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_campaign_sends_member ON campaign_sends(member_id);
CREATE INDEX idx_payments_member ON payments(member_id);
CREATE INDEX idx_audit_logs_member ON audit_logs(member_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Full-text search indexes
CREATE INDEX idx_members_name_trgm ON members USING gin(name gin_trgm_ops);
CREATE INDEX idx_events_title_trgm ON events USING gin(title gin_trgm_ops);
CREATE INDEX idx_courses_title_trgm ON courses USING gin(title gin_trgm_ops);

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA - ROLES
-- =====================================================

INSERT INTO roles (id, name, description, permissions) VALUES
('00000000-0000-0000-0000-000000000001', 'Member', 'Standard member access', '["view_own_profile", "register_events", "enroll_courses"]'::jsonb),
('00000000-0000-0000-0000-000000000002', 'Chapter Admin', 'Chapter administrator', '["manage_chapter_members", "create_chapter_events", "view_chapter_reports"]'::jsonb),
('00000000-0000-0000-0000-000000000003', 'State Admin', 'State-level administrator', '["manage_state_chapters", "view_state_reports", "manage_state_members"]'::jsonb),
('00000000-0000-0000-0000-000000000004', 'National Admin', 'National administrator with full access', '["manage_all", "system_settings", "financial_reports"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Chapters: Public read, admins can modify
CREATE POLICY chapters_public_read ON chapters FOR SELECT USING (status = 'active');
CREATE POLICY chapters_admin_all ON chapters FOR ALL USING (
    EXISTS (
        SELECT 1 FROM member_roles mr
        WHERE mr.member_id = auth.uid()
        AND mr.role_id IN (SELECT id FROM roles WHERE name IN ('National Admin', 'State Admin'))
    )
);

-- Members: Own profile + chapter admins
CREATE POLICY members_own_read ON members FOR SELECT USING (id = auth.uid());
CREATE POLICY members_chapter_admin_read ON members FOR SELECT USING (
    chapter_id IN (
        SELECT mr.chapter_id FROM member_roles mr
        WHERE mr.member_id = auth.uid()
        AND mr.role_id IN (SELECT id FROM roles WHERE name = 'Chapter Admin')
    )
);

-- Events: Public read for published events
CREATE POLICY events_public_read ON events FOR SELECT USING (status = 'published');
CREATE POLICY events_creator_all ON events FOR ALL USING (created_by = auth.uid());

-- Event Registrations: Own registrations
CREATE POLICY registrations_own ON event_registrations FOR ALL USING (member_id = auth.uid());

-- Courses: Public read for published
CREATE POLICY courses_public_read ON courses FOR SELECT USING (status = 'published');

-- Enrollments: Own enrollments
CREATE POLICY enrollments_own ON enrollments FOR ALL USING (member_id = auth.uid());

COMMIT;
