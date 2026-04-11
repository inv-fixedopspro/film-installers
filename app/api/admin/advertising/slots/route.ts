import { createAdminRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse } from "@/lib/api/response";
import { createSlot, listSlots } from "@/lib/db/ad-slots";
import type { AdPageContext, AdSlotType, AdTrafficTier, AdTargetAudience } from "@/lib/types/database";
import { createSlotSchema } from "@/lib/validations/advertising";
import { createAdminClient } from "@/lib/supabase/admin";

export const GET = createAdminRoute(async ({ request }) => {
  const url = new URL(request.url);
  const pageContext = url.searchParams.get("page_context") as AdPageContext | null;
  const slotType = url.searchParams.get("slot_type") as AdSlotType | null;
  const trafficTier = url.searchParams.get("traffic_tier") as AdTrafficTier | null;
  const targetAudience = url.searchParams.get("target_audience") as AdTargetAudience | null;
  const activeOnly = url.searchParams.get("active_only") === "true";

  const { data: slots, error } = await listSlots({
    pageContext: pageContext ?? undefined,
    slotType: slotType ?? undefined,
    trafficTier: trafficTier ?? undefined,
    targetAudience: targetAudience ?? undefined,
    activeOnly,
  });

  if (error) return errorResponse("Failed to fetch slots", 500);

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const slotIds = slots.map((s) => s.id);
  let occupancyCounts: Record<string, number> = {};

  if (slotIds.length > 0) {
    const { data: assignments } = await admin
      .from("ad_campaign_slots")
      .select("ad_slot_id, campaign_id")
      .in("ad_slot_id", slotIds)
      .eq("is_active", true);

    if (assignments && assignments.length > 0) {
      const campaignIds = [...new Set(assignments.map((a) => a.campaign_id))];
      const { data: activeCampaigns } = await admin
        .from("ad_campaigns")
        .select("id")
        .in("id", campaignIds)
        .eq("status", "active")
        .lte("starts_at", now)
        .gte("ends_at", now);

      const activeCampaignSet = new Set((activeCampaigns ?? []).map((c) => c.id));

      for (const a of assignments) {
        if (activeCampaignSet.has(a.campaign_id)) {
          occupancyCounts[a.ad_slot_id] = (occupancyCounts[a.ad_slot_id] ?? 0) + 1;
        }
      }
    }
  }

  const slotsWithOccupancy = slots.map((s) => ({
    ...s,
    active_campaign_count: occupancyCounts[s.id] ?? 0,
  }));

  return successResponse({ slots: slotsWithOccupancy });
});

export const POST = createAdminRoute(async ({ data }) => {
  const { data: slot, error } = await createSlot(data);
  if (error) return errorResponse(error, 500);

  return successResponse({ slot }, 201);
}, createSlotSchema);
