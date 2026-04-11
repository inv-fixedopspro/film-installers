import { createAdminRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse } from "@/lib/api/response";
import { getCampaign, updateCampaign } from "@/lib/db/ad-campaigns";
import { listCreativesByCampaign } from "@/lib/db/ad-creatives";
import { listCampaignSlots } from "@/lib/db/ad-campaign-slots";
import { getAdCreativeSignedUrls } from "@/lib/storage/ad-creatives";
import { updateCampaignSchema } from "@/lib/validations/advertising";
import { createAdminClient } from "@/lib/supabase/admin";

function extractId(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const campaignsIdx = segments.indexOf("campaigns");
  const id = campaignsIdx >= 0 ? segments[campaignsIdx + 1] : null;
  return id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
}

export const GET = createAdminRoute(async ({ request }) => {
  const id = extractId(request);
  if (!id) return errorResponse("Invalid campaign ID", 400);

  const { data: campaign, error: campErr } = await getCampaign(id);
  if (campErr) return errorResponse("Failed to fetch campaign", 500);
  if (!campaign) return errorResponse("Campaign not found", 404);

  const [creativesResult, slotsResult] = await Promise.all([
    listCreativesByCampaign(id),
    listCampaignSlots(id),
  ]);

  let creativesWithUrls = creativesResult.data;
  if (creativesResult.data.length > 0) {
    const paths = creativesResult.data.map((c) => c.image_storage_path);
    const signedUrls = await getAdCreativeSignedUrls(paths);
    const urlMap = new Map(signedUrls.map((u) => [u.path, u.signedUrl]));
    creativesWithUrls = creativesResult.data.map((c) => ({
      ...c,
      image_url: urlMap.get(c.image_storage_path) ?? null,
    }));
  }

  let slotDetails: Record<string, unknown>[] = [];
  if (slotsResult.data.length > 0) {
    const admin = createAdminClient();
    const slotIds = slotsResult.data.map((s) => s.ad_slot_id);
    const { data: slots } = await admin
      .from("ad_slots")
      .select("*")
      .in("id", slotIds);
    slotDetails = (slots ?? []).map((slot) => {
      const assignment = slotsResult.data.find((a) => a.ad_slot_id === slot.id);
      return { ...slot, assignment_active: assignment?.is_active ?? false };
    });
  }

  const admin = createAdminClient();
  const [{ data: impressions }, { data: clicks }] = await Promise.all([
    admin
      .from("ad_impressions")
      .select("id", { count: "exact", head: true })
      .eq("ad_campaign_id", id),
    admin
      .from("ad_clicks")
      .select("id", { count: "exact", head: true })
      .eq("ad_campaign_id", id),
  ]);

  const impressionCount = (impressions as unknown as number) ?? 0;
  const clickCount = (clicks as unknown as number) ?? 0;

  return successResponse({
    campaign,
    creatives: creativesWithUrls,
    slots: slotDetails,
    metrics: {
      impressions: impressionCount,
      clicks: clickCount,
      ctr: impressionCount > 0 ? clickCount / impressionCount : 0,
    },
  });
});

export const PUT = createAdminRoute(async ({ request, data }) => {
  const id = extractId(request);
  if (!id) return errorResponse("Invalid campaign ID", 400);

  const { id: _bodyId, ...updateData } = data;
  const { data: campaign, error } = await updateCampaign(id, updateData);
  if (error) return errorResponse(error, 500);

  return successResponse({ campaign });
}, updateCampaignSchema);
