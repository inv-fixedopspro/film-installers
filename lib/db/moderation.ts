import { SupabaseClient } from "@supabase/supabase-js";
import type {
  FlagContentType,
  FlagCategory,
  FlagReviewStatus,
  ModerationActionType,
} from "@/lib/types/database";
import { callRpc, type RpcResult } from "./utils";

export interface SubmitFlagParams {
  flaggerUserId: string;
  flaggedUserId: string;
  contentType: FlagContentType;
  contentId: string;
  category: FlagCategory;
  reason?: string | null;
  contentSnapshot?: Record<string, unknown> | null;
  contentUrl?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface SubmitFlagResult {
  success: boolean;
  flag_id: string | null;
  review_id: string | null;
  error_code: string | null;
}

export interface ReviewFlagParams {
  flagId: string;
  adminId: string;
  newStatus: FlagReviewStatus;
  notes?: string | null;
  actionType?: ModerationActionType | null;
  reason?: string | null;
}

export interface ReviewFlagResult {
  success: boolean;
  action_id: string | null;
  error_code: string | null;
}

export interface ModerateUserParams {
  targetUserId: string;
  adminId: string;
  actionType: ModerationActionType;
  reason: string;
  expiresAt?: string | null;
  notes?: string | null;
  flagId?: string | null;
  metadata?: Record<string, unknown> | null;
  resumeId?: string | null;
}

export interface ModerateUserResult {
  success: boolean;
  action_id: string | null;
  error_code: string | null;
}

export interface RestoreUserContentParams {
  targetUserId: string;
  adminId: string;
  reason: string;
  notes?: string | null;
}

export interface RestoreUserContentResult {
  success: boolean;
  action_id: string | null;
  error_code: string | null;
}

export interface RestoreResumeContentParams {
  resumeId: string;
  targetUserId: string;
  adminId: string;
  reason: string;
  notes?: string | null;
}

export interface RestoreResumeContentResult {
  success: boolean;
  action_id: string | null;
  error_code: string | null;
}

export async function submitFlag(
  supabase: SupabaseClient,
  params: SubmitFlagParams
): Promise<RpcResult<SubmitFlagResult>> {
  return callRpc<SubmitFlagResult>(supabase, "submit_flag", {
    p_flagger_user_id:  params.flaggerUserId,
    p_flagged_user_id:  params.flaggedUserId,
    p_content_type:     params.contentType,
    p_content_id:       params.contentId,
    p_category:         params.category,
    p_reason:           params.reason ?? null,
    p_content_snapshot: params.contentSnapshot ?? null,
    p_content_url:      params.contentUrl ?? null,
    p_metadata:         params.metadata ?? null,
  });
}

export async function reviewFlag(
  supabase: SupabaseClient,
  params: ReviewFlagParams
): Promise<RpcResult<ReviewFlagResult>> {
  return callRpc<ReviewFlagResult>(supabase, "review_flag", {
    p_flag_id:    params.flagId,
    p_admin_id:   params.adminId,
    p_new_status: params.newStatus,
    p_notes:      params.notes ?? null,
    p_action_type: params.actionType ?? null,
    p_reason:     params.reason ?? null,
  });
}

export async function moderateUser(
  supabase: SupabaseClient,
  params: ModerateUserParams
): Promise<RpcResult<ModerateUserResult>> {
  return callRpc<ModerateUserResult>(supabase, "moderate_user", {
    p_target_user_id: params.targetUserId,
    p_admin_id:       params.adminId,
    p_action_type:    params.actionType,
    p_reason:         params.reason,
    p_expires_at:     params.expiresAt ?? null,
    p_notes:          params.notes ?? null,
    p_flag_id:        params.flagId ?? null,
    p_metadata:       params.metadata ?? null,
    p_resume_id:      params.resumeId ?? null,
  });
}

export async function restoreUserContent(
  supabase: SupabaseClient,
  params: RestoreUserContentParams
): Promise<RpcResult<RestoreUserContentResult>> {
  return callRpc<RestoreUserContentResult>(supabase, "restore_user_content", {
    p_target_user_id: params.targetUserId,
    p_admin_id:       params.adminId,
    p_reason:         params.reason,
    p_notes:          params.notes ?? null,
  });
}

export async function restoreResumeContent(
  supabase: SupabaseClient,
  params: RestoreResumeContentParams
): Promise<RpcResult<RestoreResumeContentResult>> {
  return callRpc<RestoreResumeContentResult>(supabase, "restore_resume_content", {
    p_resume_id:      params.resumeId,
    p_target_user_id: params.targetUserId,
    p_admin_id:       params.adminId,
    p_reason:         params.reason,
    p_notes:          params.notes ?? null,
  });
}
