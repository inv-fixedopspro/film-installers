import { NextRequest, NextResponse } from "next/server";
import { getActiveAdsForSlot } from "@/lib/db/ad-serving";
import { getAdCreativeSignedUrls } from "@/lib/storage/ad-creatives";
import type { AdTargetAudience } from "@/lib/types/database";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const slot = url.searchParams.get("slot");
    const page = url.searchParams.get("page");
    const audience = (url.searchParams.get("audience") || "all") as AdTargetAudience;

    if (!slot || !page) {
      return NextResponse.json(
        { success: false, error: "slot and page query params are required" },
        { status: 400 }
      );
    }

    const { data: ads, error } = await getActiveAdsForSlot(slot, page, audience);

    if (error || ads.length === 0) {
      return NextResponse.json({ success: true, data: { ads: [] } });
    }

    const paths = ads.map((a) => a.image_storage_path);
    const signedUrls = await getAdCreativeSignedUrls(paths);
    const urlMap = new Map(signedUrls.map((u) => [u.path, u.signedUrl]));

    const result = ads.map((ad) => ({
      creative_id: ad.creative_id,
      campaign_id: ad.campaign_id,
      image_url: urlMap.get(ad.image_storage_path) ?? null,
      destination_url: ad.destination_url,
      alt_text: ad.alt_text,
      slot_type: ad.slot_type,
      width_px: ad.width_px,
      height_px: ad.height_px,
      priority_weight: ad.priority_weight,
      rotation_interval_seconds: ad.rotation_interval_seconds,
    }));

    return NextResponse.json({ success: true, data: { ads: result } });
  } catch (err) {
    console.error("Ad serve error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to serve ads" },
      { status: 500 }
    );
  }
}
