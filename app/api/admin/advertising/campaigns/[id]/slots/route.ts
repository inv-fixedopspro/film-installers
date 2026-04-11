import { createAdminRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse } from "@/lib/api/response";
import { assignCampaignToSlot, removeCampaignFromSlot } from "@/lib/db/ad-campaign-slots";
import { slotAssignmentSchema, slotRemovalSchema } from "@/lib/validations/advertising";

function extractCampaignId(request: Request): string | null {
  const segments = new URL(request.url).pathname.split("/");
  const campaignsIdx = segments.indexOf("campaigns");
  const id = campaignsIdx >= 0 ? segments[campaignsIdx + 1] : null;
  return id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}

export const POST = createAdminRoute(async ({ request, data }) => {
  const campaignId = extractCampaignId(request);
  if (!campaignId) return errorResponse("Invalid campaign ID", 400);

  const { data: assignment, error } = await assignCampaignToSlot(
    campaignId,
    data.ad_slot_id
  );

  if (error) {
    if (error.includes("duplicate") || error.includes("unique")) {
      return errorResponse("Campaign is already assigned to this slot", 409);
    }
    return errorResponse(error, 500);
  }

  return successResponse({ assignment }, 201);
}, slotAssignmentSchema);

export const DELETE = createAdminRoute(async ({ request, data }) => {
  const campaignId = extractCampaignId(request);
  if (!campaignId) return errorResponse("Invalid campaign ID", 400);

  const { error } = await removeCampaignFromSlot(campaignId, data.ad_slot_id);
  if (error) return errorResponse(error, 500);

  return successResponse({ removed: true });
}, slotRemovalSchema);
