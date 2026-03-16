/*
  # Update Employer RPCs to Handle is_distributor

  ## Summary
  Updates the three core employer profile RPCs to support the new `is_distributor`
  boolean column. This column identifies companies whose primary business is selling
  or distributing film, supplies, or materials (distinct from `is_vendor`, which
  identifies companies providing B2B services at client locations).

  ## Modified Functions
  - `create_employer_profile_with_services` — inserts `is_distributor` from profile data
  - `update_employer_profile_with_services` — updates `is_distributor` with COALESCE merge
  - `get_employer_profile_with_services` — returns `is_distributor` in result JSON

  ## Notes
  1. All functions use SECURITY DEFINER + SET search_path = public
  2. is_distributor defaults to false if not supplied
*/

-- =========================================================================
-- UPDATED: create_employer_profile_with_services
-- =========================================================================
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
  v_profile_id   uuid;
  v_team_member_id uuid;
  v_existing_profile uuid;
  v_user_profile record;
  v_service      text;
  v_slug         text;
  v_result       jsonb;
BEGIN
  SELECT id INTO v_existing_profile
  FROM employer_profiles
  WHERE user_id = p_user_id;

  IF v_existing_profile IS NOT NULL THEN
    RAISE EXCEPTION 'PROFILE_EXISTS' USING HINT = 'Employer profile already exists';
  END IF;

  v_slug := slugify_company_name(COALESCE(p_profile_data->>'company_name', 'company'));

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
    is_actively_hiring,
    company_slug,
    company_description,
    website_url,
    logo_storage_path,
    banner_storage_path,
    social_links,
    is_vendor,
    is_distributor
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
    COALESCE((p_profile_data->>'is_actively_hiring')::boolean, false),
    v_slug,
    p_profile_data->>'company_description',
    p_profile_data->>'website_url',
    p_profile_data->>'logo_storage_path',
    p_profile_data->>'banner_storage_path',
    CASE
      WHEN p_profile_data->'social_links' IS NOT NULL
        AND p_profile_data->>'social_links' <> 'null'
      THEN (p_profile_data->'social_links')::jsonb
      ELSE NULL
    END,
    COALESCE((p_profile_data->>'is_vendor')::boolean, false),
    COALESCE((p_profile_data->>'is_distributor')::boolean, false)
  )
  RETURNING id INTO v_profile_id;

  IF p_services IS NOT NULL AND array_length(p_services, 1) > 0 THEN
    FOREACH v_service IN ARRAY p_services
    LOOP
      INSERT INTO employer_services (employer_profile_id, service_type)
      VALUES (v_profile_id, v_service::service_type);
    END LOOP;
  END IF;

  INSERT INTO company_team_members (employer_profile_id, user_id, role, is_active)
  VALUES (v_profile_id, p_user_id, 'owner', true)
  RETURNING id INTO v_team_member_id;

  SELECT active_profile_type, onboarding_completed
  INTO v_user_profile
  FROM profiles
  WHERE id = p_user_id;

  IF v_user_profile.active_profile_type IS NULL OR NOT v_user_profile.onboarding_completed THEN
    UPDATE profiles
    SET
      active_profile_type  = COALESCE(active_profile_type, 'employer'),
      onboarding_completed = true,
      team_member_id       = v_team_member_id
    WHERE id = p_user_id;
  ELSE
    UPDATE profiles
    SET team_member_id = v_team_member_id
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
    'company_slug', ep.company_slug,
    'company_description', ep.company_description,
    'website_url', ep.website_url,
    'logo_storage_path', ep.logo_storage_path,
    'banner_storage_path', ep.banner_storage_path,
    'social_links', ep.social_links,
    'is_vendor', ep.is_vendor,
    'is_distributor', ep.is_distributor,
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

-- =========================================================================
-- UPDATED: update_employer_profile_with_services
-- =========================================================================
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
  v_service    text;
  v_result     jsonb;
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
    contact_first_name  = COALESCE(p_profile_data->>'contact_first_name', contact_first_name),
    contact_last_name   = COALESCE(p_profile_data->>'contact_last_name', contact_last_name),
    contact_phone       = COALESCE(p_profile_data->>'contact_phone', contact_phone),
    company_name        = COALESCE(p_profile_data->>'company_name', company_name),
    company_email       = COALESCE(p_profile_data->>'company_email', company_email),
    company_phone       = COALESCE(p_profile_data->>'company_phone', company_phone),
    hq_city             = COALESCE(p_profile_data->>'hq_city', hq_city),
    hq_state            = COALESCE(p_profile_data->>'hq_state', hq_state),
    employee_count      = COALESCE((p_profile_data->>'employee_count')::employee_count, employee_count),
    location_count      = COALESCE(p_profile_data->>'location_count', location_count),
    is_actively_hiring  = COALESCE((p_profile_data->>'is_actively_hiring')::boolean, is_actively_hiring),
    company_description = COALESCE(p_profile_data->>'company_description', company_description),
    website_url         = COALESCE(p_profile_data->>'website_url', website_url),
    logo_storage_path   = COALESCE(p_profile_data->>'logo_storage_path', logo_storage_path),
    banner_storage_path = COALESCE(p_profile_data->>'banner_storage_path', banner_storage_path),
    social_links        = CASE
                            WHEN p_profile_data->'social_links' IS NOT NULL
                              AND p_profile_data->>'social_links' <> 'null'
                            THEN (p_profile_data->'social_links')::jsonb
                            ELSE social_links
                          END,
    is_vendor           = COALESCE((p_profile_data->>'is_vendor')::boolean, is_vendor),
    is_distributor      = COALESCE((p_profile_data->>'is_distributor')::boolean, is_distributor)
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
    'company_slug', ep.company_slug,
    'company_description', ep.company_description,
    'website_url', ep.website_url,
    'logo_storage_path', ep.logo_storage_path,
    'banner_storage_path', ep.banner_storage_path,
    'social_links', ep.social_links,
    'is_vendor', ep.is_vendor,
    'is_distributor', ep.is_distributor,
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

-- =========================================================================
-- UPDATED: get_employer_profile_with_services
-- =========================================================================
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
    'company_slug', ep.company_slug,
    'company_description', ep.company_description,
    'website_url', ep.website_url,
    'logo_storage_path', ep.logo_storage_path,
    'banner_storage_path', ep.banner_storage_path,
    'social_links', ep.social_links,
    'is_vendor', ep.is_vendor,
    'is_distributor', ep.is_distributor,
    'created_at', ep.created_at,
    'updated_at', ep.updated_at,
    'services', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('service_type', es.service_type))
       FROM employer_services es WHERE es.employer_profile_id = ep.id),
      '[]'::jsonb
    ),
    'active_team_member_count', (
      SELECT COUNT(*)
      FROM company_team_members ctm
      WHERE ctm.employer_profile_id = ep.id
        AND ctm.is_active = true
    ),
    'locations', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', cl.id,
        'name', cl.name,
        'address_line1', cl.address_line1,
        'address_line2', cl.address_line2,
        'city', cl.city,
        'state', cl.state,
        'zip_code', cl.zip_code,
        'phone', cl.phone,
        'is_active', cl.is_active,
        'created_at', cl.created_at,
        'updated_at', cl.updated_at
      ) ORDER BY cl.created_at)
       FROM company_locations cl WHERE cl.employer_profile_id = ep.id),
      '[]'::jsonb
    )
  )
  INTO v_result
  FROM employer_profiles ep
  WHERE ep.user_id = p_user_id;

  RETURN v_result;
END;
$$;
