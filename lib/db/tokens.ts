import { SupabaseClient } from "@supabase/supabase-js";
import { generateVerificationToken, getExpiryDate, isTokenExpired } from "@/lib/utils/token";
import { VERIFICATION_TOKEN_EXPIRY_HOURS } from "@/lib/constants";

export interface EmailVerification {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  verified_at: string | null;
  created_at: string;
}

export interface ValidateTokenResult {
  valid: boolean;
  error: string | null;
  errorType: "invalid" | "used" | "expired" | null;
  verification: EmailVerification | null;
}

export async function validateResetToken(
  supabase: SupabaseClient,
  token: string
): Promise<ValidateTokenResult> {
  const { data: verification, error } = await supabase
    .from("email_verifications")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error || !verification) {
    return {
      valid: false,
      error: "Invalid reset token",
      errorType: "invalid",
      verification: null,
    };
  }

  if (verification.verified_at) {
    return {
      valid: false,
      error: "This reset link has already been used",
      errorType: "used",
      verification: null,
    };
  }

  if (isTokenExpired(verification.expires_at)) {
    return {
      valid: false,
      error: "Reset token has expired. Please request a new one.",
      errorType: "expired",
      verification: null,
    };
  }

  return {
    valid: true,
    error: null,
    errorType: null,
    verification,
  };
}

export async function createEmailVerificationToken(
  supabase: SupabaseClient,
  userId: string,
  expiryHours: number = VERIFICATION_TOKEN_EXPIRY_HOURS
): Promise<{ token: string | null; error: string | null }> {
  const token = generateVerificationToken();
  const expiresAt = getExpiryDate(expiryHours);

  const { error } = await supabase.from("email_verifications").insert({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    return { token: null, error: error.message };
  }

  return { token, error: null };
}

export async function validateInvitationToken(
  supabase: SupabaseClient,
  token: string
): Promise<{ valid: boolean; error: string | null; invitation: any | null }> {
  const { data: invitation, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    return { valid: false, error: error.message, invitation: null };
  }

  if (!invitation) {
    return { valid: false, error: "Invalid invitation token", invitation: null };
  }

  if (invitation.accepted_at) {
    return { valid: false, error: "Invitation already accepted", invitation: null };
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return { valid: false, error: "Invitation has expired", invitation: null };
  }

  return { valid: true, error: null, invitation };
}

export async function cleanupExpiredTokens(
  supabase: SupabaseClient,
  retentionDays: number = 30
): Promise<{ data: { verifications_deleted: number; invitations_deleted: number } | null; error: string | null }> {
  const { data, error } = await supabase.rpc("cleanup_expired_tokens", {
    p_retention_days: retentionDays,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
