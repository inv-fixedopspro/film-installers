import { NextRequest } from "next/server";
import { createRoute, successResponse, errorResponse, ERROR_CODES } from "@/lib/api";
import { validateInvitationToken } from "@/lib/db/tokens";

export const GET = createRoute(
  async ({ request, supabase }) => {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return errorResponse(
        "Invitation token is required",
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const { valid, error, invitation } = await validateInvitationToken(supabase, token);

    if (!valid || !invitation) {
      const isExpired = error === "Invitation has expired";
      return errorResponse(
        error || "Invalid invitation",
        400,
        isExpired ? ERROR_CODES.TOKEN_EXPIRED : ERROR_CODES.TOKEN_INVALID
      );
    }

    return successResponse({
      email: invitation.email,
      role: invitation.role,
    });
  }
);
