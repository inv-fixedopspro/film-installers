import { createAdminClient } from "@/lib/supabase/admin";
import type { AdTargetAudience } from "@/lib/types/database";

export interface ActiveAdCreative {
  creative_id: string;
  campaign_id: string;
  advertiser_id: string;
  image_storage_path: string;
  destination_url: string;
  alt_text: string;
  slot_type: string;
  width_px: number;
  height_px: number;
  priority_weight: number;
  rotation_interval_seconds: number;
}

export async function getActiveAdsForSlot(
  slotKey: string,
  pageContext: string,
  targetAudience: AdTargetAudience
): Promise<{ data: ActiveAdCreative[]; error: string | null }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: slot, error: slotError } = await admin
    .from("ad_slots")
    .select("id, slot_type")
    .eq("slot_key", slotKey)
    .eq("is_active", true)
    .maybeSingle();

  if (slotError || !slot) {
    return { data: [], error: slotError?.message ?? "Slot not found" };
  }

  const { data: assignments, error: assignError } = await admin
    .from("ad_campaign_slots")
    .select("campaign_id")
    .eq("ad_slot_id", slot.id)
    .eq("is_active", true);

  if (assignError || !assignments || assignments.length === 0) {
    return { data: [], error: assignError?.message ?? null };
  }

  const campaignIds = assignments.map((a) => a.campaign_id);

  const { data: campaigns, error: campError } = await admin
    .from("ad_campaigns")
    .select("id, advertiser_id, ad_package_id")
    .in("id", campaignIds)
    .eq("status", "active")
    .lte("starts_at", now)
    .gte("ends_at", now);

  if (campError || !campaigns || campaigns.length === 0) {
    return { data: [], error: campError?.message ?? null };
  }

  const activeCampaignIds = campaigns.map((c) => c.id);
  const packageIds = [...new Set(campaigns.map((c) => c.ad_package_id))];

  const { data: packages, error: pkgError } = await admin
    .from("ad_packages")
    .select("id, priority_weight, rotation_interval_seconds, target_audience")
    .in("id", packageIds);

  if (pkgError || !packages) {
    return { data: [], error: pkgError?.message ?? null };
  }

  const filteredPackages = packages.filter(
    (p) => p.target_audience === "all" || p.target_audience === targetAudience
  );
  const validPackageIds = new Set(filteredPackages.map((p) => p.id));
  const packageMap = new Map(filteredPackages.map((p) => [p.id, p]));

  const validCampaigns = campaigns.filter((c) => validPackageIds.has(c.ad_package_id));
  const validCampaignIds = validCampaigns.map((c) => c.id);

  if (validCampaignIds.length === 0) {
    return { data: [], error: null };
  }

  const { data: creatives, error: crError } = await admin
    .from("ad_creatives")
    .select("*")
    .in("campaign_id", validCampaignIds)
    .eq("slot_type", slot.slot_type)
    .eq("is_active", true);

  if (crError || !creatives) {
    return { data: [], error: crError?.message ?? null };
  }

  const campaignMap = new Map(validCampaigns.map((c) => [c.id, c]));

  const result: ActiveAdCreative[] = creatives.map((cr) => {
    const camp = campaignMap.get(cr.campaign_id)!;
    const pkg = packageMap.get(camp.ad_package_id)!;
    return {
      creative_id: cr.id,
      campaign_id: cr.campaign_id,
      advertiser_id: camp.advertiser_id,
      image_storage_path: cr.image_storage_path,
      destination_url: cr.destination_url,
      alt_text: cr.alt_text,
      slot_type: cr.slot_type,
      width_px: cr.width_px,
      height_px: cr.height_px,
      priority_weight: pkg.priority_weight,
      rotation_interval_seconds: pkg.rotation_interval_seconds,
    };
  });

  result.sort((a, b) => b.priority_weight - a.priority_weight);

  return { data: result, error: null };
}
