import { createAdminRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse } from "@/lib/api/response";
import { updateSlot } from "@/lib/db/ad-slots";
import { updateSlotSchema } from "@/lib/validations/advertising";

function extractId(request: Request): string | null {
  const segments = new URL(request.url).pathname.split("/");
  const id = segments[segments.length - 1];
  return id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}

export const PUT = createAdminRoute(async ({ request, data }) => {
  const id = extractId(request);
  if (!id) return errorResponse("Invalid slot ID", 400);

  const { id: _bodyId, ...updateData } = data;
  const { data: slot, error } = await updateSlot(id, updateData);
  if (error) return errorResponse(error, 500);

  return successResponse({ slot });
}, updateSlotSchema);
