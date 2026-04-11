import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function extractCreativeId(request: Request): string | null {
  const segments = new URL(request.url).pathname.split("/");
  const id = segments[segments.length - 1];
  return id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}

export async function GET(request: NextRequest) {
  try {
    const creativeId = extractCreativeId(request);
    if (!creativeId) {
      return NextResponse.json(
        { success: false, error: "Invalid creative ID" },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const sessionToken = url.searchParams.get("st") ?? "anonymous";
    const pageContext = url.searchParams.get("ctx") ?? "unknown";
    const impressionId = url.searchParams.get("imp") ?? null;

    const admin = createAdminClient();

    const { data: creative } = await admin
      .from("ad_creatives")
      .select("id, campaign_id, destination_url")
      .eq("id", creativeId)
      .maybeSingle();

    if (!creative) {
      return NextResponse.redirect(new URL("/", request.url), 302);
    }

    const campaignId = creative.campaign_id;
    let adPackageId: string | null = null;

    const { data: campaign } = await admin
      .from("ad_campaigns")
      .select("ad_package_id")
      .eq("id", campaignId)
      .maybeSingle();

    if (campaign) {
      adPackageId = campaign.ad_package_id;
    }

    await admin.from("ad_clicks").insert({
      ad_creative_id: creativeId,
      ad_campaign_id: campaignId,
      ad_package_id: adPackageId,
      impression_id: impressionId,
      session_token: sessionToken,
      page_context: pageContext,
      clicked_at: new Date().toISOString(),
    });

    return NextResponse.redirect(creative.destination_url, 302);
  } catch (err) {
    console.error("Click tracking error:", err);
    return NextResponse.redirect(new URL("/", request.url), 302);
  }
}
