import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdPackage,
  AdPackageTier,
  AdTargetAudience,
  AdSlotType,
  AdPageContext,
} from "@/lib/types/database";

type PackageInsert = {
  name: string;
  tier?: AdPackageTier;
  price_cents: number;
  duration_days?: number;
  max_creatives?: number;
  included_slot_types?: AdSlotType[];
  included_page_contexts?: AdPageContext[];
  target_audience?: AdTargetAudience;
  rotation_interval_seconds?: number;
  priority_weight?: number;
  is_active?: boolean;
};

type PackageUpdate = Partial<PackageInsert>;

export async function createPackage(
  data: PackageInsert
): Promise<{ data: AdPackage | null; error: string | null }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("ad_packages")
    .insert(data)
    .select()
    .single();

  return { data: row, error: error?.message ?? null };
}

export async function updatePackage(
  id: string,
  data: PackageUpdate
): Promise<{ data: AdPackage | null; error: string | null }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("ad_packages")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  return { data: row, error: error?.message ?? null };
}

export async function getPackage(
  id: string
): Promise<{ data: AdPackage | null; error: string | null }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("ad_packages")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return { data: row, error: error?.message ?? null };
}

export async function listPackages(
  filters?: { activeOnly?: boolean }
): Promise<{ data: AdPackage[]; error: string | null }> {
  const admin = createAdminClient();
  let query = admin
    .from("ad_packages")
    .select("*")
    .order("priority_weight", { ascending: false });

  if (filters?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  return { data: data ?? [], error: error?.message ?? null };
}
