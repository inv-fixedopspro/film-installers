import { createAdminClient } from "@/lib/supabase/admin";
import type { AdCampaignSlot, AdSlot } from "@/lib/types/database";

export async function assignCampaignToSlot(
  campaignId: string,
  adSlotId: string
): Promise<{ data: AdCampaignSlot | null; error: string | null }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("ad_campaign_slots")
    .insert({ campaign_id: campaignId, ad_slot_id: adSlotId })
    .select()
    .single();

  return { data: row, error: error?.message ?? null };
}

export async function removeCampaignFromSlot(
  campaignId: string,
  adSlotId: string
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("ad_campaign_slots")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("ad_slot_id", adSlotId);

  return { error: error?.message ?? null };
}

export async function listCampaignSlots(
  campaignId: string
): Promise<{ data: AdCampaignSlot[]; error: string | null }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ad_campaign_slots")
    .select("*")
    .eq("campaign_id", campaignId);

  return { data: data ?? [], error: error?.message ?? null };
}

export async function listAvailableSlotsForPackage(
  includedSlotTypes: string[],
  includedPageContexts: string[]
): Promise<{ data: AdSlot[]; error: string | null }> {
  const admin = createAdminClient();
  let query = admin
    .from("ad_slots")
    .select("*")
    .eq("is_active", true)
    .order("page_context")
    .order("sort_order", { ascending: true });

  if (includedSlotTypes.length > 0) {
    query = query.in("slot_type", includedSlotTypes);
  }
  if (includedPageContexts.length > 0) {
    query = query.in("page_context", includedPageContexts);
  }

  const { data, error } = await query;
  return { data: data ?? [], error: error?.message ?? null };
}
