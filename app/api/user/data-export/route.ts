import { createAuthRoute, successResponse, errorResponse, ERROR_CODES } from "@/lib/api";

export const POST = createAuthRoute(
  async ({ supabase, userId }) => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("data_export_requests")
      .select("id, requested_at, status")
      .eq("user_id", userId)
      .in("status", ["pending", "processing", "ready"])
      .gte("requested_at", oneDayAgo)
      .maybeSingle();

    if (recent) {
      return errorResponse(
        "You have already submitted a data export request in the last 24 hours. Please wait before requesting again.",
        429,
        ERROR_CODES.SERVER_ERROR
      );
    }

    const { data: exportRequest, error: insertError } = await supabase
      .from("data_export_requests")
      .insert({ user_id: userId })
      .select("id, status, requested_at")
      .maybeSingle();

    if (insertError || !exportRequest) {
      console.error("Data export request error:", insertError);
      return errorResponse("Failed to submit data export request", 500, ERROR_CODES.SERVER_ERROR);
    }

    return successResponse({
      message: "Your data export request has been submitted. You will be notified when it is ready.",
      requestId: exportRequest.id,
      status: exportRequest.status,
    }, 201);
  }
);

export const GET = createAuthRoute(
  async ({ supabase, userId }) => {
    const { data: requests, error } = await supabase
      .from("data_export_requests")
      .select("id, status, requested_at, completed_at, download_expires_at")
      .eq("user_id", userId)
      .order("requested_at", { ascending: false })
      .limit(5);

    if (error) {
      return errorResponse("Failed to fetch export requests", 500, ERROR_CODES.SERVER_ERROR);
    }

    return successResponse({ requests: requests ?? [] });
  }
);
