import { createAuthRoute, successResponse, errorResponse, ERROR_CODES } from "@/lib/api";

export const GET = createAuthRoute(
  async ({ supabase, userId }) => {
    const { data: records, error } = await supabase
      .from("consent_log")
      .select("id, terms_version, privacy_version, age_confirmed, cookie_essential, cookie_analytics, cookie_advertising, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return errorResponse("Failed to fetch consent history", 500, ERROR_CODES.SERVER_ERROR);
    }

    return successResponse({ records: records ?? [] });
  }
);
