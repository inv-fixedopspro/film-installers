import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "ad-creatives";
const SIGNED_URL_TTL_SECONDS = 3600;

function buildPath(campaignId: string, creativeId: string, filename: string): string {
  return `${campaignId}/${creativeId}/${filename}`;
}

function buildFolderPrefix(campaignId: string, creativeId: string): string {
  return `${campaignId}/${creativeId}/`;
}

export interface UploadResult {
  path: string;
  error: string | null;
}

export interface DeleteResult {
  error: string | null;
}

export interface SignedUrlResult {
  signedUrl: string | null;
  error: string | null;
}

export async function uploadAdCreative(
  campaignId: string,
  creativeId: string,
  filename: string,
  file: Buffer,
  contentType: string
): Promise<UploadResult> {
  const admin = createAdminClient();
  const path = buildPath(campaignId, creativeId, filename);

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    return { path: "", error: error.message };
  }

  return { path, error: null };
}

export async function replaceAdCreative(
  campaignId: string,
  creativeId: string,
  filename: string,
  file: Buffer,
  contentType: string
): Promise<UploadResult> {
  await deleteAdCreativeFolder(campaignId, creativeId);
  return uploadAdCreative(campaignId, creativeId, filename, file, contentType);
}

export async function deleteAdCreative(storagePath: string): Promise<DeleteResult> {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).remove([storagePath]);
  return { error: error?.message ?? null };
}

export async function deleteAdCreativeFolder(
  campaignId: string,
  creativeId: string
): Promise<DeleteResult> {
  const admin = createAdminClient();
  const prefix = buildFolderPrefix(campaignId, creativeId);

  const { data: files, error: listError } = await admin.storage
    .from(BUCKET)
    .list(prefix.replace(/\/$/, ""), { limit: 100 });

  if (listError) {
    return { error: listError.message };
  }

  if (!files || files.length === 0) {
    return { error: null };
  }

  const paths = files.map((f) => `${prefix}${f.name}`);
  const { error: removeError } = await admin.storage.from(BUCKET).remove(paths);

  return { error: removeError?.message ?? null };
}

export async function deleteCampaignCreatives(campaignId: string): Promise<DeleteResult> {
  const admin = createAdminClient();

  const { data: folders, error: listError } = await admin.storage
    .from(BUCKET)
    .list(campaignId, { limit: 1000 });

  if (listError) {
    return { error: listError.message };
  }

  if (!folders || folders.length === 0) {
    return { error: null };
  }

  const allPaths: string[] = [];
  for (const folder of folders) {
    const { data: files } = await admin.storage
      .from(BUCKET)
      .list(`${campaignId}/${folder.name}`, { limit: 100 });

    if (files) {
      for (const file of files) {
        allPaths.push(`${campaignId}/${folder.name}/${file.name}`);
      }
    }
  }

  if (allPaths.length === 0) {
    return { error: null };
  }

  const { error: removeError } = await admin.storage.from(BUCKET).remove(allPaths);
  return { error: removeError?.message ?? null };
}

export async function getAdCreativeSignedUrl(
  storagePath: string,
  ttlSeconds = SIGNED_URL_TTL_SECONDS
): Promise<SignedUrlResult> {
  const admin = createAdminClient();

  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, ttlSeconds);

  if (error || !data?.signedUrl) {
    return { signedUrl: null, error: error?.message ?? "Failed to generate signed URL" };
  }

  return { signedUrl: data.signedUrl, error: null };
}

export async function getAdCreativeSignedUrls(
  paths: string[],
  ttlSeconds = SIGNED_URL_TTL_SECONDS
): Promise<{ path: string; signedUrl: string | null }[]> {
  if (paths.length === 0) return [];

  const admin = createAdminClient();

  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrls(paths, ttlSeconds);

  if (error || !data) {
    return paths.map((path) => ({ path, signedUrl: null }));
  }

  return data.map((item) => ({
    path: item.path ?? "",
    signedUrl: item.signedUrl ?? null,
  }));
}

export function buildAdCreativeStoragePath(
  campaignId: string,
  creativeId: string,
  originalFilename: string
): string {
  const ext = originalFilename.split(".").pop()?.toLowerCase() ?? "jpg";
  const sanitized = originalFilename
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-{2,}/g, "-")
    .substring(0, 40);
  const timestamp = Date.now();
  return buildPath(campaignId, creativeId, `${sanitized}-${timestamp}.${ext}`);
}
