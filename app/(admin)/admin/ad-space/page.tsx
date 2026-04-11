"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared";
import { ChartBar as BarChart3, DollarSign, Eye, Loader as Loader2, Users, Package, PanelTop, Megaphone, TrendingUp, ArrowRight } from "lucide-react";
import { getCampaignStatusConfig, getPaymentStatusConfig, formatCents } from "@/lib/constants/ad-system";
import type { AdCampaign } from "@/lib/types/database";

const NAV_ITEMS = [
  { href: "/admin/ad-space/advertisers", label: "Advertisers", icon: Users, description: "Manage advertiser accounts" },
  { href: "/admin/ad-space/packages", label: "Packages", icon: Package, description: "Configure ad tiers" },
  { href: "/admin/ad-space/slots", label: "Slots", icon: PanelTop, description: "Manage ad placements" },
  { href: "/admin/ad-space/campaigns", label: "Campaigns", icon: Megaphone, description: "Manage campaigns" },
  { href: "/admin/ad-space/analytics", label: "Analytics", icon: BarChart3, description: "Performance reports" },
];

export default function AdminAdSpacePage() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [emptySlots, setEmptySlots] = useState(0);
  const [revenueThisMonth, setRevenueThisMonth] = useState(0);
  const [impressions, setImpressions] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

      const [campRes, slotRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/advertising/campaigns"),
        fetch("/api/admin/advertising/slots"),
        fetch(`/api/admin/advertising/analytics?start_date=${start}&end_date=${end}&granularity=month`),
      ]);

      const [campJson, slotJson, analyticsJson] = await Promise.all([
        campRes.json(), slotRes.json(), analyticsRes.json(),
      ]);

      const allCampaigns: AdCampaign[] = campJson.success ? campJson.data?.campaigns ?? [] : [];
      const slots = slotJson.success ? slotJson.data?.slots ?? [] : [];
      const analytics = analyticsJson.success ? analyticsJson.data : null;

      setCampaigns(allCampaigns.filter((c) => c.status === "active"));

      const activeSlots = slots.filter((s: { is_active: boolean }) => s.is_active);
      const occupied = slots.filter((s: { active_campaign_count: number; is_active: boolean }) => s.is_active && s.active_campaign_count > 0);
      setEmptySlots(activeSlots.length - occupied.length);

      setRevenueThisMonth(
        allCampaigns.filter((c) => c.payment_status === "paid").reduce((sum: number, c) => sum + c.total_price_cents, 0)
      );
      setImpressions(analytics?.summary?.total_impressions ?? 0);
      setClicks(analytics?.summary?.total_clicks ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-8">
      <PageHeader title="Ad Space Management" description="Manage platform advertising campaigns and placements" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard icon={Megaphone} label="Active Campaigns" value={String(campaigns.length)} />
        <MetricCard icon={DollarSign} label="Revenue (Paid)" value={formatCents(revenueThisMonth)} />
        <MetricCard icon={Eye} label="Impressions" value={impressions.toLocaleString()} />
        <MetricCard icon={TrendingUp} label="CTR" value={`${ctr}%`} />
        <MetricCard icon={PanelTop} label="Empty Slots" value={String(emptySlots)} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full transition-colors hover:bg-accent/40 cursor-pointer group">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {!campaigns.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">No active campaigns</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Campaign</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Payment</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Date Range</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const sCfg = getCampaignStatusConfig(c.status);
                    const pCfg = getPaymentStatusConfig(c.payment_status);
                    return (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-4">
                          <Link href={`/admin/ad-space/campaigns/${c.id}`} className="font-medium hover:underline">
                            {c.campaign_name}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge className={`text-xs ${sCfg.color}`}>{sCfg.label}</Badge>
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge className={`text-xs ${pCfg.color}`}>{pCfg.label}</Badge>
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {c.starts_at ? new Date(c.starts_at).toLocaleDateString() : "—"}
                          {" – "}
                          {c.ends_at ? new Date(c.ends_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-2.5 text-right font-medium">{formatCents(c.total_price_cents)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-muted">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
