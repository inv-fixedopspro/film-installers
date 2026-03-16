import { NextRequest } from "next/server";
import { z } from "zod";
import { createAdminRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse, rpcErrorResponse } from "@/lib/api/response";
import { moderateUser, restoreUserContent } from "@/lib/db/moderation";
import type { ModerationActionType } from "@/lib/types/database";

const moderateSchema = z.object({
  action_type: z.enum(["warning", "restrict", "unrestrict", "ban", "unban"]),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
});

const restoreSchema = z.object({
  action_type: z.literal("restore"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().nullable().optional(),
});

const bodySchema = z.union([moderateSchema, restoreSchema]);

export const POST = createAdminRoute(async ({ request, supabase, data, userId }) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const moderateIndex = segments.indexOf("moderate");
  const targetUserId = moderateIndex > 0 ? segments[moderateIndex - 1] : null;

  if (!targetUserId) {
    return errorResponse("User ID is required", 400);
  }

  const parsed = bodySchema.safeParse(data);
  if (!parsed.success) {
    return errorResponse("Invalid request body", 400);
  }

  const { action_type, reason, notes } = parsed.data;

  if (action_type === "restore") {
    const result = await restoreUserContent(supabase, {
      targetUserId,
      adminId: userId!,
      reason,
      notes: notes ?? null,
    });

    if (result.error) {
      if (result.errorCode) return rpcErrorResponse(result.errorCode, "Failed to restore content");
      return errorResponse("Failed to restore content", 500);
    }

    return successResponse({ action_id: result.data?.action_id ?? null });
  }

  const moderateData = parsed.data as z.infer<typeof moderateSchema>;

  const result = await moderateUser(supabase, {
    targetUserId,
    adminId: userId!,
    actionType: action_type as ModerationActionType,
    reason,
    notes: notes ?? null,
    expiresAt: moderateData.expires_at ?? null,
  });

  if (result.error) {
    if (result.errorCode) return rpcErrorResponse(result.errorCode, "Failed to moderate user");
    return errorResponse("Failed to moderate user", 500);
  }

  return successResponse({ action_id: result.data?.action_id ?? null });
}, bodySchema);
