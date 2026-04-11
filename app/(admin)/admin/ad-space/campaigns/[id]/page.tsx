"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { BackLink } from "@/components/shared";
import { Loader as Loader2 } from "lucide-react";
import { CampaignHeader } from "./campaign-header";
import { CampaignCreatives } from "./campaign-creatives";
import { CampaignSlots } from "./campaign-slots";
import { CampaignBilling } from "./campaign-billing";
import { CampaignPerformance } from "./campaign-performance";
import type { AdCampaign, AdCreative, AdSlot, AdPackage, Advertiser, AdCampaignStatus } from "@/lib/types/database";

interface CreativeWithUrl extends AdCreative {
  image_url?: string | null;
}

interface SlotWithAssignment extends AdSlot {
  assignment_active: boolean;
}

interface CampaignDetail {
  campaign: AdCampaign;
  creatives: CreativeWithUrl[];
  slots: SlotWithAssignment[];
  metrics: { impressions: number; clicks: number; ctr: number };
}

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [pkg, setPkg] = useState<AdPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/advertising/campaigns/${campaignId}`);
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to load campaign");
        return;
      }
      const data = json.data as CampaignDetail;
      setDetail(data);

      const [advRes, pkgRes] = await Promise.all([
        fetch(`/api/admin/advertising/advertisers/${data.campaign.advertiser_id}`),
        fetch(`/api/admin/advertising/packages/${data.campaign.ad_package_id}`),
      ]);
      const advJson = await advRes.json();
      const pkgJson = await pkgRes.json();
      if (advJson.success) setAdvertiser(advJson.data?.advertiser ?? null);
      if (pkgJson.success) setPkg(pkgJson.data?.package ?? null);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleRefresh = () => { fetchDetail(); };

  const handleStatusChange = async (status: AdCampaignStatus) => {
    await fetch(`/api/admin/advertising/campaigns/${campaignId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    handleRefresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-6">
        <BackLink href="/admin/ad-space/campaigns" label="Back to Campaigns" />
        <div className="text-center py-20">
          <p className="text-destructive font-medium">{error ?? "Campaign not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink href="/admin/ad-space/campaigns" label="Back to Campaigns" />

      <CampaignHeader
        campaign={detail.campaign}
        advertiserName={advertiser?.name ?? "Unknown Advertiser"}
        packageName={pkg?.name ?? "Unknown Package"}
        onStatusChange={handleStatusChange}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <CampaignCreatives
          campaignId={campaignId}
          creatives={detail.creatives}
          onRefresh={handleRefresh}
        />
        <div className="space-y-6">
          <CampaignSlots
            campaignId={campaignId}
            assignedSlots={detail.slots}
            pkg={pkg}
            onRefresh={handleRefresh}
          />
          <CampaignBilling
            campaignId={campaignId}
            campaign={detail.campaign}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      <CampaignPerformance
        metrics={detail.metrics}
        creatives={detail.creatives}
        slots={detail.slots}
      />
    </div>
  );
}
