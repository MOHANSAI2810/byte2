-- =================================================
-- AI Paper Evaluator — Supabase Schema
-- Go to Supabase → SQL Editor → paste and run this
-- =================================================

-- Teachers / users
CREATE TABLE IF NOT EXISTS users (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name       TEXT NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    role            TEXT DEFAULT 'teacher',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Exams created by teachers
-- Each exam holds the question paper + rubric/expected answers
CREATE TABLE IF NOT EXISTS exams (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id      UUID REFERENCES users(id),
    title           TEXT NOT NULL,          -- e.g. "Unit Test 2 - Physics"
    subject         TEXT NOT NULL,          -- e.g. "Physics"
    class           TEXT NOT NULL,          -- e.g. "Class 10"
    total_marks     INTEGER NOT NULL,
    questions       JSONB NOT NULL,
    -- questions is a JSON array:
    -- [
    --   {
    --     "q_no": 1,
    --     "question": "Explain Newton's second law.",
    --     "max_marks": 5,
    --     "expected_answer": "Force equals mass times acceleration...",
    --     "keywords": ["force", "mass", "acceleration", "F=ma"]
    --   }
    -- ]
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Student answer sheet submissions
CREATE TABLE IF NOT EXISTS submissions (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id         UUID REFERENCES exams(id) ON DELETE CASCADE,
    teacher_id      UUID REFERENCES users(id),
    student_name    TEXT NOT NULL,
    student_roll    TEXT,
    file_url        TEXT,                   -- URL in Supabase storage
    extracted_text  TEXT,                   -- OCR output
    status          TEXT DEFAULT 'pending'  -- pending | processing | done | failed
        CHECK (status IN ('pending','processing','done','failed')),
    error_message   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Graded reports — one per submission
CREATE TABLE IF NOT EXISTS graded_reports (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id       UUID REFERENCES submissions(id) ON DELETE CASCADE,
    exam_id             UUID REFERENCES exams(id),
    student_name        TEXT,
    total_score         NUMERIC,
    max_score           NUMERIC,
    percentage          NUMERIC,

    -- Per-question scores (JSON array)
    -- [{ "q_no":1, "score":4, "max":5, "feedback":"Good but missed F=ma" }]
    score_breakdown     JSONB,

    -- 6 report sections
    concept_gaps        TEXT,
    improvement_tips    TEXT,
    writing_quality     TEXT,
    performance_trend   TEXT,
    parent_summary      TEXT,

    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_submissions_exam     ON submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_teacher  ON submissions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_reports_submission   ON graded_reports(submission_id);
CREATE INDEX IF NOT EXISTS idx_exams_teacher        ON exams(teacher_id);

-- Supabase Storage bucket (run this too)
-- Go to Supabase → Storage → New bucket → name: "answer-sheets" → Public: false
