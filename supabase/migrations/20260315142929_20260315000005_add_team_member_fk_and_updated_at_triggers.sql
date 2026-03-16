/*
  # Phase A Step 5: Add team_member_id FK to profiles + updated_at triggers for all new tables

  ## Summary
  Adds the team_member_id nullable foreign key column to the profiles table, linking a user to
  their company_team_members row when they have an active team profile. Also adds updated_at
  auto-update triggers to all three new tables created in this phase.

  ## Changes

  ### profiles — New Column
  - `team_member_id` (uuid, nullable, FK → company_team_members.id) — points to the user's
    active team membership row; null when the user has no team profile

  ### Updated_at Triggers (new tables)
  - `update_updated_at_column` trigger on `company_locations`
  - `update_updated_at_column` trigger on `company_team_members`
  - `update_updated_at_column` trigger on `company_team_invitations`

  ## Notes
  1. team_member_id is nullable — existing profile rows are unaffected (no NOT NULL constraint)
  2. The FK uses ON DELETE SET NULL so that if a team membership row is deleted, the profiles
     column is automatically cleared rather than blocking the delete
  3. The trigger function is update_updated_at_column (existing in DB from prior migrations)
*/

-- 1. Add team_member_id to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS team_member_id uuid REFERENCES company_team_members(id) ON DELETE SET NULL;

-- 2. Updated_at trigger on company_locations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_updated_at_company_locations'
      AND tgrelid = 'company_locations'::regclass
  ) THEN
    CREATE TRIGGER update_updated_at_company_locations
      BEFORE UPDATE ON company_locations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 3. Updated_at trigger on company_team_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_updated_at_company_team_members'
      AND tgrelid = 'company_team_members'::regclass
  ) THEN
    CREATE TRIGGER update_updated_at_company_team_members
      BEFORE UPDATE ON company_team_members
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 4. Updated_at trigger on company_team_invitations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_updated_at_company_team_invitations'
      AND tgrelid = 'company_team_invitations'::regclass
  ) THEN
    CREATE TRIGGER update_updated_at_company_team_invitations
      BEFORE UPDATE ON company_team_invitations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
