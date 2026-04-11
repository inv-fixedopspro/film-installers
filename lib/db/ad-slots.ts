import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdSlot,
  AdSlotType,
  AdPageContext,
  AdTrafficTier,
  AdTargetAudience,
} from "@/lib/types/database";

type SlotInsert = {
  slot_key: string;
  display_name: string;
  slot_type: AdSlotType;
  page_context: AdPageContext;
  width_px: number;
  height_px: number;
  max_file_size_kb?: number;
  allowed_formats?: string[];
  is_public_page?: boolean;
  traffic_tier?: AdTrafficTier;
  target_audience?: AdTargetAudience;
  is_active?: boolean;
  sort_order?: number;
};

type SlotUpdate = Partial<SlotInsert>;

export async function createSlot(
  data: SlotInsert
): Promise<{ data: AdSlot | null; error: string | null }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("ad_slots")
    .insert(data)
    .select()
    .single();

  return { data: row, error: error?.message ?? null };
}

export async function updateSlot(
  id: string,
  data: SlotUpdate
): Promise<{ data: AdSlot | null; error: string | null }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("ad_slots")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  return { data: row, error: error?.message ?? null };
}

export async function getSlot(
  id: string
): Promise<{ data: AdSlot | null; error: string | null }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("ad_slots")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return { data: row, error: error?.message ?? null };
}

export async function getSlotByKey(
  slotKey: string
): Promise<{ data: AdSlot | null; error: string | null }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("ad_slots")
    .select("*")
    .eq("slot_key", slotKey)
    .maybeSingle();

  return { data: row, error: error?.message ?? null };
}

export interface SlotFilters {
  pageContext?: AdPageContext;
  slotType?: AdSlotType;
  trafficTier?: AdTrafficTier;
  targetAudience?: AdTargetAudience;
  activeOnly?: boolean;
}

export async function listSlots(
  filters?: SlotFilters
): Promise<{ data: AdSlot[]; error: string | null }> {
  const admin = createAdminClient();
  let query = admin
    .from("ad_slots")
    .select("*")
    .order("page_context")
    .order("sort_order", { ascending: true });

  if (filters?.pageContext) {
    query = query.eq("page_context", filters.pageContext);
  }
  if (filters?.slotType) {
    query = query.eq("slot_type", filters.slotType);
  }
  if (filters?.trafficTier) {
    query = query.eq("traffic_tier", filters.trafficTier);
  }
  if (filters?.targetAudience) {
    query = query.eq("target_audience", filters.targetAudience);
  }
  if (filters?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  return { data: data ?? [], error: error?.message ?? null };
}
