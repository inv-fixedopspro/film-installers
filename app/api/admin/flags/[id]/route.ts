import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse, rpcErrorResponse } from "@/lib/api/response";
import { reviewFlag } from "@/lib/db/moderation";
import type { FlagReviewStatus, ModerationActionType } from "@/lib/types/database";

const reviewFlagSchema = z.object({
  status: z.enum(["pending", "under_review", "resolved_actioned", "resolved_dismissed", "resolved_duplicate"]),
  notes: z.string().nullable().optional(),
  action_type: z.enum(["warning", "hide", "restore", "restrict", "unrestrict", "ban", "unban", "flag_upheld", "flag_dismissed"]).nullable().optional(),
  reason: z.string().nullable().optional(),
});

export const PUT = createAdminRoute(async ({ request, supabase, data, userId }) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const flagId = segments[segments.length - 2];

  if (!flagId) {
    return errorResponse("Flag ID is required", 400);
  }

  const parsed = reviewFlagSchema.safeParse(data);
  if (!parsed.success) {
    return errorResponse("Invalid request body", 400);
  }

  const { status, notes, action_type, reason } = parsed.data;

  const result = await reviewFlag(supabase, {
    flagId,
    adminId: userId!,
    newStatus: status as FlagReviewStatus,
    notes: notes ?? null,
    actionType: (action_type as ModerationActionType) ?? null,
    reason: reason ?? null,
  });

  if (result.error) {
    if (result.errorCode) {
      return rpcErrorResponse(result.errorCode, "Failed to review flag");
    }
    return errorResponse("Failed to review flag", 500);
  }

  return successResponse({ action_id: result.data?.action_id ?? null });
}, reviewFlagSchema);
