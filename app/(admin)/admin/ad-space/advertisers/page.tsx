"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BackLink, PageHeader, LoadingButton } from "@/components/shared";
import { Plus, Users, Loader as Loader2, Pencil, Globe, Mail, Phone } from "lucide-react";
import type { Advertiser } from "@/lib/types/database";

interface AdvertiserForm {
  name: string;
  contact_email: string;
  contact_phone: string;
  company_url: string;
  notes: string;
  is_active: boolean;
}

const EMPTY_FORM: AdvertiserForm = {
  name: "", contact_email: "", contact_phone: "", company_url: "", notes: "", is_active: true,
};

export default function AdvertisersPage() {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdvertiserForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchAdvertisers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/advertising/advertisers");
      const json = await res.json();
      if (json.success) setAdvertisers(json.data?.advertisers ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdvertisers(); }, [fetchAdvertisers]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (adv: Advertiser) => {
    setEditingId(adv.id);
    setForm({
      name: adv.name,
      contact_email: adv.contact_email,
      contact_phone: adv.contact_phone ?? "",
      company_url: adv.company_url ?? "",
      notes: adv.notes ?? "",
      is_active: adv.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId
        ? `/api/admin/advertising/advertisers/${editingId}`
        : "/api/admin/advertising/advertisers";
      const method = editingId ? "PUT" : "POST";
      const body: Record<string, unknown> = { ...form };
      if (!body.contact_phone) body.contact_phone = null;
      if (!body.company_url) body.company_url = null;
      if (!body.notes) body.notes = null;

      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setDialogOpen(false);
      setLoading(true);
      await fetchAdvertisers();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <BackLink href="/admin/ad-space" label="Back to Ad Space" />
      <PageHeader
        title="Advertisers"
        description="Manage advertiser accounts and contact information"
        action={<Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Add Advertiser</Button>}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !advertisers.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="p-3 rounded-full bg-muted"><Users className="w-6 h-6 text-muted-foreground" /></div>
            <p className="font-medium">No advertisers yet</p>
            <p className="text-sm text-muted-foreground">Create your first advertiser to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {advertisers.map((adv) => (
            <Card key={adv.id} className="cursor-pointer transition-colors hover:bg-accent/40" onClick={() => openEdit(adv)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{adv.name}</p>
                      <Badge variant={adv.is_active ? "default" : "secondary"} className="text-xs">
                        {adv.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{adv.contact_email}</span>
                      {adv.contact_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{adv.contact_phone}</span>}
                      {adv.company_url && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{adv.company_url}</span>}
                    </div>
                  </div>
                  <Pencil className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Advertiser" : "New Advertiser"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Company Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Contact Email *</Label>
              <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Phone</Label>
              <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Website URL</Label>
              <Input value={form.company_url} onChange={(e) => setForm({ ...form, company_url: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Notes</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Active</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <LoadingButton loading={saving} onClick={handleSave} disabled={!form.name || !form.contact_email}>
              {editingId ? "Save Changes" : "Create Advertiser"}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
