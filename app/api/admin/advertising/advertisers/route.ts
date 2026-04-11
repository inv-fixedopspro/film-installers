import { createAdminRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse } from "@/lib/api/response";
import { createAdvertiser, listAdvertisers } from "@/lib/db/ad-advertisers";
import { createAdvertiserSchema } from "@/lib/validations/advertising";

export const GET = createAdminRoute(async ({ request }) => {
  const url = new URL(request.url);
  const activeOnly = url.searchParams.get("active_only") === "true";

  const { data, error } = await listAdvertisers({ activeOnly });
  if (error) return errorResponse("Failed to fetch advertisers", 500);

  return successResponse({ advertisers: data });
});

export const POST = createAdminRoute(async ({ data }) => {
  const { data: advertiser, error } = await createAdvertiser(data);
  if (error) return errorResponse(error, 500);

  return successResponse({ advertiser }, 201);
}, createAdvertiserSchema);
