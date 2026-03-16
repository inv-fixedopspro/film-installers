import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { createRoute, successResponse, errorResponse, ERROR_CODES } from "@/lib/api";
import { normalizeEmail } from "@/lib/utils/string";
import { createAdminClient } from "@/lib/supabase/admin";

export const POST = createRoute<LoginFormData>(
  async ({ data, supabase }) => {
    const { email, password } = data;
    const normalizedEmail = normalizeEmail(email);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError) {
      return errorResponse("Invalid email or password", 401, ERROR_CODES.INVALID_CREDENTIALS);
    }

    if (!authData.user) {
      return errorResponse("Invalid email or password", 401, ERROR_CODES.INVALID_CREDENTIALS);
    }

    const adminClient = createAdminClient();
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return errorResponse("User profile not found", 404, ERROR_CODES.NOT_FOUND);
    }

    if (!profile.email_verified_at) {
      await supabase.auth.signOut();
      return successResponse({
        requiresVerification: true,
        email: normalizedEmail,
        redirectTo: `/verify-email?email=${encodeURIComponent(normalizedEmail)}`,
      });
    }

    let redirectTo = "/dashboard";
    if (profile.role === "admin") {
      redirectTo = "/admin";
    } else if (!profile.onboarding_completed) {
      redirectTo = "/onboarding/select-type";
    }

    return successResponse({
      message: "Login successful",
      redirectTo,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        onboardingCompleted: profile.onboarding_completed,
        activeProfileType: profile.active_profile_type,
      },
    });
  },
  { schema: loginSchema }
);
