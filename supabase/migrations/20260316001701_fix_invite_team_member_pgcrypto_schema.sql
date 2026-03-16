/*
  # Fix invite_team_member pgcrypto Extension Schema Reference

  ## Problem
  The `invite_team_member` function uses `gen_random_bytes(24)` to generate
  invitation tokens. All RPC functions in this project use `SET search_path = public`,
  which locks the search path to the `public` schema only. The `pgcrypto` extension
  is installed in the `extensions` schema, so `gen_random_bytes` is not resolvable
  without a fully-qualified schema prefix.

  ## Fix
  Replace `gen_random_bytes(24)` with `extensions.gen_random_bytes(24)` to use
  the fully-qualified schema path that works correctly with `SET search_path = public`.

  ## Changes
  - `invite_team_member`: Token generation line updated to `extensions.gen_random_bytes(24)`

  ## No Other Changes
  - Function signature unchanged
  - Return type unchanged
  - All business logic unchanged
  - All other RPC functions in the migration are unaffected (they do not call pgcrypto)
*/

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

  v_token := encode(extensions.gen_random_bytes(24), 'hex');

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
