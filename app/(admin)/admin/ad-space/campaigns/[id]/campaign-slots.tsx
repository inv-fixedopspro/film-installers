"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader as Loader2 } from "lucide-react";
import type { AdSlot, AdPackage } from "@/lib/types/database";

interface SlotWithAssignment extends AdSlot {
  assignment_active: boolean;
}

interface AllSlotWithCount extends AdSlot {
  active_campaign_count: number;
}

interface CampaignSlotsProps {
  campaignId: string;
  assignedSlots: SlotWithAssignment[];
  pkg: AdPackage | null;
  onRefresh: () => void;
}

export function CampaignSlots({ campaignId, assignedSlots, pkg, onRefresh }: CampaignSlotsProps) {
  const [allSlots, setAllSlots] = useState<AllSlotWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const assignedIds = new Set(assignedSlots.map((s) => s.id));

  const fetchSlots = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/advertising/slots?active_only=true");
      const json = await res.json();
      if (json.success) setAllSlots(json.data?.slots ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const isCompatible = (slot: AllSlotWithCount): boolean => {
    if (!pkg) return true;
    const typeMatch = pkg.included_slot_types.includes(slot.slot_type);
    const ctxMatch = pkg.included_page_contexts.includes(slot.page_context);
    return typeMatch && ctxMatch;
  };

  const handleToggle = async (slotId: string, assign: boolean) => {
    setToggling(slotId);
    try {
      if (assign) {
        await fetch(`/api/admin/advertising/campaigns/${campaignId}/slots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ad_slot_id: slotId }),
        });
      } else {
        await fetch(`/api/admin/advertising/campaigns/${campaignId}/slots`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ad_slot_id: slotId }),
        });
      }
      onRefresh();
    } finally {
      setToggling(null);
    }
  };

  const compatible = allSlots.filter(isCompatible);
  const incompatible = allSlots.filter((s) => !isCompatible(s));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Slot Assignments ({assignedSlots.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : allSlots.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No active slots defined.</p>
        ) : (
          <div className="space-y-4">
            {compatible.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Compatible Slots</p>
                {compatible.map((slot) => {
                  const isAssigned = assignedIds.has(slot.id);
                  return (
                    <label key={slot.id} className="flex items-center gap-3 p-2 border rounded-md cursor-pointer hover:bg-accent/30 transition-colors">
                      <Checkbox
                        checked={isAssigned}
                        disabled={toggling === slot.id}
                        onCheckedChange={(checked) => handleToggle(slot.id, !!checked)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{slot.display_name}</p>
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">{slot.page_context}</Badge>
                          <Badge variant="outline" className="text-xs">{slot.slot_type}</Badge>
                          <span className="text-xs text-muted-foreground">{slot.width_px}x{slot.height_px}</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {incompatible.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Incompatible Slots</p>
                {incompatible.map((slot) => (
                  <div key={slot.id} className="flex items-center gap-3 p-2 border rounded-md opacity-40">
                    <Checkbox checked={false} disabled />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{slot.display_name}</p>
                      <div className="flex gap-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">{slot.page_context}</Badge>
                        <Badge variant="outline" className="text-xs">{slot.slot_type}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
