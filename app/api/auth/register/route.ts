import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { createRoute, successResponse, errorResponse, ERROR_CODES } from "@/lib/api";
import { generateVerificationToken, getExpiryDate } from "@/lib/utils/token";
import { normalizeEmail } from "@/lib/utils/string";
import { sendVerificationEmail } from "@/lib/services/email";
import { VERIFICATION_TOKEN_EXPIRY_HOURS } from "@/lib/constants";
import { checkEmailExists } from "@/lib/db";
import { TERMS_VERSION, PRIVACY_VERSION } from "@/lib/legal/versions";

export const POST = createRoute<RegisterFormData>(
  async ({ data, supabase, request }) => {
    const { email, password } = data;
    const normalizedEmail = normalizeEmail(email);

    const emailExists = await checkEmailExists(supabase, email);
    if (emailExists) {
      return errorResponse("An account with this email already exists", 400, ERROR_CODES.EMAIL_ALREADY_EXISTS);
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error("Auth signup error:", authError);
      return errorResponse(authError?.message || "Failed to create account", 400, ERROR_CODES.SERVER_ERROR);
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: normalizedEmail,
        role: "user",
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      return errorResponse("Failed to create user profile", 500, ERROR_CODES.SERVER_ERROR);
    }

    const ipAddress = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? null;
    const userAgent = request.headers.get("user-agent") ?? null;

    const { error: consentError } = await supabase
      .from("consent_log")
      .insert({
        user_id: authData.user.id,
        terms_version: TERMS_VERSION,
        privacy_version: PRIVACY_VERSION,
        age_confirmed: true,
        cookie_essential: true,
        cookie_analytics: false,
        cookie_advertising: false,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (consentError) {
      console.error("Consent log error:", consentError);
    }

    const verificationToken = generateVerificationToken();
    const expiresAt = getExpiryDate(VERIFICATION_TOKEN_EXPIRY_HOURS);

    const { error: verificationError } = await supabase
      .from("email_verifications")
      .insert({
        user_id: authData.user.id,
        token: verificationToken,
        expires_at: expiresAt.toISOString(),
      });

    if (verificationError) {
      console.error("Verification token error:", verificationError);
      return errorResponse("Failed to generate verification token", 500, ERROR_CODES.SERVER_ERROR);
    }

    const emailResult = await sendVerificationEmail(email, verificationToken);

    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error);
    }

    return successResponse({
      message: "Account created successfully. Please check your email to verify your account.",
      userId: authData.user.id,
    }, 201);
  },
  { schema: registerSchema, useAdmin: true }
);
