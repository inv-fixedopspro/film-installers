"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BackLink, PageHeader, LoadingButton } from "@/components/shared";
import { Plus, Megaphone, Loader as Loader2, Search, ExternalLink } from "lucide-react";
import {
  AD_CAMPAIGN_STATUSES, getCampaignStatusConfig, getPaymentStatusConfig, formatCents,
} from "@/lib/constants/ad-system";
import type { AdCampaign, AdCampaignStatus, Advertiser, AdPackage } from "@/lib/types/database";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newCampaign, setNewCampaign] = useState({
    campaign_name: "",
    advertiser_id: "",
    ad_package_id: "",
    starts_at: "",
    ends_at: "",
    admin_notes: "",
  });

  const fetchAll = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const [campRes, advRes, pkgRes] = await Promise.all([
        fetch(`/api/admin/advertising/campaigns?${params}`),
        fetch("/api/admin/advertising/advertisers"),
        fetch("/api/admin/advertising/packages"),
      ]);
      const [campJson, advJson, pkgJson] = await Promise.all([
        campRes.json(), advRes.json(), pkgRes.json(),
      ]);

      setCampaigns(campJson.success ? campJson.data?.campaigns ?? [] : []);
      setAdvertisers(advJson.success ? advJson.data?.advertisers ?? [] : []);
      setPackages(pkgJson.success ? pkgJson.data?.packages ?? [] : []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSearch = () => { setSearch(searchInput); };

  const advName = (id: string) => advertisers.find((a) => a.id === id)?.name ?? "Unknown";
  const pkgName = (id: string) => packages.find((p) => p.id === id)?.name ?? "Unknown";

  const filtered = campaigns.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.campaign_name.toLowerCase().includes(q) || advName(c.advertiser_id).toLowerCase().includes(q);
  });

  const handleCreate = async () => {
    setSaving(true);
    try {
      const pkg = packages.find((p) => p.id === newCampaign.ad_package_id);
      const body = {
        ...newCampaign,
        total_price_cents: pkg?.price_cents ?? 0,
        starts_at: newCampaign.starts_at || null,
        ends_at: newCampaign.ends_at || null,
        admin_notes: newCampaign.admin_notes || null,
      };
      await fetch("/api/admin/advertising/campaigns", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      setDialogOpen(false);
      setNewCampaign({ campaign_name: "", advertiser_id: "", ad_package_id: "", starts_at: "", ends_at: "", admin_notes: "" });
      setLoading(true);
      await fetchAll();
    } finally {
      setSaving(false);
    }
  };

  const selectedPkg = packages.find((p) => p.id === newCampaign.ad_package_id);

  return (
    <div className="space-y-6">
      <BackLink href="/admin/ad-space" label="Back to Ad Space" />
      <PageHeader
        title="Campaigns"
        description="Manage advertising campaigns"
        action={<Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />New Campaign</Button>}
      />

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          {AD_CAMPAIGN_STATUSES.map((s) => (
            <TabsTrigger key={s.value} value={s.value}>{s.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex gap-2">
        <Input
          placeholder="Search campaigns or advertisers..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-xs"
        />
        <Button variant="outline" onClick={handleSearch}><Search className="w-4 h-4" /></Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !filtered.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="p-3 rounded-full bg-muted"><Megaphone className="w-6 h-6 text-muted-foreground" /></div>
            <p className="font-medium">No campaigns found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const sCfg = getCampaignStatusConfig(c.status);
            const pCfg = getPaymentStatusConfig(c.payment_status);
            return (
              <Link key={c.id} href={`/admin/ad-space/campaigns/${c.id}`}>
                <Card className="cursor-pointer transition-colors hover:bg-accent/40">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{c.campaign_name}</p>
                          <Badge className={`text-xs ${sCfg.color}`}>{sCfg.label}</Badge>
                          <Badge className={`text-xs ${pCfg.color}`}>{pCfg.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                          <span>{advName(c.advertiser_id)}</span>
                          <span>{pkgName(c.ad_package_id)}</span>
                          <span>
                            {c.starts_at ? new Date(c.starts_at).toLocaleDateString() : "—"}
                            {" – "}
                            {c.ends_at ? new Date(c.ends_at).toLocaleDateString() : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-medium text-sm">{formatCents(c.total_price_cents)}</span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Campaign Name *</Label>
              <Input value={newCampaign.campaign_name} onChange={(e) => setNewCampaign({ ...newCampaign, campaign_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Advertiser *</Label>
              <Select value={newCampaign.advertiser_id} onValueChange={(v) => setNewCampaign({ ...newCampaign, advertiser_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select advertiser" /></SelectTrigger>
                <SelectContent>
                  {advertisers.filter((a) => a.is_active).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Package *</Label>
              <Select value={newCampaign.ad_package_id} onValueChange={(v) => setNewCampaign({ ...newCampaign, ad_package_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select package" /></SelectTrigger>
                <SelectContent>
                  {packages.filter((p) => p.is_active).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({formatCents(p.price_cents)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPkg && (
                <p className="text-xs text-muted-foreground">Price: {formatCents(selectedPkg.price_cents)} / {selectedPkg.duration_days} days</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Start Date</Label>
                <Input type="date" value={newCampaign.starts_at} onChange={(e) => setNewCampaign({ ...newCampaign, starts_at: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">End Date</Label>
                <Input type="date" value={newCampaign.ends_at} onChange={(e) => setNewCampaign({ ...newCampaign, ends_at: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <LoadingButton
              loading={saving}
              onClick={handleCreate}
              disabled={!newCampaign.campaign_name || !newCampaign.advertiser_id || !newCampaign.ad_package_id}
            >
              Create Campaign
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
