/*
  # Phase A Step 2: Create company_locations table with full CRUD RLS

  ## Summary
  Creates the company_locations table to store physical locations associated with an
  employer profile. Implements four separate RLS policies per the BUILDREF.md rule:
  SELECT, INSERT, UPDATE, DELETE — no FOR ALL policies.

  ## New Table: company_locations

  ### Columns
  - `id` (uuid, PK) — auto-generated
  - `employer_profile_id` (uuid, FK → employer_profiles.id) — owning employer
  - `name` (text) — location label (e.g. "Downtown Shop", "Main Branch")
  - `address_line1` (text) — street address
  - `address_line2` (text, nullable) — suite/unit/etc.
  - `city` (text) — city
  - `state` (text) — state abbreviation
  - `zip_code` (text, nullable) — postal code
  - `phone` (text, nullable) — location-specific phone
  - `is_active` (boolean, default true) — soft-deactivation flag used by deactivate_company_location RPC
  - `created_at` (timestamptz) — auto
  - `updated_at` (timestamptz) — auto

  ## Security (RLS)
  - RLS enabled immediately in this migration
  - SELECT: authenticated users who own the employer profile OR are a team member of it
    may read all locations; additionally active locations are visible to any authenticated user
    (needed for public browse in later phases)
  - INSERT: owner of the employer_profile_id only (auth.uid() = employer_profiles.user_id)
  - UPDATE: owner of the employer_profile_id only (USING + WITH CHECK)
  - DELETE: owner of the employer_profile_id only (hard delete permitted for owner)

  ## Notes
  1. Ownership is checked by subquery to employer_profiles (no denormalized user_id stored on locations)
  2. Team member read access subquery references company_team_members which is created in the next migration;
     to avoid forward-reference issues the SELECT policy uses EXISTS on employer_profiles only for now —
     team member SELECT access is added as an additive policy in the team_members migration
  3. is_active defaults true; the Phase B deactivate_company_location RPC sets it to false
*/

CREATE TABLE IF NOT EXISTS company_locations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_profile_id uuid NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE,
  name                text NOT NULL DEFAULT '',
  address_line1       text NOT NULL DEFAULT '',
  address_line2       text,
  city                text NOT NULL DEFAULT '',
  state               text NOT NULL DEFAULT '',
  zip_code            text,
  phone               text,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE company_locations ENABLE ROW LEVEL SECURITY;

-- SELECT: owner can read all their locations; any authenticated user can read active locations
CREATE POLICY "Owner can select own company locations"
  ON company_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employer_profiles ep
      WHERE ep.id = company_locations.employer_profile_id
        AND ep.user_id = auth.uid()
    )
    OR is_active = true
  );

-- INSERT: owner only
CREATE POLICY "Owner can insert company locations"
  ON company_locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employer_profiles ep
      WHERE ep.id = company_locations.employer_profile_id
        AND ep.user_id = auth.uid()
    )
  );

-- UPDATE: owner only
CREATE POLICY "Owner can update own company locations"
  ON company_locations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employer_profiles ep
      WHERE ep.id = company_locations.employer_profile_id
        AND ep.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employer_profiles ep
      WHERE ep.id = company_locations.employer_profile_id
        AND ep.user_id = auth.uid()
    )
  );

-- DELETE: owner only (hard delete permitted)
CREATE POLICY "Owner can delete own company locations"
  ON company_locations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employer_profiles ep
      WHERE ep.id = company_locations.employer_profile_id
        AND ep.user_id = auth.uid()
    )
  );
