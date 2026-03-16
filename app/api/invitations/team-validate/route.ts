import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, errorResponse, ERROR_CODES } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return errorResponse("Token is required", 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const admin = createAdminClient();

    const { data: invitation, error } = await admin
      .from("company_team_invitations")
      .select(`
        id,
        email,
        status,
        expires_at,
        employer_profile_id,
        employer_profiles (
          id,
          company_name,
          company_slug,
          hq_city,
          hq_state,
          logo_storage_path
        )
      `)
      .eq("token", token)
      .maybeSingle();

    if (error || !invitation) {
      return errorResponse(
        "This invitation link is invalid.",
        404,
        ERROR_CODES.INVITATION_NOT_FOUND
      );
    }

    if (invitation.status === "accepted") {
      return errorResponse(
        "This invitation has already been accepted.",
        410,
        ERROR_CODES.INVITATION_INVALID
      );
    }

    if (invitation.status === "revoked" || invitation.status === "expired") {
      return errorResponse(
        "This invitation is no longer valid.",
        410,
        ERROR_CODES.INVITATION_INVALID
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return errorResponse(
        "This invitation has expired. Please ask the company owner to send a new one.",
        410,
        ERROR_CODES.INVITATION_EXPIRED
      );
    }

    return successResponse({
      invitation_id: invitation.id,
      email: invitation.email,
      expires_at: invitation.expires_at,
      employer_profile: invitation.employer_profiles,
    });
  } catch (err) {
    console.error("Team invite validate error:", err);
    return errorResponse("An unexpected error occurred", 500, ERROR_CODES.SERVER_ERROR);
  }
}
