import { createAuthRoute } from "@/lib/api/route-wrapper";
import { successResponse, rpcErrorResponse } from "@/lib/api/response";
import { leaveTeam } from "@/lib/db/team";
import { leaveTeamSchema, type LeaveTeamData } from "@/lib/validations/company";

export const POST = createAuthRoute<LeaveTeamData>(
  async ({ data, supabase, userId }) => {
    const { data: result, error, errorCode } = await leaveTeam(
      supabase,
      userId!,
      data.employer_profile_id
    );

    if (error) {
      return rpcErrorResponse(errorCode, error);
    }

    return successResponse({ left: result });
  },
  leaveTeamSchema
);
