import { createAuthRoute, successResponse, errorResponse, rpcErrorResponse, ERROR_CODES } from "@/lib/api";
import { installerProfileSchema, type InstallerProfileFormData } from "@/lib/validations/profile";
import {
  getInstallerProfileWithExperience,
  createInstallerProfileWithExperience,
  updateInstallerProfileWithExperience,
} from "@/lib/db/profiles";

export const GET = createAuthRoute(async ({ supabase, userId }) => {
  const { data: profile, error } = await getInstallerProfileWithExperience(supabase, userId!);

  if (error) {
    console.error("Fetch installer profile error:", error);
    return errorResponse("Failed to fetch profile", 500, ERROR_CODES.SERVER_ERROR);
  }

  return successResponse({ profile });
});

export const POST = createAuthRoute<InstallerProfileFormData>(
  async ({ data, supabase, userId }) => {
    const { experience, ...profileData } = data;

    const { data: profile, error, errorCode } = await createInstallerProfileWithExperience(
      supabase,
      userId!,
      profileData,
      experience || []
    );

    if (error) {
      return rpcErrorResponse(errorCode, error);
    }

    return successResponse({ profile }, 201);
  },
  installerProfileSchema
);

export const PUT = createAuthRoute<InstallerProfileFormData>(
  async ({ data, supabase, userId }) => {
    const { experience, ...profileData } = data;

    const { data: profile, error, errorCode } = await updateInstallerProfileWithExperience(
      supabase,
      userId!,
      profileData,
      experience || []
    );

    if (error) {
      return rpcErrorResponse(errorCode, error);
    }

    return successResponse({ profile });
  },
  installerProfileSchema
);
