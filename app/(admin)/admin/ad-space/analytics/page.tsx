"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BackLink, PageHeader, LoadingButton } from "@/components/shared";
import { Eye, MousePointer, TrendingUp, DollarSign, Loader as Loader2, ChartBar as BarChart3 } from "lucide-react";

interface AnalyticsData {
  summary: { total_impressions: number; total_clicks: number; overall_ctr: number };
  ctr_breakdown: { id: string; name: string; impressions: number; clicks: number; ctr: number }[];
  slot_fill_rates: { slot_id: string; slot_name: string; active_campaigns: number; fill_rate: number }[];
  campaign_performance: { campaign_id: string; campaign_name: string; advertiser_name: string; impressions: number; clicks: number; ctr: number; revenue_cents: number }[];
  revenue: { period: string; revenue_cents: number }[];
}

function fmtCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function getDefaultRange() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
}

export default function AnalyticsPage() {
  const defaults = getDefaultRange();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [groupBy, setGroupBy] = useState<"campaign" | "slot">("campaign");
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("month");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ start_date: startDate, end_date: endDate, group_by: groupBy, granularity });
      const res = await fetch(`/api/admin/advertising/analytics?${params}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [startDate, endDate, groupBy, granularity]);

  const totalRevenue = data?.campaign_performance?.reduce((sum, c) => sum + c.revenue_cents, 0) ?? 0;

  return (
    <div className="space-y-6">
      <BackLink href="/admin/ad-space" label="Back to Ad Space" />
      <PageHeader title="Analytics" description="Aggregate advertising performance and revenue" />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Date</Label>
              <Input type="date" className="h-9 w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End Date</Label>
              <Input type="date" className="h-9 w-40" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Group By</Label>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "campaign" | "slot")}>
                <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="slot">Slot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Granularity</Label>
              <Select value={granularity} onValueChange={(v) => setGranularity(v as "day" | "week" | "month")}>
                <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <LoadingButton onClick={fetchAnalytics} loading={loading} size="sm">
              Fetch Data
            </LoadingButton>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && fetched && !data && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="p-3 rounded-full bg-muted"><BarChart3 className="w-6 h-6 text-muted-foreground" /></div>
            <p className="font-medium">No data available</p>
            <p className="text-sm text-muted-foreground">Try adjusting your date range.</p>
          </CardContent>
        </Card>
      )}

      {!loading && data && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard icon={Eye} label="Impressions" value={data.summary.total_impressions.toLocaleString()} />
            <SummaryCard icon={MousePointer} label="Clicks" value={data.summary.total_clicks.toLocaleString()} />
            <SummaryCard icon={TrendingUp} label="CTR" value={`${(data.summary.overall_ctr * 100).toFixed(2)}%`} />
            <SummaryCard icon={DollarSign} label="Revenue" value={fmtCurrency(totalRevenue)} />
          </div>

          {data.revenue.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Revenue by Period</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.revenue.map((row, i) => {
                    const maxRev = Math.max(...data.revenue.map((r) => r.revenue_cents), 1);
                    const pct = (row.revenue_cents / maxRev) * 100;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-24 flex-shrink-0">{row.period}</span>
                        <div className="flex-1 h-6 bg-muted/30 rounded overflow-hidden">
                          <div className="h-full bg-emerald-500/70 rounded transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-medium w-24 text-right flex-shrink-0">{fmtCurrency(row.revenue_cents)}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {data.ctr_breakdown.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">CTR Breakdown (by {groupBy})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.ctr_breakdown.map((row) => (
                    <div key={row.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <p className="text-sm font-medium truncate flex-1 min-w-0">{row.name}</p>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">{row.impressions.toLocaleString()} imp</span>
                        <span className="text-xs text-muted-foreground">{row.clicks.toLocaleString()} clicks</span>
                        <Badge variant="outline" className="text-xs">{(row.ctr * 100).toFixed(2)}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data.slot_fill_rates.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Slot Fill Rates</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.slot_fill_rates.map((slot) => (
                    <div key={slot.slot_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{slot.slot_name}</p>
                        <Badge variant="outline" className="text-xs flex-shrink-0">{slot.active_campaigns} campaigns</Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-20 h-2 bg-muted/30 rounded overflow-hidden">
                          <div className="h-full bg-blue-500/70 rounded transition-all" style={{ width: `${Math.min(slot.fill_rate * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs font-medium w-12 text-right">{(slot.fill_rate * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data.campaign_performance.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Campaign Performance</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Campaign</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Advertiser</th>
                        <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Impressions</th>
                        <th className="text-right py-2 pr-4 font-medium text-muted-foreground">Clicks</th>
                        <th className="text-right py-2 pr-4 font-medium text-muted-foreground">CTR</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.campaign_performance.map((row) => (
                        <tr key={row.campaign_id} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium truncate max-w-[200px]">{row.campaign_name}</td>
                          <td className="py-2 pr-4 text-muted-foreground truncate max-w-[150px]">{row.advertiser_name}</td>
                          <td className="py-2 pr-4 text-right">{row.impressions.toLocaleString()}</td>
                          <td className="py-2 pr-4 text-right">{row.clicks.toLocaleString()}</td>
                          <td className="py-2 pr-4 text-right">{(row.ctr * 100).toFixed(2)}%</td>
                          <td className="py-2 text-right font-medium">{fmtCurrency(row.revenue_cents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-muted"><Icon className="w-4 h-4 text-muted-foreground" /></div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
