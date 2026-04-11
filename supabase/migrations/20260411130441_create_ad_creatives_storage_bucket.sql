/*
  # Ad Creatives Storage Bucket

  ## Summary
  Creates the `ad-creatives` private Supabase Storage bucket for ad campaign
  creative images (banners, leaderboards, sidebar ads, etc.).

  ## Bucket Configuration
  - Private (not public) -- all reads require signed URLs generated server-side
  - 2MB file size limit (2,097,152 bytes)
  - Allowed MIME types: JPEG, PNG, WebP, GIF only (no video)

  ## Bucket Structure
  - `/{campaign_id}/{creative_id}/{filename}` -- organized by campaign and creative

  ## Security
  - No authenticated user RLS policies are created
  - All operations (upload, read, delete) go through the service role admin client
  - This ensures only admin actions can manage ad creatives
  - The default RLS on storage.objects blocks all non-service-role access
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ad-creatives',
  'ad-creatives',
  false,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
