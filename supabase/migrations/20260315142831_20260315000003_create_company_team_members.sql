/*
  # Phase A Step 3: Create company_team_members table with RLS

  ## Summary
  Creates the company_team_members table which tracks which users are members of a company
  team. The company owner (employer_profiles.user_id) is also stored here as role='owner'.
  Implements four separate RLS policies per the BUILDREF.md rule.

  ## New Table: company_team_members

  ### Columns
  - `id` (uuid, PK) — auto-generated
  - `employer_profile_id` (uuid, FK → employer_profiles.id) — the company this membership belongs to
  - `user_id` (uuid, FK → profiles.id) — the team member's user account
  - `role` (text, check: 'owner'|'member') — member's role on the team
  - `is_active` (boolean, default true) — soft removal flag
  - `joined_at` (timestamptz) — when the member joined
  - `created_at` (timestamptz) — auto
  - `updated_at` (timestamptz) — auto

  ### Constraints
  - UNIQUE (employer_profile_id, user_id) — one membership record per user per company

  ## Security (RLS)
  - SELECT: members can select rows for companies they belong to (self or fellow members);
    owner can see all members of their company
  - INSERT: owner of the employer_profile_id can insert new member rows
  - UPDATE: owner of the employer_profile_id can update member rows (e.g. deactivate)
  - DELETE: owner can delete any member; member can delete their own row (self-leave)

  ## Notes
  1. After this migration, the SELECT policy on company_locations is retroactively extended
     by adding a team member check — done here as an additive policy to avoid forward references
  2. The owner row is inserted atomically by the update_employer_profile RPC in Phase B
*/

CREATE TABLE IF NOT EXISTS company_team_members (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_profile_id uuid NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role                text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  is_active           boolean NOT NULL DEFAULT true,
  joined_at           timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employer_profile_id, user_id)
);

ALTER TABLE company_team_members ENABLE ROW LEVEL SECURITY;

-- SELECT: any active member of the company (including owner) can read all member rows
CREATE POLICY "Team members can select their company members"
  ON company_team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_team_members ctm
      WHERE ctm.employer_profile_id = company_team_members.employer_profile_id
        AND ctm.user_id = auth.uid()
        AND ctm.is_active = true
    )
  );

-- INSERT: owner of the employer profile can add new members
CREATE POLICY "Owner can insert company team members"
  ON company_team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employer_profiles ep
      WHERE ep.id = company_team_members.employer_profile_id
        AND ep.user_id = auth.uid()
    )
  );

-- UPDATE: owner of the employer profile can update member rows
CREATE POLICY "Owner can update company team members"
  ON company_team_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employer_profiles ep
      WHERE ep.id = company_team_members.employer_profile_id
        AND ep.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employer_profiles ep
      WHERE ep.id = company_team_members.employer_profile_id
        AND ep.user_id = auth.uid()
    )
  );

-- DELETE: owner can remove any member; member can remove themselves (self-leave)
CREATE POLICY "Owner or self can delete team member rows"
  ON company_team_members FOR DELETE
  TO authenticated
  USING (
    company_team_members.user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM employer_profiles ep
      WHERE ep.id = company_team_members.employer_profile_id
        AND ep.user_id = auth.uid()
    )
  );

-- Additive SELECT policy on company_locations for team members
-- Now that company_team_members exists, team members can also read all locations for their company
CREATE POLICY "Team members can select company locations"
  ON company_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_team_members ctm
      WHERE ctm.employer_profile_id = company_locations.employer_profile_id
        AND ctm.user_id = auth.uid()
        AND ctm.is_active = true
    )
  );
