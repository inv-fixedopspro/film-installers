import { NextRequest } from "next/server";
import { createAdminRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse } from "@/lib/api/response";
import type { FlagReviewStatus } from "@/lib/types/database";

const PAGE_SIZE = 25;

export const GET = createAdminRoute(async ({ request, supabase }) => {

  const url = new URL(request.url);
  const status = (url.searchParams.get("status") as FlagReviewStatus) || "pending";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const { data: reviews, error: reviewError, count } = await supabase
    .from("flag_reviews")
    .select(
      `
      id,
      status,
      priority,
      reviewer_notes,
      reviewed_at,
      assigned_to,
      created_at,
      updated_at,
      content_flags (
        id,
        content_type,
        flag_category,
        flag_reason_detail,
        content_snapshot,
        content_url,
        is_duplicate,
        created_at,
        flagger_user_id,
        flagged_user_id
      )
    `,
      { count: "exact" }
    )
    .eq("status", status)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  if (reviewError) {
    return errorResponse("Failed to fetch flag queue", 500);
  }

  const userIds = new Set<string>();
  (reviews ?? []).forEach((r) => {
    const flag = r.content_flags as unknown as { flagger_user_id: string; flagged_user_id: string } | null;
    if (flag) {
      userIds.add(flag.flagger_user_id);
      userIds.add(flag.flagged_user_id);
    }
  });

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, account_status")
    .in("id", Array.from(userIds));

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const enriched = (reviews ?? []).map((r) => {
    const flag = r.content_flags as unknown as {
      flagger_user_id: string;
      flagged_user_id: string;
    } | null;
    return {
      ...r,
      flagger: flag ? profileMap[flag.flagger_user_id] ?? null : null,
      flagged_user: flag ? profileMap[flag.flagged_user_id] ?? null : null,
    };
  });

  return successResponse({
    reviews: enriched,
    total: count ?? 0,
    page,
    page_size: PAGE_SIZE,
    total_pages: Math.ceil((count ?? 0) / PAGE_SIZE),
  });
});
