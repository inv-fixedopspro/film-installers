import { z } from "zod";
import { createRoute, successResponse, errorResponse, ERROR_CODES } from "@/lib/api";
import { validateInvitationToken } from "@/lib/db/tokens";
import { acceptInvitationAtomic } from "@/lib/db/auth";
import { passwordSchema } from "@/lib/validations/auth";
import { extractRpcErrorCode } from "@/lib/errors";

const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
  password: passwordSchema,
});

type AcceptInvitationData = z.infer<typeof acceptInvitationSchema>;

export const POST = createRoute<AcceptInvitationData>(
  async ({ data, supabase }) => {
    const { token, password } = data;

    const { valid, error: validationError, invitation } = await validateInvitationToken(supabase, token);

    if (!valid || !invitation) {
      const isExpired = validationError === "Invitation has expired";
      return errorResponse(
        validationError || "Invalid invitation",
        400,
        isExpired ? ERROR_CODES.TOKEN_EXPIRED : ERROR_CODES.TOKEN_INVALID
      );
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invitation.email,
      password,
    });

    if (authError || !authData.user) {
      console.error("Auth signup error:", authError);
      return errorResponse(authError?.message || "Failed to create account", 400, ERROR_CODES.SERVER_ERROR);
    }

    const { data: acceptResult, error: acceptError } = await acceptInvitationAtomic(
      supabase,
      token,
      authData.user.id
    );

    if (acceptError) {
      console.error("Accept invitation error:", acceptError);
      const errorCode = extractRpcErrorCode(acceptError);

      if (errorCode === "TOKEN_EXPIRED") {
        return errorResponse("Invitation has expired", 400, ERROR_CODES.TOKEN_EXPIRED);
      }
      if (errorCode === "TOKEN_ALREADY_USED") {
        return errorResponse("Invitation already accepted", 400, ERROR_CODES.TOKEN_INVALID);
      }

      return errorResponse("Failed to complete registration", 500, ERROR_CODES.SERVER_ERROR);
    }

    return successResponse({
      message: "Account created successfully",
      userId: authData.user.id,
      email: acceptResult?.email,
    }, 201);
  },
  { schema: acceptInvitationSchema }
);
