import { z } from "zod";
import { createAuthRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse, rpcErrorResponse, ERROR_CODES } from "@/lib/api/response";
import { acceptTeamInvitation } from "@/lib/db/team";
import { createAdminClient } from "@/lib/supabase/admin";

const teamAcceptSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

type TeamAcceptData = z.infer<typeof teamAcceptSchema>;

export const POST = createAuthRoute<TeamAcceptData>(
  async ({ data, supabase, userId }) => {
    const admin = createAdminClient();

    const { data: invitation, error: lookupError } = await admin
      .from("company_team_invitations")
      .select("id, email, status, expires_at")
      .eq("token", data.token)
      .maybeSingle();

    if (lookupError || !invitation) {
      return errorResponse("Invitation not found.", 404, ERROR_CODES.INVITATION_NOT_FOUND);
    }

    if (invitation.status !== "pending") {
      return errorResponse(
        "This invitation is no longer valid.",
        410,
        ERROR_CODES.INVITATION_INVALID
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return errorResponse(
        "This invitation has expired.",
        410,
        ERROR_CODES.INVITATION_EXPIRED
      );
    }

    const { data: userProfile, error: profileError } = await admin
      .from("profiles")
      .select("email")
      .eq("id", userId!)
      .maybeSingle();

    if (profileError || !userProfile) {
      return errorResponse("User profile not found.", 404, ERROR_CODES.PROFILE_NOT_FOUND);
    }

    if (userProfile.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return errorResponse(
        "This invitation was sent to a different email address.",
        403,
        ERROR_CODES.FORBIDDEN
      );
    }

    const { data: result, error, errorCode } = await acceptTeamInvitation(
      supabase,
      data.token,
      userId!
    );

    if (error) {
      return rpcErrorResponse(errorCode, error);
    }

    return successResponse({ accepted: result });
  },
  teamAcceptSchema
);
