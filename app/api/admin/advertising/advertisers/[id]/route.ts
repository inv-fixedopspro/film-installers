import { createAdminRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse } from "@/lib/api/response";
import { getAdvertiser, updateAdvertiser } from "@/lib/db/ad-advertisers";
import { updateAdvertiserSchema } from "@/lib/validations/advertising";

function extractId(request: Request): string | null {
  const segments = new URL(request.url).pathname.split("/");
  const id = segments[segments.length - 1];
  return id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}

export const GET = createAdminRoute(async ({ request }) => {
  const id = extractId(request);
  if (!id) return errorResponse("Invalid advertiser ID", 400);

  const { data, error } = await getAdvertiser(id);
  if (error) return errorResponse("Failed to fetch advertiser", 500);
  if (!data) return errorResponse("Advertiser not found", 404);

  return successResponse({ advertiser: data });
});

export const PUT = createAdminRoute(async ({ request, data }) => {
  const id = extractId(request);
  if (!id) return errorResponse("Invalid advertiser ID", 400);

  const { id: _bodyId, ...updateData } = data;
  const { data: advertiser, error } = await updateAdvertiser(id, updateData);
  if (error) return errorResponse(error, 500);

  return successResponse({ advertiser });
}, updateAdvertiserSchema);
