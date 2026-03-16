import { NextRequest } from "next/server";
import { createAdminRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse } from "@/lib/api/response";

export const GET = createAdminRoute(async ({ request, supabase }) => {

  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");

  if (!userId) {
    return errorResponse("user_id is required", 400);
  }

  const { data: actions, error } = await supabase
    .from("moderation_actions")
    .select("id, action_type, reason, notes, admin_user_id, created_at, expires_at, flag_id")
    .eq("target_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return errorResponse("Failed to fetch moderation history", 500);
  }

  return successResponse({ actions: actions ?? [] });
});
