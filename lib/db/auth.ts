import { SupabaseClient } from "@supabase/supabase-js";
import type { VerifyEmailResult, AcceptInvitationResult } from "./types";
import { callRpc, type RpcResult } from "./utils";

export function verifyEmailToken(
  supabase: SupabaseClient,
  token: string
): Promise<RpcResult<VerifyEmailResult>> {
  return callRpc<VerifyEmailResult>(supabase, "verify_email_token", {
    p_token: token,
  });
}

export function acceptInvitationAtomic(
  supabase: SupabaseClient,
  token: string,
  userId: string
): Promise<RpcResult<AcceptInvitationResult>> {
  return callRpc<AcceptInvitationResult>(supabase, "accept_invitation_atomic", {
    p_token: token,
    p_user_id: userId,
  });
}
