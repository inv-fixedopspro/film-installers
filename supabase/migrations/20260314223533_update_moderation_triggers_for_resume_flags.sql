/*
  # Update Moderation Triggers to Handle Resume-Level Flags

  ## Overview
  The existing handle_new_flag and handle_flag_review_resolved triggers only
  operated on the profiles table. This migration replaces both with updated
  versions that branch on content_type: flags against a 'resume' increment
  and decrement unresolved_flag_count on installer_resumes instead of profiles.

  ## Trigger Changes

  ### handle_new_flag (AFTER INSERT ON content_flags)
  - If content_type = 'resume': increments unresolved_flag_count on
    installer_resumes WHERE id = content_id. Then checks the auto_hide_threshold
    and sets content_visibility = 'auto_hidden' / auto_hidden_at = now() on the
    resume row if the threshold is met (and the resume is currently 'visible').
  - All other content_type values: unchanged behavior — increments
    unresolved_flag_count on profiles WHERE id = flagged_user_id and applies
    the same auto-hide logic to the profile.

  ### handle_flag_review_resolved (AFTER UPDATE ON flag_reviews)
  - Resolving a resume-type flag decrements unresolved_flag_count on
    installer_resumes WHERE id = content_flags.content_id (floor 0).
  - Resolving any other flag type still decrements unresolved_flag_count
    on profiles WHERE id = flagged_user_id (floor 0).
  - Auto-restore is NOT performed in either case — that remains a deliberate
    admin action only.

  ## Important Notes
  1. Both functions use SECURITY DEFINER to bypass RLS during trigger execution.
  2. The threshold is read from moderation_config at trigger-time so config
     changes propagate immediately to new flag inserts.
  3. unresolved_flag_count can never go below 0 (GREATEST guard).
  4. The existing triggers are dropped and recreated — no data is affected.
*/

-- ============================================================
-- Updated Trigger Function: handle_new_flag
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
  -- Read auto_hide threshold (default 3 if not set)
  SELECT COALESCE(value::integer, 3)
  INTO v_threshold
  FROM moderation_config
  WHERE key = 'auto_hide_threshold';

  IF v_threshold IS NULL THEN
    v_threshold := 3;
  END IF;

  IF NEW.content_type = 'resume' THEN
    -- Resume-level flag: operate on installer_resumes
    UPDATE installer_resumes
    SET
      unresolved_flag_count = unresolved_flag_count + 1,
      updated_at            = now()
    WHERE id = NEW.content_id
    RETURNING unresolved_flag_count INTO v_flag_count;

    IF v_flag_count >= v_threshold THEN
      UPDATE installer_resumes
      SET
        content_visibility = 'auto_hidden',
        auto_hidden_at     = now(),
        updated_at         = now()
      WHERE id = NEW.content_id
        AND content_visibility = 'visible';
    END IF;

  ELSE
    -- Profile/account-level flag: operate on profiles
    UPDATE profiles
    SET
      unresolved_flag_count = unresolved_flag_count + 1,
      updated_at            = now()
    WHERE id = NEW.flagged_user_id
    RETURNING unresolved_flag_count INTO v_flag_count;

    IF v_flag_count >= v_threshold THEN
      UPDATE profiles
      SET
        content_visibility = 'auto_hidden',
        auto_hidden_at     = now(),
        updated_at         = now()
      WHERE id = NEW.flagged_user_id
        AND content_visibility = 'visible';
    END IF;
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
-- Updated Trigger Function: handle_flag_review_resolved
-- ============================================================
CREATE OR REPLACE FUNCTION handle_flag_review_resolved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_flagged_user_id   uuid;
  v_content_type      text;
  v_content_id        uuid;
BEGIN
  -- Only act when transitioning to a resolved state
  IF NEW.status NOT IN ('resolved_actioned', 'resolved_dismissed', 'resolved_duplicate') THEN
    RETURN NEW;
  END IF;

  -- Only act when previous status was unresolved
  IF OLD.status NOT IN ('pending', 'under_review') THEN
    RETURN NEW;
  END IF;

  -- Get the flag details
  SELECT flagged_user_id, content_type, content_id
  INTO v_flagged_user_id, v_content_type, v_content_id
  FROM content_flags
  WHERE id = NEW.flag_id;

  IF v_flagged_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF v_content_type = 'resume' THEN
    -- Decrement on installer_resumes, floored at 0
    UPDATE installer_resumes
    SET
      unresolved_flag_count = GREATEST(0, unresolved_flag_count - 1),
      updated_at            = now()
    WHERE id = v_content_id;
  ELSE
    -- Decrement on profiles, floored at 0
    UPDATE profiles
    SET
      unresolved_flag_count = GREATEST(0, unresolved_flag_count - 1),
      updated_at            = now()
    WHERE id = v_flagged_user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_flag_review_resolved ON flag_reviews;
CREATE TRIGGER trg_handle_flag_review_resolved
  AFTER UPDATE ON flag_reviews
  FOR EACH ROW
  EXECUTE FUNCTION handle_flag_review_resolved();
