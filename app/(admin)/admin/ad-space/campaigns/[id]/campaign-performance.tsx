"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, MousePointer, TrendingUp } from "lucide-react";
import type { AdCreative, AdSlot } from "@/lib/types/database";

interface CreativeWithUrl extends AdCreative {
  image_url?: string | null;
}

interface SlotWithAssignment extends AdSlot {
  assignment_active: boolean;
}

interface CampaignPerformanceProps {
  metrics: { impressions: number; clicks: number; ctr: number };
  creatives: CreativeWithUrl[];
  slots: SlotWithAssignment[];
}

const METRICS = [
  { key: "impressions" as const, label: "Impressions", icon: Eye },
  { key: "clicks" as const, label: "Clicks", icon: MousePointer },
  { key: "ctr" as const, label: "CTR", icon: TrendingUp },
];

function fmtMetric(key: "impressions" | "clicks" | "ctr", value: number): string {
  if (key === "ctr") return `${(value * 100).toFixed(2)}%`;
  return value.toLocaleString();
}

export function CampaignPerformance({ metrics, creatives, slots }: CampaignPerformanceProps) {
  const activeCreatives = creatives.filter((c) => c.is_active);
  const activeSlots = slots.filter((s) => s.assignment_active);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {METRICS.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="p-2 rounded-md bg-background">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold">{fmtMetric(key, metrics[key])}</p>
              </div>
            </div>
          ))}
        </div>

        {activeCreatives.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">By Creative ({activeCreatives.length} active)</p>
            <div className="space-y-1">
              {activeCreatives.map((creative) => (
                <div key={creative.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-medium truncate">{creative.label || "Untitled"}</p>
                    <Badge variant="outline" className="text-xs flex-shrink-0">{creative.slot_type}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {creative.width_px}x{creative.height_px}px
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSlots.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">By Slot ({activeSlots.length} assigned)</p>
            <div className="space-y-1">
              {activeSlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-medium truncate">{slot.display_name}</p>
                    <Badge variant="outline" className="text-xs flex-shrink-0">{slot.page_context}</Badge>
                  </div>
                  <Badge variant="outline" className="text-xs">{slot.target_audience}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeCreatives.length === 0 && activeSlots.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active creatives or slots assigned yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
