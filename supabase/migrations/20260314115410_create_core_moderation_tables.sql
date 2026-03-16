/*
  # Phase 2: Core Moderation Tables

  ## Overview
  Creates the three core tables that form the backbone of the moderation and
  flagging system, plus a configuration table for runtime-tunable thresholds.
  No application logic is added here - this is purely the data layer.

  ## New Tables

  ### content_flags
  Immutable flag submissions from users. Each row records exactly one user
  reporting a piece of content. Append-only by design - flags are never edited
  or deleted, only superseded by moderation_actions.
  - `flagger_user_id` - the authenticated user who submitted the flag
  - `flagged_user_id` - the user whose content is being flagged
  - `content_type` - what kind of content was flagged (CHECK constraint)
  - `content_id` - the UUID of the specific content record
  - `flag_category` - the reason category (CHECK constraint)
  - `flag_reason_detail` - optional free-text elaboration
  - `content_snapshot` - JSONB copy of the content at flag time for audit
  - `content_url` - optional URL for context
  - `metadata` - JSONB for extensible extra data
  - `is_duplicate` - set to true by admin workflow if flag is a repeat

  ### flag_reviews
  Admin workflow record, one per flag. Tracks the lifecycle of a flag from
  receipt through resolution. Updated as admins process the queue.
  - `flag_id` - FK to content_flags (1:1)
  - `status` - current workflow state (CHECK constraint, 5 valid values)
  - `assigned_to` - nullable FK to profiles for admin assignment
  - `priority` - triage priority (CHECK constraint, 4 levels)
  - `reviewer_id` - which admin last touched this review
  - `reviewer_notes` - internal admin notes
  - `reviewed_at` - when the review was last actioned

  ### moderation_actions
  Append-only audit log of every moderation action taken. Never updated or
  deleted. Provides complete history of admin actions against any user.
  - `flag_id` - nullable FK to content_flags (action may be manual, not flag-driven)
  - `target_user_id` - the user the action was taken against
  - `admin_user_id` - the admin who took the action
  - `action_type` - what was done (CHECK constraint, 9 valid values)
  - `content_type` / `content_id` - optional, which content was acted on
  - `reason` - required plain-text reason shown to the target user
  - `notes` - internal admin notes not shown to user
  - `expires_at` - optional expiry for temporary actions (bans, restrictions)
  - `metadata` - JSONB for extensible extra data

  ### moderation_config
  Key/value store for runtime-tunable moderation settings. Seeded with the
  auto_hide_threshold default of 3 unresolved flags.

  ## Security
  - RLS enabled on all four tables
  - Users can INSERT flags (not against themselves, cannot flag themselves)
  - Users can SELECT their own submitted flags
  - Users can SELECT moderation_actions where they are the target (own history)
  - No user-level write access to flag_reviews or moderation_actions
  - Admins (via is_admin()) have full SELECT, INSERT, UPDATE access to all tables
  - moderation_actions is intentionally missing an admin UPDATE policy (append-only)
  - moderation_config is admin-read/write, no user access

  ## Indexes
  - Pending flag queue (flag_reviews by status)
  - Per-user flag lookup (content_flags by flagged_user_id)
  - Flagger abuse detection (content_flags by flagger_user_id)
  - Compound duplicate detection (flagger + flagged + content)
  - Moderation action history per user
  - Partial index on flag_reviews for open items only
*/

-- ============================================================
-- content_flags
-- ============================================================
CREATE TABLE IF NOT EXISTS content_flags (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  flagger_user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  flagged_user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type        text        NOT NULL
    CONSTRAINT content_flags_content_type_check
      CHECK (content_type IN ('installer_profile', 'employer_profile', 'user_account')),
  content_id          uuid        NOT NULL,
  flag_category       text        NOT NULL
    CONSTRAINT content_flags_flag_category_check
      CHECK (flag_category IN (
        'spam',
        'fake_profile',
        'inappropriate_content',
        'harassment',
        'misleading_information',
        'other'
      )),
  flag_reason_detail  text,
  content_snapshot    jsonb,
  content_url         text,
  metadata            jsonb,
  is_duplicate        boolean     NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_flags_no_self_flag CHECK (flagger_user_id != flagged_user_id)
);

-- ============================================================
-- flag_reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS flag_reviews (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id         uuid        NOT NULL REFERENCES content_flags(id) ON DELETE CASCADE,
  status          text        NOT NULL DEFAULT 'pending'
    CONSTRAINT flag_reviews_status_check
      CHECK (status IN (
        'pending',
        'under_review',
        'resolved_actioned',
        'resolved_dismissed',
        'resolved_duplicate'
      )),
  assigned_to     uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  priority        text        NOT NULL DEFAULT 'normal'
    CONSTRAINT flag_reviews_priority_check
      CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  reviewer_id     uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  reviewer_notes  text,
  reviewed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT flag_reviews_flag_id_unique UNIQUE (flag_id)
);

-- ============================================================
-- moderation_actions
-- ============================================================
CREATE TABLE IF NOT EXISTS moderation_actions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id         uuid        REFERENCES content_flags(id) ON DELETE SET NULL,
  target_user_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_user_id   uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type     text        NOT NULL
    CONSTRAINT moderation_actions_action_type_check
      CHECK (action_type IN (
        'warning',
        'hide',
        'restore',
        'restrict',
        'unrestrict',
        'ban',
        'unban',
        'flag_upheld',
        'flag_dismissed'
      )),
  content_type    text,
  content_id      uuid,
  reason          text        NOT NULL,
  notes           text,
  expires_at      timestamptz,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- moderation_config
-- ============================================================
CREATE TABLE IF NOT EXISTS moderation_config (
  key         text PRIMARY KEY,
  value       text NOT NULL,
  description text NOT NULL DEFAULT ''
);

INSERT INTO moderation_config (key, value, description)
VALUES (
  'auto_hide_threshold',
  '3',
  'Number of unresolved flags against a user before their content is automatically hidden'
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Indexes
-- ============================================================

-- Pending flag queue - primary admin queue view
CREATE INDEX IF NOT EXISTS idx_flag_reviews_status
  ON flag_reviews(status);

-- Partial index for open reviews only (most common admin query)
CREATE INDEX IF NOT EXISTS idx_flag_reviews_open
  ON flag_reviews(status, created_at)
  WHERE status IN ('pending', 'under_review');

-- Per-user: how many flags has this user received
CREATE INDEX IF NOT EXISTS idx_content_flags_flagged_user_id
  ON content_flags(flagged_user_id);

-- Per-user: flags submitted by this user (abuse detection)
CREATE INDEX IF NOT EXISTS idx_content_flags_flagger_user_id
  ON content_flags(flagger_user_id);

-- Compound duplicate detection (same flagger flagging same content again)
CREATE INDEX IF NOT EXISTS idx_content_flags_duplicate_detection
  ON content_flags(flagger_user_id, flagged_user_id, content_type, content_id);

-- Moderation history per target user
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target_user_id
  ON moderation_actions(target_user_id, created_at DESC);

-- Admin action lookup by admin
CREATE INDEX IF NOT EXISTS idx_moderation_actions_admin_user_id
  ON moderation_actions(admin_user_id);

-- Flag assignment lookup
CREATE INDEX IF NOT EXISTS idx_flag_reviews_assigned_to
  ON flag_reviews(assigned_to)
  WHERE assigned_to IS NOT NULL;

-- ============================================================
-- updated_at trigger on flag_reviews
-- ============================================================
DROP TRIGGER IF EXISTS update_flag_reviews_updated_at ON flag_reviews;
CREATE TRIGGER update_flag_reviews_updated_at
  BEFORE UPDATE ON flag_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Enable RLS
-- ============================================================
ALTER TABLE content_flags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE flag_reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_config   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- content_flags policies
-- ============================================================

-- Users can submit flags (but not against themselves - enforced by CHECK constraint too)
CREATE POLICY "Authenticated users can submit flags"
  ON content_flags FOR INSERT
  TO authenticated
  WITH CHECK (
    flagger_user_id = auth.uid()
    AND flagged_user_id != auth.uid()
  );

-- Users can view their own submitted flags
CREATE POLICY "Users can view own submitted flags"
  ON content_flags FOR SELECT
  TO authenticated
  USING (flagger_user_id = auth.uid());

-- Admins can view all flags
CREATE POLICY "Admins can view all flags"
  ON content_flags FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can update flags (e.g. mark is_duplicate)
CREATE POLICY "Admins can update flags"
  ON content_flags FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- flag_reviews policies
-- ============================================================

-- Admins can view all flag reviews
CREATE POLICY "Admins can view all flag reviews"
  ON flag_reviews FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can insert flag reviews (created when a flag is submitted via trigger in Phase 3)
CREATE POLICY "Admins can insert flag reviews"
  ON flag_reviews FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Admins can update flag reviews (progress through workflow states)
CREATE POLICY "Admins can update flag reviews"
  ON flag_reviews FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- moderation_actions policies
-- ============================================================

-- Users can view their own moderation history
CREATE POLICY "Users can view own moderation history"
  ON moderation_actions FOR SELECT
  TO authenticated
  USING (target_user_id = auth.uid());

-- Admins can view all moderation actions
CREATE POLICY "Admins can view all moderation actions"
  ON moderation_actions FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can insert moderation actions (append-only - no UPDATE policy by design)
CREATE POLICY "Admins can insert moderation actions"
  ON moderation_actions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- ============================================================
-- moderation_config policies
-- ============================================================

-- Admins can view config
CREATE POLICY "Admins can view moderation config"
  ON moderation_config FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can update config values
CREATE POLICY "Admins can update moderation config"
  ON moderation_config FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can insert new config keys
CREATE POLICY "Admins can insert moderation config"
  ON moderation_config FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());
