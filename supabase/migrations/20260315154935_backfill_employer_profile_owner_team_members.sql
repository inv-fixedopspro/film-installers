/*
  # Backfill Missing Owner Rows in company_team_members

  ## Summary
  Some employer profiles were created before the Phase B migration added the
  company_team_members table. This migration inserts the missing "owner" rows
  for any employer profile that does not already have one, and updates the
  corresponding profile's team_member_id foreign key.

  ## Changes

  ### Backfill
  - For each employer_profile that has no corresponding owner row in
    company_team_members, insert a new owner row with role='owner', is_active=true
  - Update the owning user's profiles.team_member_id to point at the new row

  ## Notes
  - Safe to run multiple times (uses NOT EXISTS guard)
  - Does not touch profiles that already have a team_member_id set
*/

DO $$
DECLARE
  r RECORD;
  v_team_member_id uuid;
BEGIN
  FOR r IN
    SELECT ep.id AS employer_profile_id, ep.user_id
    FROM employer_profiles ep
    WHERE NOT EXISTS (
      SELECT 1 FROM company_team_members ctm
      WHERE ctm.employer_profile_id = ep.id
        AND ctm.user_id = ep.user_id
        AND ctm.role = 'owner'
    )
  LOOP
    INSERT INTO company_team_members (employer_profile_id, user_id, role, is_active)
    VALUES (r.employer_profile_id, r.user_id, 'owner', true)
    RETURNING id INTO v_team_member_id;

    UPDATE profiles
    SET team_member_id = v_team_member_id
    WHERE id = r.user_id
      AND team_member_id IS NULL;
  END LOOP;
END $$;
