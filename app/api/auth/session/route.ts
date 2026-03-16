import { createRoute, successResponse } from "@/lib/api";

interface SessionUser {
  id: string;
  email: string;
  role: string;
  emailVerifiedAt: string | null;
  onboardingCompleted: boolean;
  activeProfileType: string | null;
  createdAt: string;
  installerProfile: unknown;
  employerProfile: unknown;
}

interface SessionResponse {
  user: SessionUser | null;
}

export const GET = createRoute<unknown, SessionResponse>(
  async ({ supabase }) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return successResponse({ user: null });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return successResponse({ user: null });
    }

    const { data: installerProfile } = await supabase
      .from("installer_profiles")
      .select(`
        *,
        installer_experience (*)
      `)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: employerProfile } = await supabase
      .from("employer_profiles")
      .select(`
        *,
        employer_services (*)
      `)
      .eq("user_id", user.id)
      .maybeSingle();

    return successResponse({
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        emailVerifiedAt: profile.email_verified_at,
        onboardingCompleted: profile.onboarding_completed,
        activeProfileType: profile.active_profile_type,
        createdAt: profile.created_at,
        installerProfile: installerProfile || null,
        employerProfile: employerProfile || null,
      },
    });
  }
);
