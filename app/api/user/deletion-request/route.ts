import { z } from "zod";
import { createAuthRoute, successResponse, errorResponse, ERROR_CODES } from "@/lib/api";

const cancelSchema = z.object({
  action: z.literal("cancel"),
  requestId: z.string().uuid(),
});

type CancelData = z.infer<typeof cancelSchema>;

export const POST = createAuthRoute(
  async ({ supabase, userId }) => {
    const { data: existing } = await supabase
      .from("deletion_requests")
      .select("id, status")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return errorResponse(
        "You already have a pending account deletion request.",
        409,
        ERROR_CODES.SERVER_ERROR
      );
    }

    const scheduledDeleteAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: request, error: insertError } = await supabase
      .from("deletion_requests")
      .insert({
        user_id: userId,
        scheduled_delete_at: scheduledDeleteAt,
      })
      .select("id, status, scheduled_delete_at")
      .maybeSingle();

    if (insertError || !request) {
      console.error("Deletion request error:", insertError);
      return errorResponse("Failed to submit deletion request", 500, ERROR_CODES.SERVER_ERROR);
    }

    return successResponse({
      message: "Your account deletion request has been submitted. Your account will be permanently deleted in 30 days.",
      requestId: request.id,
      scheduledDeleteAt: request.scheduled_delete_at,
    }, 201);
  }
);

export const PATCH = createAuthRoute<CancelData>(
  async ({ data, supabase, userId }) => {
    const { requestId } = data;

    const { data: request } = await supabase
      .from("deletion_requests")
      .select("id, status, user_id")
      .eq("id", requestId)
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();

    if (!request) {
      return errorResponse("Deletion request not found or already processed", 404, ERROR_CODES.SERVER_ERROR);
    }

    const { error: updateError } = await supabase
      .from("deletion_requests")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Cancel deletion error:", updateError);
      return errorResponse("Failed to cancel deletion request", 500, ERROR_CODES.SERVER_ERROR);
    }

    return successResponse({
      message: "Your account deletion request has been cancelled. Your account will remain active.",
    });
  },
  cancelSchema
);

export const GET = createAuthRoute(
  async ({ supabase, userId }) => {
    const { data: request, error } = await supabase
      .from("deletion_requests")
      .select("id, status, requested_at, scheduled_delete_at, cancelled_at")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();

    if (error) {
      return errorResponse("Failed to fetch deletion request", 500, ERROR_CODES.SERVER_ERROR);
    }

    return successResponse({ request: request ?? null });
  }
);
