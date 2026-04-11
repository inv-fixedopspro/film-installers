"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BackLink, PageHeader, LoadingButton } from "@/components/shared";
import { Plus, Package, Loader as Loader2, Pencil } from "lucide-react";
import {
  AD_PACKAGE_TIERS,
  AD_DURATION_OPTIONS,
  AD_SLOT_TYPES,
  AD_PAGE_CONTEXTS,
  AD_TARGET_AUDIENCES,
  formatCents,
} from "@/lib/constants/ad-system";
import type { AdPackage, AdSlotType, AdPageContext, AdPackageTier, AdTargetAudience } from "@/lib/types/database";

interface PackageForm {
  name: string;
  tier: AdPackageTier;
  price_cents: number;
  duration_days: number;
  max_creatives: number;
  included_slot_types: AdSlotType[];
  included_page_contexts: AdPageContext[];
  target_audience: AdTargetAudience;
  rotation_interval_seconds: number;
  priority_weight: number;
  is_active: boolean;
}

const EMPTY_FORM: PackageForm = {
  name: "", tier: "starter", price_cents: 0, duration_days: 30, max_creatives: 3,
  included_slot_types: [], included_page_contexts: [], target_audience: "all",
  rotation_interval_seconds: 4, priority_weight: 1, is_active: true,
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PackageForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [priceInput, setPriceInput] = useState("");

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/advertising/packages");
      const json = await res.json();
      if (json.success) setPackages(json.data?.packages ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPriceInput("");
    setDialogOpen(true);
  };

  const openEdit = (pkg: AdPackage) => {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name, tier: pkg.tier, price_cents: pkg.price_cents, duration_days: pkg.duration_days,
      max_creatives: pkg.max_creatives, included_slot_types: pkg.included_slot_types,
      included_page_contexts: pkg.included_page_contexts, target_audience: pkg.target_audience,
      rotation_interval_seconds: pkg.rotation_interval_seconds, priority_weight: pkg.priority_weight,
      is_active: pkg.is_active,
    });
    setPriceInput(String(pkg.price_cents / 100));
    setDialogOpen(true);
  };

  const toggleSlotType = (type: AdSlotType) => {
    setForm((f) => ({
      ...f,
      included_slot_types: f.included_slot_types.includes(type)
        ? f.included_slot_types.filter((t) => t !== type)
        : [...f.included_slot_types, type],
    }));
  };

  const togglePageContext = (ctx: AdPageContext) => {
    setForm((f) => ({
      ...f,
      included_page_contexts: f.included_page_contexts.includes(ctx)
        ? f.included_page_contexts.filter((c) => c !== ctx)
        : [...f.included_page_contexts, ctx],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/advertising/packages/${editingId}`
        : "/api/admin/advertising/packages";
      const method = editingId ? "PUT" : "POST";
      const body = { ...form, price_cents: Math.round(parseFloat(priceInput || "0") * 100) };
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setDialogOpen(false);
      setLoading(true);
      await fetchPackages();
    } finally {
      setSaving(false);
    }
  };

  const tierLabel = (tier: AdPackageTier) => AD_PACKAGE_TIERS.find((t) => t.value === tier)?.label ?? tier;

  return (
    <div className="space-y-6">
      <BackLink href="/admin/ad-space" label="Back to Ad Space" />
      <PageHeader
        title="Ad Packages"
        description="Configure purchasable advertising tiers"
        action={<Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Add Package</Button>}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !packages.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="p-3 rounded-full bg-muted"><Package className="w-6 h-6 text-muted-foreground" /></div>
            <p className="font-medium">No packages yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="cursor-pointer transition-colors hover:bg-accent/40" onClick={() => openEdit(pkg)}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{pkg.name}</p>
                    <Badge variant={pkg.is_active ? "default" : "secondary"} className="text-xs">{pkg.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold">{formatCents(pkg.price_cents)}</span>
                  <span className="text-sm text-muted-foreground">/ {pkg.duration_days}d</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">{tierLabel(pkg.tier)}</Badge>
                  <Badge variant="outline" className="text-xs">{pkg.max_creatives} creatives</Badge>
                  <Badge variant="outline" className="text-xs">{AD_TARGET_AUDIENCES.find((a) => a.value === pkg.target_audience)?.label}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {pkg.included_slot_types.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Package" : "New Package"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Tier</Label>
                <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v as AdPackageTier })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AD_PACKAGE_TIERS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Price (USD) *</Label>
                <Input type="number" min="0" step="0.01" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Duration</Label>
                <Select value={String(form.duration_days)} onValueChange={(v) => setForm({ ...form, duration_days: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AD_DURATION_OPTIONS.map((d) => <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Max Creatives</Label>
                <Input type="number" min="1" value={form.max_creatives} onChange={(e) => setForm({ ...form, max_creatives: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Priority Weight</Label>
                <Input type="number" min="1" value={form.priority_weight} onChange={(e) => setForm({ ...form, priority_weight: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Rotation (sec)</Label>
                <Input type="number" min="1" value={form.rotation_interval_seconds} onChange={(e) => setForm({ ...form, rotation_interval_seconds: Number(e.target.value) })} />
              </div>
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
            <div className="space-y-1.5">
              <Label className="text-sm">Included Slot Types</Label>
              <div className="grid grid-cols-2 gap-2">
                {AD_SLOT_TYPES.map((st) => (
                  <label key={st.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.included_slot_types.includes(st.value)} onCheckedChange={() => toggleSlotType(st.value)} />
                    {st.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Included Page Contexts</Label>
              <div className="grid grid-cols-2 gap-2">
                {AD_PAGE_CONTEXTS.map((pc) => (
                  <label key={pc.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={form.included_page_contexts.includes(pc.value)} onCheckedChange={() => togglePageContext(pc.value)} />
                    {pc.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Active</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <LoadingButton loading={saving} onClick={handleSave} disabled={!form.name || !priceInput}>
              {editingId ? "Save Changes" : "Create Package"}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
