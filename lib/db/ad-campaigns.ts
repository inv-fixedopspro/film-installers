import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdCampaign,
  AdCampaignStatus,
  AdPaymentStatus,
} from "@/lib/types/database";

type CampaignInsert = {
  advertiser_id: string;
  ad_package_id: string;
  campaign_name: string;
  status?: AdCampaignStatus;
  starts_at?: string | null;
  ends_at?: string | null;
  admin_notes?: string | null;
  total_price_cents?: number;
  payment_status?: AdPaymentStatus;
  invoice_reference?: string | null;
  paid_at?: string | null;
  created_by: string;
};

type CampaignUpdate = Partial<Omit<CampaignInsert, "created_by">>;

export async function createCampaign(
  data: CampaignInsert
): Promise<{ data: AdCampaign | null; error: string | null }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("ad_campaigns")
    .insert(data)
    .select()
    .single();

  return { data: row, error: error?.message ?? null };
}

export async function updateCampaign(
  id: string,
  data: CampaignUpdate
): Promise<{ data: AdCampaign | null; error: string | null }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("ad_campaigns")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  return { data: row, error: error?.message ?? null };
}

export async function updateCampaignStatus(
  id: string,
  status: AdCampaignStatus
): Promise<{ data: AdCampaign | null; error: string | null }> {
  return updateCampaign(id, { status });
}

export async function getCampaign(
  id: string
): Promise<{ data: AdCampaign | null; error: string | null }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("ad_campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return { data: row, error: error?.message ?? null };
}

export interface CampaignFilters {
  status?: AdCampaignStatus;
  advertiserId?: string;
  startAfter?: string;
  endBefore?: string;
}

export async function listCampaigns(
  filters?: CampaignFilters
): Promise<{ data: AdCampaign[]; error: string | null }> {
  const admin = createAdminClient();
  let query = admin
    .from("ad_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.advertiserId) {
    query = query.eq("advertiser_id", filters.advertiserId);
  }
  if (filters?.startAfter) {
    query = query.gte("starts_at", filters.startAfter);
  }
  if (filters?.endBefore) {
    query = query.lte("ends_at", filters.endBefore);
  }

  const { data, error } = await query;
  return { data: data ?? [], error: error?.message ?? null };
}
