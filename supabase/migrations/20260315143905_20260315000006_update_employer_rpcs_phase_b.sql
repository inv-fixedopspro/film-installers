/*
  # Phase B: Employer RPC Functions — Full Update

  ## Summary
  Updates existing employer profile RPCs to handle all new Phase A columns, auto-generate
  company_slug, and atomically create the owner row in company_team_members on profile creation.
  Adds all new team management and company location RPCs.

  ## Modified Functions
  - `create_employer_profile_with_services` — handles new columns, auto-slug, creates owner team member, sets team_member_id
  - `update_employer_profile_with_services` — handles new columns with COALESCE merge
  - `get_employer_profile_with_services` — returns new fields, active_team_member_count, locations array

  ## New Functions
  - `invite_team_member(p_owner_id, p_employer_profile_id, p_email)` → jsonb
  - `accept_team_invitation(p_token, p_user_id)` → jsonb
  - `leave_team(p_user_id, p_employer_profile_id)` → jsonb
  - `remove_team_member(p_owner_id, p_employer_profile_id, p_target_user_id)` → jsonb
  - `revoke_team_invitation(p_owner_id, p_invitation_id)` → jsonb
  - `add_company_location(p_owner_id, p_employer_profile_id, p_location_data)` → jsonb
  - `update_company_location(p_owner_id, p_location_id, p_location_data)` → jsonb
  - `deactivate_company_location(p_owner_id, p_location_id)` → jsonb
  - `get_company_locations(p_caller_id, p_employer_profile_id)` → jsonb

  ## Error Codes Raised
  - PROFILE_EXISTS, PROFILE_NOT_FOUND (existing)
  - ALREADY_A_MEMBER — user is already an active member of the team
  - ALREADY_ON_TEAM — same as ALREADY_A_MEMBER (for accept flow when user already joined)
  - INVITATION_NOT_FOUND — token lookup failed
  - INVITATION_EXPIRED — token past expires_at
  - INVITATION_INVALID — email mismatch or wrong status
  - OWNER_CANNOT_LEAVE — owner tried to call leave_team
  - NOT_A_MEMBER — user is not a member of the team
  - SELF_REMOVE_FORBIDDEN — owner tried to remove themselves via remove_team_member
  - LOCATION_NOT_FOUND — location does not belong to the caller's company

  ## Notes
  1. All functions use SECURITY DEFINER + SET search_path = public
  2. Slug is generated from company_name: lowercase, whitespace → hyphens, strip non-alphanum/hyphen,
     collapse hyphens, then append a 6-char hex suffix to ensure uniqueness
  3. The owner row in company_team_members is created on first profile creation; subsequent
     calls to create are already guarded by PROFILE_EXISTS check
  4. accept_team_invitation sets active_profile_type = 'team' and team_member_id on the accepting user's profile
  5. leave_team sets active_profile_type back to NULL (or 'employer'/'installer' if they have one) and clears team_member_id
*/

-- =========================================================================
-- Helper: slugify a company name
-- =========================================================================
CREATE OR REPLACE FUNCTION slugify_company_name(p_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_slug text;
  v_suffix text;
BEGIN
  v_slug := lower(p_name);
  v_slug := regexp_replace(v_slug, '[^a-z0-9\s-]', '', 'g');
  v_slug := regexp_replace(v_slug, '\s+', '-', 'g');
  v_slug := regexp_replace(v_slug, '-{2,}', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  IF v_slug = '' THEN
    v_slug := 'company';
  END IF;
  v_suffix := substr(md5(random()::text), 1, 6);
  RETURN v_slug || '-' || v_suffix;
END;
$$;

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
    is_vendor
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
    COALESCE((p_profile_data->>'is_vendor')::boolean, false)
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
    is_vendor           = COALESCE((p_profile_data->>'is_vendor')::boolean, is_vendor)
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

-- =========================================================================
-- NEW: invite_team_member
-- =========================================================================
CREATE OR REPLACE FUNCTION invite_team_member(
  p_owner_id           uuid,
  p_employer_profile_id uuid,
  p_email              text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_check    uuid;
  v_invited_user   uuid;
  v_existing_member uuid;
  v_existing_invite uuid;
  v_token          text;
  v_invitation_id  uuid;
  v_result         jsonb;
BEGIN
  SELECT id INTO v_owner_check
  FROM employer_profiles
  WHERE id = p_employer_profile_id
    AND user_id = p_owner_id;

  IF v_owner_check IS NULL THEN
    RAISE EXCEPTION 'FORBIDDEN' USING HINT = 'Caller is not the owner of this employer profile';
  END IF;

  SELECT id INTO v_invited_user
  FROM profiles
  WHERE lower(email) = lower(p_email);

  IF v_invited_user IS NOT NULL THEN
    SELECT id INTO v_existing_member
    FROM company_team_members
    WHERE employer_profile_id = p_employer_profile_id
      AND user_id = v_invited_user
      AND is_active = true;

    IF v_existing_member IS NOT NULL THEN
      RAISE EXCEPTION 'ALREADY_A_MEMBER' USING HINT = 'User is already an active team member';
    END IF;
  END IF;

  SELECT id INTO v_existing_invite
  FROM company_team_invitations
  WHERE employer_profile_id = p_employer_profile_id
    AND lower(email) = lower(p_email)
    AND status = 'pending'
    AND expires_at > now();

  IF v_existing_invite IS NOT NULL THEN
    RAISE EXCEPTION 'ALREADY_A_MEMBER' USING HINT = 'A pending invitation already exists for this email';
  END IF;

  v_token := encode(gen_random_bytes(24), 'hex');

  INSERT INTO company_team_invitations (
    employer_profile_id,
    invited_by,
    email,
    token,
    status,
    expires_at
  )
  VALUES (
    p_employer_profile_id,
    p_owner_id,
    lower(p_email),
    v_token,
    'pending',
    now() + interval '7 days'
  )
  RETURNING id INTO v_invitation_id;

  v_result := jsonb_build_object(
    'invitation_id', v_invitation_id,
    'token', v_token,
    'email', lower(p_email),
    'expires_at', (now() + interval '7 days')
  );

  RETURN v_result;
END;
$$;

-- =========================================================================
-- NEW: accept_team_invitation
-- =========================================================================
CREATE OR REPLACE FUNCTION accept_team_invitation(
  p_token   text,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite       record;
  v_user_email   text;
  v_team_member_id uuid;
  v_existing_member uuid;
  v_result       jsonb;
BEGIN
  SELECT * INTO v_invite
  FROM company_team_invitations
  WHERE token = p_token
  FOR UPDATE;

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'INVITATION_NOT_FOUND' USING HINT = 'Invitation token not found';
  END IF;

  IF v_invite.status <> 'pending' THEN
    IF v_invite.status = 'accepted' THEN
      RAISE EXCEPTION 'TOKEN_ALREADY_USED' USING HINT = 'Invitation already accepted';
    ELSIF v_invite.status = 'revoked' THEN
      RAISE EXCEPTION 'INVITATION_INVALID' USING HINT = 'Invitation has been revoked';
    ELSE
      RAISE EXCEPTION 'INVITATION_INVALID' USING HINT = 'Invitation is no longer valid';
    END IF;
  END IF;

  IF v_invite.expires_at < now() THEN
    UPDATE company_team_invitations SET status = 'expired' WHERE id = v_invite.id;
    RAISE EXCEPTION 'INVITATION_EXPIRED' USING HINT = 'Invitation has expired';
  END IF;

  SELECT lower(email) INTO v_user_email
  FROM profiles
  WHERE id = p_user_id;

  IF v_user_email IS NULL OR lower(v_invite.email) <> v_user_email THEN
    RAISE EXCEPTION 'INVITATION_INVALID' USING HINT = 'Invitation email does not match your account';
  END IF;

  SELECT id INTO v_existing_member
  FROM company_team_members
  WHERE employer_profile_id = v_invite.employer_profile_id
    AND user_id = p_user_id
    AND is_active = true;

  IF v_existing_member IS NOT NULL THEN
    RAISE EXCEPTION 'ALREADY_ON_TEAM' USING HINT = 'User is already an active member of this team';
  END IF;

  INSERT INTO company_team_members (employer_profile_id, user_id, role, is_active)
  VALUES (v_invite.employer_profile_id, p_user_id, 'member', true)
  RETURNING id INTO v_team_member_id;

  UPDATE company_team_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_invite.id;

  UPDATE profiles
  SET
    active_profile_type = 'team',
    team_member_id      = v_team_member_id
  WHERE id = p_user_id;

  v_result := jsonb_build_object(
    'team_member_id', v_team_member_id,
    'employer_profile_id', v_invite.employer_profile_id,
    'accepted_at', now()
  );

  RETURN v_result;
END;
$$;

-- =========================================================================
-- NEW: leave_team
-- =========================================================================
CREATE OR REPLACE FUNCTION leave_team(
  p_user_id            uuid,
  p_employer_profile_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member       record;
  v_has_installer boolean;
  v_has_employer  boolean;
  v_fallback_type text;
  v_result        jsonb;
BEGIN
  SELECT * INTO v_member
  FROM company_team_members
  WHERE employer_profile_id = p_employer_profile_id
    AND user_id = p_user_id
    AND is_active = true
  FOR UPDATE;

  IF v_member IS NULL THEN
    RAISE EXCEPTION 'NOT_A_MEMBER' USING HINT = 'User is not an active member of this team';
  END IF;

  IF v_member.role = 'owner' THEN
    RAISE EXCEPTION 'OWNER_CANNOT_LEAVE' USING HINT = 'Profile owner cannot leave their own team';
  END IF;

  DELETE FROM company_team_members WHERE id = v_member.id;

  SELECT
    EXISTS(SELECT 1 FROM installer_profiles WHERE user_id = p_user_id),
    EXISTS(SELECT 1 FROM employer_profiles WHERE user_id = p_user_id)
  INTO v_has_installer, v_has_employer;

  IF v_has_employer THEN
    v_fallback_type := 'employer';
  ELSIF v_has_installer THEN
    v_fallback_type := 'installer';
  ELSE
    v_fallback_type := NULL;
  END IF;

  UPDATE profiles
  SET
    active_profile_type = v_fallback_type,
    team_member_id      = NULL
  WHERE id = p_user_id
    AND team_member_id = v_member.id;

  v_result := jsonb_build_object(
    'success', true,
    'employer_profile_id', p_employer_profile_id,
    'fallback_profile_type', v_fallback_type
  );

  RETURN v_result;
END;
$$;

-- =========================================================================
-- NEW: remove_team_member
-- =========================================================================
CREATE OR REPLACE FUNCTION remove_team_member(
  p_owner_id            uuid,
  p_employer_profile_id uuid,
  p_target_user_id      uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_check  uuid;
  v_member       record;
  v_has_installer boolean;
  v_has_employer  boolean;
  v_fallback_type text;
  v_result        jsonb;
BEGIN
  SELECT id INTO v_owner_check
  FROM employer_profiles
  WHERE id = p_employer_profile_id
    AND user_id = p_owner_id;

  IF v_owner_check IS NULL THEN
    RAISE EXCEPTION 'FORBIDDEN' USING HINT = 'Caller is not the owner of this employer profile';
  END IF;

  IF p_owner_id = p_target_user_id THEN
    RAISE EXCEPTION 'SELF_REMOVE_FORBIDDEN' USING HINT = 'Owner cannot remove themselves via this function';
  END IF;

  SELECT * INTO v_member
  FROM company_team_members
  WHERE employer_profile_id = p_employer_profile_id
    AND user_id = p_target_user_id
    AND is_active = true
  FOR UPDATE;

  IF v_member IS NULL THEN
    RAISE EXCEPTION 'NOT_A_MEMBER' USING HINT = 'Target user is not an active member of this team';
  END IF;

  DELETE FROM company_team_members WHERE id = v_member.id;

  SELECT
    EXISTS(SELECT 1 FROM installer_profiles WHERE user_id = p_target_user_id),
    EXISTS(SELECT 1 FROM employer_profiles WHERE user_id = p_target_user_id)
  INTO v_has_installer, v_has_employer;

  IF v_has_employer THEN
    v_fallback_type := 'employer';
  ELSIF v_has_installer THEN
    v_fallback_type := 'installer';
  ELSE
    v_fallback_type := NULL;
  END IF;

  UPDATE profiles
  SET
    active_profile_type = v_fallback_type,
    team_member_id      = NULL
  WHERE id = p_target_user_id
    AND team_member_id = v_member.id;

  v_result := jsonb_build_object(
    'success', true,
    'removed_user_id', p_target_user_id,
    'employer_profile_id', p_employer_profile_id
  );

  RETURN v_result;
END;
$$;

-- =========================================================================
-- NEW: revoke_team_invitation
-- =========================================================================
CREATE OR REPLACE FUNCTION revoke_team_invitation(
  p_owner_id     uuid,
  p_invitation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite record;
  v_result jsonb;
BEGIN
  SELECT cti.*, ep.user_id AS owner_user_id
  INTO v_invite
  FROM company_team_invitations cti
  JOIN employer_profiles ep ON ep.id = cti.employer_profile_id
  WHERE cti.id = p_invitation_id
  FOR UPDATE;

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'INVITATION_NOT_FOUND' USING HINT = 'Invitation not found';
  END IF;

  IF v_invite.owner_user_id <> p_owner_id THEN
    RAISE EXCEPTION 'FORBIDDEN' USING HINT = 'Caller is not the owner of this invitation';
  END IF;

  IF v_invite.status <> 'pending' THEN
    RAISE EXCEPTION 'INVITATION_INVALID' USING HINT = 'Only pending invitations can be revoked';
  END IF;

  UPDATE company_team_invitations
  SET status = 'revoked'
  WHERE id = p_invitation_id;

  v_result := jsonb_build_object(
    'success', true,
    'invitation_id', p_invitation_id
  );

  RETURN v_result;
END;
$$;

-- =========================================================================
-- NEW: add_company_location
-- =========================================================================
CREATE OR REPLACE FUNCTION add_company_location(
  p_owner_id            uuid,
  p_employer_profile_id uuid,
  p_location_data       jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_check uuid;
  v_location_id uuid;
  v_result      jsonb;
BEGIN
  SELECT id INTO v_owner_check
  FROM employer_profiles
  WHERE id = p_employer_profile_id
    AND user_id = p_owner_id;

  IF v_owner_check IS NULL THEN
    RAISE EXCEPTION 'FORBIDDEN' USING HINT = 'Caller is not the owner of this employer profile';
  END IF;

  INSERT INTO company_locations (
    employer_profile_id,
    name,
    address_line1,
    address_line2,
    city,
    state,
    zip_code,
    phone,
    is_active
  )
  VALUES (
    p_employer_profile_id,
    COALESCE(p_location_data->>'name', ''),
    COALESCE(p_location_data->>'address_line1', ''),
    p_location_data->>'address_line2',
    COALESCE(p_location_data->>'city', ''),
    COALESCE(p_location_data->>'state', ''),
    p_location_data->>'zip_code',
    p_location_data->>'phone',
    COALESCE((p_location_data->>'is_active')::boolean, true)
  )
  RETURNING id INTO v_location_id;

  SELECT jsonb_build_object(
    'id', cl.id,
    'employer_profile_id', cl.employer_profile_id,
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
  )
  INTO v_result
  FROM company_locations cl
  WHERE cl.id = v_location_id;

  RETURN v_result;
END;
$$;

-- =========================================================================
-- NEW: update_company_location
-- =========================================================================
CREATE OR REPLACE FUNCTION update_company_location(
  p_owner_id      uuid,
  p_location_id   uuid,
  p_location_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_location record;
  v_result   jsonb;
BEGIN
  SELECT cl.*, ep.user_id AS owner_user_id
  INTO v_location
  FROM company_locations cl
  JOIN employer_profiles ep ON ep.id = cl.employer_profile_id
  WHERE cl.id = p_location_id
  FOR UPDATE;

  IF v_location IS NULL THEN
    RAISE EXCEPTION 'LOCATION_NOT_FOUND' USING HINT = 'Location not found';
  END IF;

  IF v_location.owner_user_id <> p_owner_id THEN
    RAISE EXCEPTION 'FORBIDDEN' USING HINT = 'Caller is not the owner of this location';
  END IF;

  UPDATE company_locations
  SET
    name          = COALESCE(p_location_data->>'name', name),
    address_line1 = COALESCE(p_location_data->>'address_line1', address_line1),
    address_line2 = COALESCE(p_location_data->>'address_line2', address_line2),
    city          = COALESCE(p_location_data->>'city', city),
    state         = COALESCE(p_location_data->>'state', state),
    zip_code      = COALESCE(p_location_data->>'zip_code', zip_code),
    phone         = COALESCE(p_location_data->>'phone', phone),
    is_active     = COALESCE((p_location_data->>'is_active')::boolean, is_active)
  WHERE id = p_location_id;

  SELECT jsonb_build_object(
    'id', cl.id,
    'employer_profile_id', cl.employer_profile_id,
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
  )
  INTO v_result
  FROM company_locations cl
  WHERE cl.id = p_location_id;

  RETURN v_result;
END;
$$;

-- =========================================================================
-- NEW: deactivate_company_location
-- =========================================================================
CREATE OR REPLACE FUNCTION deactivate_company_location(
  p_owner_id    uuid,
  p_location_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_location record;
  v_result   jsonb;
BEGIN
  SELECT cl.*, ep.user_id AS owner_user_id
  INTO v_location
  FROM company_locations cl
  JOIN employer_profiles ep ON ep.id = cl.employer_profile_id
  WHERE cl.id = p_location_id
  FOR UPDATE;

  IF v_location IS NULL THEN
    RAISE EXCEPTION 'LOCATION_NOT_FOUND' USING HINT = 'Location not found';
  END IF;

  IF v_location.owner_user_id <> p_owner_id THEN
    RAISE EXCEPTION 'FORBIDDEN' USING HINT = 'Caller is not the owner of this location';
  END IF;

  UPDATE company_locations
  SET is_active = false
  WHERE id = p_location_id;

  v_result := jsonb_build_object(
    'success', true,
    'location_id', p_location_id
  );

  RETURN v_result;
END;
$$;

-- =========================================================================
-- NEW: get_company_locations
-- =========================================================================
CREATE OR REPLACE FUNCTION get_company_locations(
  p_caller_id           uuid,
  p_employer_profile_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_owner   boolean;
  v_is_member  boolean;
  v_result     jsonb;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM employer_profiles
    WHERE id = p_employer_profile_id AND user_id = p_caller_id
  ) INTO v_is_owner;

  SELECT EXISTS(
    SELECT 1 FROM company_team_members
    WHERE employer_profile_id = p_employer_profile_id
      AND user_id = p_caller_id
      AND is_active = true
  ) INTO v_is_member;

  IF NOT v_is_owner AND NOT v_is_member THEN
    RAISE EXCEPTION 'FORBIDDEN' USING HINT = 'Caller is not a member of this team';
  END IF;

  SELECT COALESCE(
    jsonb_agg(jsonb_build_object(
      'id', cl.id,
      'employer_profile_id', cl.employer_profile_id,
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
    ) ORDER BY cl.created_at),
    '[]'::jsonb
  )
  INTO v_result
  FROM company_locations cl
  WHERE cl.employer_profile_id = p_employer_profile_id
    AND (v_is_owner OR cl.is_active = true);

  RETURN v_result;
END;
$$;
