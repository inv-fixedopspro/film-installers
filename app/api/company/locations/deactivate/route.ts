import { createAuthRoute } from "@/lib/api/route-wrapper";
import { successResponse, rpcErrorResponse } from "@/lib/api/response";
import { deactivateCompanyLocation } from "@/lib/db/team";
import { deactivateLocationSchema, type DeactivateLocationData } from "@/lib/validations/company";

export const POST = createAuthRoute<DeactivateLocationData>(
  async ({ data, supabase, userId }) => {
    const { data: result, error, errorCode } = await deactivateCompanyLocation(
      supabase,
      userId!,
      data.location_id
    );

    if (error) {
      return rpcErrorResponse(errorCode, error);
    }

    return successResponse({ deactivated: result });
  },
  deactivateLocationSchema
);
