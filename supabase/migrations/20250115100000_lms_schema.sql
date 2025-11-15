-- =====================================================
-- NABIP AMS Learning Management System (LMS) Schema
-- =====================================================
-- Establish comprehensive LMS infrastructure to streamline professional
-- development, certification tracking, and measurable learning outcomes
-- across 20,000+ members.
--
-- Features:
-- - Course catalog with modular content structure
-- - Video progress tracking with resume functionality
-- - Quiz engine with auto-grading
-- - Certificate generation with verification
-- - Live virtual session management
-- - SCORM 1.2/2004 package support
-- - Assignment submissions with rubric grading
--
-- Created: 2025-01-15
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. COURSE CATALOG & STRUCTURE
-- =====================================================

-- Master Course Catalog
-- Establishes centralized course inventory with pricing, prerequisites,
-- and learning objectives to streamline course discovery and enrollment.
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core course information
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  short_description text,

  -- Learning outcomes
  learning_objectives jsonb DEFAULT '[]'::jsonb,
  prerequisites jsonb DEFAULT '[]'::jsonb,
  target_audience text,

  -- Course metadata
  category text NOT NULL CHECK (category IN (
    'insurance_fundamentals',
    'health_benefits',
    'life_insurance',
    'retirement_planning',
    'compliance',
    'sales_techniques',
    'leadership',
    'technology',
    'continuing_education'
  )),
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),

  -- Credentials and certification
  ce_credits numeric(5,2) DEFAULT 0,
  designation_id uuid,
  certificate_template_id uuid,

  -- Pricing and access
  pricing_type text CHECK (pricing_type IN ('free', 'paid', 'member_only', 'premium')) DEFAULT 'free',
  price numeric(10,2) DEFAULT 0,
  member_price numeric(10,2),

  -- Delivery format
  delivery_format text CHECK (delivery_format IN (
    'self_paced',
    'instructor_led',
    'blended',
    'live_virtual'
  )) DEFAULT 'self_paced',
  estimated_duration_minutes integer,

  -- Publishing and visibility
  status text CHECK (status IN ('draft', 'published', 'archived', 'under_review')) DEFAULT 'draft',
  published_at timestamptz,
  archived_at timestamptz,

  -- Instructors and authors
  instructor_id uuid REFERENCES members(id),
  co_instructors uuid[] DEFAULT ARRAY[]::uuid[],
  author_bio text,

  -- Media assets
  thumbnail_url text,
  promo_video_url text,
  syllabus_url text,

  -- Course settings
  allow_enrollment boolean DEFAULT true,
  max_enrollments integer,
  enrollment_start_date timestamptz,
  enrollment_end_date timestamptz,
  course_start_date timestamptz,
  course_end_date timestamptz,

  -- Engagement settings
  enable_discussion_forum boolean DEFAULT false,
  enable_peer_review boolean DEFAULT false,
  completion_certificate boolean DEFAULT true,

  -- Analytics (auto-calculated via triggers)
  total_enrollments integer DEFAULT 0,
  active_enrollments integer DEFAULT 0,
  completion_count integer DEFAULT 0,
  completion_rate numeric(5,2) DEFAULT 0,
  avg_rating numeric(3,2),
  total_reviews integer DEFAULT 0,

  -- SCORM package support
  scorm_package_url text,
  scorm_version text CHECK (scorm_version IN ('1.2', '2004')),

  -- Audit fields
  created_by uuid REFERENCES members(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance optimization
CREATE INDEX idx_courses_status ON courses(status) WHERE status = 'published';
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_pricing ON courses(pricing_type);
CREATE INDEX idx_courses_prerequisites ON courses USING gin(prerequisites);
CREATE INDEX idx_courses_learning_objectives ON courses USING gin(learning_objectives);

COMMENT ON TABLE courses IS 'Master course catalog supporting self-paced, instructor-led, and blended learning formats with CE credit tracking';

-- Course Sections/Modules
-- Organize courses into logical sections to streamline content delivery
-- and track module-level completion rates.
CREATE TABLE course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,

  -- Module information
  title text NOT NULL,
  description text,

  -- Ordering and structure
  module_order integer NOT NULL,

  -- Learning outcomes specific to this module
  learning_objectives jsonb DEFAULT '[]'::jsonb,

  -- Access control
  is_preview boolean DEFAULT false,
  unlock_after_module_id uuid REFERENCES course_modules(id),
  unlock_date timestamptz,

  -- Module metadata
  estimated_duration_minutes integer,

  -- Analytics (auto-calculated)
  completion_count integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_course_module_order UNIQUE(course_id, module_order)
);

CREATE INDEX idx_course_modules_course ON course_modules(course_id);
CREATE INDEX idx_course_modules_order ON course_modules(course_id, module_order);
CREATE INDEX idx_course_modules_unlock ON course_modules(unlock_after_module_id);

COMMENT ON TABLE course_modules IS 'Course sections enabling modular content organization with sequential unlock capabilities';

-- Individual Learning Units
-- Store granular learning content (videos, text, SCORM) to enable
-- precise progress tracking and content personalization.
CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES course_modules(id) ON DELETE CASCADE NOT NULL,

  -- Lesson information
  title text NOT NULL,
  description text,

  -- Content type and delivery
  lesson_type text CHECK (lesson_type IN (
    'video',
    'text',
    'pdf',
    'scorm',
    'quiz',
    'assignment',
    'live_session',
    'external_link',
    'embedded_content'
  )) NOT NULL,

  -- Ordering
  lesson_order integer NOT NULL,

  -- Content delivery
  content_url text,
  content_html text,
  video_duration_seconds integer,
  transcript_url text,

  -- Video settings (if lesson_type = 'video')
  video_provider text CHECK (video_provider IN ('supabase_storage', 'vimeo', 'youtube', 'wistia')),
  video_thumbnail_url text,
  enable_video_controls boolean DEFAULT true,
  allow_download boolean DEFAULT false,

  -- SCORM settings (if lesson_type = 'scorm')
  scorm_manifest_url text,
  scorm_version text CHECK (scorm_version IN ('1.2', '2004')),

  -- Access control
  is_preview boolean DEFAULT false,
  unlock_after_lesson_id uuid REFERENCES lessons(id),

  -- Completion criteria
  require_completion boolean DEFAULT true,
  completion_criteria text CHECK (completion_criteria IN (
    'video_watched',
    'time_spent',
    'quiz_passed',
    'marked_complete',
    'scorm_completed'
  )) DEFAULT 'marked_complete',
  min_time_seconds integer,

  -- Metadata
  estimated_duration_minutes integer,

  -- Analytics
  views_count integer DEFAULT 0,
  avg_completion_rate numeric(5,2) DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_module_lesson_order UNIQUE(module_id, lesson_order)
);

CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_lessons_order ON lessons(module_id, lesson_order);
CREATE INDEX idx_lessons_type ON lessons(lesson_type);
CREATE INDEX idx_lessons_unlock ON lessons(unlock_after_lesson_id);

COMMENT ON TABLE lessons IS 'Granular learning units supporting video, SCORM, and rich text with precise progress tracking';

-- Downloadable Resources
-- Manage supplemental learning materials to enhance course value
-- and provide reference resources.
CREATE TABLE lesson_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,

  -- File information
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size_bytes bigint,

  -- Metadata
  description text,
  attachment_order integer DEFAULT 0,

  -- Access control
  requires_enrollment boolean DEFAULT true,

  -- Analytics
  download_count integer DEFAULT 0,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_lesson_attachments_lesson ON lesson_attachments(lesson_id);

COMMENT ON TABLE lesson_attachments IS 'Supplemental course materials with download tracking';

-- =====================================================
-- 2. ENROLLMENT & PROGRESS TRACKING
-- =====================================================

-- Student Course Registration
-- Track course enrollments with payment integration, progress monitoring,
-- and certificate issuance to drive measurable learning outcomes.
CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE RESTRICT NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,

  -- Enrollment metadata
  enrolled_at timestamptz DEFAULT now(),
  enrollment_source text CHECK (enrollment_source IN (
    'self_enrollment',
    'admin_assignment',
    'bulk_import',
    'event_registration',
    'membership_benefit'
  )) DEFAULT 'self_enrollment',

  -- Payment tracking
  transaction_id uuid REFERENCES transactions(id),
  amount_paid numeric(10,2) DEFAULT 0,

  -- Status and access
  status text CHECK (status IN (
    'enrolled',
    'in_progress',
    'completed',
    'dropped',
    'expired',
    'suspended'
  )) DEFAULT 'enrolled',

  -- Progress tracking (auto-calculated)
  progress_percentage numeric(5,2) DEFAULT 0,
  lessons_completed integer DEFAULT 0,
  total_lessons integer DEFAULT 0,
  current_lesson_id uuid REFERENCES lessons(id),

  -- Time tracking
  started_at timestamptz,
  last_accessed_at timestamptz,
  completed_at timestamptz,
  total_time_spent_minutes integer DEFAULT 0,

  -- Completion and certification
  certificate_issued boolean DEFAULT false,
  certificate_number text UNIQUE,
  certificate_url text,
  certificate_issued_at timestamptz,

  -- Course instance (for cohort-based courses)
  cohort_name text,
  cohort_start_date timestamptz,
  cohort_end_date timestamptz,

  -- Expiration (for CE credits)
  expires_at timestamptz,

  -- Instructor feedback
  final_grade numeric(5,2),
  instructor_notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_member_course_enrollment UNIQUE(member_id, course_id, cohort_name)
);

CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_member ON enrollments(member_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_completed ON enrollments(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_enrollments_certificate ON enrollments(certificate_number) WHERE certificate_number IS NOT NULL;

COMMENT ON TABLE enrollments IS 'Student course registration with progress tracking, certificate issuance, and payment integration';

-- Detailed Progress Tracking
-- Track granular lesson-level progress including video watch positions
-- to enable resume functionality and measure engagement.
CREATE TABLE lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,

  -- Progress tracking
  status text CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',

  -- Video-specific tracking
  video_position_seconds integer DEFAULT 0,
  video_watched_seconds integer DEFAULT 0,
  video_completion_percentage numeric(5,2) DEFAULT 0,

  -- SCORM tracking
  scorm_cmi_data jsonb,
  scorm_completion_status text,
  scorm_score numeric(5,2),

  -- Time tracking
  started_at timestamptz,
  completed_at timestamptz,
  time_spent_seconds integer DEFAULT 0,
  last_accessed_at timestamptz,

  -- Analytics
  access_count integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_enrollment_lesson UNIQUE(enrollment_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX idx_lesson_progress_status ON lesson_progress(status);
CREATE INDEX idx_lesson_progress_scorm ON lesson_progress USING gin(scorm_cmi_data);

COMMENT ON TABLE lesson_progress IS 'Granular progress tracking supporting video resume, SCORM state, and time-on-task analytics';

-- Student Feedback
-- Collect course ratings and feedback to improve content quality
-- and inform purchasing decisions.
CREATE TABLE course_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,

  -- Review content
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title text,
  review_text text,

  -- Sentiment categories
  liked_aspects text[],
  improvement_areas text[],

  -- Moderation
  is_approved boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  moderated_by uuid REFERENCES members(id),
  moderated_at timestamptz,

  -- Helpfulness voting
  helpful_count integer DEFAULT 0,
  not_helpful_count integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_member_course_review UNIQUE(member_id, course_id)
);

CREATE INDEX idx_course_reviews_course ON course_reviews(course_id);
CREATE INDEX idx_course_reviews_member ON course_reviews(member_id);
CREATE INDEX idx_course_reviews_rating ON course_reviews(rating);
CREATE INDEX idx_course_reviews_approved ON course_reviews(is_approved) WHERE is_approved = true;

COMMENT ON TABLE course_reviews IS 'Student feedback enabling data-driven course improvements and social proof';

-- =====================================================
-- 3. QUIZ & ASSESSMENT ENGINE
-- =====================================================

-- Quiz Configuration
-- Define assessments with passing criteria, time limits, and retry logic
-- to validate learning outcomes.
CREATE TABLE quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,

  -- Quiz metadata
  title text NOT NULL,
  description text,
  instructions text,

  -- Quiz type and placement
  quiz_type text CHECK (quiz_type IN (
    'pre_assessment',
    'formative',
    'summative',
    'final_exam',
    'practice'
  )) DEFAULT 'formative',

  -- Passing criteria
  passing_score numeric(5,2) DEFAULT 70.00,
  max_attempts integer,
  require_passing boolean DEFAULT false,

  -- Time limits
  time_limit_minutes integer,

  -- Question settings
  shuffle_questions boolean DEFAULT true,
  shuffle_answers boolean DEFAULT true,
  show_correct_answers text CHECK (show_correct_answers IN (
    'immediately',
    'after_submission',
    'after_deadline',
    'never'
  )) DEFAULT 'after_submission',

  -- Grading
  total_points numeric(8,2) DEFAULT 0,

  -- Availability
  available_from timestamptz,
  available_until timestamptz,

  -- Analytics
  attempts_count integer DEFAULT 0,
  avg_score numeric(5,2),
  pass_rate numeric(5,2),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_quizzes_course ON quizzes(course_id);
CREATE INDEX idx_quizzes_lesson ON quizzes(lesson_id);
CREATE INDEX idx_quizzes_type ON quizzes(quiz_type);

COMMENT ON TABLE quizzes IS 'Assessment configuration with passing criteria, time limits, and retry policies';

-- Question Bank
-- Store reusable quiz questions supporting multiple question types
-- to enable comprehensive knowledge assessment.
CREATE TABLE quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,

  -- Question content
  question_text text NOT NULL,
  question_html text,

  -- Question type
  question_type text CHECK (question_type IN (
    'multiple_choice',
    'true_false',
    'multiple_answer',
    'short_answer',
    'essay',
    'fill_blank',
    'matching',
    'ordering'
  )) NOT NULL,

  -- Ordering
  question_order integer NOT NULL,

  -- Answer options (JSONB for flexibility)
  answer_options jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Correct answer(s)
  correct_answer jsonb,

  -- Grading
  points numeric(5,2) DEFAULT 1.00,

  -- Explanation and feedback
  explanation text,
  hint text,

  -- Media attachments
  image_url text,
  video_url text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_quiz_question_order UNIQUE(quiz_id, question_order)
);

CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_type ON quiz_questions(question_type);
CREATE INDEX idx_quiz_questions_order ON quiz_questions(quiz_id, question_order);

COMMENT ON TABLE quiz_questions IS 'Flexible question bank supporting 8 question types with rich media support';

-- Student Quiz Submissions
-- Track quiz attempt history with scoring to measure learning progression
-- and identify struggling students.
CREATE TABLE quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,

  -- Attempt metadata
  attempt_number integer NOT NULL,

  -- Timing
  started_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  time_spent_seconds integer,

  -- Scoring
  score numeric(5,2),
  points_earned numeric(8,2),
  total_points numeric(8,2),
  passed boolean,

  -- Status
  status text CHECK (status IN ('in_progress', 'submitted', 'graded', 'expired')) DEFAULT 'in_progress',

  -- IP and browser tracking (proctoring)
  ip_address inet,
  user_agent text,

  -- Grading (for manual grading)
  graded_by uuid REFERENCES members(id),
  graded_at timestamptz,
  instructor_feedback text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_enrollment_quiz_attempt UNIQUE(enrollment_id, quiz_id, attempt_number)
);

CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_enrollment ON quiz_attempts(enrollment_id);
CREATE INDEX idx_quiz_attempts_member ON quiz_attempts(member_id);
CREATE INDEX idx_quiz_attempts_status ON quiz_attempts(status);

COMMENT ON TABLE quiz_attempts IS 'Quiz submission tracking with scoring, timing, and proctoring metadata';

-- Individual Question Responses
-- Store granular answer data to enable question-level analytics
-- and partial credit grading.
CREATE TABLE quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_attempt_id uuid REFERENCES quiz_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES quiz_questions(id) ON DELETE CASCADE NOT NULL,

  -- Answer data
  answer_data jsonb NOT NULL,

  -- Scoring
  is_correct boolean,
  points_earned numeric(5,2) DEFAULT 0,
  max_points numeric(5,2),

  -- Timing
  answered_at timestamptz DEFAULT now(),
  time_spent_seconds integer,

  -- Feedback
  automated_feedback text,
  instructor_feedback text,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_quiz_answers_attempt ON quiz_answers(quiz_attempt_id);
CREATE INDEX idx_quiz_answers_question ON quiz_answers(question_id);
CREATE INDEX idx_quiz_answers_correct ON quiz_answers(is_correct);

COMMENT ON TABLE quiz_answers IS 'Question-level response tracking enabling granular analytics and partial credit';

-- =====================================================
-- 4. ASSIGNMENTS & SUBMISSIONS
-- =====================================================

-- Course Assignments
-- Define practical assignments with rubrics and deadlines to assess
-- real-world application of learning.
CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,

  -- Assignment details
  title text NOT NULL,
  description text NOT NULL,
  instructions_html text,

  -- Grading
  total_points numeric(8,2) DEFAULT 100,
  rubric jsonb,

  -- Submission settings
  submission_type text CHECK (submission_type IN (
    'file_upload',
    'text_entry',
    'url_submission',
    'both'
  )) DEFAULT 'file_upload',
  allowed_file_types text[],
  max_file_size_mb integer DEFAULT 10,
  max_submissions integer DEFAULT 1,

  -- Deadlines
  available_from timestamptz,
  due_date timestamptz,
  late_submission_allowed boolean DEFAULT true,
  late_penalty_percentage numeric(5,2) DEFAULT 10,

  -- Peer review
  enable_peer_review boolean DEFAULT false,
  peer_reviews_required integer DEFAULT 2,

  -- Analytics
  submissions_count integer DEFAULT 0,
  avg_score numeric(5,2),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_assignments_lesson ON assignments(lesson_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);

COMMENT ON TABLE assignments IS 'Practical assignments with rubric-based grading and peer review capabilities';

-- Student Work
-- Store assignment submissions with file attachments to facilitate
-- instructor grading and feedback.
CREATE TABLE assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,

  -- Submission metadata
  submission_number integer DEFAULT 1,
  submitted_at timestamptz DEFAULT now(),
  is_late boolean DEFAULT false,
  late_days integer DEFAULT 0,

  -- Submission content
  submission_text text,
  submission_html text,
  submission_url text,
  file_attachments jsonb DEFAULT '[]'::jsonb,

  -- Grading
  status text CHECK (status IN (
    'submitted',
    'grading',
    'graded',
    'returned',
    'resubmission_requested'
  )) DEFAULT 'submitted',

  score numeric(5,2),
  points_earned numeric(8,2),
  grade_percentage numeric(5,2),

  -- Instructor feedback
  graded_by uuid REFERENCES members(id),
  graded_at timestamptz,
  instructor_feedback_html text,
  rubric_scores jsonb,

  -- Late penalty
  late_penalty_applied numeric(5,2) DEFAULT 0,
  final_score numeric(5,2),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_enrollment_assignment_submission UNIQUE(enrollment_id, assignment_id, submission_number)
);

CREATE INDEX idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_enrollment ON assignment_submissions(enrollment_id);
CREATE INDEX idx_assignment_submissions_member ON assignment_submissions(member_id);
CREATE INDEX idx_assignment_submissions_status ON assignment_submissions(status);

COMMENT ON TABLE assignment_submissions IS 'Student assignment submissions with file uploads, grading, and feedback';

-- =====================================================
-- 5. LIVE VIRTUAL SESSIONS
-- =====================================================

-- Virtual Classroom Sessions
-- Schedule and manage live instructor-led sessions to support
-- synchronous learning and real-time interaction.
CREATE TABLE live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,

  -- Session details
  title text NOT NULL,
  description text,

  -- Scheduling
  session_date timestamptz NOT NULL,
  duration_minutes integer NOT NULL,
  timezone text DEFAULT 'America/New_York',

  -- Virtual meeting details
  meeting_platform text CHECK (meeting_platform IN (
    'zoom',
    'microsoft_teams',
    'google_meet',
    'webex',
    'custom'
  )),
  meeting_url text NOT NULL,
  meeting_id text,
  meeting_password text,

  -- Session metadata
  instructor_id uuid REFERENCES members(id) NOT NULL,
  co_hosts uuid[] DEFAULT ARRAY[]::uuid[],

  -- Capacity
  max_attendees integer,
  registered_count integer DEFAULT 0,

  -- Recording
  recording_enabled boolean DEFAULT true,
  recording_url text,
  recording_available boolean DEFAULT false,

  -- Resources
  agenda_html text,
  pre_session_materials jsonb DEFAULT '[]'::jsonb,
  post_session_materials jsonb DEFAULT '[]'::jsonb,

  -- Status
  status text CHECK (status IN (
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
  )) DEFAULT 'scheduled',

  -- Analytics
  attendance_count integer DEFAULT 0,
  avg_attendance_duration_minutes integer,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_live_sessions_course ON live_sessions(course_id);
CREATE INDEX idx_live_sessions_instructor ON live_sessions(instructor_id);
CREATE INDEX idx_live_sessions_date ON live_sessions(session_date);
CREATE INDEX idx_live_sessions_status ON live_sessions(status);

COMMENT ON TABLE live_sessions IS 'Live virtual classroom sessions with meeting integration and recording support';

-- Attendance Tracking
-- Record session attendance and participation metrics to validate
-- engagement and CE credit eligibility.
CREATE TABLE session_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES live_sessions(id) ON DELETE CASCADE NOT NULL,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,

  -- Registration
  registered_at timestamptz DEFAULT now(),

  -- Attendance tracking
  attended boolean DEFAULT false,
  joined_at timestamptz,
  left_at timestamptz,
  duration_minutes integer,

  -- Engagement metrics
  questions_asked integer DEFAULT 0,
  polls_answered integer DEFAULT 0,

  -- Certificate eligibility
  eligible_for_credit boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_member_session UNIQUE(member_id, session_id)
);

CREATE INDEX idx_session_attendance_session ON session_attendance(session_id);
CREATE INDEX idx_session_attendance_member ON session_attendance(member_id);
CREATE INDEX idx_session_attendance_attended ON session_attendance(attended);

COMMENT ON TABLE session_attendance IS 'Live session participation tracking with CE credit eligibility validation';

-- =====================================================
-- DATABASE FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update enrollment progress when lesson progress changes
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_total_lessons integer;
  v_completed_lessons integer;
  v_progress numeric(5,2);
BEGIN
  SELECT COUNT(DISTINCT l.id)
  INTO v_total_lessons
  FROM lessons l
  JOIN course_modules m ON l.module_id = m.id
  WHERE m.course_id = (
    SELECT course_id FROM enrollments WHERE id = NEW.enrollment_id
  );

  SELECT COUNT(*)
  INTO v_completed_lessons
  FROM lesson_progress
  WHERE enrollment_id = NEW.enrollment_id
    AND status = 'completed';

  IF v_total_lessons > 0 THEN
    v_progress := ROUND((v_completed_lessons::numeric / v_total_lessons::numeric) * 100, 2);
  ELSE
    v_progress := 0;
  END IF;

  UPDATE enrollments
  SET
    progress_percentage = v_progress,
    lessons_completed = v_completed_lessons,
    total_lessons = v_total_lessons,
    updated_at = now()
  WHERE id = NEW.enrollment_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_enrollment_progress
  AFTER INSERT OR UPDATE ON lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_progress();

COMMENT ON FUNCTION update_enrollment_progress IS 'Auto-calculates enrollment progress when lesson progress updates';

-- Auto-generate certificate numbers on course completion
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year text;
  v_sequence text;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    v_year := TO_CHAR(now(), 'YYYY');
    v_sequence := LPAD(
      (EXTRACT(EPOCH FROM now())::bigint % 100000000)::text,
      8,
      '0'
    );

    NEW.certificate_number := 'CERT-' || v_year || '-' || v_sequence;
    NEW.certificate_issued := true;
    NEW.certificate_issued_at := now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_certificate_number
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION generate_certificate_number();

COMMENT ON FUNCTION generate_certificate_number IS 'Auto-generates unique certificate numbers on course completion';

-- Auto-grade quiz attempts on submission
CREATE OR REPLACE FUNCTION auto_grade_quiz_attempt()
RETURNS TRIGGER AS $$
DECLARE
  v_total_points numeric(8,2);
  v_points_earned numeric(8,2);
  v_score numeric(5,2);
  v_passing_score numeric(5,2);
  v_passed boolean;
BEGIN
  IF NEW.status = 'submitted' AND (OLD.status IS NULL OR OLD.status = 'in_progress') THEN
    SELECT COALESCE(SUM(points), 0)
    INTO v_total_points
    FROM quiz_questions
    WHERE quiz_id = NEW.quiz_id;

    SELECT COALESCE(SUM(points_earned), 0)
    INTO v_points_earned
    FROM quiz_answers
    WHERE quiz_attempt_id = NEW.id;

    IF v_total_points > 0 THEN
      v_score := ROUND((v_points_earned / v_total_points) * 100, 2);
    ELSE
      v_score := 0;
    END IF;

    SELECT passing_score INTO v_passing_score
    FROM quizzes WHERE id = NEW.quiz_id;

    v_passed := v_score >= v_passing_score;

    NEW.total_points := v_total_points;
    NEW.points_earned := v_points_earned;
    NEW.score := v_score;
    NEW.passed := v_passed;
    NEW.status := 'graded';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_grade_quiz
  BEFORE UPDATE ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION auto_grade_quiz_attempt();

COMMENT ON FUNCTION auto_grade_quiz_attempt IS 'Automatically grades quiz attempts on submission';

-- Update course analytics on enrollment changes
CREATE OR REPLACE FUNCTION update_course_analytics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courses
  SET
    total_enrollments = (
      SELECT COUNT(*) FROM enrollments WHERE course_id = NEW.course_id
    ),
    active_enrollments = (
      SELECT COUNT(*) FROM enrollments
      WHERE course_id = NEW.course_id AND status IN ('enrolled', 'in_progress')
    ),
    completion_count = (
      SELECT COUNT(*) FROM enrollments
      WHERE course_id = NEW.course_id AND status = 'completed'
    ),
    completion_rate = CASE
      WHEN (SELECT COUNT(*) FROM enrollments WHERE course_id = NEW.course_id) > 0
      THEN ROUND(
        (SELECT COUNT(*) FROM enrollments WHERE course_id = NEW.course_id AND status = 'completed')::numeric
        / (SELECT COUNT(*) FROM enrollments WHERE course_id = NEW.course_id)::numeric * 100,
        2
      )
      ELSE 0
    END,
    updated_at = now()
  WHERE id = NEW.course_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_course_analytics
  AFTER INSERT OR UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_course_analytics();

COMMENT ON FUNCTION update_course_analytics IS 'Real-time course analytics updates on enrollment changes';

-- Certificate verification public function
CREATE OR REPLACE FUNCTION verify_certificate(p_certificate_number text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'valid', true,
    'member_name', m.first_name || ' ' || m.last_name,
    'course_title', c.title,
    'completion_date', e.completed_at,
    'certificate_number', e.certificate_number,
    'ce_credits', c.ce_credits
  )
  INTO v_result
  FROM enrollments e
  JOIN members m ON e.member_id = m.id
  JOIN courses c ON e.course_id = c.id
  WHERE e.certificate_number = p_certificate_number
    AND e.status = 'completed';

  IF v_result IS NULL THEN
    v_result := jsonb_build_object('valid', false, 'message', 'Certificate not found');
  END IF;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION verify_certificate IS 'Public API for certificate verification by certificate number';

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;

-- Courses: Public can view published courses
CREATE POLICY "Public can view published courses"
  ON courses FOR SELECT
  USING (status = 'published');

CREATE POLICY "Instructors can manage own courses"
  ON courses FOR ALL
  USING (
    instructor_id = auth.uid()
    OR auth.uid() = ANY(co_instructors)
  );

-- Enrollments: Members can view/manage their own enrollments
CREATE POLICY "Members can view own enrollments"
  ON enrollments FOR SELECT
  USING (member_id = auth.uid());

CREATE POLICY "Members can self-enroll"
  ON enrollments FOR INSERT
  WITH CHECK (
    member_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM courses
      WHERE id = course_id
      AND status = 'published'
      AND allow_enrollment = true
    )
  );

CREATE POLICY "Members can update own progress"
  ON enrollments FOR UPDATE
  USING (member_id = auth.uid());

-- Lesson Progress: Members can view/update own progress
CREATE POLICY "Members can manage own lesson progress"
  ON lesson_progress FOR ALL
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE member_id = auth.uid()
    )
  );

-- Quiz Attempts: Members can view/create own attempts
CREATE POLICY "Members can view own quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (member_id = auth.uid());

CREATE POLICY "Members can start quiz attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (
    member_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM enrollments
      WHERE id = enrollment_id
      AND member_id = auth.uid()
      AND status IN ('enrolled', 'in_progress')
    )
  );

CREATE POLICY "Members can update own attempts"
  ON quiz_attempts FOR UPDATE
  USING (member_id = auth.uid() AND status = 'in_progress');

-- Quiz Answers: Members can manage own answers
CREATE POLICY "Members can manage own quiz answers"
  ON quiz_answers FOR ALL
  USING (
    quiz_attempt_id IN (
      SELECT id FROM quiz_attempts WHERE member_id = auth.uid()
    )
  );

-- Assignment Submissions: Members can manage own submissions
CREATE POLICY "Members can manage own submissions"
  ON assignment_submissions FOR ALL
  USING (member_id = auth.uid());

-- Live Sessions: Public can view scheduled sessions for published courses
CREATE POLICY "Public can view published course sessions"
  ON live_sessions FOR SELECT
  USING (
    course_id IN (SELECT id FROM courses WHERE status = 'published')
  );

-- Session Attendance: Members can view/manage own attendance
CREATE POLICY "Members can manage own attendance"
  ON session_attendance FOR ALL
  USING (member_id = auth.uid());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- =====================================================
-- END OF LMS SCHEMA MIGRATION
-- =====================================================
