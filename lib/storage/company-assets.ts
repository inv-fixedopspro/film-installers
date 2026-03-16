import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "company-assets";
const SIGNED_URL_TTL_SECONDS = 3600;

export type AssetFolder = "logo" | "banner";

function buildPath(employerProfileId: string, folder: AssetFolder, filename: string): string {
  return `${employerProfileId}/${folder}/${filename}`;
}

function buildFolderPrefix(employerProfileId: string, folder: AssetFolder): string {
  return `${employerProfileId}/${folder}/`;
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

export async function uploadCompanyAsset(
  employerProfileId: string,
  folder: AssetFolder,
  filename: string,
  file: Buffer,
  contentType: string
): Promise<UploadResult> {
  const admin = createAdminClient();
  const path = buildPath(employerProfileId, folder, filename);

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

export async function replaceCompanyAsset(
  employerProfileId: string,
  folder: AssetFolder,
  filename: string,
  file: Buffer,
  contentType: string
): Promise<UploadResult> {
  const admin = createAdminClient();

  await deleteCompanyFolder(employerProfileId, folder);

  return uploadCompanyAsset(employerProfileId, folder, filename, file, contentType);
}

export async function deleteCompanyAsset(
  employerProfileId: string,
  folder: AssetFolder,
  filename: string
): Promise<DeleteResult> {
  const admin = createAdminClient();
  const path = buildPath(employerProfileId, folder, filename);

  const { error } = await admin.storage.from(BUCKET).remove([path]);

  return { error: error?.message ?? null };
}

export async function deleteCompanyFolder(
  employerProfileId: string,
  folder: AssetFolder
): Promise<DeleteResult> {
  const admin = createAdminClient();
  const prefix = buildFolderPrefix(employerProfileId, folder);

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

export async function getSignedUrl(
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

export async function getSignedUrls(
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

export function extractFilenameFromPath(storagePath: string): string {
  const parts = storagePath.split("/");
  return parts[parts.length - 1] ?? "";
}

export function buildStoragePath(
  employerProfileId: string,
  folder: AssetFolder,
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
  return buildPath(employerProfileId, folder, `${sanitized}-${timestamp}.${ext}`);
}
