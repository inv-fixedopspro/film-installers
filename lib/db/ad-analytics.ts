import { createAdminClient } from "@/lib/supabase/admin";

export interface DateRangeParams {
  startDate: string;
  endDate: string;
}

export interface ImpressionRow {
  id: string;
  ad_campaign_id: string | null;
  ad_creative_id: string | null;
  ad_package_id: string | null;
  session_token: string;
  page_context: string;
  ad_slot: string;
  rendered_at: string;
}

export interface ClickRow {
  id: string;
  impression_id: string | null;
  ad_campaign_id: string | null;
  ad_creative_id: string | null;
  ad_package_id: string | null;
  session_token: string;
  page_context: string;
  clicked_at: string;
}

export async function getImpressionsByDateRange(
  params: DateRangeParams
): Promise<{ data: ImpressionRow[]; error: string | null }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ad_impressions")
    .select("*")
    .gte("rendered_at", params.startDate)
    .lte("rendered_at", params.endDate)
    .order("rendered_at", { ascending: false });

  return { data: data ?? [], error: error?.message ?? null };
}

export async function getClicksByDateRange(
  params: DateRangeParams
): Promise<{ data: ClickRow[]; error: string | null }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ad_clicks")
    .select("*")
    .gte("clicked_at", params.startDate)
    .lte("clicked_at", params.endDate)
    .order("clicked_at", { ascending: false });

  return { data: data ?? [], error: error?.message ?? null };
}

export interface CTRResult {
  id: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export async function getCTRByCampaign(
  params: DateRangeParams
): Promise<{ data: CTRResult[]; error: string | null }> {
  const admin = createAdminClient();

  const { data: impressions, error: impErr } = await admin
    .from("ad_impressions")
    .select("ad_campaign_id")
    .gte("rendered_at", params.startDate)
    .lte("rendered_at", params.endDate)
    .not("ad_campaign_id", "is", null);

  if (impErr) return { data: [], error: impErr.message };

  const { data: clicks, error: clickErr } = await admin
    .from("ad_clicks")
    .select("ad_campaign_id")
    .gte("clicked_at", params.startDate)
    .lte("clicked_at", params.endDate)
    .not("ad_campaign_id", "is", null);

  if (clickErr) return { data: [], error: clickErr.message };

  const impCounts = new Map<string, number>();
  for (const row of impressions ?? []) {
    if (row.ad_campaign_id) {
      impCounts.set(row.ad_campaign_id, (impCounts.get(row.ad_campaign_id) ?? 0) + 1);
    }
  }

  const clickCounts = new Map<string, number>();
  for (const row of clicks ?? []) {
    if (row.ad_campaign_id) {
      clickCounts.set(row.ad_campaign_id, (clickCounts.get(row.ad_campaign_id) ?? 0) + 1);
    }
  }

  const allIds = new Set([...impCounts.keys(), ...clickCounts.keys()]);
  const results: CTRResult[] = Array.from(allIds).map((id) => {
    const imp = impCounts.get(id) ?? 0;
    const clk = clickCounts.get(id) ?? 0;
    return { id, impressions: imp, clicks: clk, ctr: imp > 0 ? clk / imp : 0 };
  });

  return { data: results, error: null };
}

export async function getCTRBySlot(
  params: DateRangeParams
): Promise<{ data: CTRResult[]; error: string | null }> {
  const admin = createAdminClient();

  const { data: impressions, error: impErr } = await admin
    .from("ad_impressions")
    .select("ad_slot")
    .gte("rendered_at", params.startDate)
    .lte("rendered_at", params.endDate);

  if (impErr) return { data: [], error: impErr.message };

  const { data: clicks, error: clickErr } = await admin
    .from("ad_clicks")
    .select("ad_campaign_id, page_context")
    .gte("clicked_at", params.startDate)
    .lte("clicked_at", params.endDate);

  if (clickErr) return { data: [], error: clickErr.message };

  const impCounts = new Map<string, number>();
  for (const row of impressions ?? []) {
    if (row.ad_slot) {
      impCounts.set(row.ad_slot, (impCounts.get(row.ad_slot) ?? 0) + 1);
    }
  }

  const clickCounts = new Map<string, number>();
  for (const row of clicks ?? []) {
    if (row.page_context) {
      clickCounts.set(row.page_context, (clickCounts.get(row.page_context) ?? 0) + 1);
    }
  }

  const allIds = new Set([...impCounts.keys(), ...clickCounts.keys()]);
  const results: CTRResult[] = Array.from(allIds).map((id) => {
    const imp = impCounts.get(id) ?? 0;
    const clk = clickCounts.get(id) ?? 0;
    return { id, impressions: imp, clicks: clk, ctr: imp > 0 ? clk / imp : 0 };
  });

  return { data: results, error: null };
}

export interface SlotFillResult {
  slot_id: string;
  slot_key: string;
  display_name: string;
  active_campaigns: number;
}

export async function getSlotFillRate(): Promise<{ data: SlotFillResult[]; error: string | null }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: slots, error: slotErr } = await admin
    .from("ad_slots")
    .select("id, slot_key, display_name")
    .eq("is_active", true);

  if (slotErr || !slots) return { data: [], error: slotErr?.message ?? null };

  const { data: assignments, error: assErr } = await admin
    .from("ad_campaign_slots")
    .select("ad_slot_id, campaign_id")
    .eq("is_active", true);

  if (assErr) return { data: [], error: assErr.message };

  const campaignIds = [...new Set((assignments ?? []).map((a) => a.campaign_id))];

  let activeCampaignIds = new Set<string>();
  if (campaignIds.length > 0) {
    const { data: campaigns } = await admin
      .from("ad_campaigns")
      .select("id")
      .in("id", campaignIds)
      .eq("status", "active")
      .lte("starts_at", now)
      .gte("ends_at", now);

    activeCampaignIds = new Set((campaigns ?? []).map((c) => c.id));
  }

  const slotCounts = new Map<string, number>();
  for (const a of assignments ?? []) {
    if (activeCampaignIds.has(a.campaign_id)) {
      slotCounts.set(a.ad_slot_id, (slotCounts.get(a.ad_slot_id) ?? 0) + 1);
    }
  }

  const results: SlotFillResult[] = slots.map((s) => ({
    slot_id: s.id,
    slot_key: s.slot_key,
    display_name: s.display_name,
    active_campaigns: slotCounts.get(s.id) ?? 0,
  }));

  return { data: results, error: null };
}

export interface CampaignPerformance {
  campaign_id: string;
  campaign_name: string;
  advertiser_id: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
  total_price_cents: number;
}

export async function getCampaignPerformanceSummary(
  params?: DateRangeParams
): Promise<{ data: CampaignPerformance[]; error: string | null }> {
  const admin = createAdminClient();

  const { data: campaigns, error: campErr } = await admin
    .from("ad_campaigns")
    .select("id, campaign_name, advertiser_id, status, total_price_cents");

  if (campErr || !campaigns) return { data: [], error: campErr?.message ?? null };

  let impQuery = admin
    .from("ad_impressions")
    .select("ad_campaign_id")
    .not("ad_campaign_id", "is", null);

  let clickQuery = admin
    .from("ad_clicks")
    .select("ad_campaign_id")
    .not("ad_campaign_id", "is", null);

  if (params) {
    impQuery = impQuery
      .gte("rendered_at", params.startDate)
      .lte("rendered_at", params.endDate);
    clickQuery = clickQuery
      .gte("clicked_at", params.startDate)
      .lte("clicked_at", params.endDate);
  }

  const [{ data: impressions }, { data: clicks }] = await Promise.all([impQuery, clickQuery]);

  const impCounts = new Map<string, number>();
  for (const row of impressions ?? []) {
    if (row.ad_campaign_id) {
      impCounts.set(row.ad_campaign_id, (impCounts.get(row.ad_campaign_id) ?? 0) + 1);
    }
  }

  const clickCounts = new Map<string, number>();
  for (const row of clicks ?? []) {
    if (row.ad_campaign_id) {
      clickCounts.set(row.ad_campaign_id, (clickCounts.get(row.ad_campaign_id) ?? 0) + 1);
    }
  }

  const results: CampaignPerformance[] = campaigns.map((c) => {
    const imp = impCounts.get(c.id) ?? 0;
    const clk = clickCounts.get(c.id) ?? 0;
    return {
      campaign_id: c.id,
      campaign_name: c.campaign_name,
      advertiser_id: c.advertiser_id,
      status: c.status,
      impressions: imp,
      clicks: clk,
      ctr: imp > 0 ? clk / imp : 0,
      total_price_cents: c.total_price_cents,
    };
  });

  return { data: results, error: null };
}

export interface RevenueByPeriod {
  period: string;
  total_cents: number;
  campaign_count: number;
}

export async function getRevenueByPeriod(
  params: DateRangeParams,
  granularity: "day" | "week" | "month" = "month"
): Promise<{ data: RevenueByPeriod[]; error: string | null }> {
  const admin = createAdminClient();

  const { data: campaigns, error } = await admin
    .from("ad_campaigns")
    .select("total_price_cents, payment_status, paid_at, created_at")
    .eq("payment_status", "paid")
    .gte("paid_at", params.startDate)
    .lte("paid_at", params.endDate);

  if (error) return { data: [], error: error.message };

  const buckets = new Map<string, { total: number; count: number }>();

  for (const c of campaigns ?? []) {
    const date = new Date(c.paid_at ?? c.created_at);
    let key: string;

    if (granularity === "day") {
      key = date.toISOString().split("T")[0];
    } else if (granularity === "week") {
      const dayOfWeek = date.getDay();
      const diff = date.getDate() - dayOfWeek;
      const weekStart = new Date(date);
      weekStart.setDate(diff);
      key = weekStart.toISOString().split("T")[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }

    const existing = buckets.get(key) ?? { total: 0, count: 0 };
    existing.total += c.total_price_cents;
    existing.count += 1;
    buckets.set(key, existing);
  }

  const results: RevenueByPeriod[] = Array.from(buckets.entries())
    .map(([period, data]) => ({
      period,
      total_cents: data.total,
      campaign_count: data.count,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  return { data: results, error: null };
}
