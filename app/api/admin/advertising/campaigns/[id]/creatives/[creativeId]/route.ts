import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClientWithCookies } from "@/lib/supabase/route-handler";
import { successResponse, errorResponse, ERROR_CODES } from "@/lib/api/response";
import { getCreative, toggleCreativeActive, deleteCreative } from "@/lib/db/ad-creatives";
import { deleteAdCreativeFolder } from "@/lib/storage/ad-creatives";

function extractIds(request: Request): { campaignId: string | null; creativeId: string | null } {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const campaignsIdx = segments.indexOf("campaigns");
  const creativesIdx = segments.indexOf("creatives");

  const campaignId = campaignsIdx >= 0 ? segments[campaignsIdx + 1] : null;
  const creativeId = creativesIdx >= 0 ? segments[creativesIdx + 1] : null;

  return {
    campaignId: campaignId && /^[0-9a-f-]{36}$/i.test(campaignId) ? campaignId : null,
    creativeId: creativeId && /^[0-9a-f-]{36}$/i.test(creativeId) ? creativeId : null,
  };
}

async function verifyAdmin(): Promise<string | null> {
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

export async function PUT(request: NextRequest) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) return errorResponse("Forbidden", 403, ERROR_CODES.FORBIDDEN);

    const { creativeId } = extractIds(request);
    if (!creativeId) return errorResponse("Invalid creative ID", 400);

    const body = await request.json();
    const isActive = typeof body.is_active === "boolean" ? body.is_active : undefined;
    if (isActive === undefined) {
      return errorResponse("is_active (boolean) is required", 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const { data: creative, error } = await toggleCreativeActive(creativeId, isActive);
    if (error) return errorResponse(error, 500);

    return successResponse({ creative });
  } catch (err) {
    console.error("Creative toggle error:", err);
    return errorResponse("An unexpected error occurred", 500, ERROR_CODES.SERVER_ERROR);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) return errorResponse("Forbidden", 403, ERROR_CODES.FORBIDDEN);

    const { campaignId, creativeId } = extractIds(request);
    if (!campaignId || !creativeId) return errorResponse("Invalid IDs", 400);

    const { data: creative } = await getCreative(creativeId);
    if (!creative) return errorResponse("Creative not found", 404);
    if (creative.campaign_id !== campaignId) return errorResponse("Creative does not belong to this campaign", 400);

    await deleteAdCreativeFolder(campaignId, creativeId);

    const { error } = await deleteCreative(creativeId);
    if (error) return errorResponse("Failed to delete creative", 500);

    return successResponse({ deleted: true });
  } catch (err) {
    console.error("Creative delete error:", err);
    return errorResponse("An unexpected error occurred", 500, ERROR_CODES.SERVER_ERROR);
  }
}
