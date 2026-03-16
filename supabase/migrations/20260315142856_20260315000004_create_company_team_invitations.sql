/*
  # Phase A Step 4: Create company_team_invitations table with RLS

  ## Summary
  Creates the company_team_invitations table to track pending invitations sent by company
  owners to prospective team members. Implements four separate RLS policies per the BUILDREF.md
  rule (SELECT, INSERT, UPDATE, DELETE — no FOR ALL).

  ## New Table: company_team_invitations

  ### Columns
  - `id` (uuid, PK) — auto-generated
  - `employer_profile_id` (uuid, FK → employer_profiles.id) — the company sending the invitation
  - `invited_by` (uuid, FK → profiles.id) — the user (owner) who sent the invitation
  - `email` (text) — email address of the invited person
  - `token` (text, unique) — secure random token used in the invite link
  - `status` (text, check: 'pending'|'accepted'|'expired'|'revoked') — lifecycle state
  - `expires_at` (timestamptz) — when the token expires (7 days from creation)
  - `accepted_at` (timestamptz, nullable) — when the invitation was accepted
  - `created_at` (timestamptz) — auto
  - `updated_at` (timestamptz) — auto

  ## Security (RLS)
  - SELECT: owner of the employer_profile_id can read all invitations for their company;
    the invited user can read their own invitation by matching auth.email() to the invitation email
  - INSERT: owner of the employer_profile_id only
  - UPDATE: owner of the employer_profile_id can update (revoke, etc.);
    also needed for the accept flow (handled via RPC with service role — but policy allows owner updates)
  - DELETE: owner of the employer_profile_id only

  ## Notes
  1. The accept_team_invitation RPC (Phase B) runs with elevated privileges to update status
     to 'accepted' — the UPDATE policy covers owner-initiated updates; RPC uses security definer
  2. Token lookup for the invitation accept page is done via RPC (no direct table SELECT by token
     for unauthenticated users — the accept page requires auth first)
  3. status check constraint uses text values matching the TypeScript type defined in Phase F
*/

CREATE TABLE IF NOT EXISTS company_team_invitations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_profile_id uuid NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE,
  invited_by          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email               text NOT NULL,
  token               text NOT NULL UNIQUE,
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at          timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE company_team_invitations ENABLE ROW LEVEL SECURITY;

-- SELECT: owner of the company can read all invitations;
--         invited user can read their own invitation (matched by email)
CREATE POLICY "Owner can select company team invitations"
  ON company_team_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employer_profiles ep
      WHERE ep.id = company_team_invitations.employer_profile_id
        AND ep.user_id = auth.uid()
    )
    OR (
      company_team_invitations.email = (
        SELECT p.email FROM profiles p WHERE p.id = auth.uid()
      )
    )
  );

-- INSERT: owner of the employer profile only
CREATE POLICY "Owner can insert company team invitations"
  ON company_team_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employer_profiles ep
      WHERE ep.id = company_team_invitations.employer_profile_id
        AND ep.user_id = auth.uid()
    )
  );

-- UPDATE: owner can update invitations (revoke, etc.)
CREATE POLICY "Owner can update company team invitations"
  ON company_team_invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employer_profiles ep
      WHERE ep.id = company_team_invitations.employer_profile_id
        AND ep.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employer_profiles ep
      WHERE ep.id = company_team_invitations.employer_profile_id
        AND ep.user_id = auth.uid()
    )
  );

-- DELETE: owner can delete invitations
CREATE POLICY "Owner can delete company team invitations"
  ON company_team_invitations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employer_profiles ep
      WHERE ep.id = company_team_invitations.employer_profile_id
        AND ep.user_id = auth.uid()
    )
  );
