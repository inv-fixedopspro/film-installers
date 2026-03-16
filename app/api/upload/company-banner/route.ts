import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClientWithCookies } from "@/lib/supabase/route-handler";
import { successResponse, errorResponse, ERROR_CODES } from "@/lib/api/response";
import { replaceCompanyAsset, deleteCompanyFolder, buildStoragePath } from "@/lib/storage/company-assets";
import { createAdminClient } from "@/lib/supabase/admin";

async function resolveAuth(request: NextRequest): Promise<{ userId: string | null }> {
  const cookieStore = await cookies();
  const { supabase } = createRouteHandlerClientWithCookies(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  return { userId: user?.id ?? null };
}

async function verifyProfileOwnership(userId: string, employerProfileId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("employer_profiles")
    .select("id")
    .eq("id", employerProfileId)
    .eq("user_id", userId)
    .maybeSingle();
  return data !== null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await resolveAuth(request);
    if (!userId) return errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const employerProfileId = formData.get("employer_profile_id") as string | null;

    if (!file || !employerProfileId) {
      return errorResponse("Missing required fields", 400, ERROR_CODES.VALIDATION_ERROR);
    }
    if (!UUID_RE.test(employerProfileId)) {
      return errorResponse("Invalid employer profile ID", 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      return errorResponse("Unsupported file type. Use JPEG, PNG, or WebP.", 400, ERROR_CODES.VALIDATION_ERROR);
    }
    if (file.size > 5 * 1024 * 1024) {
      return errorResponse("File too large. Maximum size is 5MB.", 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const isOwner = await verifyProfileOwnership(userId, employerProfileId);
    if (!isOwner) return errorResponse("Forbidden", 403, ERROR_CODES.FORBIDDEN);

    const storagePath = buildStoragePath(employerProfileId, "banner", file.name);
    const filename = storagePath.split("/").pop()!;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { path, error: uploadError } = await replaceCompanyAsset(
      employerProfileId,
      "banner",
      filename,
      buffer,
      file.type
    );
    if (uploadError) return errorResponse("Upload failed", 500, ERROR_CODES.SERVER_ERROR);

    const admin = createAdminClient();
    await admin
      .from("employer_profiles")
      .update({ banner_storage_path: path })
      .eq("id", employerProfileId)
      .eq("user_id", userId);

    return successResponse({ storage_path: path });
  } catch (err) {
    console.error("Banner upload error:", err);
    return errorResponse("An unexpected error occurred", 500, ERROR_CODES.SERVER_ERROR);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await resolveAuth(request);
    if (!userId) return errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);

    const body = await request.json();
    const employerProfileId = body?.employer_profile_id as string | undefined;

    if (!employerProfileId || !UUID_RE.test(employerProfileId)) {
      return errorResponse("Invalid employer_profile_id", 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const isOwner = await verifyProfileOwnership(userId, employerProfileId);
    if (!isOwner) return errorResponse("Forbidden", 403, ERROR_CODES.FORBIDDEN);

    const { error: deleteError } = await deleteCompanyFolder(employerProfileId, "banner");
    if (deleteError) return errorResponse("Delete failed", 500, ERROR_CODES.SERVER_ERROR);

    const admin = createAdminClient();
    await admin
      .from("employer_profiles")
      .update({ banner_storage_path: null })
      .eq("id", employerProfileId)
      .eq("user_id", userId);

    return successResponse({ removed: true });
  } catch (err) {
    console.error("Banner delete error:", err);
    return errorResponse("An unexpected error occurred", 500, ERROR_CODES.SERVER_ERROR);
  }
}
