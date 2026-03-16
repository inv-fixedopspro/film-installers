/*
  # International Expansion Prep — Phase 7

  ## Purpose
  Adds the data infrastructure needed to support EU/UK users and GDPR compliance
  before any international expansion takes place.

  ## Changes

  ### Modified Tables
  - `profiles` — adds `country_code` (text, nullable)
    Stores an ISO 3166-1 alpha-2 country code (e.g. 'US', 'GB', 'DE').
    Populated from CF-IPCountry header at registration or first login.
    Used to serve region-specific privacy notices and GDPR consent flows.

  ### New Tables

  #### dpa_requests
  Data Processing Agreement tracking for employer accounts operating in the EU/UK.
  Under GDPR, when an employer uses the platform to process personal data of EU residents
  (e.g. viewing installer profiles), a DPA is required between the controller (employer)
  and processor (Film Installers).

  Columns:
  - `id` (uuid, PK)
  - `employer_profile_id` (uuid, FK → employer_profiles.id)
  - `user_id` (uuid, FK → auth.users.id) — the account that accepted
  - `accepted_at` (timestamptz) — when they accepted the DPA
  - `dpa_version` (text) — version string of the DPA document accepted
  - `ip_address` (text, nullable) — for audit trail
  - `user_agent` (text, nullable) — for audit trail
  - `company_name` (text) — snapshot of company name at time of acceptance
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on dpa_requests
  - Employers can read their own DPA records (by user_id)
  - Inserts via service role only (API route validates employer profile ownership first)

  ## Notes
  1. country_code is nullable — existing users won't have it set until they log in post-migration
  2. DPA acceptance is only required for EU/UK-based employer accounts
  3. The dpa_requests table is included in personal data exports (user_id present)
*/

-- ────────────────────────────────────────────────────────────
-- 1. Add country_code to profiles
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'country_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN country_code text;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2. dpa_requests — employer DPA acceptance records
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dpa_requests (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_profile_id uuid        REFERENCES employer_profiles(id) ON DELETE CASCADE,
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_at         timestamptz NOT NULL DEFAULT now(),
  dpa_version         text        NOT NULL,
  ip_address          text,
  user_agent          text,
  company_name        text        NOT NULL DEFAULT '',
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dpa_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can view own DPA records"
  ON dpa_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dpa_requests_user ON dpa_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_dpa_requests_employer ON dpa_requests(employer_profile_id);
