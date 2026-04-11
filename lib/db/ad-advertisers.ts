import { createAdminClient } from "@/lib/supabase/admin";
import type { Advertiser } from "@/lib/types/database";

type AdvertiserInsert = {
  name: string;
  contact_email: string;
  contact_phone?: string | null;
  company_url?: string | null;
  notes?: string | null;
  is_active?: boolean;
};

type AdvertiserUpdate = Partial<AdvertiserInsert>;

export async function createAdvertiser(
  data: AdvertiserInsert
): Promise<{ data: Advertiser | null; error: string | null }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("advertisers")
    .insert(data)
    .select()
    .single();

  return { data: row, error: error?.message ?? null };
}

export async function updateAdvertiser(
  id: string,
  data: AdvertiserUpdate
): Promise<{ data: Advertiser | null; error: string | null }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("advertisers")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  return { data: row, error: error?.message ?? null };
}

export async function getAdvertiser(
  id: string
): Promise<{ data: Advertiser | null; error: string | null }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("advertisers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return { data: row, error: error?.message ?? null };
}

export async function listAdvertisers(
  filters?: { activeOnly?: boolean }
): Promise<{ data: Advertiser[]; error: string | null }> {
  const admin = createAdminClient();
  let query = admin
    .from("advertisers")
    .select("*")
    .order("name", { ascending: true });

  if (filters?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  return { data: data ?? [], error: error?.message ?? null };
}
