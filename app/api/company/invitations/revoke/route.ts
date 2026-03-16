import { createAuthRoute } from "@/lib/api/route-wrapper";
import { successResponse, rpcErrorResponse } from "@/lib/api/response";
import { revokeTeamInvitation } from "@/lib/db/team";
import { revokeInvitationSchema, type RevokeInvitationData } from "@/lib/validations/company";

export const POST = createAuthRoute<RevokeInvitationData>(
  async ({ data, supabase, userId }) => {
    const { data: result, error, errorCode } = await revokeTeamInvitation(
      supabase,
      userId!,
      data.invitation_id
    );

    if (error) {
      return rpcErrorResponse(errorCode, error);
    }

    return successResponse({ revoked: result });
  },
  revokeInvitationSchema
);
