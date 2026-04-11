import { createAdminClient } from "@/lib/supabase/admin";
import type { AdCreative, AdSlotType } from "@/lib/types/database";

type CreativeInsert = {
  campaign_id: string;
  label?: string;
  image_storage_path: string;
  destination_url: string;
  alt_text?: string;
  slot_type: AdSlotType;
  width_px: number;
  height_px: number;
  file_size_bytes?: number;
  is_active?: boolean;
};

export async function createCreative(
  data: CreativeInsert
): Promise<{ data: AdCreative | null; error: string | null }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("ad_creatives")
    .insert(data)
    .select()
    .single();

  return { data: row, error: error?.message ?? null };
}

export async function deleteCreative(
  id: string
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("ad_creatives")
    .delete()
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function listCreativesByCampaign(
  campaignId: string
): Promise<{ data: AdCreative[]; error: string | null }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ad_creatives")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  return { data: data ?? [], error: error?.message ?? null };
}

export async function toggleCreativeActive(
  id: string,
  isActive: boolean
): Promise<{ data: AdCreative | null; error: string | null }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("ad_creatives")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();

  return { data: row, error: error?.message ?? null };
}

export async function getCreative(
  id: string
): Promise<{ data: AdCreative | null; error: string | null }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("ad_creatives")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return { data: row, error: error?.message ?? null };
}
