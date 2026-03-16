import { NextRequest } from "next/server";
import { createAuthRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse, rpcErrorResponse, ERROR_CODES } from "@/lib/api/response";
import { removeTeamMember } from "@/lib/db/team";
import { removeTeamMemberSchema, type RemoveTeamMemberData } from "@/lib/validations/company";
import { createAdminClient } from "@/lib/supabase/admin";

export const GET = createAuthRoute(async ({ supabase, userId, request }) => {
  const { searchParams } = new URL(request.url);
  const employerProfileId = searchParams.get("employer_profile_id");

  if (!employerProfileId) {
    return errorResponse("employer_profile_id is required", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("employer_profiles")
    .select("id")
    .eq("id", employerProfileId)
    .eq("user_id", userId!)
    .maybeSingle();

  if (!profile) {
    return errorResponse("Forbidden", 403, ERROR_CODES.FORBIDDEN);
  }

  const { data: members, error } = await admin
    .from("company_team_members")
    .select("id, user_id, role, is_active, created_at, profiles!company_team_members_user_id_fkey(email)")
    .eq("employer_profile_id", employerProfileId)
    .eq("is_active", true)
    .order("created_at");

  if (error) {
    return errorResponse("Failed to fetch team members", 500, ERROR_CODES.SERVER_ERROR);
  }

  const { data: invitations, error: inviteError } = await admin
    .from("company_team_invitations")
    .select("id, email, status, expires_at, created_at")
    .eq("employer_profile_id", employerProfileId)
    .eq("status", "pending")
    .order("created_at");

  if (inviteError) {
    return errorResponse("Failed to fetch invitations", 500, ERROR_CODES.SERVER_ERROR);
  }

  return successResponse({ members: members ?? [], invitations: invitations ?? [] });
});

export const DELETE = createAuthRoute<RemoveTeamMemberData>(
  async ({ data, supabase, userId }) => {
    const { data: result, error, errorCode } = await removeTeamMember(
      supabase,
      userId!,
      data.employer_profile_id,
      data.target_user_id
    );

    if (error) {
      return rpcErrorResponse(errorCode, error);
    }

    return successResponse({ removed: result });
  },
  removeTeamMemberSchema
);
