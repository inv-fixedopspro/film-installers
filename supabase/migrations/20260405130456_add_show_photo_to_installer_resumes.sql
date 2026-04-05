/*
  # Add show_photo column to installer_resumes

  ## Summary
  Adds a boolean `show_photo` column to the `installer_resumes` table to allow
  installers to control whether their profile photo appears on their resume.

  ## Changes

  ### Modified Tables
  - `installer_resumes`
    - Added `show_photo` (boolean, default true): When true and a photo_storage_path
      exists on the linked installer_profiles row, the photo is rendered in the
      resume template header. When false, no photo is shown regardless of whether
      a photo exists.

  ## Notes
  - Existing resume rows default to true (photo shown), which is the natural
    expectation for users who have already uploaded a photo.
  - No visibility or access changes — this is purely a display preference column.
  - RLS policies on installer_resumes are unchanged.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installer_resumes' AND column_name = 'show_photo'
  ) THEN
    ALTER TABLE installer_resumes ADD COLUMN show_photo boolean NOT NULL DEFAULT true;
  END IF;
END $$;
