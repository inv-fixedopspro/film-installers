import { z } from "zod";
import { createAdminRoute, successResponse, errorResponse, ERROR_CODES } from "@/lib/api";
import { createEmailVerificationToken } from "@/lib/db/tokens";
import { normalizeEmail } from "@/lib/utils/string";
import { sendVerificationEmail } from "@/lib/services/email";

const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ResendVerificationData = z.infer<typeof resendVerificationSchema>;

export const POST = createAdminRoute<ResendVerificationData>(
  async ({ data, supabase }) => {
    const { email } = data;
    const normalizedEmail = normalizeEmail(email);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, email_verified_at")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!profile) {
      return successResponse({
        message: "If an account exists with this email, a new verification link will be sent.",
      });
    }

    if (profile.email_verified_at) {
      return errorResponse("Email is already verified", 400, ERROR_CODES.VALIDATION_ERROR);
    }

    await supabase
      .from("email_verifications")
      .delete()
      .eq("user_id", profile.id)
      .is("verified_at", null);

    const { token, error: tokenError } = await createEmailVerificationToken(supabase, profile.id);

    if (tokenError || !token) {
      console.error("Verification token error:", tokenError);
      return errorResponse("Failed to generate verification token", 500, ERROR_CODES.SERVER_ERROR);
    }

    const emailResult = await sendVerificationEmail(email, token);

    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error);
    }

    return successResponse({
      message: "If an account exists with this email, a new verification link will be sent.",
    });
  },
  resendVerificationSchema
);
