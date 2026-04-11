"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BackLink, PageHeader, LoadingButton } from "@/components/shared";
import { Plus, PanelTop, Loader as Loader2, Pencil, Megaphone } from "lucide-react";
import {
  AD_SLOT_TYPES, AD_PAGE_CONTEXTS, AD_TARGET_AUDIENCES, AD_TRAFFIC_TIERS, AD_SLOT_DIMENSIONS,
} from "@/lib/constants/ad-system";
import type { AdSlot, AdSlotType, AdPageContext, AdTargetAudience, AdTrafficTier } from "@/lib/types/database";

interface SlotWithCount extends AdSlot {
  active_campaign_count: number;
}

interface SlotForm {
  slot_key: string;
  display_name: string;
  slot_type: AdSlotType;
  page_context: AdPageContext;
  width_px: number;
  height_px: number;
  max_file_size_kb: number;
  allowed_formats: string[];
  is_public_page: boolean;
  traffic_tier: AdTrafficTier;
  target_audience: AdTargetAudience;
  is_active: boolean;
  sort_order: number;
}

const EMPTY_FORM: SlotForm = {
  slot_key: "", display_name: "", slot_type: "banner", page_context: "home",
  width_px: 468, height_px: 60, max_file_size_kb: 2048,
  allowed_formats: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  is_public_page: true, traffic_tier: "high", target_audience: "all",
  is_active: true, sort_order: 0,
};

export default function SlotsPage() {
  const [slots, setSlots] = useState<SlotWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SlotForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchSlots = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/advertising/slots");
      const json = await res.json();
      if (json.success) setSlots(json.data?.slots ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (slot: SlotWithCount) => {
    setEditingId(slot.id);
    setForm({
      slot_key: slot.slot_key, display_name: slot.display_name, slot_type: slot.slot_type,
      page_context: slot.page_context, width_px: slot.width_px, height_px: slot.height_px,
      max_file_size_kb: slot.max_file_size_kb, allowed_formats: slot.allowed_formats,
      is_public_page: slot.is_public_page, traffic_tier: slot.traffic_tier,
      target_audience: slot.target_audience, is_active: slot.is_active, sort_order: slot.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSlotTypeChange = (type: AdSlotType) => {
    const dims = AD_SLOT_DIMENSIONS[type];
    setForm((f) => ({ ...f, slot_type: type, width_px: dims.width, height_px: dims.height }));
  };

  const handlePageContextChange = (ctx: AdPageContext) => {
    const pc = AD_PAGE_CONTEXTS.find((p) => p.value === ctx);
    setForm((f) => ({
      ...f, page_context: ctx,
      is_public_page: pc?.isPublic ?? false,
      traffic_tier: pc?.trafficTier ?? "medium",
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/advertising/slots/${editingId}` : "/api/admin/advertising/slots";
      const method = editingId ? "PUT" : "POST";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setDialogOpen(false);
      setLoading(true);
      await fetchSlots();
    } finally {
      setSaving(false);
    }
  };

  const scaleFactor = (w: number) => Math.min(1, 200 / w);

  return (
    <div className="space-y-6">
      <BackLink href="/admin/ad-space" label="Back to Ad Space" />
      <PageHeader
        title="Ad Slots"
        description="Define and manage ad placement positions across the platform"
        action={<Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Add Slot</Button>}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !slots.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="p-3 rounded-full bg-muted"><PanelTop className="w-6 h-6 text-muted-foreground" /></div>
            <p className="font-medium">No slots defined</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {slots.map((slot) => {
            const scale = scaleFactor(slot.width_px);
            return (
              <Card key={slot.id} className="cursor-pointer transition-colors hover:bg-accent/40" onClick={() => openEdit(slot)}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{slot.display_name}</p>
                      <Badge variant={slot.is_active ? "default" : "secondary"} className="text-xs">
                        {slot.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <Pencil className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                  <div className="flex justify-center py-2">
                    <div
                      className="border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center"
                      style={{ width: slot.width_px * scale, height: slot.height_px * scale }}
                    >
                      <span className="text-xs text-muted-foreground">{slot.width_px}x{slot.height_px}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">{slot.page_context}</Badge>
                    <Badge variant="outline" className="text-xs">{slot.traffic_tier}</Badge>
                    <Badge variant="outline" className="text-xs">{slot.target_audience}</Badge>
                    {slot.active_campaign_count > 0 && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Megaphone className="w-3 h-3" />{slot.active_campaign_count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{slot.slot_key}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Slot" : "New Slot"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Display Name *</Label>
                <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Slot Key *</Label>
                <Input value={form.slot_key} onChange={(e) => setForm({ ...form, slot_key: e.target.value })} placeholder="home_banner_top" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Slot Type</Label>
                <Select value={form.slot_type} onValueChange={(v) => handleSlotTypeChange(v as AdSlotType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AD_SLOT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Page Context</Label>
                <Select value={form.page_context} onValueChange={(v) => handlePageContextChange(v as AdPageContext)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AD_PAGE_CONTEXTS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Width (px)</Label>
                <Input type="number" value={form.width_px} onChange={(e) => setForm({ ...form, width_px: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Height (px)</Label>
                <Input type="number" value={form.height_px} onChange={(e) => setForm({ ...form, height_px: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Traffic Tier</Label>
                <Select value={form.traffic_tier} onValueChange={(v) => setForm({ ...form, traffic_tier: v as AdTrafficTier })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AD_TRAFFIC_TIERS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Target Audience</Label>
                <Select value={form.target_audience} onValueChange={(v) => setForm({ ...form, target_audience: v as AdTargetAudience })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AD_TARGET_AUDIENCES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
              <div className="flex items-center justify-between pt-6">
                <Label className="text-sm">Active</Label>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <LoadingButton loading={saving} onClick={handleSave} disabled={!form.display_name || !form.slot_key}>
              {editingId ? "Save Changes" : "Create Slot"}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
