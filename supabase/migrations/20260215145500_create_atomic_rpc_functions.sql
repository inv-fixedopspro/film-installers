/*
  # Atomic RPC Functions for Data Integrity

  1. Overview
    - Creates PostgreSQL stored procedures for atomic multi-table operations
    - Ensures all-or-nothing semantics for critical business operations
    - Prevents partial state from failed operations

  2. Functions Created
    - `verify_email_token(p_token)` - Atomically verifies email and marks token used
    - `create_employer_profile_with_services(p_user_id, p_profile_data, p_services)` - Creates employer profile with services
    - `create_installer_profile_with_experience(p_user_id, p_profile_data, p_experience)` - Creates installer profile with experience
    - `update_employer_profile_with_services(p_user_id, p_profile_data, p_services)` - Updates employer profile and services
    - `update_installer_profile_with_experience(p_user_id, p_profile_data, p_experience)` - Updates installer profile and experience
    - `accept_invitation_atomic(p_token, p_user_id)` - Atomically accepts invitation
    - `cleanup_expired_tokens()` - Maintenance function for token cleanup

  3. Security
    - Functions use SECURITY DEFINER to execute with owner privileges
    - RLS policies still apply for user-facing queries
    - Input validation within each function

  4. Important Notes
    - All functions are atomic - any failure rolls back all changes
    - Functions raise exceptions with specific error codes for client handling
    - JSONB used for flexible profile data passing
*/

-- Function to verify email token atomically
CREATE OR REPLACE FUNCTION verify_email_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_verification record;
  v_result jsonb;
BEGIN
  SELECT ev.*, p.email
  INTO v_verification
  FROM email_verifications ev
  JOIN profiles p ON p.id = ev.user_id
  WHERE ev.token = p_token
  FOR UPDATE;

  IF v_verification IS NULL THEN
    RAISE EXCEPTION 'INVALID_TOKEN' USING HINT = 'Token not found';
  END IF;

  IF v_verification.verified_at IS NOT NULL THEN
    RAISE EXCEPTION 'TOKEN_ALREADY_USED' USING HINT = 'Email already verified';
  END IF;

  IF v_verification.expires_at < now() THEN
    RAISE EXCEPTION 'TOKEN_EXPIRED' USING HINT = 'Verification token has expired';
  END IF;

  UPDATE email_verifications
  SET verified_at = now()
  WHERE id = v_verification.id;

  UPDATE profiles
  SET email_verified_at = now()
  WHERE id = v_verification.user_id;

  v_result := jsonb_build_object(
    'user_id', v_verification.user_id,
    'email', v_verification.email,
    'verified_at', now()
  );

  RETURN v_result;
END;
$$;

-- Function to create employer profile with services atomically
CREATE OR REPLACE FUNCTION create_employer_profile_with_services(
  p_user_id uuid,
  p_profile_data jsonb,
  p_services text[]
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
  v_service text;
  v_result jsonb;
BEGIN
  SELECT id INTO v_existing_profile
  FROM employer_profiles
  WHERE user_id = p_user_id;

  IF v_existing_profile IS NOT NULL THEN
    RAISE EXCEPTION 'PROFILE_EXISTS' USING HINT = 'Employer profile already exists';
  END IF;

  INSERT INTO employer_profiles (
    user_id,
    contact_first_name,
    contact_last_name,
    contact_phone,
    company_name,
    company_email,
    company_phone,
    hq_city,
    hq_state,
    employee_count,
    location_count,
    is_actively_hiring
  )
  VALUES (
    p_user_id,
    p_profile_data->>'contact_first_name',
    p_profile_data->>'contact_last_name',
    p_profile_data->>'contact_phone',
    p_profile_data->>'company_name',
    p_profile_data->>'company_email',
    p_profile_data->>'company_phone',
    p_profile_data->>'hq_city',
    p_profile_data->>'hq_state',
    (p_profile_data->>'employee_count')::employee_count,
    p_profile_data->>'location_count',
    COALESCE((p_profile_data->>'is_actively_hiring')::boolean, false)
  )
  RETURNING id INTO v_profile_id;

  IF p_services IS NOT NULL AND array_length(p_services, 1) > 0 THEN
    FOREACH v_service IN ARRAY p_services
    LOOP
      INSERT INTO employer_services (employer_profile_id, service_type)
      VALUES (v_profile_id, v_service::service_type);
    END LOOP;
  END IF;

  SELECT active_profile_type, onboarding_completed
  INTO v_user_profile
  FROM profiles
  WHERE id = p_user_id;

  IF v_user_profile.active_profile_type IS NULL OR NOT v_user_profile.onboarding_completed THEN
    UPDATE profiles
    SET 
      active_profile_type = COALESCE(active_profile_type, 'employer'),
      onboarding_completed = true
    WHERE id = p_user_id;
  END IF;

  SELECT jsonb_build_object(
    'id', ep.id,
    'user_id', ep.user_id,
    'contact_first_name', ep.contact_first_name,
    'contact_last_name', ep.contact_last_name,
    'contact_phone', ep.contact_phone,
    'company_name', ep.company_name,
    'company_email', ep.company_email,
    'company_phone', ep.company_phone,
    'hq_city', ep.hq_city,
    'hq_state', ep.hq_state,
    'employee_count', ep.employee_count,
    'location_count', ep.location_count,
    'is_actively_hiring', ep.is_actively_hiring,
    'created_at', ep.created_at,
    'updated_at', ep.updated_at,
    'services', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('service_type', es.service_type))
       FROM employer_services es WHERE es.employer_profile_id = ep.id),
      '[]'::jsonb
    )
  )
  INTO v_result
  FROM employer_profiles ep
  WHERE ep.id = v_profile_id;

  RETURN v_result;
END;
$$;

-- Function to create installer profile with experience atomically
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

-- Function to update employer profile with services atomically
CREATE OR REPLACE FUNCTION update_employer_profile_with_services(
  p_user_id uuid,
  p_profile_data jsonb,
  p_services text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_service text;
  v_result jsonb;
BEGIN
  SELECT id INTO v_profile_id
  FROM employer_profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND' USING HINT = 'Employer profile not found';
  END IF;

  UPDATE employer_profiles
  SET
    contact_first_name = COALESCE(p_profile_data->>'contact_first_name', contact_first_name),
    contact_last_name = COALESCE(p_profile_data->>'contact_last_name', contact_last_name),
    contact_phone = COALESCE(p_profile_data->>'contact_phone', contact_phone),
    company_name = COALESCE(p_profile_data->>'company_name', company_name),
    company_email = COALESCE(p_profile_data->>'company_email', company_email),
    company_phone = COALESCE(p_profile_data->>'company_phone', company_phone),
    hq_city = COALESCE(p_profile_data->>'hq_city', hq_city),
    hq_state = COALESCE(p_profile_data->>'hq_state', hq_state),
    employee_count = COALESCE((p_profile_data->>'employee_count')::employee_count, employee_count),
    location_count = COALESCE(p_profile_data->>'location_count', location_count),
    is_actively_hiring = COALESCE((p_profile_data->>'is_actively_hiring')::boolean, is_actively_hiring)
  WHERE id = v_profile_id;

  DELETE FROM employer_services WHERE employer_profile_id = v_profile_id;

  IF p_services IS NOT NULL AND array_length(p_services, 1) > 0 THEN
    FOREACH v_service IN ARRAY p_services
    LOOP
      INSERT INTO employer_services (employer_profile_id, service_type)
      VALUES (v_profile_id, v_service::service_type);
    END LOOP;
  END IF;

  SELECT jsonb_build_object(
    'id', ep.id,
    'user_id', ep.user_id,
    'contact_first_name', ep.contact_first_name,
    'contact_last_name', ep.contact_last_name,
    'contact_phone', ep.contact_phone,
    'company_name', ep.company_name,
    'company_email', ep.company_email,
    'company_phone', ep.company_phone,
    'hq_city', ep.hq_city,
    'hq_state', ep.hq_state,
    'employee_count', ep.employee_count,
    'location_count', ep.location_count,
    'is_actively_hiring', ep.is_actively_hiring,
    'created_at', ep.created_at,
    'updated_at', ep.updated_at,
    'services', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('service_type', es.service_type))
       FROM employer_services es WHERE es.employer_profile_id = ep.id),
      '[]'::jsonb
    )
  )
  INTO v_result
  FROM employer_profiles ep
  WHERE ep.id = v_profile_id;

  RETURN v_result;
END;
$$;

-- Function to update installer profile with experience atomically
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

-- Function to accept invitation atomically
CREATE OR REPLACE FUNCTION accept_invitation_atomic(
  p_token text,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_result jsonb;
BEGIN
  SELECT *
  INTO v_invitation
  FROM invitations
  WHERE token = p_token
  FOR UPDATE;

  IF v_invitation IS NULL THEN
    RAISE EXCEPTION 'INVALID_TOKEN' USING HINT = 'Invitation not found';
  END IF;

  IF v_invitation.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'TOKEN_ALREADY_USED' USING HINT = 'Invitation already accepted';
  END IF;

  IF v_invitation.expires_at < now() THEN
    RAISE EXCEPTION 'TOKEN_EXPIRED' USING HINT = 'Invitation has expired';
  END IF;

  UPDATE invitations
  SET accepted_at = now()
  WHERE id = v_invitation.id;

  INSERT INTO profiles (id, email, role, email_verified_at)
  VALUES (p_user_id, v_invitation.email, v_invitation.role, now())
  ON CONFLICT (id) DO UPDATE
  SET 
    email_verified_at = now(),
    role = EXCLUDED.role;

  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'email', v_invitation.email,
    'role', v_invitation.role,
    'accepted_at', now()
  );

  RETURN v_result;
END;
$$;

-- Function to cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens(p_retention_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_verifications_deleted integer;
  v_invitations_deleted integer;
BEGIN
  DELETE FROM email_verifications
  WHERE (expires_at < now() - (p_retention_days || ' days')::interval)
     OR (verified_at IS NOT NULL AND verified_at < now() - (p_retention_days || ' days')::interval);
  
  GET DIAGNOSTICS v_verifications_deleted = ROW_COUNT;

  DELETE FROM invitations
  WHERE (expires_at < now() - (p_retention_days || ' days')::interval)
     OR (accepted_at IS NOT NULL AND accepted_at < now() - (p_retention_days || ' days')::interval);
  
  GET DIAGNOSTICS v_invitations_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'verifications_deleted', v_verifications_deleted,
    'invitations_deleted', v_invitations_deleted,
    'cleaned_at', now()
  );
END;
$$;

-- Function to get employer profile with services (for read operations)
CREATE OR REPLACE FUNCTION get_employer_profile_with_services(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', ep.id,
    'user_id', ep.user_id,
    'contact_first_name', ep.contact_first_name,
    'contact_last_name', ep.contact_last_name,
    'contact_phone', ep.contact_phone,
    'company_name', ep.company_name,
    'company_email', ep.company_email,
    'company_phone', ep.company_phone,
    'hq_city', ep.hq_city,
    'hq_state', ep.hq_state,
    'employee_count', ep.employee_count,
    'location_count', ep.location_count,
    'is_actively_hiring', ep.is_actively_hiring,
    'created_at', ep.created_at,
    'updated_at', ep.updated_at,
    'services', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('service_type', es.service_type))
       FROM employer_services es WHERE es.employer_profile_id = ep.id),
      '[]'::jsonb
    )
  )
  INTO v_result
  FROM employer_profiles ep
  WHERE ep.user_id = p_user_id;

  RETURN v_result;
END;
$$;

-- Function to get installer profile with experience (for read operations)
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
  WHERE ip.user_id = p_user_id;

  RETURN v_result;
END;
$$;

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION verify_email_token(text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_employer_profile_with_services(uuid, jsonb, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION create_installer_profile_with_experience(uuid, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION update_employer_profile_with_services(uuid, jsonb, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION update_installer_profile_with_experience(uuid, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation_atomic(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employer_profile_with_services(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_installer_profile_with_experience(uuid) TO authenticated;

-- Service role only for cleanup
GRANT EXECUTE ON FUNCTION cleanup_expired_tokens(integer) TO service_role;