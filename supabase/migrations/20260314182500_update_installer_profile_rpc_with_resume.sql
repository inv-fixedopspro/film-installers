/*
  # Update get_installer_profile_with_experience RPC to include resume data

  ## Summary
  Updates the read-only `get_installer_profile_with_experience` RPC function to LEFT JOIN
  the `installer_resumes` table so callers receive the full profile including resume data
  in a single round-trip query.

  ## Modified Functions

  ### `get_installer_profile_with_experience(p_user_id uuid)`
  - Now includes a `resume` key in the returned JSON object
  - `resume` is `null` when the installer has no resume, or the full resume object when one exists
  - Resume object includes: id, visibility, selected_template, accent_color, headline, summary,
    skills, work_history, certifications, education, pdf_storage_path, pdf_generated_at,
    created_at, updated_at

  ## Notes
  1. Uses LEFT JOIN so installers without a resume still get their profile returned correctly.
  2. resume_id on installer_profiles was added in the create_resume_tables migration — the LEFT JOIN
     uses installer_profiles.resume_id to find the linked resume.
  3. No changes to the write RPCs (create/update) — those do not need to return resume data.
  4. Existing callers that do not use the `resume` key are unaffected.
*/

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
        'visibility', ir.visibility,
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
