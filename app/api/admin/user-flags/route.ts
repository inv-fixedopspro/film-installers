import { NextRequest } from "next/server";
import { createAdminRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse } from "@/lib/api/response";

export const GET = createAdminRoute(async ({ request, supabase }) => {

  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");
  const type = url.searchParams.get("type");

  if (!userId) {
    return errorResponse("user_id is required", 400);
  }

  const flagSelect = `
    id,
    content_type,
    flag_category,
    flag_reason_detail,
    created_at,
    is_duplicate,
    flag_reviews (
      status,
      priority,
      reviewed_at
    )
  `;

  if (type === "submitted") {
    const { data: flags, error } = await supabase
      .from("content_flags")
      .select(flagSelect)
      .eq("flagger_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return errorResponse("Failed to fetch flags", 500);
    return successResponse({ flags: flags ?? [] });
  }

  const { data: flags, error } = await supabase
    .from("content_flags")
    .select(flagSelect)
    .eq("flagged_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return errorResponse("Failed to fetch flags", 500);
  return successResponse({ flags: flags ?? [] });
});
