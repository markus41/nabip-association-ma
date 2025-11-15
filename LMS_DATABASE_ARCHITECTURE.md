# NABIP AMS - Learning Management System (LMS) Database Architecture

## Executive Summary

This document establishes a comprehensive database architecture for the NABIP Association Management System Learning Management System (LMS). This enterprise-grade solution streamlines course delivery, certification tracking, and professional development workflows across 20,000+ members while maintaining scalability, compliance, and measurable learning outcomes.

**Architecture Type**: PostgreSQL (Supabase) with SCORM 1.2/2004 support
**Total Tables**: 15 core LMS tables + 3 integration tables
**Key Features**: Video progress tracking, quiz engine, certificate generation, live sessions, SCORM packages
**Compliance**: AICC, SCORM 1.2/2004, xAPI (Tin Can API) ready
**Created**: 2025-01-15

---

## Business Value & Outcomes

### Primary Objectives
1. **Streamline Professional Development**: Unified platform for CE credits, certifications, and continuous learning
2. **Improve Member Engagement**: Track and reward learning activity with measurable outcomes
3. **Drive Revenue Growth**: Monetized courses, certification programs, and premium content
4. **Ensure Compliance**: Automated CE credit tracking, certificate verification, and audit trails

### Target Metrics
- **Course Completion Rate**: Target 70%+ completion for enrolled members
- **Certificate Issuance**: 5,000+ certificates annually with auto-verification
- **Learning Hours**: Track 50,000+ learning hours across organization
- **Revenue Impact**: Support $500K+ annual course revenue

---

## Schema Architecture Overview

### Entity Relationship Structure

```
courses (catalog)
  ├── course_modules (sections/chapters)
  │   └── lessons (individual learning units)
  │       ├── lesson_content (HTML/video/SCORM)
  │       └── lesson_attachments (PDFs/resources)
  │
  ├── enrollments (student registration)
  │   ├── lesson_progress (video tracking)
  │   └── course_completions (certificates)
  │
  ├── quizzes (assessments)
  │   ├── quiz_questions (question bank)
  │   └── quiz_attempts (student submissions)
  │       └── quiz_answers (individual responses)
  │
  ├── assignments (practical work)
  │   └── assignment_submissions (student work)
  │       └── assignment_reviews (instructor feedback)
  │
  └── live_sessions (virtual classrooms)
      └── session_attendance (participation tracking)
```

---

## Table Definitions

### 1. Course Catalog & Structure (4 tables)

#### `courses` - Master Course Catalog

**Purpose**: Establish centralized course inventory with pricing, prerequisites, and learning objectives to streamline course discovery and enrollment workflows.

```sql
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core course information
  title text NOT NULL,
  slug text UNIQUE NOT NULL, -- URL-friendly identifier
  description text NOT NULL,
  short_description text, -- For catalog listings (max 200 chars)

  -- Learning outcomes
  learning_objectives jsonb DEFAULT '[]'::jsonb, -- Array of learning goals
  prerequisites jsonb DEFAULT '[]'::jsonb, -- Course IDs or text requirements
  target_audience text, -- "Insurance agents", "NABIP members", etc.

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
  ce_credits numeric(5,2) DEFAULT 0, -- Continuing Education credits
  designation_id uuid REFERENCES member_designations(id), -- REBC, RHU, CLU, etc.
  certificate_template_id uuid, -- Reference to certificate design

  -- Pricing and access
  pricing_type text CHECK (pricing_type IN ('free', 'paid', 'member_only', 'premium')) DEFAULT 'free',
  price numeric(10,2) DEFAULT 0,
  member_price numeric(10,2), -- Discounted price for members

  -- Delivery format
  delivery_format text CHECK (delivery_format IN (
    'self_paced',
    'instructor_led',
    'blended',
    'live_virtual'
  )) DEFAULT 'self_paced',
  estimated_duration_minutes integer, -- Total course length

  -- Publishing and visibility
  status text CHECK (status IN ('draft', 'published', 'archived', 'under_review')) DEFAULT 'draft',
  published_at timestamptz,
  archived_at timestamptz,

  -- Instructors and authors
  instructor_id uuid REFERENCES members(id), -- Primary instructor
  co_instructors uuid[] DEFAULT ARRAY[]::uuid[], -- Additional instructors
  author_bio text,

  -- Media assets
  thumbnail_url text,
  promo_video_url text,
  syllabus_url text, -- PDF download

  -- Course settings
  allow_enrollment boolean DEFAULT true,
  max_enrollments integer, -- Capacity limit for cohort courses
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
  completion_rate numeric(5,2) DEFAULT 0, -- Percentage
  avg_rating numeric(3,2), -- 0-5 stars
  total_reviews integer DEFAULT 0,

  -- SCORM package support
  scorm_package_url text, -- S3/Supabase Storage URL
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
CREATE INDEX idx_courses_designation ON courses(designation_id);
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_pricing ON courses(pricing_type);

-- GIN index for JSONB queries
CREATE INDEX idx_courses_prerequisites ON courses USING gin(prerequisites);
CREATE INDEX idx_courses_learning_objectives ON courses USING gin(learning_objectives);

COMMENT ON TABLE courses IS 'Master course catalog supporting self-paced, instructor-led, and blended learning formats with CE credit tracking';
```

**Best for**: Organizations delivering structured professional development programs requiring certification tracking and measurable learning outcomes.

---

#### `course_modules` - Course Sections/Chapters

**Purpose**: Organize courses into logical sections to streamline content delivery and track module-level completion rates.

```sql
CREATE TABLE course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,

  -- Module information
  title text NOT NULL,
  description text,

  -- Ordering and structure
  module_order integer NOT NULL, -- Sequential ordering within course

  -- Learning outcomes specific to this module
  learning_objectives jsonb DEFAULT '[]'::jsonb,

  -- Access control
  is_preview boolean DEFAULT false, -- Allow preview before enrollment
  unlock_after_module_id uuid REFERENCES course_modules(id), -- Sequential unlock
  unlock_date timestamptz, -- Time-based unlock

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
```

---

#### `lessons` - Individual Learning Units

**Purpose**: Store granular learning content (videos, text, SCORM) to enable precise progress tracking and content personalization.

```sql
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
  content_url text, -- Video URL, SCORM package, PDF, etc.
  content_html text, -- Rich text content for text-based lessons
  video_duration_seconds integer, -- For progress tracking
  transcript_url text, -- Accessibility requirement

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
  require_completion boolean DEFAULT true, -- Must complete to progress
  completion_criteria text CHECK (completion_criteria IN (
    'video_watched', -- 90%+ of video watched
    'time_spent', -- Minimum time requirement
    'quiz_passed', -- Associated quiz must pass
    'marked_complete', -- Manual completion
    'scorm_completed' -- SCORM package reports completion
  )) DEFAULT 'marked_complete',
  min_time_seconds integer, -- Minimum time to mark complete

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
```

---

#### `lesson_attachments` - Downloadable Resources

**Purpose**: Manage supplemental learning materials to enhance course value and provide reference resources.

```sql
CREATE TABLE lesson_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,

  -- File information
  file_name text NOT NULL,
  file_url text NOT NULL, -- Supabase Storage URL
  file_type text NOT NULL, -- MIME type
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
```

---

### 2. Enrollment & Progress Tracking (3 tables)

#### `enrollments` - Student Course Registration

**Purpose**: Track course enrollments with payment integration, progress monitoring, and certificate issuance to drive measurable learning outcomes.

```sql
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

  -- Payment tracking (integrates with transactions table)
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
  progress_percentage numeric(5,2) DEFAULT 0, -- 0-100
  lessons_completed integer DEFAULT 0,
  total_lessons integer DEFAULT 0,
  current_lesson_id uuid REFERENCES lessons(id), -- Resume point

  -- Time tracking
  started_at timestamptz, -- First lesson access
  last_accessed_at timestamptz,
  completed_at timestamptz,
  total_time_spent_minutes integer DEFAULT 0,

  -- Completion and certification
  certificate_issued boolean DEFAULT false,
  certificate_number text UNIQUE, -- CERT-YYYY-XXXXXXXX
  certificate_url text, -- PDF stored in Supabase Storage
  certificate_issued_at timestamptz,

  -- Course instance (for cohort-based courses)
  cohort_name text,
  cohort_start_date timestamptz,
  cohort_end_date timestamptz,

  -- Expiration (for CE credits)
  expires_at timestamptz, -- Some certifications expire

  -- Instructor feedback
  final_grade numeric(5,2), -- 0-100
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
```

---

#### `lesson_progress` - Detailed Progress Tracking

**Purpose**: Track granular lesson-level progress including video watch positions to enable resume functionality and measure engagement.

```sql
CREATE TABLE lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,

  -- Progress tracking
  status text CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',

  -- Video-specific tracking
  video_position_seconds integer DEFAULT 0, -- Resume point for videos
  video_watched_seconds integer DEFAULT 0, -- Total watch time
  video_completion_percentage numeric(5,2) DEFAULT 0,

  -- SCORM tracking
  scorm_cmi_data jsonb, -- SCORM API data storage
  scorm_completion_status text,
  scorm_score numeric(5,2),

  -- Time tracking
  started_at timestamptz,
  completed_at timestamptz,
  time_spent_seconds integer DEFAULT 0,
  last_accessed_at timestamptz,

  -- Analytics
  access_count integer DEFAULT 0, -- Number of times lesson accessed

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_enrollment_lesson UNIQUE(enrollment_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX idx_lesson_progress_status ON lesson_progress(status);
CREATE INDEX idx_lesson_progress_scorm ON lesson_progress USING gin(scorm_cmi_data);

COMMENT ON TABLE lesson_progress IS 'Granular progress tracking supporting video resume, SCORM state, and time-on-task analytics';
```

---

#### `course_reviews` - Student Feedback

**Purpose**: Collect course ratings and feedback to improve content quality and inform purchasing decisions.

```sql
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
  liked_aspects text[], -- ["clear_explanations", "practical_examples"]
  improvement_areas text[], -- ["pacing", "audio_quality"]

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
```

---

### 3. Quiz & Assessment Engine (4 tables)

#### `quizzes` - Quiz Configuration

**Purpose**: Define assessments with passing criteria, time limits, and retry logic to validate learning outcomes.

```sql
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
    'pre_assessment', -- Diagnostic
    'formative', -- During module
    'summative', -- End of module
    'final_exam', -- Course conclusion
    'practice' -- No grade impact
  )) DEFAULT 'formative',

  -- Passing criteria
  passing_score numeric(5,2) DEFAULT 70.00, -- Percentage
  max_attempts integer, -- NULL = unlimited
  require_passing boolean DEFAULT false, -- Must pass to proceed

  -- Time limits
  time_limit_minutes integer, -- NULL = no limit

  -- Question settings
  shuffle_questions boolean DEFAULT true,
  shuffle_answers boolean DEFAULT true,
  show_correct_answers text CHECK (show_correct_answers IN (
    'immediately', -- After each question
    'after_submission', -- After quiz submitted
    'after_deadline', -- For scheduled quizzes
    'never'
  )) DEFAULT 'after_submission',

  -- Grading
  total_points numeric(8,2) DEFAULT 0, -- Auto-calculated from questions

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
```

---

#### `quiz_questions` - Question Bank

**Purpose**: Store reusable quiz questions supporting multiple question types to enable comprehensive knowledge assessment.

```sql
CREATE TABLE quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,

  -- Question content
  question_text text NOT NULL,
  question_html text, -- Rich text formatting

  -- Question type
  question_type text CHECK (question_type IN (
    'multiple_choice',
    'true_false',
    'multiple_answer', -- Select all that apply
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
  /* Example for multiple_choice:
  [
    {"id": "a", "text": "Answer A", "is_correct": false},
    {"id": "b", "text": "Answer B", "is_correct": true},
    {"id": "c", "text": "Answer C", "is_correct": false}
  ]
  */

  -- Correct answer(s)
  correct_answer jsonb, -- Flexible storage for various types

  -- Grading
  points numeric(5,2) DEFAULT 1.00,

  -- Explanation and feedback
  explanation text, -- Shown after answering
  hint text, -- Optional hint

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
```

---

#### `quiz_attempts` - Student Quiz Submissions

**Purpose**: Track quiz attempt history with scoring to measure learning progression and identify struggling students.

```sql
CREATE TABLE quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,

  -- Attempt metadata
  attempt_number integer NOT NULL, -- 1, 2, 3, etc.

  -- Timing
  started_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  time_spent_seconds integer,

  -- Scoring
  score numeric(5,2), -- Percentage
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
```

---

#### `quiz_answers` - Individual Question Responses

**Purpose**: Store granular answer data to enable question-level analytics and partial credit grading.

```sql
CREATE TABLE quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_attempt_id uuid REFERENCES quiz_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES quiz_questions(id) ON DELETE CASCADE NOT NULL,

  -- Answer data
  answer_data jsonb NOT NULL,
  /* Example structures:
  Multiple choice: {"selected": "b"}
  Multiple answer: {"selected": ["a", "c"]}
  Short answer: {"text": "Student response"}
  Essay: {"html": "<p>Essay content</p>"}
  */

  -- Scoring
  is_correct boolean,
  points_earned numeric(5,2) DEFAULT 0,
  max_points numeric(5,2),

  -- Timing
  answered_at timestamptz DEFAULT now(),
  time_spent_seconds integer,

  -- Feedback
  automated_feedback text, -- Auto-generated based on answer
  instructor_feedback text, -- Manual grading

  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_quiz_answers_attempt ON quiz_answers(quiz_attempt_id);
CREATE INDEX idx_quiz_answers_question ON quiz_answers(question_id);
CREATE INDEX idx_quiz_answers_correct ON quiz_answers(is_correct);

COMMENT ON TABLE quiz_answers IS 'Question-level response tracking enabling granular analytics and partial credit';
```

---

### 4. Assignments & Submissions (2 tables)

#### `assignments` - Course Assignments

**Purpose**: Define practical assignments with rubrics and deadlines to assess real-world application of learning.

```sql
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
  rubric jsonb, -- Structured grading criteria
  /* Example:
  [
    {"criterion": "Completeness", "points": 40, "description": "..."},
    {"criterion": "Accuracy", "points": 30, "description": "..."},
    {"criterion": "Presentation", "points": 30, "description": "..."}
  ]
  */

  -- Submission settings
  submission_type text CHECK (submission_type IN (
    'file_upload',
    'text_entry',
    'url_submission',
    'both'
  )) DEFAULT 'file_upload',
  allowed_file_types text[], -- ['pdf', 'docx', 'xlsx']
  max_file_size_mb integer DEFAULT 10,
  max_submissions integer DEFAULT 1,

  -- Deadlines
  available_from timestamptz,
  due_date timestamptz,
  late_submission_allowed boolean DEFAULT true,
  late_penalty_percentage numeric(5,2) DEFAULT 10, -- Per day

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
```

---

#### `assignment_submissions` - Student Work

**Purpose**: Store assignment submissions with file attachments to facilitate instructor grading and feedback.

```sql
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
  /* Example:
  [
    {"file_name": "report.pdf", "file_url": "...", "file_size": 1024000}
  ]
  */

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
  rubric_scores jsonb, -- Scores per rubric criterion

  -- Late penalty
  late_penalty_applied numeric(5,2) DEFAULT 0,
  final_score numeric(5,2), -- After late penalty

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_enrollment_assignment_submission UNIQUE(enrollment_id, assignment_id, submission_number)
);

CREATE INDEX idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_enrollment ON assignment_submissions(enrollment_id);
CREATE INDEX idx_assignment_submissions_member ON assignment_submissions(member_id);
CREATE INDEX idx_assignment_submissions_status ON assignment_submissions(status);

COMMENT ON TABLE assignment_submissions IS 'Student assignment submissions with file uploads, grading, and feedback';
```

---

### 5. Live Virtual Sessions (2 tables)

#### `live_sessions` - Virtual Classroom Sessions

**Purpose**: Schedule and manage live instructor-led sessions to support synchronous learning and real-time interaction.

```sql
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
  pre_session_materials jsonb DEFAULT '[]'::jsonb, -- File URLs
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
```

---

#### `session_attendance` - Attendance Tracking

**Purpose**: Record session attendance and participation metrics to validate engagement and CE credit eligibility.

```sql
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
  eligible_for_credit boolean DEFAULT false, -- Based on duration thresholds

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_member_session UNIQUE(member_id, session_id)
);

CREATE INDEX idx_session_attendance_session ON session_attendance(session_id);
CREATE INDEX idx_session_attendance_member ON session_attendance(member_id);
CREATE INDEX idx_session_attendance_attended ON session_attendance(attended);

COMMENT ON TABLE session_attendance IS 'Live session participation tracking with CE credit eligibility validation';
```

---

## Database Functions & Triggers

### Enrollment Progress Auto-Calculation

**Purpose**: Automatically update enrollment progress percentages when lesson progress changes to maintain accurate completion metrics.

```sql
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_total_lessons integer;
  v_completed_lessons integer;
  v_progress numeric(5,2);
BEGIN
  -- Get total lessons for this course
  SELECT COUNT(DISTINCT l.id)
  INTO v_total_lessons
  FROM lessons l
  JOIN course_modules m ON l.module_id = m.id
  WHERE m.course_id = (
    SELECT course_id FROM enrollments WHERE id = NEW.enrollment_id
  );

  -- Get completed lessons for this enrollment
  SELECT COUNT(*)
  INTO v_completed_lessons
  FROM lesson_progress
  WHERE enrollment_id = NEW.enrollment_id
    AND status = 'completed';

  -- Calculate progress percentage
  IF v_total_lessons > 0 THEN
    v_progress := ROUND((v_completed_lessons::numeric / v_total_lessons::numeric) * 100, 2);
  ELSE
    v_progress := 0;
  END IF;

  -- Update enrollment record
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
```

---

### Certificate Number Auto-Generation

**Purpose**: Generate unique certificate numbers with timestamp-based sequencing for audit compliance.

```sql
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year text;
  v_sequence text;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
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
```

---

### Quiz Auto-Grading

**Purpose**: Instantly grade objective question types to provide immediate feedback and reduce instructor workload.

```sql
CREATE OR REPLACE FUNCTION auto_grade_quiz_attempt()
RETURNS TRIGGER AS $$
DECLARE
  v_total_points numeric(8,2);
  v_points_earned numeric(8,2);
  v_score numeric(5,2);
  v_passing_score numeric(5,2);
  v_passed boolean;
BEGIN
  IF NEW.status = 'submitted' AND OLD.status = 'in_progress' THEN
    -- Calculate total points from questions
    SELECT COALESCE(SUM(points), 0)
    INTO v_total_points
    FROM quiz_questions
    WHERE quiz_id = NEW.quiz_id;

    -- Calculate points earned
    SELECT COALESCE(SUM(points_earned), 0)
    INTO v_points_earned
    FROM quiz_answers
    WHERE quiz_attempt_id = NEW.id;

    -- Calculate percentage score
    IF v_total_points > 0 THEN
      v_score := ROUND((v_points_earned / v_total_points) * 100, 2);
    ELSE
      v_score := 0;
    END IF;

    -- Check if passed
    SELECT passing_score INTO v_passing_score
    FROM quizzes WHERE id = NEW.quiz_id;

    v_passed := v_score >= v_passing_score;

    -- Update attempt
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
```

---

### Course Analytics Update

**Purpose**: Maintain real-time course statistics for informed decision-making and performance monitoring.

```sql
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
```

---

## Row Level Security (RLS) Policies

### Course Visibility Policies

```sql
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Public can view published courses
CREATE POLICY "Public can view published courses"
  ON courses FOR SELECT
  USING (status = 'published');

-- Instructors can manage their own courses
CREATE POLICY "Instructors can manage own courses"
  ON courses FOR ALL
  USING (
    instructor_id = auth.uid()
    OR auth.uid() = ANY(co_instructors)
  );

-- Admins have full access (via service role)
```

### Enrollment Access Policies

```sql
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Members can view their own enrollments
CREATE POLICY "Members can view own enrollments"
  ON enrollments FOR SELECT
  USING (member_id = auth.uid());

-- Members can enroll in published courses
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

-- Members can update own enrollment progress
CREATE POLICY "Members can update own progress"
  ON enrollments FOR UPDATE
  USING (member_id = auth.uid());
```

### Quiz Attempt Policies

```sql
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Members can view own quiz attempts
CREATE POLICY "Members can view own quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (member_id = auth.uid());

-- Members can create quiz attempts for enrolled courses
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

-- Members can update their own in-progress attempts
CREATE POLICY "Members can update own attempts"
  ON quiz_attempts FOR UPDATE
  USING (member_id = auth.uid() AND status = 'in_progress');
```

---

## Integration with Existing NABIP Schema

### 1. Members Table Integration

The existing `members` table already supports the LMS through:
- `credentials` field (professional certifications)
- `designations` field (REBC, RHU, CLU, ChFC)
- `engagement_score` (updated based on course activity)

**No modifications required.**

### 2. Transactions Table Integration

Course purchases link to existing financial tracking:

```sql
-- When member purchases a course
INSERT INTO transactions (
  member_id,
  transaction_type,
  amount,
  description,
  status
) VALUES (
  'member-uuid',
  'course_purchase',
  199.00,
  'Insurance Fundamentals Course',
  'completed'
);

-- Then link to enrollment
INSERT INTO enrollments (
  course_id,
  member_id,
  transaction_id,
  amount_paid
) VALUES (
  'course-uuid',
  'member-uuid',
  'transaction-uuid', -- From above
  199.00
);
```

### 3. Audit Logs Integration

All LMS activities automatically log via existing `audit_logs` table:

```sql
-- Trigger on enrollments
CREATE TRIGGER log_enrollment_changes
  AFTER INSERT OR UPDATE OR DELETE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_trail('enrollments');

-- Trigger on quiz attempts
CREATE TRIGGER log_quiz_attempt_changes
  AFTER INSERT OR UPDATE ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_trail('quiz_attempts');
```

---

## Sample Data Migration & Seeding

### Seed Sample Courses

```sql
-- Insert sample courses
WITH new_course AS (
  INSERT INTO courses (
    title,
    slug,
    description,
    short_description,
    category,
    difficulty_level,
    ce_credits,
    pricing_type,
    price,
    member_price,
    delivery_format,
    estimated_duration_minutes,
    status,
    published_at
  ) VALUES (
    'Health Insurance Fundamentals',
    'health-insurance-fundamentals',
    'Comprehensive introduction to health insurance products, regulations, and sales strategies for insurance professionals.',
    'Master health insurance fundamentals and regulations',
    'health_benefits',
    'beginner',
    10.00,
    'paid',
    299.00,
    199.00,
    'self_paced',
    600,
    'published',
    now()
  ) RETURNING id
)
-- Insert modules for this course
INSERT INTO course_modules (course_id, title, description, module_order, estimated_duration_minutes)
SELECT
  id,
  unnest(ARRAY['Introduction to Health Insurance', 'Regulatory Landscape', 'Product Types', 'Sales Strategies']),
  unnest(ARRAY[
    'Overview of health insurance industry and terminology',
    'Understanding ACA, HIPAA, and state regulations',
    'Individual, group, Medicare, and Medicaid plans',
    'Needs analysis and closing techniques'
  ]),
  unnest(ARRAY[1, 2, 3, 4]),
  unnest(ARRAY[120, 150, 180, 150])
FROM new_course;
```

---

## Performance Optimization Strategy

### Index Strategy

**Best for**: Query patterns involving:
- Course catalog browsing (category, status, pricing)
- Student dashboard (enrollments by member_id)
- Instructor views (courses by instructor_id)
- Progress tracking (lesson_progress by enrollment)
- Quiz grading (quiz_attempts by status)

All indexes defined inline with table definitions optimize read-heavy workloads typical in LMS platforms.

### Partitioning Recommendations

For organizations exceeding 100,000 enrollments:

```sql
-- Partition enrollments by created_at (monthly)
CREATE TABLE enrollments_partitioned (LIKE enrollments INCLUDING ALL)
PARTITION BY RANGE (created_at);

CREATE TABLE enrollments_2025_01 PARTITION OF enrollments_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE enrollments_2025_02 PARTITION OF enrollments_partitioned
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
-- Continue for each month
```

### Caching Strategy

Implement Redis/Memcached for:
- Course catalog listings (5-minute TTL)
- Student progress dashboards (1-minute TTL)
- Quiz questions (until modified)
- Certificate verification (24-hour TTL)

---

## Certificate Generation Strategy

### PDF Generation via Supabase Edge Function

**Purpose**: Generate professional, tamper-proof certificates with QR code verification.

**Technology Stack**:
- **jsPDF**: PDF generation library
- **QRCode.js**: QR code generation
- **Supabase Storage**: PDF storage

**Implementation Pattern**:

```typescript
// Edge Function: generate-certificate
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export async function generateCertificate(enrollmentId: string) {
  // 1. Fetch enrollment + course + member data
  const enrollment = await supabase
    .from('enrollments')
    .select(`
      *,
      course:courses(*),
      member:members(*)
    `)
    .eq('id', enrollmentId)
    .single();

  // 2. Create PDF
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: 'letter'
  });

  // 3. Add certificate content
  doc.setFontSize(36);
  doc.text('Certificate of Completion', 5.5, 2, { align: 'center' });

  doc.setFontSize(20);
  doc.text(enrollment.member.first_name + ' ' + enrollment.member.last_name, 5.5, 3.5, { align: 'center' });

  doc.setFontSize(14);
  doc.text('has successfully completed', 5.5, 4.2, { align: 'center' });

  doc.setFontSize(24);
  doc.text(enrollment.course.title, 5.5, 5, { align: 'center' });

  // 4. Add QR code for verification
  const qrDataUrl = await QRCode.toDataURL(
    `https://nabip-ams.com/verify-certificate/${enrollment.certificate_number}`
  );
  doc.addImage(qrDataUrl, 'PNG', 9, 6, 1, 1);

  // 5. Upload to Supabase Storage
  const pdfBlob = doc.output('blob');
  const { data: uploadData } = await supabase.storage
    .from('certificates')
    .upload(`${enrollment.certificate_number}.pdf`, pdfBlob);

  // 6. Update enrollment record
  await supabase
    .from('enrollments')
    .update({
      certificate_url: uploadData.path
    })
    .eq('id', enrollmentId);

  return uploadData.path;
}
```

**Certificate Verification Endpoint**:

```sql
-- Public certificate verification function
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
```

---

## Video Storage & Streaming Strategy

### Option 1: Supabase Storage (Recommended for <500 courses)

**Advantages**:
- Integrated with existing infrastructure
- No additional vendor dependencies
- Simple upload workflow
- Cost-effective for moderate volumes

**Implementation**:

```typescript
// Upload video to Supabase Storage
const { data, error } = await supabase.storage
  .from('course-videos')
  .upload(`lessons/${lessonId}/video.mp4`, videoFile, {
    cacheControl: '3600',
    upsert: false
  });

// Get signed URL for playback
const { data: signedUrl } = await supabase.storage
  .from('course-videos')
  .createSignedUrl(`lessons/${lessonId}/video.mp4`, 3600);

// Store in lessons table
await supabase
  .from('lessons')
  .update({
    content_url: signedUrl.signedUrl,
    video_provider: 'supabase_storage'
  })
  .eq('id', lessonId);
```

### Option 2: Vimeo (Recommended for >500 courses)

**Advantages**:
- Professional video player with controls
- Adaptive bitrate streaming (HLS)
- Built-in analytics
- Privacy controls and domain restrictions
- Subtitle support

**Implementation**:

```typescript
// Upload to Vimeo via API
const vimeoUpload = await fetch('https://api.vimeo.com/me/videos', {
  method: 'POST',
  headers: {
    'Authorization': `bearer ${VIMEO_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: lesson.title,
    privacy: { view: 'unlisted' },
    embed: {
      buttons: { like: false, share: false },
      logos: { vimeo: false }
    }
  })
});

// Store Vimeo player URL
await supabase
  .from('lessons')
  .update({
    content_url: vimeoData.player_embed_url,
    video_provider: 'vimeo',
    video_duration_seconds: vimeoData.duration
  })
  .eq('id', lessonId);
```

### Video Progress Tracking (All Providers)

```typescript
// Frontend: Track video progress every 10 seconds
const trackProgress = async (lessonId, position, duration) => {
  const completionPercentage = (position / duration) * 100;

  await supabase
    .from('lesson_progress')
    .upsert({
      enrollment_id: currentEnrollment.id,
      lesson_id: lessonId,
      video_position_seconds: Math.floor(position),
      video_watched_seconds: Math.floor(position),
      video_completion_percentage: Math.min(completionPercentage, 100),
      status: completionPercentage >= 90 ? 'completed' : 'in_progress',
      last_accessed_at: new Date().toISOString()
    }, {
      onConflict: 'enrollment_id,lesson_id'
    });
};

// Frontend: Resume from saved position
const resumeVideo = async (lessonId) => {
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('video_position_seconds')
    .eq('enrollment_id', currentEnrollment.id)
    .eq('lesson_id', lessonId)
    .single();

  return progress?.video_position_seconds || 0;
};
```

---

## SCORM Package Support

### SCORM 1.2 Integration

**Purpose**: Enable import of existing SCORM courses for rapid content deployment.

**Implementation**:

```typescript
// SCORM Package Upload Handler
export async function uploadScormPackage(file: File, lessonId: string) {
  // 1. Unzip SCORM package
  const jszip = new JSZip();
  const zip = await jszip.loadAsync(file);

  // 2. Extract imsmanifest.xml
  const manifestXml = await zip.file('imsmanifest.xml')?.async('text');
  const parser = new DOMParser();
  const manifest = parser.parseFromString(manifestXml, 'text/xml');

  // 3. Upload all package files to Supabase Storage
  const baseFolder = `scorm/${lessonId}/`;
  for (const [relativePath, file] of Object.entries(zip.files)) {
    if (!file.dir) {
      const content = await file.async('blob');
      await supabase.storage
        .from('course-scorm')
        .upload(baseFolder + relativePath, content);
    }
  }

  // 4. Get launch file from manifest
  const launchFile = manifest.querySelector('resource[type="webcontent"]')
    ?.getAttribute('href');

  // 5. Update lesson record
  await supabase
    .from('lessons')
    .update({
      lesson_type: 'scorm',
      scorm_package_url: baseFolder,
      scorm_manifest_url: baseFolder + 'imsmanifest.xml',
      scorm_version: '1.2',
      content_url: baseFolder + launchFile
    })
    .eq('id', lessonId);
}
```

### SCORM API Wrapper (Client-Side)

```typescript
// SCORM API emulation for lesson_progress tracking
class ScormApiWrapper {
  private enrollmentId: string;
  private lessonId: string;
  private cmiData: any = {};

  Initialize() {
    // Load existing SCORM state from database
    return 'true';
  }

  GetValue(element: string) {
    return this.cmiData[element] || '';
  }

  SetValue(element: string, value: string) {
    this.cmiData[element] = value;

    // Save to database
    supabase
      .from('lesson_progress')
      .upsert({
        enrollment_id: this.enrollmentId,
        lesson_id: this.lessonId,
        scorm_cmi_data: this.cmiData,
        scorm_completion_status: this.cmiData['cmi.core.lesson_status'],
        scorm_score: parseFloat(this.cmiData['cmi.core.score.raw']),
        status: this.cmiData['cmi.core.lesson_status'] === 'completed'
          ? 'completed'
          : 'in_progress'
      }, {
        onConflict: 'enrollment_id,lesson_id'
      });

    return 'true';
  }

  Commit() {
    // Already saved on SetValue
    return 'true';
  }

  Terminate() {
    return 'true';
  }
}

// Expose to SCORM content
window.API = new ScormApiWrapper();
```

---

## Migration Path from Current useKV Architecture

### Phase 1: Database Setup (Week 1)

```sql
-- Run all migrations in sequence
\i supabase/migrations/20250115100000_lms_schema.sql

-- Seed sample data
\i supabase/migrations/20250115100001_lms_seed_data.sql

-- Validate schema
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'course%' OR table_name LIKE '%quiz%'
ORDER BY table_name;
```

### Phase 2: Frontend Migration (Week 2-3)

Replace useKV hooks with Supabase queries:

```typescript
// BEFORE (useKV)
const [courses, setCourses] = useKV<Course[]>('ams-courses', []);
const [enrollments, setEnrollments] = useKV<Enrollment[]>('ams-enrollments', []);

// AFTER (Supabase)
const { data: courses, error: coursesError } = await supabase
  .from('courses')
  .select('*')
  .eq('status', 'published')
  .order('title');

const { data: enrollments, error: enrollmentsError } = await supabase
  .from('enrollments')
  .select(`
    *,
    course:courses(title, thumbnail_url, ce_credits)
  `)
  .eq('member_id', currentMember.id);
```

### Phase 3: Video Infrastructure (Week 4)

1. Set up Supabase Storage buckets:
   - `course-videos`
   - `course-scorm`
   - `certificates`
   - `assignment-submissions`

2. Implement video upload workflow
3. Deploy certificate generation Edge Function
4. Test video resume functionality

### Phase 4: Testing & QA (Week 5)

- Load test with 1,000+ concurrent students
- Validate certificate generation
- Test RLS policies across all roles
- Verify SCORM package compatibility
- Measure quiz auto-grading performance

---

## Monitoring & Maintenance

### Key Performance Indicators (KPIs)

```sql
-- Daily LMS Health Check Query
SELECT
  'Total Active Enrollments' AS metric,
  COUNT(*) AS value
FROM enrollments
WHERE status IN ('enrolled', 'in_progress')
UNION ALL
SELECT
  'Avg Course Completion Rate',
  ROUND(AVG(completion_rate), 2)
FROM courses
WHERE status = 'published'
UNION ALL
SELECT
  'Certificates Issued (30d)',
  COUNT(*)::text
FROM enrollments
WHERE certificate_issued_at >= NOW() - INTERVAL '30 days'
UNION ALL
SELECT
  'Avg Video Completion %',
  ROUND(AVG(video_completion_percentage), 2)::text
FROM lesson_progress
WHERE lesson_id IN (
  SELECT id FROM lessons WHERE lesson_type = 'video'
);
```

### Slow Query Detection

```sql
-- Identify slow-running queries
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  most_common_vals
FROM pg_stats
WHERE schemaname = 'public'
  AND tablename IN ('enrollments', 'lesson_progress', 'quiz_attempts')
ORDER BY n_distinct DESC;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'course%'
ORDER BY idx_scan DESC;
```

### Automated Maintenance Tasks

```sql
-- Weekly: Archive old quiz attempts (>2 years)
UPDATE quiz_attempts
SET status = 'archived'
WHERE submitted_at < NOW() - INTERVAL '2 years'
  AND status = 'graded';

-- Monthly: Update course analytics
UPDATE courses
SET
  avg_rating = (
    SELECT AVG(rating)
    FROM course_reviews
    WHERE course_id = courses.id AND is_approved = true
  ),
  total_reviews = (
    SELECT COUNT(*)
    FROM course_reviews
    WHERE course_id = courses.id AND is_approved = true
  );

-- Daily: Clean up abandoned quiz attempts
DELETE FROM quiz_attempts
WHERE status = 'in_progress'
  AND started_at < NOW() - INTERVAL '7 days';
```

---

## Security & Compliance

### Data Privacy (FERPA Compliance)

Educational records require strict privacy controls:

```sql
-- RLS ensures students only see own grades
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students see own quiz attempts only"
  ON quiz_attempts FOR SELECT
  USING (member_id = auth.uid());

-- Instructors can view enrollments in their courses
CREATE POLICY "Instructors view own course enrollments"
  ON enrollments FOR SELECT
  USING (
    course_id IN (
      SELECT id FROM courses WHERE instructor_id = auth.uid()
    )
  );
```

### Certificate Verification API

Public endpoint for credential verification:

```sql
-- Create public API view (no authentication required)
CREATE OR REPLACE VIEW public_certificate_verification AS
SELECT
  e.certificate_number,
  m.first_name || ' ' || m.last_name AS member_name,
  c.title AS course_title,
  e.completed_at,
  c.ce_credits,
  e.certificate_url
FROM enrollments e
JOIN members m ON e.member_id = m.id
JOIN courses c ON e.course_id = c.id
WHERE e.status = 'completed'
  AND e.certificate_issued = true;

-- Enable access without authentication
GRANT SELECT ON public_certificate_verification TO anon;
```

---

## Cost Estimation & Scalability

### Storage Requirements

**20,000 Members, 500 Courses**:

| Data Type | Avg Size | Volume | Total Storage |
|-----------|----------|--------|---------------|
| Course Videos | 500 MB/course | 500 courses | 250 GB |
| SCORM Packages | 20 MB/package | 100 packages | 2 GB |
| Certificates (PDF) | 100 KB | 10,000 certs/year | 1 GB/year |
| Assignment Submissions | 2 MB/submission | 50,000/year | 100 GB/year |
| **Total Year 1** | | | **~353 GB** |

**Supabase Storage Pricing**: $0.021/GB/month = ~$7.41/month

### Database Size Projection

| Table | Rows (Year 1) | Avg Row Size | Total Size |
|-------|---------------|--------------|------------|
| courses | 500 | 5 KB | 2.5 MB |
| enrollments | 50,000 | 2 KB | 100 MB |
| lesson_progress | 500,000 | 1 KB | 500 MB |
| quiz_attempts | 100,000 | 3 KB | 300 MB |
| **Total Database** | | | **~900 MB** |

**Supabase Database Pricing**: Included in Pro plan ($25/month)

**Total Estimated Cost**: $32.41/month (scales linearly with usage)

---

## Next Steps & Implementation Roadmap

### Week 1: Foundation
- [ ] Execute all SQL migrations
- [ ] Create Supabase Storage buckets
- [ ] Configure RLS policies
- [ ] Deploy certificate generation Edge Function

### Week 2: Course Builder
- [ ] Build instructor course creation UI
- [ ] Implement module/lesson editor
- [ ] Add video upload workflow
- [ ] Create quiz builder interface

### Week 3: Student Experience
- [ ] Build course catalog with search/filter
- [ ] Implement video player with resume
- [ ] Create student dashboard
- [ ] Add progress tracking visualizations

### Week 4: Assessments
- [ ] Build quiz taking interface
- [ ] Implement auto-grading logic
- [ ] Create assignment submission workflow
- [ ] Add instructor grading interface

### Week 5: Certification & Live Sessions
- [ ] Deploy certificate PDF generation
- [ ] Build certificate verification page
- [ ] Implement live session scheduling
- [ ] Add attendance tracking

### Week 6: Testing & Launch
- [ ] Load testing (1,000+ concurrent users)
- [ ] Security audit of RLS policies
- [ ] Performance optimization
- [ ] User acceptance testing
- [ ] Documentation & training
- [ ] Production deployment

---

## Support & References

**Supabase Documentation**:
- Storage: https://supabase.com/docs/guides/storage
- Edge Functions: https://supabase.com/docs/guides/functions
- RLS Policies: https://supabase.com/docs/guides/auth/row-level-security

**SCORM Resources**:
- SCORM 1.2 Specification: https://scorm.com/scorm-explained/technical-scorm/scorm-12-overview/
- SCORM Cloud: https://rusticisoftware.com/products/scorm-cloud/

**Video Streaming**:
- Vimeo API: https://developer.vimeo.com/api/reference
- HLS Specification: https://datatracker.ietf.org/doc/html/rfc8216

**PDF Generation**:
- jsPDF: https://github.com/parallax/jsPDF
- QRCode.js: https://github.com/davidshimjs/qrcodejs

---

**Document Version**: 1.0
**Last Updated**: 2025-01-15
**Maintained By**: Brookside BI - Database Architecture Team
**Contact**: Consultations@BrooksideBI.com | +1 209 487 2047

---

This comprehensive LMS database architecture establishes scalable data foundations that streamline professional development workflows, improve learning visibility, and drive measurable certification outcomes across your 20,000+ member organization. The design supports sustainable growth while maintaining compliance, security, and performance at enterprise scale.
