/*
  # Drop PDF columns from installer_resumes

  ## Summary
  Removes the two PDF export tracking columns from the installer_resumes table now that
  the PDF generation feature has been removed from the application.

  ## Changes
  - `installer_resumes`
    - DROP COLUMN `pdf_storage_path` (previously stored the Supabase Storage path to the generated PDF)
    - DROP COLUMN `pdf_generated_at` (previously tracked when the PDF was last generated)

  ## Notes
  - This is a safe operation; no foreign keys or policies reference these columns
  - Any existing non-null values in these columns are discarded (no data of ongoing use)
*/

ALTER TABLE installer_resumes DROP COLUMN IF EXISTS pdf_storage_path;
ALTER TABLE installer_resumes DROP COLUMN IF EXISTS pdf_generated_at;
