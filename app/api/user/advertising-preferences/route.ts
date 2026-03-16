import { z } from "zod";
import { createAuthRoute, successResponse, errorResponse, ERROR_CODES } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

export const GET = createAuthRoute(async ({ supabase, userId }) => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("targeted_ads_opted_out")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return errorResponse("Failed to fetch advertising preferences", 500, ERROR_CODES.SERVER_ERROR);
  }

  const { data: history } = await supabase
    .from("ad_consent_log")
    .select("id, opted_out, source, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return successResponse({
    targeted_ads_opted_out: profile?.targeted_ads_opted_out ?? false,
    history: history ?? [],
  });
});

const updateSchema = z.object({
  opted_out: z.boolean(),
});

export const POST = createAuthRoute<z.infer<typeof updateSchema>>(
  async ({ request, data, userId }) => {
    const admin = createAdminClient();

    const { error: profileError } = await admin
      .from("profiles")
      .update({ targeted_ads_opted_out: data.opted_out })
      .eq("id", userId);

    if (profileError) {
      return errorResponse("Failed to update advertising preferences", 500, ERROR_CODES.SERVER_ERROR);
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : null;
    const ua = request.headers.get("user-agent");

    await admin.from("ad_consent_log").insert({
      user_id: userId,
      opted_out: data.opted_out,
      source: "settings",
      ip_address: ip,
      user_agent: ua,
    });

    return successResponse({ targeted_ads_opted_out: data.opted_out });
  },
  updateSchema
);
