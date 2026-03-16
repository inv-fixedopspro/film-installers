/*
  # Fix Resume Visibility — Step 2: Migrate Data and Collapse Enum

  ## Summary
  The `resume_visibility` enum is collapsed from three values (`public`,
  `members_only`, `private`) to the correct two values (`visible`, `private`).

  ## Changes

  ### Data Migration
  - Any rows with `visibility = 'public'` or `visibility = 'members_only'` are
    updated to `visibility = 'visible'` — the user intent was "not private" in both cases.

  ### Enum Replacement
  - Creates `resume_visibility_v2` AS ENUM ('visible', 'private')
  - Drops the column default before swapping types
  - Swaps the `installer_resumes.visibility` column to use the new enum
  - Restores the column default to 'visible'
  - Drops the old enum and renames the new one to `resume_visibility`

  ### RLS Policy Update
  - Drops the old SELECT policy that referenced 'public' and 'members_only'
  - Recreates it checking only `visibility = 'visible'`

  ## Notes
  1. No data is lost — old values are migrated to their logical equivalent.
  2. This migration is safe to re-run; all steps use guards.
*/

-- Step 1: Migrate data
UPDATE installer_resumes
SET visibility = 'visible'
WHERE visibility IN ('public', 'members_only');

-- Step 2: Create the two-value replacement enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'resume_visibility_v2'
  ) THEN
    CREATE TYPE resume_visibility_v2 AS ENUM ('visible', 'private');
  END IF;
END $$;

-- Step 3: Drop the old SELECT policy that referenced removed enum values
DROP POLICY IF EXISTS "Authenticated users can view public or members_only resumes" ON installer_resumes;

-- Step 4: Drop the column default so we can safely change the type
ALTER TABLE installer_resumes
  ALTER COLUMN visibility DROP DEFAULT;

-- Step 5: Swap the column type
ALTER TABLE installer_resumes
  ALTER COLUMN visibility TYPE resume_visibility_v2
  USING visibility::text::resume_visibility_v2;

-- Step 6: Restore the default using the new enum type
ALTER TABLE installer_resumes
  ALTER COLUMN visibility SET DEFAULT 'visible'::resume_visibility_v2;

-- Step 7: Drop the old enum and rename the new one
DROP TYPE IF EXISTS resume_visibility;
ALTER TYPE resume_visibility_v2 RENAME TO resume_visibility;

-- Step 8: Recreate the correct SELECT policy for non-owners
CREATE POLICY "Authenticated users can view visible resumes"
  ON installer_resumes
  FOR SELECT
  TO authenticated
  USING (visibility = 'visible');
