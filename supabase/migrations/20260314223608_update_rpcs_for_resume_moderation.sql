/*
  # Update RPC Functions for Resume-Level Moderation

  ## Overview
  Updates the moderate_user and restore_user_content RPCs to optionally target
  a specific resume instead of (or in addition to) the user's profile. Also
  adds a new restore_resume_content RPC for admin-initiated resume-only restores.

  ## RPC Changes

  ### moderate_user
  - New optional parameter: p_resume_id (uuid, DEFAULT NULL)
  - When p_resume_id is provided AND action_type is 'hide' or 'restore', the
    action is applied to installer_resumes WHERE id = p_resume_id instead of
    (or in addition to) the profile-level visibility.
  - When action_type is 'ban', the user's resume is also hidden alongside the
    profile (p_resume_id not required — all resumes for the user are hidden).
  - All other action types (warning, restrict, unrestrict, unban) operate only
    on profiles — resume is unaffected.

  ### restore_user_content
  - Behavior unchanged for profile-level restores.
  - Does NOT automatically restore resumes when a profile is restored; that
    requires a separate restore_resume_content call.

  ### restore_resume_content (NEW)
  - Targets a specific resume by p_resume_id.
  - Sets content_visibility = 'restored', resets unresolved_flag_count = 0,
    clears auto_hidden_at = NULL on installer_resumes.
  - Appends a moderation_actions row with action_type = 'restore' and
    content_type = 'resume', content_id = p_resume_id.

  ## Important Notes
  1. All RPCs run SECURITY DEFINER.
  2. Banning a user still hides all their resumes as a side effect.
  3. Unbanning a user does NOT auto-restore their resumes.
  4. Resume-only hide/restore does NOT affect the user's profile visibility.
*/

-- ============================================================
-- Updated RPC: moderate_user (adds p_resume_id parameter)
-- ============================================================
CREATE OR REPLACE FUNCTION moderate_user(
  p_target_user_id  uuid,
  p_admin_id        uuid,
  p_action_type     text,
  p_reason          text,
  p_expires_at      timestamptz DEFAULT NULL,
  p_notes           text        DEFAULT NULL,
  p_flag_id         uuid        DEFAULT NULL,
  p_metadata        jsonb       DEFAULT NULL,
  p_resume_id       uuid        DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action_id uuid;
BEGIN
  CASE p_action_type

    WHEN 'warning' THEN
      UPDATE profiles
      SET
        account_status = 'warned',
        updated_at     = now()
      WHERE id = p_target_user_id
        AND account_status NOT IN ('banned');

    WHEN 'restrict' THEN
      UPDATE profiles
      SET
        account_status = 'restricted',
        updated_at     = now()
      WHERE id = p_target_user_id
        AND account_status != 'banned';

    WHEN 'unrestrict' THEN
      UPDATE profiles
      SET
        account_status = 'active',
        updated_at     = now()
      WHERE id = p_target_user_id
        AND account_status = 'restricted';

    WHEN 'ban' THEN
      -- Hide the profile
      UPDATE profiles
      SET
        account_status     = 'banned',
        content_visibility = 'admin_hidden',
        updated_at         = now()
      WHERE id = p_target_user_id;

      -- Also hide all resumes for this user
      UPDATE installer_resumes
      SET
        content_visibility = 'admin_hidden',
        updated_at         = now()
      WHERE user_id = p_target_user_id;

    WHEN 'unban' THEN
      UPDATE profiles
      SET
        account_status = 'active',
        updated_at     = now()
      WHERE id = p_target_user_id
        AND account_status = 'banned';

    WHEN 'hide' THEN
      IF p_resume_id IS NOT NULL THEN
        -- Resume-specific hide
        UPDATE installer_resumes
        SET
          content_visibility = 'admin_hidden',
          updated_at         = now()
        WHERE id = p_resume_id
          AND user_id = p_target_user_id;
      ELSE
        -- Profile-level hide
        UPDATE profiles
        SET
          content_visibility = 'admin_hidden',
          updated_at         = now()
        WHERE id = p_target_user_id;
      END IF;

    WHEN 'restore' THEN
      IF p_resume_id IS NOT NULL THEN
        -- Resume-specific restore
        UPDATE installer_resumes
        SET
          content_visibility    = 'restored',
          unresolved_flag_count = 0,
          auto_hidden_at        = NULL,
          updated_at            = now()
        WHERE id = p_resume_id
          AND user_id = p_target_user_id;
      ELSE
        -- Profile-level restore
        UPDATE profiles
        SET
          content_visibility    = 'restored',
          unresolved_flag_count = 0,
          auto_hidden_at        = NULL,
          updated_at            = now()
        WHERE id = p_target_user_id;
      END IF;

    ELSE
      NULL;
  END CASE;

  -- Append to audit log
  INSERT INTO moderation_actions (
    flag_id,
    target_user_id,
    admin_user_id,
    action_type,
    content_type,
    content_id,
    reason,
    notes,
    expires_at,
    metadata
  ) VALUES (
    p_flag_id,
    p_target_user_id,
    p_admin_id,
    p_action_type,
    CASE WHEN p_resume_id IS NOT NULL THEN 'resume' ELSE NULL END,
    p_resume_id,
    p_reason,
    p_notes,
    p_expires_at,
    p_metadata
  )
  RETURNING id INTO v_action_id;

  RETURN jsonb_build_object(
    'success',    true,
    'action_id',  v_action_id,
    'error_code', null
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success',    false,
    'error_code', 'SERVER_ERROR',
    'detail',     SQLERRM
  );
END;
$$;

-- ============================================================
-- New RPC: restore_resume_content
-- ============================================================
CREATE OR REPLACE FUNCTION restore_resume_content(
  p_resume_id       uuid,
  p_target_user_id  uuid,
  p_admin_id        uuid,
  p_reason          text,
  p_notes           text  DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action_id uuid;
BEGIN
  UPDATE installer_resumes
  SET
    content_visibility    = 'restored',
    unresolved_flag_count = 0,
    auto_hidden_at        = NULL,
    updated_at            = now()
  WHERE id = p_resume_id
    AND user_id = p_target_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success',    false,
      'error_code', 'NOT_FOUND'
    );
  END IF;

  INSERT INTO moderation_actions (
    target_user_id,
    admin_user_id,
    action_type,
    content_type,
    content_id,
    reason,
    notes
  ) VALUES (
    p_target_user_id,
    p_admin_id,
    'restore',
    'resume',
    p_resume_id,
    p_reason,
    p_notes
  )
  RETURNING id INTO v_action_id;

  RETURN jsonb_build_object(
    'success',    true,
    'action_id',  v_action_id,
    'error_code', null
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success',    false,
    'error_code', 'SERVER_ERROR',
    'detail',     SQLERRM
  );
END;
$$;
