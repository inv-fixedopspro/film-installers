/*
  # Create User Data Rights Tables

  ## Purpose
  These tables support the user data rights features required by CCPA and PIPEDA:
  - Users can request a download of all their data
  - Users can request permanent deletion of their account

  ## New Tables

  ### deletion_requests
  Tracks account deletion requests. A soft-flag is created first, allowing a 30-day
  grace period before hard deletion. Users can cancel during this window.

  Columns:
  - `id` (uuid, PK) — unique record identifier
  - `user_id` (uuid, FK → auth.users) — the requesting user
  - `requested_at` (timestamptz) — when the request was submitted
  - `scheduled_delete_at` (timestamptz) — 30 days after request; when hard-delete occurs
  - `status` (text) — one of: 'pending', 'cancelled', 'completed'
  - `cancelled_at` (timestamptz, nullable) — when the user cancelled
  - `completed_at` (timestamptz, nullable) — when the deletion was executed
  - `created_at` (timestamptz) — record creation timestamp

  ### data_export_requests
  Tracks requests to download a copy of all personal data. After processing,
  a JSON download URL is stored with a 48-hour expiry.

  Columns:
  - `id` (uuid, PK) — unique record identifier
  - `user_id` (uuid, FK → auth.users) — the requesting user
  - `requested_at` (timestamptz) — when the request was submitted
  - `status` (text) — one of: 'pending', 'processing', 'ready', 'expired', 'failed'
  - `download_url` (text, nullable) — URL to the prepared JSON file
  - `download_expires_at` (timestamptz, nullable) — 48 hours after ready
  - `completed_at` (timestamptz, nullable) — when export was finished
  - `created_at` (timestamptz) — record creation timestamp

  ## Security
  - RLS enabled on both tables
  - Users can only read and insert their own records
  - No delete policies — records are kept for audit trail
  - Updates are not user-facing; status changes happen server-side via service role

  ## Notes
  1. One active deletion request per user enforced at application level
  2. Export requests rate-limited at application level (one per 24h)
  3. Admins can view all records via service role
*/

CREATE TABLE IF NOT EXISTS deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  scheduled_delete_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'completed')),
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deletion requests"
  ON deletion_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deletion requests"
  ON deletion_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending deletion requests"
  ON deletion_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS data_export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'expired', 'failed')),
  download_url text,
  download_expires_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own export requests"
  ON data_export_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own export requests"
  ON data_export_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
