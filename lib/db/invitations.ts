import { SupabaseClient } from "@supabase/supabase-js";
import { generateVerificationToken, getExpiryDate } from "@/lib/utils/token";
import { normalizeEmail } from "@/lib/utils/string";
import type { UserRole } from "@/lib/types/database";

const INVITATION_EXPIRY_DAYS = 7;

export async function createInvitation(
  supabase: SupabaseClient,
  inviterUserId: string,
  email: string,
  role: UserRole = "user"
): Promise<{ token: string | null; error: string | null }> {
  const normalizedEmail = normalizeEmail(email);

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingProfile) {
    return { token: null, error: "User with this email already exists" };
  }

  const { data: existingInvitation } = await supabase
    .from("invitations")
    .select("id")
    .eq("email", normalizedEmail)
    .is("accepted_at", null)
    .maybeSingle();

  if (existingInvitation) {
    return { token: null, error: "An invitation has already been sent to this email" };
  }

  const token = generateVerificationToken();
  const expiresAt = getExpiryDate(INVITATION_EXPIRY_DAYS * 24);

  const { error } = await supabase.from("invitations").insert({
    email: normalizedEmail,
    role,
    invited_by: inviterUserId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    return { token: null, error: error.message };
  }

  return { token, error: null };
}

export async function markInvitationAccepted(
  supabase: SupabaseClient,
  invitationId: string
) {
  const { error } = await supabase
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitationId);

  return { error: error?.message || null };
}
