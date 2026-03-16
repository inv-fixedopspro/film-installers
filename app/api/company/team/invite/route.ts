import { createAuthRoute } from "@/lib/api/route-wrapper";
import { successResponse, rpcErrorResponse } from "@/lib/api/response";
import { inviteTeamMember } from "@/lib/db/team";
import { inviteTeamMemberSchema, type InviteTeamMemberData } from "@/lib/validations/company";
import { sendTeamInvitationEmail } from "@/lib/services/email";

export const POST = createAuthRoute<InviteTeamMemberData>(
  async ({ data, supabase, userId }) => {
    const { data: result, error, errorCode } = await inviteTeamMember(
      supabase,
      userId!,
      data.employer_profile_id,
      data.email
    );

    if (error) {
      return rpcErrorResponse(errorCode, error);
    }

    const emailResult = await sendTeamInvitationEmail(result!.email, result!.token);
    if (!emailResult.success) {
      console.warn("Team invitation created but email dispatch failed:", emailResult.error);
    }

    return successResponse({ invitation: result }, 201);
  },
  inviteTeamMemberSchema
);
