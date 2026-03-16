/*
  # Create consent_log table

  ## Purpose
  Captures a timestamped record of each user's legal consent at the point of registration.
  This fulfills CCPA, PIPEDA, and general compliance requirements by creating an audit trail.

  ## New Tables

  ### consent_log
  - `id` (uuid, primary key) — unique record identifier
  - `user_id` (uuid, FK → auth.users) — the user who consented
  - `terms_version` (text) — version string of the Terms of Service agreed to (e.g. "2026-03-14")
  - `privacy_version` (text) — version string of the Privacy Policy agreed to (e.g. "2026-03-14")
  - `age_confirmed` (boolean) — user confirmed they are 18 or older
  - `cookie_essential` (boolean) — always true; essential cookies are always on
  - `cookie_analytics` (boolean) — user's analytics cookie preference at registration
  - `cookie_advertising` (boolean) — user's advertising cookie preference at registration
  - `ip_address` (text, nullable) — IP address at time of consent (for audit purposes)
  - `user_agent` (text, nullable) — browser user agent at time of consent
  - `created_at` (timestamptz) — timestamp of consent

  ## Security
  - RLS enabled: users can only read their own consent records
  - No update or delete policies: consent records are immutable
  - Inserts are done via service role only (the registration API route)

  ## Notes
  1. Records are append-only — no UPDATE or DELETE policies are created intentionally
  2. The service role (used in API routes) bypasses RLS for inserts
  3. Version strings use ISO date format (YYYY-MM-DD) matching the document effective dates
*/

CREATE TABLE IF NOT EXISTS consent_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version text NOT NULL DEFAULT '',
  privacy_version text NOT NULL DEFAULT '',
  age_confirmed boolean NOT NULL DEFAULT false,
  cookie_essential boolean NOT NULL DEFAULT true,
  cookie_analytics boolean NOT NULL DEFAULT false,
  cookie_advertising boolean NOT NULL DEFAULT false,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consent records"
  ON consent_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
