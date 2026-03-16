/*
  # Fix Resume Visibility — Step 1: Add 'visible' enum value

  Adds the `visible` value to the `resume_visibility` enum so it can be
  used in the subsequent migration after this transaction commits.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'resume_visibility'::regtype
      AND enumlabel = 'visible'
  ) THEN
    ALTER TYPE resume_visibility ADD VALUE 'visible';
  END IF;
END $$;
