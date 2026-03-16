import { NextRequest } from "next/server";
import { createAdminRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse } from "@/lib/api/response";

const PAGE_SIZE = 50;

export const GET = createAdminRoute(async ({ request, supabase }) => {

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const search = url.searchParams.get("search") || "";
  const statusFilter = url.searchParams.get("status") || "";
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("profiles")
    .select(
      `
      id,
      email,
      role,
      account_status,
      content_visibility,
      unresolved_flag_count,
      auto_hidden_at,
      onboarding_completed,
      created_at,
      installer_profiles (id, first_name, last_name),
      employer_profiles (id, company_name)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (search) {
    query = query.ilike("email", `%${search}%`);
  }

  if (statusFilter) {
    query = query.eq("account_status", statusFilter);
  }

  const { data: users, error, count } = await query;

  if (error) {
    return errorResponse("Failed to fetch users", 500);
  }

  return successResponse({
    users: users ?? [],
    total: count ?? 0,
    page,
    page_size: PAGE_SIZE,
    total_pages: Math.ceil((count ?? 0) / PAGE_SIZE),
  });
});
