# NABIP AMS - Learning Management System Implementation Guide

## Executive Summary

This guide provides step-by-step instructions for implementing the comprehensive Learning Management System (LMS) within the NABIP Association Management System. The implementation follows a structured approach to minimize risk, ensure data integrity, and deliver measurable learning outcomes within 6 weeks.

**Estimated Timeline**: 6 weeks
**Total Tables**: 15 core LMS tables
**Key Deliverables**: Course builder, student interface, quiz engine, certificate generation, live sessions
**Team Requirements**: 2-3 developers, 1 database administrator, 1 QA engineer

---

## Phase 1: Database Foundation (Week 1)

### Step 1.1: Execute Schema Migration

```bash
# Navigate to project directory
cd C:\Users\MarkusAhling\nabip-ams-alpha\nabip-association-ma

# Execute LMS schema migration via Supabase CLI
supabase db push

# Or manually via psql
psql -h db.YOUR_PROJECT_REF.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/migrations/20250115100000_lms_schema.sql
```

**Validation**:
```sql
-- Verify all 15 LMS tables created
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE 'course%'
    OR table_name LIKE '%quiz%'
    OR table_name LIKE '%lesson%'
    OR table_name LIKE 'enrollment%'
    OR table_name LIKE 'assignment%'
    OR table_name LIKE 'live_session%'
  )
ORDER BY table_name;

-- Should return 15 tables:
-- assignments, assignment_submissions, course_modules, course_reviews,
-- courses, enrollments, lesson_attachments, lesson_progress, lessons,
-- live_sessions, quiz_answers, quiz_attempts, quiz_questions, quizzes,
-- session_attendance
```

### Step 1.2: Configure Supabase Storage Buckets

```typescript
// Execute via Supabase Dashboard or API
const buckets = [
  {
    name: 'course-videos',
    public: false,
    fileSizeLimit: 1073741824, // 1GB
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime']
  },
  {
    name: 'course-scorm',
    public: false,
    fileSizeLimit: 104857600, // 100MB
    allowedMimeTypes: ['application/zip']
  },
  {
    name: 'certificates',
    public: false,
    fileSizeLimit: 1048576, // 1MB
    allowedMimeTypes: ['application/pdf']
  },
  {
    name: 'assignment-submissions',
    public: false,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  {
    name: 'lesson-attachments',
    public: false,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['application/pdf', 'application/zip']
  }
];

// Create each bucket
for (const bucket of buckets) {
  const { data, error } = await supabase.storage.createBucket(
    bucket.name,
    {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: bucket.allowedMimeTypes
    }
  );
}
```

**Storage RLS Policies**:
```sql
-- Allow authenticated users to upload to assignment-submissions
CREATE POLICY "Users can upload own assignment submissions"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assignment-submissions'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to read certificates they earned
CREATE POLICY "Users can read own certificates"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'certificates'
    AND EXISTS (
      SELECT 1 FROM enrollments
      WHERE member_id = auth.uid()
      AND certificate_url LIKE '%' || name || '%'
    )
  );
```

### Step 1.3: Deploy Certificate Generation Edge Function

Create `supabase/functions/generate-certificate/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsPDF } from 'https://cdn.skypack.dev/jspdf@2.5.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { enrollmentId } = await req.json();

    // 1. Fetch enrollment with course and member data
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(title, ce_credits, instructor_id),
        member:members(first_name, last_name)
      `)
      .eq('id', enrollmentId)
      .single();

    if (enrollmentError) throw enrollmentError;

    // 2. Create PDF certificate
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: 'letter'
    });

    // Certificate border
    doc.setLineWidth(0.05);
    doc.rect(0.5, 0.5, 10, 7.5);
    doc.rect(0.6, 0.6, 9.8, 7.3);

    // Certificate title
    doc.setFontSize(48);
    doc.setFont('times', 'bold');
    doc.text('Certificate of Completion', 5.5, 2, { align: 'center' });

    // Horizontal line
    doc.setLineWidth(0.02);
    doc.line(2, 2.5, 9, 2.5);

    // Member name
    doc.setFontSize(32);
    doc.setFont('times', 'italic');
    doc.text(
      `${enrollment.member.first_name} ${enrollment.member.last_name}`,
      5.5,
      3.5,
      { align: 'center' }
    );

    // Body text
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('has successfully completed', 5.5, 4.2, { align: 'center' });

    // Course title
    doc.setFontSize(24);
    doc.setFont('times', 'bold');
    doc.text(enrollment.course.title, 5.5, 5, { align: 'center' });

    // CE Credits
    if (enrollment.course.ce_credits > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Continuing Education Credits: ${enrollment.course.ce_credits}`,
        5.5,
        5.7,
        { align: 'center' }
      );
    }

    // Certificate number and date
    doc.setFontSize(12);
    const completionDate = new Date(enrollment.completed_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Certificate Number: ${enrollment.certificate_number}`, 5.5, 6.5, { align: 'center' });
    doc.text(`Issued: ${completionDate}`, 5.5, 6.9, { align: 'center' });

    // Signature line
    doc.line(1.5, 7.5, 3.5, 7.5);
    doc.setFontSize(10);
    doc.text('Authorized Signature', 2.5, 7.7, { align: 'center' });

    // 3. Convert to blob and upload to Supabase Storage
    const pdfBlob = doc.output('blob');
    const fileName = `${enrollment.certificate_number}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // 4. Get public URL
    const { data: urlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(fileName);

    // 5. Update enrollment with certificate URL
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({ certificate_url: urlData.publicUrl })
      .eq('id', enrollmentId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        certificateUrl: urlData.publicUrl,
        certificateNumber: enrollment.certificate_number
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
```

Deploy Edge Function:
```bash
supabase functions deploy generate-certificate
```

---

## Phase 2: Frontend Foundation (Week 2)

### Step 2.1: Install Dependencies

```bash
npm install @supabase/supabase-js
npm install date-fns
npm install react-player  # For video playback
npm install react-markdown  # For lesson content
npm install recharts  # Analytics charts (already installed)
```

### Step 2.2: Create Supabase Client

Update `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get current authenticated user
export async function getCurrentMember() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', user.id)
    .single();

  return member;
}
```

### Step 2.3: Create LMS Type Definitions

Update `src/lib/types.ts` to add LMS interfaces:

```typescript
// Add to existing types.ts file

export interface LMSCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  learning_objectives: string[];
  prerequisites: string[];
  category: CourseCategory;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  ce_credits: number;
  pricing_type: 'free' | 'paid' | 'member_only' | 'premium';
  price: number;
  member_price?: number;
  delivery_format: 'self_paced' | 'instructor_led' | 'blended' | 'live_virtual';
  estimated_duration_minutes: number;
  status: 'draft' | 'published' | 'archived' | 'under_review';
  instructor_id: string;
  thumbnail_url?: string;
  total_enrollments: number;
  completion_rate: number;
  avg_rating?: number;
}

export type CourseCategory =
  | 'insurance_fundamentals'
  | 'health_benefits'
  | 'life_insurance'
  | 'retirement_planning'
  | 'compliance'
  | 'sales_techniques'
  | 'leadership'
  | 'technology'
  | 'continuing_education';

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  module_order: number;
  estimated_duration_minutes?: number;
  is_preview: boolean;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  lesson_type: LessonType;
  lesson_order: number;
  content_url?: string;
  content_html?: string;
  video_duration_seconds?: number;
  video_provider?: 'supabase_storage' | 'vimeo' | 'youtube' | 'wistia';
  is_preview: boolean;
  completion_criteria: 'video_watched' | 'time_spent' | 'quiz_passed' | 'marked_complete' | 'scorm_completed';
}

export type LessonType =
  | 'video'
  | 'text'
  | 'pdf'
  | 'scorm'
  | 'quiz'
  | 'assignment'
  | 'live_session'
  | 'external_link'
  | 'embedded_content';

export interface LMSEnrollment {
  id: string;
  course_id: string;
  member_id: string;
  enrolled_at: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped' | 'expired' | 'suspended';
  progress_percentage: number;
  lessons_completed: number;
  total_lessons: number;
  current_lesson_id?: string;
  started_at?: string;
  last_accessed_at?: string;
  completed_at?: string;
  certificate_issued: boolean;
  certificate_number?: string;
  certificate_url?: string;
}

export interface LessonProgress {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  video_position_seconds: number;
  video_completion_percentage: number;
  last_accessed_at?: string;
}

export interface Quiz {
  id: string;
  course_id?: string;
  lesson_id?: string;
  title: string;
  description?: string;
  quiz_type: 'pre_assessment' | 'formative' | 'summative' | 'final_exam' | 'practice';
  passing_score: number;
  max_attempts?: number;
  time_limit_minutes?: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  enrollment_id: string;
  member_id: string;
  attempt_number: number;
  status: 'in_progress' | 'submitted' | 'graded' | 'expired';
  score?: number;
  passed?: boolean;
  started_at: string;
  submitted_at?: string;
}
```

---

## Phase 3: Course Catalog & Student Interface (Week 3)

### Step 3.1: Create Course Catalog Component

Create `src/components/features/CourseCatalog.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LMSCourse } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function CourseCatalog() {
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchCourses();
  }, [selectedCategory]);

  async function fetchCourses() {
    setLoading(true);
    let query = supabase
      .from('courses')
      .select('*')
      .eq('status', 'published')
      .order('title');

    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching courses:', error);
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  }

  async function enrollInCourse(courseId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in to enroll in courses');
      return;
    }

    const { error } = await supabase
      .from('enrollments')
      .insert({
        course_id: courseId,
        member_id: user.id,
        enrollment_source: 'self_enrollment'
      });

    if (error) {
      console.error('Error enrolling:', error);
      alert('Failed to enroll in course');
    } else {
      alert('Successfully enrolled!');
      // Refresh or navigate to My Courses
    }
  }

  if (loading) {
    return <div>Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('all')}
        >
          All Courses
        </Button>
        <Button
          variant={selectedCategory === 'health_benefits' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('health_benefits')}
        >
          Health Benefits
        </Button>
        <Button
          variant={selectedCategory === 'compliance' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('compliance')}
        >
          Compliance
        </Button>
        {/* Add more category filters */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="p-6">
            {course.thumbnail_url && (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full h-48 object-cover rounded-md mb-4"
              />
            )}
            <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{course.short_description}</p>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                {course.ce_credits} CE Credits
              </span>
              <span className="text-sm text-gray-500">
                {Math.floor(course.estimated_duration_minutes / 60)}h {course.estimated_duration_minutes % 60}m
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">
                {course.pricing_type === 'free'
                  ? 'Free'
                  : `$${course.price}`}
              </span>
              <Button onClick={() => enrollInCourse(course.id)}>
                Enroll Now
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### Step 3.2: Create Student Dashboard Component

Create `src/components/features/StudentDashboard.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LMSEnrollment } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function StudentDashboard() {
  const [enrollments, setEnrollments] = useState<LMSEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  async function fetchEnrollments() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(title, thumbnail_url, ce_credits)
      `)
      .eq('member_id', user.id)
      .in('status', ['enrolled', 'in_progress', 'completed'])
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Error fetching enrollments:', error);
    } else {
      setEnrollments(data || []);
    }
    setLoading(false);
  }

  if (loading) {
    return <div>Loading your courses...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Learning</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrollments.map((enrollment) => (
          <Card key={enrollment.id} className="p-6">
            <h3 className="text-lg font-semibold mb-2">
              {enrollment.course.title}
            </h3>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{enrollment.progress_percentage}%</span>
              </div>
              <Progress value={enrollment.progress_percentage} />
            </div>

            <div className="text-sm text-gray-600 mb-4">
              {enrollment.lessons_completed} of {enrollment.total_lessons} lessons completed
            </div>

            {enrollment.certificate_issued && (
              <a
                href={enrollment.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                View Certificate
              </a>
            )}

            <Button
              className="w-full mt-4"
              onClick={() => {
                // Navigate to course player
                window.location.href = `/learning/course/${enrollment.course_id}`;
              }}
            >
              {enrollment.status === 'completed' ? 'Review Course' : 'Continue Learning'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## Phase 4: Video Player & Progress Tracking (Week 4)

### Step 4.1: Create Video Lesson Player

Create `src/components/features/VideoLessonPlayer.tsx`:

```typescript
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import ReactPlayer from 'react-player';
import { Lesson, LessonProgress } from '@/lib/types';

interface VideoLessonPlayerProps {
  lesson: Lesson;
  enrollmentId: string;
  onComplete: () => void;
}

export function VideoLessonPlayer({
  lesson,
  enrollmentId,
  onComplete
}: VideoLessonPlayerProps) {
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);

  useEffect(() => {
    loadProgress();
  }, [lesson.id]);

  async function loadProgress() {
    const { data } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .eq('lesson_id', lesson.id)
      .single();

    if (data) {
      setProgress(data);
      // Resume from saved position
      if (playerRef.current && data.video_position_seconds > 0) {
        playerRef.current.seekTo(data.video_position_seconds, 'seconds');
      }
    }
  }

  async function updateProgress(playedSeconds: number, played: number) {
    const completionPercentage = played * 100;

    await supabase
      .from('lesson_progress')
      .upsert({
        enrollment_id: enrollmentId,
        lesson_id: lesson.id,
        video_position_seconds: Math.floor(playedSeconds),
        video_watched_seconds: Math.floor(playedSeconds),
        video_completion_percentage: completionPercentage,
        status: completionPercentage >= 90 ? 'completed' : 'in_progress',
        last_accessed_at: new Date().toISOString()
      }, {
        onConflict: 'enrollment_id,lesson_id'
      });

    // Mark lesson complete if 90%+ watched
    if (completionPercentage >= 90 && progress?.status !== 'completed') {
      onComplete();
    }
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <ReactPlayer
        ref={playerRef}
        url={lesson.content_url}
        width="100%"
        height="100%"
        playing={playing}
        controls
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onProgress={({ playedSeconds, played }) => {
          // Save progress every 10 seconds
          if (Math.floor(playedSeconds) % 10 === 0) {
            updateProgress(playedSeconds, played);
          }
        }}
      />
    </div>
  );
}
```

---

## Phase 5: Quiz Engine (Week 5)

### Step 5.1: Create Quiz Taking Interface

Create `src/components/features/QuizInterface.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Quiz, QuizQuestion, QuizAttempt } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface QuizInterfaceProps {
  quiz: Quiz;
  enrollmentId: string;
  onComplete: (passed: boolean) => void;
}

export function QuizInterface({ quiz, enrollmentId, onComplete }: QuizInterfaceProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    startQuiz();
  }, []);

  async function startQuiz() {
    // Fetch questions
    const { data: questionsData } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('question_order');

    setQuestions(questionsData || []);

    // Create quiz attempt
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get attempt number
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('attempt_number')
      .eq('enrollment_id', enrollmentId)
      .eq('quiz_id', quiz.id)
      .order('attempt_number', { ascending: false })
      .limit(1);

    const attemptNumber = attempts && attempts.length > 0
      ? attempts[0].attempt_number + 1
      : 1;

    const { data: newAttempt } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quiz.id,
        enrollment_id: enrollmentId,
        member_id: user.id,
        attempt_number: attemptNumber,
        status: 'in_progress'
      })
      .select()
      .single();

    setAttemptId(newAttempt?.id || null);

    // Start timer if time limit exists
    if (quiz.time_limit_minutes) {
      setTimeRemaining(quiz.time_limit_minutes * 60);
    }
  }

  async function submitQuiz() {
    if (!attemptId) return;

    // Save all answers
    for (const [questionId, answerData] of Object.entries(answers)) {
      const question = questions.find(q => q.id === questionId);
      if (!question) continue;

      // Auto-grade objective questions
      let isCorrect = false;
      let pointsEarned = 0;

      if (question.question_type === 'multiple_choice') {
        isCorrect = answerData.selected === question.correct_answer;
        pointsEarned = isCorrect ? question.points : 0;
      } else if (question.question_type === 'true_false') {
        isCorrect = answerData.selected === question.correct_answer;
        pointsEarned = isCorrect ? question.points : 0;
      }

      await supabase
        .from('quiz_answers')
        .insert({
          quiz_attempt_id: attemptId,
          question_id: questionId,
          answer_data: answerData,
          is_correct: isCorrect,
          points_earned: pointsEarned,
          max_points: question.points
        });
    }

    // Update attempt status to submitted (triggers auto-grading)
    const { data: updatedAttempt } = await supabase
      .from('quiz_attempts')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', attemptId)
      .select()
      .single();

    if (updatedAttempt) {
      onComplete(updatedAttempt.passed || false);
    }
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return <div>Loading quiz...</div>;
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex justify-between">
        <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
        {timeRemaining !== null && (
          <span>Time Remaining: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
        )}
      </div>

      <h3 className="text-xl font-semibold mb-4">{currentQuestion.question_text}</h3>

      {currentQuestion.question_type === 'multiple_choice' && (
        <div className="space-y-2">
          {currentQuestion.answer_options.map((option: any) => (
            <label key={option.id} className="flex items-center space-x-2">
              <input
                type="radio"
                name={`question-${currentQuestion.id}`}
                value={option.id}
                checked={answers[currentQuestion.id]?.selected === option.id}
                onChange={(e) => setAnswers({
                  ...answers,
                  [currentQuestion.id]: { selected: e.target.value }
                })}
              />
              <span>{option.text}</span>
            </label>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        {currentQuestionIndex < questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
          >
            Next
          </Button>
        ) : (
          <Button onClick={submitQuiz}>
            Submit Quiz
          </Button>
        )}
      </div>
    </Card>
  );
}
```

---

## Phase 6: Testing & Launch (Week 6)

### Step 6.1: Load Testing Script

```typescript
// test/lms-load-test.ts
import { supabase } from '../src/lib/supabase';

async function loadTest() {
  console.log('Starting LMS load test...');

  // Test 1: Concurrent course enrollments
  const enrollmentPromises = Array.from({ length: 100 }, (_, i) =>
    supabase
      .from('enrollments')
      .insert({
        course_id: 'test-course-id',
        member_id: `test-member-${i}`,
        enrollment_source: 'self_enrollment'
      })
  );

  const start1 = Date.now();
  await Promise.all(enrollmentPromises);
  console.log(`100 concurrent enrollments: ${Date.now() - start1}ms`);

  // Test 2: Progress updates
  const progressPromises = Array.from({ length: 100 }, (_, i) =>
    supabase
      .from('lesson_progress')
      .upsert({
        enrollment_id: `enrollment-${i}`,
        lesson_id: 'test-lesson-id',
        video_position_seconds: Math.floor(Math.random() * 600),
        status: 'in_progress'
      })
  );

  const start2 = Date.now();
  await Promise.all(progressPromises);
  console.log(`100 concurrent progress updates: ${Date.now() - start2}ms`);

  // Test 3: Quiz submissions
  const quizPromises = Array.from({ length: 50 }, (_, i) =>
    supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: 'test-quiz-id',
        enrollment_id: `enrollment-${i}`,
        member_id: `member-${i}`,
        attempt_number: 1,
        status: 'in_progress'
      })
  );

  const start3 = Date.now();
  await Promise.all(quizPromises);
  console.log(`50 concurrent quiz attempts: ${Date.now() - start3}ms`);

  console.log('Load test complete!');
}

loadTest();
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All migrations executed successfully
- [ ] Storage buckets created and RLS configured
- [ ] Edge Functions deployed
- [ ] Environment variables set (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] Sample courses and content uploaded
- [ ] Load testing completed (target: <100ms for 90% of requests)

### Post-Deployment
- [ ] Certificate generation tested end-to-end
- [ ] Video resume functionality verified
- [ ] Quiz auto-grading validated
- [ ] RLS policies audited across all user roles
- [ ] Analytics dashboards verified
- [ ] User acceptance testing completed
- [ ] Documentation and training materials finalized

---

## Success Metrics

Track these KPIs weekly:

```sql
-- Weekly LMS Health Report
SELECT
  (SELECT COUNT(*) FROM enrollments WHERE status IN ('enrolled', 'in_progress')) AS active_enrollments,
  (SELECT ROUND(AVG(completion_rate), 2) FROM courses WHERE status = 'published') AS avg_course_completion_rate,
  (SELECT COUNT(*) FROM enrollments WHERE certificate_issued_at >= NOW() - INTERVAL '7 days') AS certificates_issued_this_week,
  (SELECT ROUND(AVG(video_completion_percentage), 2) FROM lesson_progress WHERE lesson_id IN (SELECT id FROM lessons WHERE lesson_type = 'video')) AS avg_video_completion,
  (SELECT ROUND(AVG(score), 2) FROM quiz_attempts WHERE status = 'graded' AND submitted_at >= NOW() - INTERVAL '7 days') AS avg_quiz_score_this_week;
```

Target Metrics:
- **Course Completion Rate**: 70%+
- **Video Completion Rate**: 85%+
- **Quiz Pass Rate**: 75%+
- **Certificate Issuance**: 1,000+ per year

---

## Support & Escalation

**Technical Issues**:
- Database performance: Review query execution plans, add indexes as needed
- Storage limits: Upgrade Supabase plan or implement archival strategy
- Edge Function timeouts: Optimize PDF generation, consider async processing

**User Support**:
- Certificate not generating: Check enrollment status = 'completed', trigger Edge Function manually
- Video not resuming: Verify lesson_progress table updates, check RLS policies
- Quiz not grading: Validate quiz_answers table inserts, check trigger execution

**Contact**:
- Technical Support: Consultations@BrooksideBI.com
- Phone: +1 209 487 2047

---

This implementation guide provides structured, step-by-step instructions to deploy a comprehensive Learning Management System that drives measurable learning outcomes across your 20,000+ member organization within 6 weeks.
