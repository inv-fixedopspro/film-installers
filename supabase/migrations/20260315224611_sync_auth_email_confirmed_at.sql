/*
  # Sync auth.users email_confirmed_at for existing users

  ## Purpose
  Removes the dual email verification system conflict. Going forward, `email_confirm: true`
  is used at registration so Supabase does not enforce its own email confirmation gate.
  The sole source of truth for email verification is `profiles.email_verified_at`.

  ## What This Migration Does
  - Sets `auth.users.email_confirmed_at = now()` for all users where it is currently NULL
  - This is a one-time sync to unblock any existing users who registered before this fix
  - Users who have not yet verified via the custom system are still correctly gated by
    the `profiles.email_verified_at` check in the login route handler
  - No data is deleted, no columns are dropped, no behavior changes for already-verified users

  ## Why This Is Safe
  - `auth.users.email_confirmed_at` is no longer the enforcement point — the login route
    checks `profiles.email_verified_at` exclusively
  - Setting this field to now() on unverified auth records only removes Supabase's redundant
    gate; it does not grant any access to users who have not completed custom verification
*/

UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;
