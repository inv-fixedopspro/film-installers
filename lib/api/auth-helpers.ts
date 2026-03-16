import { SupabaseClient, User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types/database";

export interface AuthResult {
  user: User;
  error: null;
}

export interface AuthError {
  user: null;
  error: string;
  code: string;
}

export interface AuthWithProfileResult {
  user: User;
  profile: Profile;
  error: null;
}

export interface AuthWithProfileError {
  user: null;
  profile: null;
  error: string;
  code: string;
}

export function isAuthError(
  result: AuthResult | AuthError | AuthWithProfileResult | AuthWithProfileError
): result is AuthError | AuthWithProfileError {
  return result.error !== null;
}

export async function requireAuth(
  supabase: SupabaseClient
): Promise<AuthResult | AuthError> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: "Unauthorized", code: "UNAUTHORIZED" };
  }

  return { user, error: null };
}

export async function requireAuthWithProfile(
  supabase: SupabaseClient
): Promise<AuthWithProfileResult | AuthWithProfileError> {
  const authResult = await requireAuth(supabase);

  if (isAuthError(authResult)) {
    return { user: null, profile: null, error: authResult.error, code: authResult.code };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authResult.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { user: null, profile: null, error: "Profile not found", code: "PROFILE_NOT_FOUND" };
  }

  return { user: authResult.user, profile, error: null };
}

export async function requireEmailVerified(
  supabase: SupabaseClient
): Promise<AuthWithProfileResult | AuthWithProfileError> {
  const result = await requireAuthWithProfile(supabase);

  if (isAuthError(result)) {
    return result;
  }

  if (!result.profile.email_verified_at) {
    return { user: null, profile: null, error: "Email not verified", code: "EMAIL_NOT_VERIFIED" };
  }

  return result;
}

export async function requireAdmin(
  supabase: SupabaseClient
): Promise<AuthWithProfileResult | AuthWithProfileError> {
  const result = await requireAuthWithProfile(supabase);

  if (isAuthError(result)) {
    return result;
  }

  if (result.profile.role !== "admin") {
    return { user: null, profile: null, error: "Forbidden", code: "FORBIDDEN" };
  }

  return result;
}

export async function requireActiveAccount(
  supabase: SupabaseClient
): Promise<AuthWithProfileResult | AuthWithProfileError> {
  const result = await requireAuthWithProfile(supabase);

  if (isAuthError(result)) {
    return result;
  }

  if (result.profile.account_status === "banned") {
    return { user: null, profile: null, error: "Account banned", code: "ACCOUNT_BANNED" };
  }

  if (result.profile.account_status === "restricted") {
    return { user: null, profile: null, error: "Account restricted", code: "ACCOUNT_RESTRICTED" };
  }

  return result;
}
