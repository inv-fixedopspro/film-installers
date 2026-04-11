import { createAdminRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse } from "@/lib/api/response";
import { createPackage, listPackages } from "@/lib/db/ad-packages";
import { createPackageSchema } from "@/lib/validations/advertising";

export const GET = createAdminRoute(async ({ request }) => {
  const url = new URL(request.url);
  const activeOnly = url.searchParams.get("active_only") === "true";

  const { data, error } = await listPackages({ activeOnly });
  if (error) return errorResponse("Failed to fetch packages", 500);

  return successResponse({ packages: data });
});

export const POST = createAdminRoute(async ({ data }) => {
  const { data: pkg, error } = await createPackage(data);
  if (error) return errorResponse(error, 500);

  return successResponse({ package: pkg }, 201);
}, createPackageSchema);
