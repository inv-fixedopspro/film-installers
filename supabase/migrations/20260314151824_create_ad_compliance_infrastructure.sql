/*
  # Ad System Compliance Infrastructure

  ## Purpose
  Prepares the legal and tracking groundwork for a first-party ad system before any ads go live.
  All schema is designed to be privacy-compliant (CCPA) from day one:
  - Impression/click records carry no direct PII — they store a session token, not a user ID
  - A separate ad_consent_log maps user consent decisions to the ad system
  - Users can opt out of targeted advertising at any time via a profile flag
  - Opt-out events are recorded in the consent_log for audit purposes

  ## Changes

  ### Modified Tables
  - `profiles` — adds `targeted_ads_opted_out` (boolean, default false)
    Tracks the user's current CCPA "Do Not Sell or Share" opt-out status.

  ### New Tables

  #### ad_consent_log
  Records every time a user grants or revokes advertising consent.
  Linked to the user (for CCPA compliance audits), but separate from
  impression/click data which is anonymized.

  Columns:
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → auth.users)
  - `opted_out` (boolean) — true = opted out, false = opted back in
  - `source` (text) — where the change was made: 'settings', 'cookie_banner', 'registration'
  - `ip_address` (text, nullable) — for audit trail
  - `user_agent` (text, nullable) — for audit trail
  - `created_at` (timestamptz)

  #### ad_impressions
  Anonymized record of each time an ad unit is rendered to a visitor.
  No user_id — only a session_token (opaque string, not linked to auth).

  Columns:
  - `id` (uuid, PK)
  - `ad_package_id` (uuid, nullable) — which ad package was shown
  - `session_token` (text) — opaque session identifier (not auth user ID)
  - `page_context` (text) — e.g. 'jobs', 'network', 'dashboard'
  - `ad_slot` (text) — e.g. 'sidebar', 'banner_top'
  - `rendered_at` (timestamptz)
  - `created_at` (timestamptz)

  #### ad_clicks
  Anonymized record of each click on an ad unit.
  References ad_impressions for join analysis, no direct PII.

  Columns:
  - `id` (uuid, PK)
  - `impression_id` (uuid, FK → ad_impressions)
  - `ad_package_id` (uuid, nullable)
  - `session_token` (text)
  - `page_context` (text)
  - `clicked_at` (timestamptz)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all three new tables
  - ad_consent_log: users can only read their own records; inserts via service role only
  - ad_impressions / ad_clicks: no authenticated read policies — analytics are admin-only via service role
  - profiles.targeted_ads_opted_out: readable by user, writable by user (existing profile RLS covers this)

  ## Notes
  1. Impression/click records are excluded from personal data exports by default (no user_id column)
  2. The session_token in impressions/clicks is a random UUID generated client-side per session, not tied to auth
  3. When a user opts out, the application must stop attaching their session to ad events
  4. The ad_consent_log is the audit trail for CCPA opt-out requests
*/

-- ────────────────────────────────────────────────────────────
-- 1. Add targeted_ads_opted_out to profiles
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'targeted_ads_opted_out'
  ) THEN
    ALTER TABLE profiles ADD COLUMN targeted_ads_opted_out boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2. ad_consent_log — tracks every opt-in/opt-out event
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_consent_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opted_out    boolean     NOT NULL,
  source       text        NOT NULL DEFAULT 'settings'
                           CHECK (source IN ('settings', 'cookie_banner', 'registration')),
  ip_address   text,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ad_consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ad consent records"
  ON ad_consent_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Inserts are via service role only (API route) — no authenticated insert policy

-- ────────────────────────────────────────────────────────────
-- 3. ad_impressions — anonymized ad render events
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_impressions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_package_id  uuid,
  session_token  text        NOT NULL,
  page_context   text        NOT NULL DEFAULT '',
  ad_slot        text        NOT NULL DEFAULT '',
  rendered_at    timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

-- No authenticated read policy — analytics accessed via service role only
-- Inserts are via server-side event collection, not direct client writes

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_ad_impressions_package ON ad_impressions(ad_package_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_rendered ON ad_impressions(rendered_at);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_context ON ad_impressions(page_context);

-- ────────────────────────────────────────────────────────────
-- 4. ad_clicks — anonymized click events
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_clicks (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  impression_id  uuid        REFERENCES ad_impressions(id) ON DELETE SET NULL,
  ad_package_id  uuid,
  session_token  text        NOT NULL,
  page_context   text        NOT NULL DEFAULT '',
  clicked_at     timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;

-- No authenticated read policy — analytics accessed via service role only

CREATE INDEX IF NOT EXISTS idx_ad_clicks_impression ON ad_clicks(impression_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_package ON ad_clicks(ad_package_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_clicked ON ad_clicks(clicked_at);
