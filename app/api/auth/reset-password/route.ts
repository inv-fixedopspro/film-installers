import { resetPasswordWithTokenSchema, type ResetPasswordWithTokenFormData } from "@/lib/validations/auth";
import { createAdminRoute, successResponse, errorResponse, ERROR_CODES } from "@/lib/api";
import { validateResetToken } from "@/lib/db/tokens";

export const POST = createAdminRoute<ResetPasswordWithTokenFormData>(
  async ({ data, supabase }) => {
    const { token, password } = data;

    const tokenResult = await validateResetToken(supabase, token);

    if (!tokenResult.valid || !tokenResult.verification) {
      const errorCode = tokenResult.errorType === "expired"
        ? ERROR_CODES.TOKEN_EXPIRED
        : ERROR_CODES.TOKEN_INVALID;
      return errorResponse(tokenResult.error || "Invalid token", 400, errorCode);
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      tokenResult.verification.user_id,
      { password }
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      return errorResponse("Failed to update password", 500, ERROR_CODES.SERVER_ERROR);
    }

    await supabase
      .from("email_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", tokenResult.verification.id);

    return successResponse({
      message: "Password reset successfully",
    });
  },
  resetPasswordWithTokenSchema
);
