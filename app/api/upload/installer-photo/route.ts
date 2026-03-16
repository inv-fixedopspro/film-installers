import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClientWithCookies } from "@/lib/supabase/route-handler";
import { successResponse, errorResponse, ERROR_CODES } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "company-assets";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveAuth(request: NextRequest): Promise<{ userId: string | null }> {
  const cookieStore = await cookies();
  const { supabase } = createRouteHandlerClientWithCookies(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  return { userId: user?.id ?? null };
}

async function verifyInstallerOwnership(userId: string, installerProfileId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("installer_profiles")
    .select("id")
    .eq("id", installerProfileId)
    .eq("user_id", userId)
    .maybeSingle();
  return data !== null;
}

function buildInstallerPhotoPath(installerProfileId: string, filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const timestamp = Date.now();
  return `installer-profiles/${installerProfileId}/photo/photo-${timestamp}.${ext}`;
}

async function clearInstallerPhotoFolder(installerProfileId: string): Promise<void> {
  const admin = createAdminClient();
  const prefix = `installer-profiles/${installerProfileId}/photo`;
  const { data: files } = await admin.storage.from(BUCKET).list(prefix, { limit: 100 });
  if (files && files.length > 0) {
    const paths = files.map((f) => `${prefix}/${f.name}`);
    await admin.storage.from(BUCKET).remove(paths);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await resolveAuth(request);
    if (!userId) return errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const installerProfileId = formData.get("installer_profile_id") as string | null;

    if (!file || !installerProfileId) {
      return errorResponse("Missing required fields", 400, ERROR_CODES.VALIDATION_ERROR);
    }
    if (!UUID_RE.test(installerProfileId)) {
      return errorResponse("Invalid installer profile ID", 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      return errorResponse("Unsupported file type. Use JPEG, PNG, or WebP.", 400, ERROR_CODES.VALIDATION_ERROR);
    }
    if (file.size > 5 * 1024 * 1024) {
      return errorResponse("File too large. Maximum size is 5MB.", 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const isOwner = await verifyInstallerOwnership(userId, installerProfileId);
    if (!isOwner) return errorResponse("Forbidden", 403, ERROR_CODES.FORBIDDEN);

    await clearInstallerPhotoFolder(installerProfileId);

    const storagePath = buildInstallerPhotoPath(installerProfileId, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const admin = createAdminClient();

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: true });

    if (uploadError) return errorResponse("Upload failed", 500, ERROR_CODES.SERVER_ERROR);

    await admin
      .from("installer_profiles")
      .update({ photo_storage_path: storagePath })
      .eq("id", installerProfileId)
      .eq("user_id", userId);

    return successResponse({ storage_path: storagePath });
  } catch (err) {
    console.error("Installer photo upload error:", err);
    return errorResponse("An unexpected error occurred", 500, ERROR_CODES.SERVER_ERROR);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await resolveAuth(request);
    if (!userId) return errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);

    const body = await request.json();
    const installerProfileId = body?.installer_profile_id as string | undefined;

    if (!installerProfileId || !UUID_RE.test(installerProfileId)) {
      return errorResponse("Invalid installer_profile_id", 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const isOwner = await verifyInstallerOwnership(userId, installerProfileId);
    if (!isOwner) return errorResponse("Forbidden", 403, ERROR_CODES.FORBIDDEN);

    await clearInstallerPhotoFolder(installerProfileId);

    const admin = createAdminClient();
    await admin
      .from("installer_profiles")
      .update({ photo_storage_path: null })
      .eq("id", installerProfileId)
      .eq("user_id", userId);

    return successResponse({ removed: true });
  } catch (err) {
    console.error("Installer photo delete error:", err);
    return errorResponse("An unexpected error occurred", 500, ERROR_CODES.SERVER_ERROR);
  }
}
