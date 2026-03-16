import { createAuthRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse, ERROR_CODES } from "@/lib/api/response";
import type { ContentFlag } from "@/lib/types/database";

export const GET = createAuthRoute(async ({ supabase, userId }) => {
  const { data, error } = await supabase
    .from("content_flags")
    .select(
      "id, flagged_user_id, content_type, content_id, flag_category, flag_reason_detail, content_url, is_duplicate, created_at"
    )
    .eq("flagger_user_id", userId!)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch my-flags error:", error);
    return errorResponse("Failed to fetch flags", 500, ERROR_CODES.SERVER_ERROR);
  }

  return successResponse({ flags: (data ?? []) as Partial<ContentFlag>[] });
});
