import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations/auth";
import { createAdminRoute, successResponse, errorResponse, ERROR_CODES } from "@/lib/api";
import { generateVerificationToken, getExpiryDate } from "@/lib/utils/token";
import { normalizeEmail } from "@/lib/utils/string";
import { sendPasswordResetEmail } from "@/lib/services/email";

export const POST = createAdminRoute<ForgotPasswordFormData>(
  async ({ data, supabase }) => {
    const { email } = data;
    const normalizedEmail = normalizeEmail(email);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!profile) {
      return successResponse({
        message: "If an account exists with this email, you will receive a password reset link.",
      });
    }

    const resetToken = generateVerificationToken();
    const expiresAt = getExpiryDate(1);

    const { error: tokenError } = await supabase
      .from("email_verifications")
      .insert({
        user_id: profile.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Password reset token error:", tokenError);
      return errorResponse("Failed to generate password reset token", 500, ERROR_CODES.SERVER_ERROR);
    }

    const emailResult = await sendPasswordResetEmail(email, resetToken);

    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult.error);
    }

    return successResponse({
      message: "If an account exists with this email, you will receive a password reset link.",
    });
  },
  forgotPasswordSchema
);
