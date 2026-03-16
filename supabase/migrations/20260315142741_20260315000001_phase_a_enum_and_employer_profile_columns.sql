/*
  # Phase A Step 1: Add 'team' to profile_type enum + new employer_profiles columns

  ## Summary
  This migration extends the profile_type enum to support team members, adds new branding
  and company metadata columns to employer_profiles, and makes location_count nullable
  (soft change — no drops).

  ## Changes

  ### Enum Updates
  - `profile_type` enum: adds 'team' value (used for users who are members of a company team
    without being the owner/employer)

  ### employer_profiles — New Columns (all additive, no drops)
  - `company_slug` (text, unique, nullable) — URL-friendly identifier auto-generated from company_name
  - `company_description` (text, nullable) — free-text description of the company
  - `website_url` (text, nullable) — company website URL
  - `logo_storage_path` (text, nullable) — path to logo in company-assets storage bucket
  - `banner_storage_path` (text, nullable) — path to banner image in company-assets storage bucket
  - `social_links` (jsonb, nullable) — structured social media links (linkedin, instagram, etc.)
  - `is_vendor` (boolean, default false) — marks company as a product/service vendor

  ### employer_profiles — Modified Columns
  - `location_count` (text) → now nullable (no removal, soft pattern)

  ## Security
  - No new tables in this migration; RLS changes are not required here
  - Existing RLS policies on employer_profiles remain in force

  ## Notes
  1. All new columns are nullable to avoid breaking existing rows
  2. company_slug has a unique constraint but is nullable (null does not violate unique)
  3. The 'team' enum value is added with ALTER TYPE ... ADD VALUE IF NOT EXISTS
     which is safe and idempotent
  4. location_count nullable change uses ALTER COLUMN ... DROP NOT NULL
*/

-- 1. Add 'team' to the profile_type enum
ALTER TYPE profile_type ADD VALUE IF NOT EXISTS 'team';

-- 2. Add new columns to employer_profiles
ALTER TABLE employer_profiles
  ADD COLUMN IF NOT EXISTS company_slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS company_description text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS logo_storage_path text,
  ADD COLUMN IF NOT EXISTS banner_storage_path text,
  ADD COLUMN IF NOT EXISTS social_links jsonb,
  ADD COLUMN IF NOT EXISTS is_vendor boolean NOT NULL DEFAULT false;

-- 3. Make location_count nullable
ALTER TABLE employer_profiles
  ALTER COLUMN location_count DROP NOT NULL;
