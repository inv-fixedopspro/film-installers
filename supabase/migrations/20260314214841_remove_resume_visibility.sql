/*
  # Remove resume_visibility from installer_resumes

  ## Summary
  Removes the `visibility` column and associated infrastructure from the `installer_resumes`
  table. The visibility setting had no practical effect since resumes are only accessible
  to employers through job applications — there is no browse/search/discovery surface.
  Keeping the setting was confusing and misleading to users.

  ## Modified Tables

  ### `installer_resumes`
  - Removes the `visibility` column

  ## Security Changes
  - Drops the old visibility-based SELECT policy "Authenticated users can view visible resumes"
  - Drops the index on the visibility column
  - The owner-only SELECT policy remains unchanged — installers can always view their own resume
  - The enum type `resume_visibility` and `resume_visibility_v2` are dropped

  ## Notes
  1. The owner-based RLS policies (insert, update, delete, owner select) are unaffected.
  2. The `get_installer_profile_with_experience` RPC is updated to remove the visibility field
     from its return object.
*/

-- Drop the visibility-based SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view visible resumes" ON installer_resumes;
DROP POLICY IF EXISTS "Authenticated users can view public or members_only resumes" ON installer_resumes;

-- Drop the visibility index
DROP INDEX IF EXISTS idx_installer_resumes_visibility;

-- Remove the visibility column
ALTER TABLE installer_resumes DROP COLUMN IF EXISTS visibility;

-- Drop the enum types (both old and new versions)
DROP TYPE IF EXISTS resume_visibility_v2;
DROP TYPE IF EXISTS resume_visibility;

-- Update the RPC to remove the visibility field from the returned resume object
CREATE OR REPLACE FUNCTION get_installer_profile_with_experience(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', ip.id,
    'user_id', ip.user_id,
    'first_name', ip.first_name,
    'last_name', ip.last_name,
    'phone', ip.phone,
    'city', ip.city,
    'state', ip.state,
    'is_actively_interviewing', ip.is_actively_interviewing,
    'experience_level', ip.experience_level,
    'resume_id', ip.resume_id,
    'created_at', ip.created_at,
    'updated_at', ip.updated_at,
    'experience', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'service_type', ie.service_type,
        'years_experience', ie.years_experience
      ))
       FROM installer_experience ie WHERE ie.installer_profile_id = ip.id),
      '[]'::jsonb
    ),
    'resume', CASE
      WHEN ir.id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'id', ir.id,
        'user_id', ir.user_id,
        'installer_profile_id', ir.installer_profile_id,
        'selected_template', ir.selected_template,
        'accent_color', ir.accent_color,
        'headline', ir.headline,
        'summary', ir.summary,
        'skills', ir.skills,
        'work_history', ir.work_history,
        'certifications', ir.certifications,
        'education', ir.education,
        'pdf_storage_path', ir.pdf_storage_path,
        'pdf_generated_at', ir.pdf_generated_at,
        'created_at', ir.created_at,
        'updated_at', ir.updated_at
      )
    END
  )
  INTO v_result
  FROM installer_profiles ip
  LEFT JOIN installer_resumes ir ON ir.id = ip.resume_id
  WHERE ip.user_id = p_user_id;

  RETURN v_result;
END;
$$;
