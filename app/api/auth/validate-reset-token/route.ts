import { z } from "zod";
import { createAdminRoute, successResponse, errorResponse, ERROR_CODES } from "@/lib/api";
import { validateResetToken } from "@/lib/db/tokens";

const validateTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

type ValidateTokenData = z.infer<typeof validateTokenSchema>;

export const POST = createAdminRoute<ValidateTokenData>(
  async ({ data, supabase }) => {
    const { token } = data;

    const tokenResult = await validateResetToken(supabase, token);

    if (!tokenResult.valid) {
      const errorCode = tokenResult.errorType === "expired"
        ? ERROR_CODES.TOKEN_EXPIRED
        : ERROR_CODES.TOKEN_INVALID;
      return errorResponse(tokenResult.error || "Invalid token", 400, errorCode);
    }

    return successResponse({ valid: true });
  },
  validateTokenSchema
);
