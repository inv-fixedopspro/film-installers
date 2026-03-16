/*
  # Add is_distributor to employer_profiles

  ## Summary
  Adds a new boolean flag `is_distributor` to `employer_profiles` to identify
  companies whose primary business is selling or distributing film, supplies,
  or materials. This is distinct from `is_vendor` (companies that provide
  services at client locations without a fixed storefront).

  ## Changes
  - `employer_profiles`: Added `is_distributor` boolean column (default false)

  ## Usage
  - `is_vendor` = B2B service company working at client locations (no storefront); relevant to job listings
  - `is_distributor` = Company that sells/distributes film or supplies as their core business; relevant to
    marketplace to distinguish professional distributors from individuals selling personal stock
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employer_profiles' AND column_name = 'is_distributor'
  ) THEN
    ALTER TABLE employer_profiles ADD COLUMN is_distributor boolean NOT NULL DEFAULT false;
  END IF;
END $$;
