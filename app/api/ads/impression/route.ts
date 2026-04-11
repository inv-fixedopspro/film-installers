import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRouteHandlerClientWithCookies } from "@/lib/supabase/route-handler";
import { z } from "zod";

const impressionSchema = z.object({
  creative_id: z.string().uuid(),
  campaign_id: z.string().uuid(),
  session_token: z.string().min(1).max(200),
  page_context: z.string().min(1).max(50),
  ad_slot: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = impressionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid impression data" },
        { status: 400 }
      );
    }

    const { creative_id, campaign_id, session_token, page_context, ad_slot } = parsed.data;

    const admin = createAdminClient();

    const cookieStore = await cookies();
    const { supabase } = createRouteHandlerClientWithCookies(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await admin
        .from("profiles")
        .select("targeted_ads_opted_out")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.targeted_ads_opted_out) {
        return NextResponse.json({ success: true, data: { recorded: false, reason: "opted_out" } });
      }
    }

    const adPackageId = await getPackageId(admin, campaign_id);

    const { error } = await admin
      .from("ad_impressions")
      .insert({
        ad_creative_id: creative_id,
        ad_campaign_id: campaign_id,
        ad_package_id: adPackageId,
        session_token,
        page_context,
        ad_slot,
        rendered_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Impression insert error:", error.message);
      return NextResponse.json(
        { success: false, error: "Failed to record impression" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { recorded: true } });
  } catch (err) {
    console.error("Impression error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to record impression" },
      { status: 500 }
    );
  }
}

async function getPackageId(
  admin: ReturnType<typeof createAdminClient>,
  campaignId: string
): Promise<string | null> {
  const { data } = await admin
    .from("ad_campaigns")
    .select("ad_package_id")
    .eq("id", campaignId)
    .maybeSingle();
  return data?.ad_package_id ?? null;
}
