/*
  # Add photo_storage_path to installer_profiles

  ## Summary
  Adds a profile photo column to the installer_profiles table and updates all
  installer RPC functions to include the new field in their return payloads.

  ## Changes

  ### Modified Tables
  - `installer_profiles`
    - Added `photo_storage_path` (text, nullable) — stores the Supabase Storage path for the installer's profile photo

  ### Modified Functions
  - `get_installer_profile_with_experience(p_user_id uuid)`
    - Now includes `photo_storage_path` in the returned JSON object
  - `create_installer_profile_with_experience(p_user_id, p_profile_data, p_experience)`
    - Now includes `photo_storage_path` in the returned JSON object
  - `update_installer_profile_with_experience(p_user_id, p_profile_data, p_experience)`
    - Now includes `photo_storage_path` in the returned JSON object

  ## Notes
  1. Column is nullable — existing installers without a photo are unaffected.
  2. The actual photo upload/delete is handled by a dedicated API route, not via the profile RPCs.
  3. RPCs are updated to return the field so the client always has the current storage path.
*/

-- Add the column if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installer_profiles' AND column_name = 'photo_storage_path'
  ) THEN
    ALTER TABLE installer_profiles ADD COLUMN photo_storage_path text;
  END IF;
END $$;

-- Update get_installer_profile_with_experience to include photo_storage_path
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
    'photo_storage_path', ip.photo_storage_path,
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

-- Update create_installer_profile_with_experience to include photo_storage_path in return
CREATE OR REPLACE FUNCTION create_installer_profile_with_experience(
  p_user_id uuid,
  p_profile_data jsonb,
  p_experience jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_existing_profile uuid;
  v_user_profile record;
  v_exp jsonb;
  v_result jsonb;
BEGIN
  SELECT id INTO v_existing_profile
  FROM installer_profiles
  WHERE user_id = p_user_id;

  IF v_existing_profile IS NOT NULL THEN
    RAISE EXCEPTION 'PROFILE_EXISTS' USING HINT = 'Installer profile already exists';
  END IF;

  INSERT INTO installer_profiles (
    user_id,
    first_name,
    last_name,
    phone,
    city,
    state,
    is_actively_interviewing,
    experience_level
  )
  VALUES (
    p_user_id,
    p_profile_data->>'first_name',
    p_profile_data->>'last_name',
    p_profile_data->>'phone',
    p_profile_data->>'city',
    p_profile_data->>'state',
    COALESCE((p_profile_data->>'is_actively_interviewing')::boolean, false),
    COALESCE((p_profile_data->>'experience_level')::experience_level, 'new_to_industry')
  )
  RETURNING id INTO v_profile_id;

  IF p_experience IS NOT NULL AND jsonb_array_length(p_experience) > 0 THEN
    FOR v_exp IN SELECT * FROM jsonb_array_elements(p_experience)
    LOOP
      INSERT INTO installer_experience (installer_profile_id, service_type, years_experience)
      VALUES (
        v_profile_id,
        (v_exp->>'service_type')::service_type,
        (v_exp->>'years_experience')::experience_years
      );
    END LOOP;
  END IF;

  SELECT active_profile_type, onboarding_completed
  INTO v_user_profile
  FROM profiles
  WHERE id = p_user_id;

  IF v_user_profile.active_profile_type IS NULL OR NOT v_user_profile.onboarding_completed THEN
    UPDATE profiles
    SET
      active_profile_type = COALESCE(active_profile_type, 'installer'),
      onboarding_completed = true
    WHERE id = p_user_id;
  END IF;

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
    'photo_storage_path', ip.photo_storage_path,
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
    )
  )
  INTO v_result
  FROM installer_profiles ip
  WHERE ip.id = v_profile_id;

  RETURN v_result;
END;
$$;

-- Update update_installer_profile_with_experience to include photo_storage_path in return
CREATE OR REPLACE FUNCTION update_installer_profile_with_experience(
  p_user_id uuid,
  p_profile_data jsonb,
  p_experience jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_exp jsonb;
  v_result jsonb;
BEGIN
  SELECT id INTO v_profile_id
  FROM installer_profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND' USING HINT = 'Installer profile not found';
  END IF;

  UPDATE installer_profiles
  SET
    first_name = COALESCE(p_profile_data->>'first_name', first_name),
    last_name = COALESCE(p_profile_data->>'last_name', last_name),
    phone = COALESCE(p_profile_data->>'phone', phone),
    city = COALESCE(p_profile_data->>'city', city),
    state = COALESCE(p_profile_data->>'state', state),
    is_actively_interviewing = COALESCE((p_profile_data->>'is_actively_interviewing')::boolean, is_actively_interviewing),
    experience_level = COALESCE((p_profile_data->>'experience_level')::experience_level, experience_level)
  WHERE id = v_profile_id;

  DELETE FROM installer_experience WHERE installer_profile_id = v_profile_id;

  IF p_experience IS NOT NULL AND jsonb_array_length(p_experience) > 0 THEN
    FOR v_exp IN SELECT * FROM jsonb_array_elements(p_experience)
    LOOP
      INSERT INTO installer_experience (installer_profile_id, service_type, years_experience)
      VALUES (
        v_profile_id,
        (v_exp->>'service_type')::service_type,
        (v_exp->>'years_experience')::experience_years
      );
    END LOOP;
  END IF;

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
    'photo_storage_path', ip.photo_storage_path,
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
    )
  )
  INTO v_result
  FROM installer_profiles ip
  WHERE ip.id = v_profile_id;

  RETURN v_result;
END;
$$;
