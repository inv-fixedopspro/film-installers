/*
  # Add Resume-Level Moderation Infrastructure

  ## Overview
  Extends the existing moderation system to support flagging of installer resumes
  independently of user profile-level visibility. A resume can be hidden without
  affecting the user's profile, and vice versa.

  ## Changes

  ### Modified Tables

  #### installer_resumes
  Three new moderation columns are added:
  - `content_visibility` (text, DEFAULT 'visible') — mirrors the same enum used on
    profiles: 'visible' | 'auto_hidden' | 'admin_hidden' | 'restored'. Controls
    whether the resume is shown to other members.
  - `unresolved_flag_count` (integer, DEFAULT 0) — running count of open flags
    against this specific resume. Incremented by trigger on each new resume flag.
  - `auto_hidden_at` (timestamptz, nullable) — timestamp set when a DB trigger
    auto-hides the resume due to hitting the flag threshold.

  #### content_flags
  The `content_type` column previously accepted only
  'installer_profile' | 'employer_profile' | 'user_account'. A new CHECK constraint
  replaces the old one to also accept 'resume'.

  ## Important Notes
  1. The old CHECK constraint on content_type is dropped and recreated — no data
     is modified, only the allowed value set is expanded.
  2. RLS on installer_resumes is already enabled. No changes needed there.
  3. Existing rows in installer_resumes default to content_visibility = 'visible'
     and unresolved_flag_count = 0 — fully backward-compatible.
*/

-- Add moderation columns to installer_resumes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installer_resumes' AND column_name = 'content_visibility'
  ) THEN
    ALTER TABLE installer_resumes
      ADD COLUMN content_visibility text NOT NULL DEFAULT 'visible'
        CHECK (content_visibility IN ('visible', 'auto_hidden', 'admin_hidden', 'restored'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installer_resumes' AND column_name = 'unresolved_flag_count'
  ) THEN
    ALTER TABLE installer_resumes
      ADD COLUMN unresolved_flag_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installer_resumes' AND column_name = 'auto_hidden_at'
  ) THEN
    ALTER TABLE installer_resumes
      ADD COLUMN auto_hidden_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Expand the content_type CHECK constraint on content_flags to include 'resume'
-- First, drop the existing constraint if it exists
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT conname INTO v_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'content_flags'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%content_type%';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE content_flags DROP CONSTRAINT ' || quote_ident(v_constraint_name);
  END IF;
END $$;

-- Add updated CHECK constraint including 'resume'
ALTER TABLE content_flags
  ADD CONSTRAINT content_flags_content_type_check
  CHECK (content_type IN ('installer_profile', 'employer_profile', 'user_account', 'resume'));
