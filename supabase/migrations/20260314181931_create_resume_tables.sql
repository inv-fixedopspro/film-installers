/*
  # Create Resume Tables

  ## Summary
  This migration establishes the complete database schema for the installer resume builder feature.

  ## New Tables

  ### `installer_resumes`
  Stores the full resume data for installer profiles, including all sections of the resume,
  display preferences (template, accent color), and PDF generation metadata.

  Columns:
  - `id` (uuid, PK) — unique identifier
  - `user_id` (uuid, FK → profiles.id) — owner of the resume
  - `installer_profile_id` (uuid, FK → installer_profiles.id) — linked installer profile
  - `visibility` (enum: public | members_only | private) — who can view this resume
  - `selected_template` (enum: standard | modern | minimal) — chosen resume template
  - `accent_color` (enum: charcoal | navy | forest) — accent color for Modern template
  - `headline` (text) — professional headline / tagline
  - `summary` (text) — professional summary paragraph
  - `skills` (text[]) — array of skill tags
  - `work_history` (jsonb) — array of work history entries
  - `certifications` (jsonb) — array of certification entries
  - `education` (jsonb) — array of education entries
  - `pdf_storage_path` (text) — path to generated PDF in Supabase Storage
  - `pdf_generated_at` (timestamptz) — timestamp of last PDF generation
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `resume_views`
  Tracks views of installer resumes for analytics. Schema only — no trigger logic wired yet.

  Columns:
  - `id` (uuid, PK)
  - `resume_id` (uuid, FK → installer_resumes.id) — which resume was viewed
  - `viewer_user_id` (uuid, nullable FK → profiles.id) — who viewed it (null for anonymous)
  - `viewer_ip_hash` (text) — hashed IP for deduplication without storing PII
  - `viewed_at` (timestamptz)

  ## Modified Tables

  ### `installer_profiles`
  - Added `resume_id` (uuid, nullable FK → installer_resumes.id) — points to the installer's active resume

  ## New Enums
  - `resume_visibility`: public | members_only | private
  - `resume_template`: standard | modern | minimal
  - `resume_accent_color`: charcoal | navy | forest

  ## Security
  - RLS enabled on both new tables
  - `installer_resumes`: 4 separate policies (SELECT, INSERT, UPDATE, DELETE)
    - Owners can fully manage their own resumes
    - Authenticated users can SELECT public or members_only resumes
    - Anonymous access is denied
  - `resume_views`: 4 separate policies
    - Authenticated users can INSERT views
    - Owners can SELECT views of their own resumes
    - No UPDATE or DELETE for anyone (immutable audit trail)

  ## Storage
  - Creates the `resumes` storage bucket (private — no public access)

  ## Notes
  1. The `work_history`, `certifications`, and `education` columns store structured JSON arrays
     to avoid over-normalizing at this stage. These can be migrated to relational tables in a
     future phase if query patterns require it.
  2. The `resume_id` FK on `installer_profiles` is nullable — installers without a resume have NULL here.
  3. `resume_views.viewer_user_id` is nullable to support anonymous/non-logged-in views in the future.
  4. The `resumes` Storage bucket is private; signed URLs are generated on demand by the API.
*/

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resume_visibility') THEN
    CREATE TYPE resume_visibility AS ENUM ('public', 'members_only', 'private');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resume_template') THEN
    CREATE TYPE resume_template AS ENUM ('standard', 'modern', 'minimal');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resume_accent_color') THEN
    CREATE TYPE resume_accent_color AS ENUM ('charcoal', 'navy', 'forest');
  END IF;
END $$;

-- ============================================================
-- TABLE: installer_resumes
-- ============================================================

CREATE TABLE IF NOT EXISTS installer_resumes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  installer_profile_id  uuid NOT NULL REFERENCES installer_profiles(id) ON DELETE CASCADE,
  visibility            resume_visibility NOT NULL DEFAULT 'members_only',
  selected_template     resume_template NOT NULL DEFAULT 'standard',
  accent_color          resume_accent_color NOT NULL DEFAULT 'charcoal',
  headline              text NOT NULL DEFAULT '',
  summary               text NOT NULL DEFAULT '',
  skills                text[] NOT NULL DEFAULT '{}',
  work_history          jsonb NOT NULL DEFAULT '[]',
  certifications        jsonb NOT NULL DEFAULT '[]',
  education             jsonb NOT NULL DEFAULT '[]',
  pdf_storage_path      text,
  pdf_generated_at      timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE installer_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their own resume"
  ON installer_resumes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view public or members_only resumes"
  ON installer_resumes
  FOR SELECT
  TO authenticated
  USING (visibility IN ('public', 'members_only'));

CREATE POLICY "Owners can insert their own resume"
  ON installer_resumes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their own resume"
  ON installer_resumes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete their own resume"
  ON installer_resumes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_installer_resumes_user_id
  ON installer_resumes (user_id);

CREATE INDEX IF NOT EXISTS idx_installer_resumes_installer_profile_id
  ON installer_resumes (installer_profile_id);

CREATE INDEX IF NOT EXISTS idx_installer_resumes_visibility
  ON installer_resumes (visibility);

-- ============================================================
-- TABLE: resume_views
-- ============================================================

CREATE TABLE IF NOT EXISTS resume_views (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id        uuid NOT NULL REFERENCES installer_resumes(id) ON DELETE CASCADE,
  viewer_user_id   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  viewer_ip_hash   text,
  viewed_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE resume_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can log a resume view"
  ON resume_views
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = viewer_user_id);

CREATE POLICY "Resume owners can view their resume analytics"
  ON resume_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM installer_resumes
      WHERE installer_resumes.id = resume_views.resume_id
        AND installer_resumes.user_id = auth.uid()
    )
  );

CREATE POLICY "Nobody can update resume views"
  ON resume_views
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Nobody can delete resume views"
  ON resume_views
  FOR DELETE
  TO authenticated
  USING (false);

-- Index for resume view lookups
CREATE INDEX IF NOT EXISTS idx_resume_views_resume_id
  ON resume_views (resume_id);

-- ============================================================
-- ALTER TABLE: installer_profiles — add resume_id FK
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installer_profiles' AND column_name = 'resume_id'
  ) THEN
    ALTER TABLE installer_profiles
      ADD COLUMN resume_id uuid REFERENCES installer_resumes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- STORAGE: resumes bucket (private)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- RLS on storage objects for the resumes bucket
CREATE POLICY "Owners can upload their own resume PDF"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners can read their own resume PDF"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners can update their own resume PDF"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners can delete their own resume PDF"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
