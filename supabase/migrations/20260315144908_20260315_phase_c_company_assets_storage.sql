/*
  # Phase C: company-assets Storage Bucket and RLS Policies

  ## Summary
  Creates the `company-assets` private Supabase Storage bucket and applies
  Row Level Security policies scoped to the employer profile owner.

  ## Bucket Structure
  - `/{employer_profile_id}/logo/{filename}` — company logo images
  - `/{employer_profile_id}/banner/{filename}` — company banner images

  ## Security
  All policies check that:
  1. The caller is authenticated (`auth.uid() IS NOT NULL`)
  2. The employer_profile_id segment in the storage path belongs to an
     `employer_profiles` row where `user_id = auth.uid()`

  The path segment is extracted from `name` using `split_part(name, '/', 1)`,
  which yields the UUID folder name — the employer_profile_id.

  ## Notes
  1. Bucket is private (public = false) — all reads require signed URLs
  2. Only the employer owner can upload, replace, and delete their own assets
  3. SELECT (read) is also owner-only since all delivery goes through signed URLs
     generated server-side by the admin client
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Owner can view own company assets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'company-assets'
    AND EXISTS (
      SELECT 1 FROM public.employer_profiles ep
      WHERE ep.id::text = split_part(name, '/', 1)
        AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can upload own company assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-assets'
    AND EXISTS (
      SELECT 1 FROM public.employer_profiles ep
      WHERE ep.id::text = split_part(name, '/', 1)
        AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can update own company assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company-assets'
    AND EXISTS (
      SELECT 1 FROM public.employer_profiles ep
      WHERE ep.id::text = split_part(name, '/', 1)
        AND ep.user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'company-assets'
    AND EXISTS (
      SELECT 1 FROM public.employer_profiles ep
      WHERE ep.id::text = split_part(name, '/', 1)
        AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can delete own company assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-assets'
    AND EXISTS (
      SELECT 1 FROM public.employer_profiles ep
      WHERE ep.id::text = split_part(name, '/', 1)
        AND ep.user_id = auth.uid()
    )
  );
