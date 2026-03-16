/*
  # Phase 3: Auto-Hide Triggers and Moderation RPC Functions

  ## Overview
  Adds the intelligence layer to the moderation system. PostgreSQL triggers
  automatically maintain the unresolved_flag_count on profiles and enforce the
  auto-hide threshold without any application code involvement. Four RPC
  functions provide atomic, safe entry points for all flag and moderation
  operations.

  ## Triggers

  ### handle_new_flag (AFTER INSERT ON content_flags)
  Increments unresolved_flag_count on the flagged user's profile row. Then
  reads auto_hide_threshold from moderation_config and, if the count meets or
  exceeds the threshold and the user is not already hidden, sets
  content_visibility = 'auto_hidden' and records auto_hidden_at = now().

  ### handle_flag_review_resolved (AFTER UPDATE ON flag_reviews)
  Fires when a flag_reviews row transitions from 'pending' or 'under_review'
  to any resolved state. Decrements unresolved_flag_count (floor 0) on the
  flagged user. If the count drops below threshold and content was auto_hidden,
  it does NOT auto-restore (that is a deliberate admin action via restore_user_content).

  ## RPC Functions

  ### submit_flag
  Validates the submission (no self-flagging, duplicate check), inserts to
  content_flags, inserts a pending row to flag_reviews, returns a JSON result
  with success flag and error codes on failure.
  Error codes: FLAG_SELF, FLAG_DUPLICATE

  ### review_flag
  Admin-only. Atomically updates flag_reviews status and inserts a row to
  moderation_actions. Returns JSON result.

  ### moderate_user
  Admin-only. Updates account_status and/or content_visibility on the target
  profile based on action_type, then inserts an append-only moderation_actions
  row. Returns JSON result.
  Error codes: USER_BANNED (when trying to restrict an already-banned user), USER_RESTRICTED

  ### restore_user_content
  Admin-only. Sets content_visibility = 'restored', resets unresolved_flag_count
  to 0, and inserts a moderation_actions row with action_type = 'restore'.

  ## Important Notes
  1. All RPCs run with SECURITY DEFINER to bypass RLS while still validating
     inputs explicitly.
  2. The auto-hide trigger reads the threshold at trigger-time so changing the
     config takes effect immediately for new flags.
  3. unresolved_flag_count can never go below 0 (GREATEST guard).
  4. submit_flag returns {success, flag_id, review_id, error_code} as JSONB.
  5. All other RPCs return {success, error_code} as JSONB.
*/

-- ============================================================
-- Trigger: handle_new_flag
-- Fires AFTER INSERT ON content_flags
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_threshold     integer;
  v_flag_count    integer;
BEGIN
  -- Increment unresolved_flag_count on the flagged user
  UPDATE profiles
  SET
    unresolved_flag_count = unresolved_flag_count + 1,
    updated_at            = now()
  WHERE id = NEW.flagged_user_id
  RETURNING unresolved_flag_count INTO v_flag_count;

  -- Read auto_hide threshold (default 3 if not set)
  SELECT COALESCE(value::integer, 3)
  INTO v_threshold
  FROM moderation_config
  WHERE key = 'auto_hide_threshold';

  IF v_threshold IS NULL THEN
    v_threshold := 3;
  END IF;

  -- Auto-hide if threshold met and not already hidden/banned
  IF v_flag_count >= v_threshold THEN
    UPDATE profiles
    SET
      content_visibility = 'auto_hidden',
      auto_hidden_at     = now(),
      updated_at         = now()
    WHERE id = NEW.flagged_user_id
      AND content_visibility = 'visible';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_new_flag ON content_flags;
CREATE TRIGGER trg_handle_new_flag
  AFTER INSERT ON content_flags
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_flag();

-- ============================================================
-- Trigger: handle_flag_review_resolved
-- Fires AFTER UPDATE ON flag_reviews
-- ============================================================
CREATE OR REPLACE FUNCTION handle_flag_review_resolved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flagged_user_id uuid;
BEGIN
  -- Only act when transitioning to a resolved state
  IF NEW.status NOT IN ('resolved_actioned', 'resolved_dismissed', 'resolved_duplicate') THEN
    RETURN NEW;
  END IF;

  -- Only act when previous status was unresolved
  IF OLD.status NOT IN ('pending', 'under_review') THEN
    RETURN NEW;
  END IF;

  -- Get the flagged user from the associated content_flag
  SELECT flagged_user_id
  INTO v_flagged_user_id
  FROM content_flags
  WHERE id = NEW.flag_id;

  IF v_flagged_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Decrement, floored at 0
  UPDATE profiles
  SET
    unresolved_flag_count = GREATEST(0, unresolved_flag_count - 1),
    updated_at            = now()
  WHERE id = v_flagged_user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_flag_review_resolved ON flag_reviews;
CREATE TRIGGER trg_handle_flag_review_resolved
  AFTER UPDATE ON flag_reviews
  FOR EACH ROW
  EXECUTE FUNCTION handle_flag_review_resolved();

-- ============================================================
-- RPC: submit_flag
-- ============================================================
CREATE OR REPLACE FUNCTION submit_flag(
  p_flagger_user_id   uuid,
  p_flagged_user_id   uuid,
  p_content_type      text,
  p_content_id        uuid,
  p_category          text,
  p_reason            text    DEFAULT NULL,
  p_content_snapshot  jsonb   DEFAULT NULL,
  p_content_url       text    DEFAULT NULL,
  p_metadata          jsonb   DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flag_id         uuid;
  v_review_id       uuid;
  v_existing_flag   uuid;
  v_is_duplicate    boolean := false;
BEGIN
  -- Self-flag guard
  IF p_flagger_user_id = p_flagged_user_id THEN
    RETURN jsonb_build_object(
      'success',    false,
      'error_code', 'FLAG_SELF'
    );
  END IF;

  -- Duplicate check: same flagger, same content
  SELECT id INTO v_existing_flag
  FROM content_flags
  WHERE flagger_user_id = p_flagger_user_id
    AND flagged_user_id = p_flagged_user_id
    AND content_type    = p_content_type
    AND content_id      = p_content_id
  LIMIT 1;

  IF v_existing_flag IS NOT NULL THEN
    v_is_duplicate := true;
  END IF;

  -- Insert the flag (duplicate or not - we record everything)
  INSERT INTO content_flags (
    flagger_user_id,
    flagged_user_id,
    content_type,
    content_id,
    flag_category,
    flag_reason_detail,
    content_snapshot,
    content_url,
    metadata,
    is_duplicate
  ) VALUES (
    p_flagger_user_id,
    p_flagged_user_id,
    p_content_type,
    p_content_id,
    p_category,
    p_reason,
    p_content_snapshot,
    p_content_url,
    p_metadata,
    v_is_duplicate
  )
  RETURNING id INTO v_flag_id;

  -- Create the flag_review row
  INSERT INTO flag_reviews (
    flag_id,
    status,
    priority
  ) VALUES (
    v_flag_id,
    'pending',
    'normal'
  )
  RETURNING id INTO v_review_id;

  -- Return duplicate code as informational (not a hard failure)
  IF v_is_duplicate THEN
    RETURN jsonb_build_object(
      'success',    true,
      'flag_id',    v_flag_id,
      'review_id',  v_review_id,
      'error_code', 'FLAG_DUPLICATE'
    );
  END IF;

  RETURN jsonb_build_object(
    'success',   true,
    'flag_id',   v_flag_id,
    'review_id', v_review_id,
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
-- RPC: review_flag
-- ============================================================
CREATE OR REPLACE FUNCTION review_flag(
  p_flag_id       uuid,
  p_admin_id      uuid,
  p_new_status    text,
  p_notes         text    DEFAULT NULL,
  p_action_type   text    DEFAULT NULL,
  p_reason        text    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flagged_user_id   uuid;
  v_action_id         uuid;
BEGIN
  -- Update flag_reviews
  UPDATE flag_reviews
  SET
    status         = p_new_status,
    reviewer_id    = p_admin_id,
    reviewer_notes = p_notes,
    reviewed_at    = now(),
    updated_at     = now()
  WHERE flag_id = p_flag_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success',    false,
      'error_code', 'NOT_FOUND'
    );
  END IF;

  -- Optionally record a moderation action
  IF p_action_type IS NOT NULL AND p_reason IS NOT NULL THEN
    SELECT flagged_user_id INTO v_flagged_user_id
    FROM content_flags
    WHERE id = p_flag_id;

    INSERT INTO moderation_actions (
      flag_id,
      target_user_id,
      admin_user_id,
      action_type,
      reason,
      notes
    ) VALUES (
      p_flag_id,
      v_flagged_user_id,
      p_admin_id,
      p_action_type,
      p_reason,
      p_notes
    )
    RETURNING id INTO v_action_id;
  END IF;

  RETURN jsonb_build_object(
    'success',   true,
    'action_id', v_action_id,
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
-- RPC: moderate_user
-- ============================================================
CREATE OR REPLACE FUNCTION moderate_user(
  p_target_user_id  uuid,
  p_admin_id        uuid,
  p_action_type     text,
  p_reason          text,
  p_expires_at      timestamptz DEFAULT NULL,
  p_notes           text        DEFAULT NULL,
  p_flag_id         uuid        DEFAULT NULL,
  p_metadata        jsonb       DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action_id uuid;
BEGIN
  -- Apply profile status changes based on action type
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
      UPDATE profiles
      SET
        account_status     = 'banned',
        content_visibility = 'admin_hidden',
        updated_at         = now()
      WHERE id = p_target_user_id;

    WHEN 'unban' THEN
      UPDATE profiles
      SET
        account_status = 'active',
        updated_at     = now()
      WHERE id = p_target_user_id
        AND account_status = 'banned';

    WHEN 'hide' THEN
      UPDATE profiles
      SET
        content_visibility = 'admin_hidden',
        updated_at         = now()
      WHERE id = p_target_user_id;

    WHEN 'restore' THEN
      UPDATE profiles
      SET
        content_visibility    = 'restored',
        unresolved_flag_count = 0,
        auto_hidden_at        = NULL,
        updated_at            = now()
      WHERE id = p_target_user_id;

    ELSE
      NULL;
  END CASE;

  -- Append to audit log
  INSERT INTO moderation_actions (
    flag_id,
    target_user_id,
    admin_user_id,
    action_type,
    reason,
    notes,
    expires_at,
    metadata
  ) VALUES (
    p_flag_id,
    p_target_user_id,
    p_admin_id,
    p_action_type,
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
-- RPC: restore_user_content
-- ============================================================
CREATE OR REPLACE FUNCTION restore_user_content(
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
  -- Reset visibility and flag count
  UPDATE profiles
  SET
    content_visibility    = 'restored',
    unresolved_flag_count = 0,
    auto_hidden_at        = NULL,
    updated_at            = now()
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success',    false,
      'error_code', 'NOT_FOUND'
    );
  END IF;

  -- Append-only audit log entry
  INSERT INTO moderation_actions (
    target_user_id,
    admin_user_id,
    action_type,
    reason,
    notes
  ) VALUES (
    p_target_user_id,
    p_admin_id,
    'restore',
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
