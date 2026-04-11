import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClientWithCookies } from "@/lib/supabase/route-handler";
import { successResponse, errorResponse, ERROR_CODES } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCreative, listCreativesByCampaign } from "@/lib/db/ad-creatives";
import { getCampaign } from "@/lib/db/ad-campaigns";
import { getPackage } from "@/lib/db/ad-packages";
import { uploadAdCreative, buildAdCreativeStoragePath } from "@/lib/storage/ad-creatives";
import { getAdCreativeSignedUrls } from "@/lib/storage/ad-creatives";
import { AD_SLOT_DIMENSIONS, AD_ALLOWED_FORMATS, AD_MAX_FILE_SIZE_BYTES } from "@/lib/constants/ad-system";
import type { AdSlotType } from "@/lib/types/database";

function extractCampaignId(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const campaignsIdx = segments.indexOf("campaigns");
  const id = campaignsIdx >= 0 ? segments[campaignsIdx + 1] : null;
  return id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}

async function verifyAdmin(request: NextRequest): Promise<string | null> {
  const cookieStore = await cookies();
  const { supabase } = createRouteHandlerClientWithCookies(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  return profile?.role === "admin" ? user.id : null;
}

export async function GET(request: NextRequest) {
  try {
    const adminId = await verifyAdmin(request);
    if (!adminId) return errorResponse("Forbidden", 403, ERROR_CODES.FORBIDDEN);

    const campaignId = extractCampaignId(request);
    if (!campaignId) return errorResponse("Invalid campaign ID", 400);

    const { data: creatives, error } = await listCreativesByCampaign(campaignId);
    if (error) return errorResponse("Failed to fetch creatives", 500);

    if (creatives.length > 0) {
      const paths = creatives.map((c) => c.image_storage_path);
      const signedUrls = await getAdCreativeSignedUrls(paths);
      const urlMap = new Map(signedUrls.map((u) => [u.path, u.signedUrl]));

      const withUrls = creatives.map((c) => ({
        ...c,
        image_url: urlMap.get(c.image_storage_path) ?? null,
      }));

      return successResponse({ creatives: withUrls });
    }

    return successResponse({ creatives });
  } catch (err) {
    console.error("Creatives GET error:", err);
    return errorResponse("An unexpected error occurred", 500, ERROR_CODES.SERVER_ERROR);
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = await verifyAdmin(request);
    if (!adminId) return errorResponse("Forbidden", 403, ERROR_CODES.FORBIDDEN);

    const campaignId = extractCampaignId(request);
    if (!campaignId) return errorResponse("Invalid campaign ID", 400);

    const { data: campaign, error: campErr } = await getCampaign(campaignId);
    if (campErr || !campaign) return errorResponse("Campaign not found", 404);

    const { data: pkg } = await getPackage(campaign.ad_package_id);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const slotType = formData.get("slot_type") as AdSlotType | null;
    const destinationUrl = formData.get("destination_url") as string | null;
    const label = (formData.get("label") as string) ?? "";
    const altText = (formData.get("alt_text") as string) ?? "";

    if (!file) return errorResponse("File is required", 400, ERROR_CODES.VALIDATION_ERROR);
    if (!slotType) return errorResponse("slot_type is required", 400, ERROR_CODES.VALIDATION_ERROR);
    if (!destinationUrl) return errorResponse("destination_url is required", 400, ERROR_CODES.VALIDATION_ERROR);

    const validSlotTypes = Object.keys(AD_SLOT_DIMENSIONS);
    if (!validSlotTypes.includes(slotType)) {
      return errorResponse(`Invalid slot_type. Must be one of: ${validSlotTypes.join(", ")}`, 400);
    }

    if (!AD_ALLOWED_FORMATS.includes(file.type as typeof AD_ALLOWED_FORMATS[number])) {
      return errorResponse("Unsupported file type. Use JPEG, PNG, WebP, or GIF.", 400, ERROR_CODES.VALIDATION_ERROR);
    }
    if (file.size > AD_MAX_FILE_SIZE_BYTES) {
      return errorResponse("File too large. Maximum size is 2MB.", 400, ERROR_CODES.VALIDATION_ERROR);
    }

    try {
      new URL(destinationUrl);
    } catch {
      return errorResponse("Invalid destination URL", 400, ERROR_CODES.VALIDATION_ERROR);
    }

    if (pkg) {
      const existing = await listCreativesByCampaign(campaignId);
      if (existing.data.length >= pkg.max_creatives) {
        return errorResponse(
          `Maximum creatives reached (${pkg.max_creatives} allowed for this package)`,
          400
        );
      }
    }

    const dims = AD_SLOT_DIMENSIONS[slotType];
    const creativeId = crypto.randomUUID();
    const storagePath = buildAdCreativeStoragePath(campaignId, creativeId, file.name);
    const filename = storagePath.split("/").pop()!;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { path, error: uploadError } = await uploadAdCreative(
      campaignId,
      creativeId,
      filename,
      buffer,
      file.type
    );
    if (uploadError) return errorResponse("Upload failed", 500, ERROR_CODES.SERVER_ERROR);

    const { data: creative, error: dbError } = await createCreative({
      campaign_id: campaignId,
      label,
      image_storage_path: path,
      destination_url: destinationUrl,
      alt_text: altText,
      slot_type: slotType,
      width_px: dims.width,
      height_px: dims.height,
      file_size_bytes: file.size,
    });

    if (dbError) return errorResponse("Failed to save creative", 500, ERROR_CODES.SERVER_ERROR);

    return successResponse({ creative }, 201);
  } catch (err) {
    console.error("Creative upload error:", err);
    return errorResponse("An unexpected error occurred", 500, ERROR_CODES.SERVER_ERROR);
  }
}
