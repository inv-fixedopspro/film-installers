import { createAuthRoute, successResponse, errorResponse, rpcErrorResponse, ERROR_CODES } from "@/lib/api";
import { employerProfileSchema, type EmployerProfileFormData } from "@/lib/validations/profile";
import {
  getEmployerProfileWithServices,
  createEmployerProfileWithServices,
  updateEmployerProfileWithServices,
} from "@/lib/db/profiles";

export const GET = createAuthRoute(async ({ supabase, userId }) => {
  const { data: profile, error } = await getEmployerProfileWithServices(supabase, userId!);

  if (error) {
    console.error("Fetch employer profile error:", error);
    return errorResponse("Failed to fetch profile", 500, ERROR_CODES.SERVER_ERROR);
  }

  return successResponse({ profile });
});

export const POST = createAuthRoute<EmployerProfileFormData>(
  async ({ data, supabase, userId }) => {
    const { services, ...profileData } = data;

    const { data: profile, error, errorCode } = await createEmployerProfileWithServices(
      supabase,
      userId!,
      profileData,
      services
    );

    if (error) {
      return rpcErrorResponse(errorCode, error);
    }

    return successResponse({ profile }, 201);
  },
  employerProfileSchema
);

export const PUT = createAuthRoute<EmployerProfileFormData>(
  async ({ data, supabase, userId }) => {
    const { services, ...profileData } = data;

    const { data: profile, error, errorCode } = await updateEmployerProfileWithServices(
      supabase,
      userId!,
      profileData,
      services
    );

    if (error) {
      return rpcErrorResponse(errorCode, error);
    }

    return successResponse({ profile });
  },
  employerProfileSchema
);
