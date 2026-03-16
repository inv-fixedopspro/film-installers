/*
  # Phase 1: Profiles Table Extension and Admin Helper Function

  ## Overview
  Adds moderation state columns to the profiles table and creates a reusable
  is_admin() helper function for efficient RLS policy evaluation in future phases.

  ## Changes to profiles Table
  - `account_status` TEXT - tracks the user's moderation state
    - Values: active (default), warned, restricted, banned, pending_review
  - `content_visibility` TEXT - controls whether the user's content is visible
    - Values: visible (default), auto_hidden, admin_hidden, restored
  - `unresolved_flag_count` INTEGER - counter of open flags against this user
    - Defaults to 0; drives the auto-hide threshold check in Phase 3
  - `auto_hidden_at` TIMESTAMPTZ - records when auto-hide was triggered, nullable

  ## New Function
  - `is_admin()` SECURITY DEFINER function
    - Returns TRUE if the calling user has role = 'admin' in profiles
    - Defined with a fixed search_path for security
    - Used in all future RLS policies instead of repeated subquery pattern

  ## Security Notes
  - No existing RLS policies are modified in this migration
  - The is_admin() function uses SECURITY DEFINER so it always reads from
    the profiles table with elevated privileges, preventing privilege escalation
    through search_path manipulation (search_path is explicitly set to public)
  - New columns have CHECK constraints to enforce valid values at DB level
*/

-- Add account_status column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'account_status'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN account_status text NOT NULL DEFAULT 'active'
      CONSTRAINT profiles_account_status_check
        CHECK (account_status IN ('active', 'warned', 'restricted', 'banned', 'pending_review'));
  END IF;
END $$;

-- Add content_visibility column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'content_visibility'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN content_visibility text NOT NULL DEFAULT 'visible'
      CONSTRAINT profiles_content_visibility_check
        CHECK (content_visibility IN ('visible', 'auto_hidden', 'admin_hidden', 'restored'));
  END IF;
END $$;

-- Add unresolved_flag_count column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'unresolved_flag_count'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN unresolved_flag_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add auto_hidden_at column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'auto_hidden_at'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN auto_hidden_at timestamptz;
  END IF;
END $$;

-- Add index on account_status for admin queries filtering by moderation state
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);

-- Add partial index for non-visible content (used in Phase 3 / 5 enforcement)
CREATE INDEX IF NOT EXISTS idx_profiles_content_visibility_non_visible
  ON profiles(content_visibility)
  WHERE content_visibility != 'visible';

-- Create is_admin() helper function
-- SECURITY DEFINER runs with the privileges of the function owner (postgres),
-- so it can read profiles.role regardless of the caller's own RLS policies.
-- The explicit search_path = public prevents search_path injection attacks.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$;
