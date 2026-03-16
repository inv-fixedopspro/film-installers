import { createAdminRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse, ERROR_CODES } from "@/lib/api";

export const GET = createAdminRoute<unknown, unknown>(async ({ request, supabase }) => {
  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") || "overview";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const PAGE_SIZE = 25;
  const offset = (page - 1) * PAGE_SIZE;

  if (tab === "overview") {
    const now = new Date().toISOString();
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [
      { count: pendingDeletions },
      { count: pendingExports },
      { count: overdueDeletions },
      { count: overdueExports },
      { count: completedThisMonth },
    ] = await Promise.all([
      supabase
        .from("deletion_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("data_export_requests")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "processing"]),
      supabase
        .from("deletion_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .lt("scheduled_delete_at", now),
      supabase
        .from("data_export_requests")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "processing"])
        .lt("requested_at", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from("deletion_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("completed_at", startOfMonth),
    ]);

    return successResponse({
      metrics: {
        pending_deletions: pendingDeletions ?? 0,
        pending_exports: pendingExports ?? 0,
        overdue_deletions: overdueDeletions ?? 0,
        overdue_exports: overdueExports ?? 0,
        completed_this_month: completedThisMonth ?? 0,
      },
    });
  }

  if (tab === "deletions") {
    const statusFilter = url.searchParams.get("status") || "pending";

    const { data: requests, error, count } = await supabase
      .from("deletion_requests")
      .select("id, user_id, requested_at, scheduled_delete_at, status, cancelled_at, completed_at, created_at", { count: "exact" })
      .eq("status", statusFilter)
      .order("scheduled_delete_at", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      return errorResponse("Failed to fetch deletion requests", 500, ERROR_CODES.SERVER_ERROR);
    }

    const userIds = (requests ?? []).map((r) => r.user_id);
    const { data: profiles } = userIds.length
      ? await supabase.from("profiles").select("id, email").in("id", userIds)
      : { data: [] };

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

    const enriched = (requests ?? []).map((r) => ({
      ...r,
      user: profileMap[r.user_id] ?? null,
      days_remaining: Math.max(0, Math.ceil(
        (new Date(r.scheduled_delete_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )),
    }));

    return successResponse({
      requests: enriched,
      total: count ?? 0,
      page,
      page_size: PAGE_SIZE,
      total_pages: Math.ceil((count ?? 0) / PAGE_SIZE),
    });
  }

  if (tab === "exports") {
    const statusFilter = url.searchParams.get("status") || "pending";

    const { data: requests, error, count } = await supabase
      .from("data_export_requests")
      .select("id, user_id, requested_at, status, completed_at, download_expires_at, created_at", { count: "exact" })
      .eq("status", statusFilter)
      .order("requested_at", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      return errorResponse("Failed to fetch export requests", 500, ERROR_CODES.SERVER_ERROR);
    }

    const userIds = (requests ?? []).map((r) => r.user_id);
    const { data: profiles } = userIds.length
      ? await supabase.from("profiles").select("id, email").in("id", userIds)
      : { data: [] };

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

    const enriched = (requests ?? []).map((r) => ({
      ...r,
      user: profileMap[r.user_id] ?? null,
      age_hours: Math.floor((Date.now() - new Date(r.requested_at).getTime()) / (1000 * 60 * 60)),
    }));

    return successResponse({
      requests: enriched,
      total: count ?? 0,
      page,
      page_size: PAGE_SIZE,
      total_pages: Math.ceil((count ?? 0) / PAGE_SIZE),
    });
  }

  return errorResponse("Invalid tab parameter", 400, ERROR_CODES.SERVER_ERROR);
});
