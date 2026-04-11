import { createAdminRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse } from "@/lib/api/response";
import { createCampaign, listCampaigns } from "@/lib/db/ad-campaigns";
import { createCampaignSchema } from "@/lib/validations/advertising";
import type { AdCampaignStatus } from "@/lib/types/database";

export const GET = createAdminRoute(async ({ request }) => {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") as AdCampaignStatus | null;
  const advertiserId = url.searchParams.get("advertiser_id");
  const startAfter = url.searchParams.get("start_after");
  const endBefore = url.searchParams.get("end_before");

  const { data, error } = await listCampaigns({
    status: status ?? undefined,
    advertiserId: advertiserId ?? undefined,
    startAfter: startAfter ?? undefined,
    endBefore: endBefore ?? undefined,
  });

  if (error) return errorResponse("Failed to fetch campaigns", 500);

  return successResponse({ campaigns: data });
});

export const POST = createAdminRoute(async ({ data, userId }) => {
  const { data: campaign, error } = await createCampaign({
    ...data,
    created_by: userId!,
  });

  if (error) return errorResponse(error, 500);

  return successResponse({ campaign }, 201);
}, createCampaignSchema);
