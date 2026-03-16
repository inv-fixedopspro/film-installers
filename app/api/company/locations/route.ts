import { NextRequest } from "next/server";
import { createAuthRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse, rpcErrorResponse, ERROR_CODES } from "@/lib/api/response";
import { addCompanyLocation, updateCompanyLocation, getCompanyLocations } from "@/lib/db/team";
import {
  companyLocationSchema,
  updateCompanyLocationSchema,
  getCompanyLocationsSchema,
  type CompanyLocationData,
  type UpdateCompanyLocationData,
} from "@/lib/validations/company";

export const GET = createAuthRoute(async ({ supabase, userId, request }) => {
  const { searchParams } = new URL(request.url);
  const parsed = getCompanyLocationsSchema.safeParse({
    employer_profile_id: searchParams.get("employer_profile_id") ?? "",
  });

  if (!parsed.success) {
    return errorResponse(
      parsed.error.errors[0]?.message ?? "Invalid parameters",
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  const { data: locations, error, errorCode } = await getCompanyLocations(
    supabase,
    userId!,
    parsed.data.employer_profile_id
  );

  if (error) {
    return rpcErrorResponse(errorCode, error);
  }

  return successResponse({ locations: locations ?? [] });
});

export const POST = createAuthRoute<CompanyLocationData>(
  async ({ data, supabase, userId }) => {
    const { employer_profile_id, ...locationData } = data;

    const { data: location, error, errorCode } = await addCompanyLocation(
      supabase,
      userId!,
      employer_profile_id,
      locationData
    );

    if (error) {
      return rpcErrorResponse(errorCode, error);
    }

    return successResponse({ location }, 201);
  },
  companyLocationSchema
);

export const PUT = createAuthRoute<UpdateCompanyLocationData>(
  async ({ data, supabase, userId }) => {
    const { location_id, ...locationData } = data;

    const { data: location, error, errorCode } = await updateCompanyLocation(
      supabase,
      userId!,
      location_id,
      locationData
    );

    if (error) {
      return rpcErrorResponse(errorCode, error);
    }

    return successResponse({ location });
  },
  updateCompanyLocationSchema
);
