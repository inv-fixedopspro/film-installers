"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/shared";
import { getCampaignStatusConfig, getPaymentStatusConfig, formatCents } from "@/lib/constants/ad-system";
import { Play, Pause, CircleCheck as CheckCircle2, Circle as XCircle, Calendar } from "lucide-react";
import type { AdCampaign, AdCampaignStatus } from "@/lib/types/database";

interface CampaignHeaderProps {
  campaign: AdCampaign;
  advertiserName: string;
  packageName: string;
  onStatusChange: (status: AdCampaignStatus) => Promise<void>;
}

const STATUS_ACTIONS: Record<string, { label: string; target: AdCampaignStatus; icon: React.ElementType; variant: "default" | "destructive" | "outline" }[]> = {
  draft: [
    { label: "Schedule", target: "scheduled", icon: Calendar, variant: "default" },
    { label: "Activate", target: "active", icon: Play, variant: "default" },
    { label: "Cancel", target: "cancelled", icon: XCircle, variant: "destructive" },
  ],
  scheduled: [
    { label: "Activate", target: "active", icon: Play, variant: "default" },
    { label: "Cancel", target: "cancelled", icon: XCircle, variant: "destructive" },
  ],
  active: [
    { label: "Pause", target: "paused", icon: Pause, variant: "outline" },
    { label: "Complete", target: "completed", icon: CheckCircle2, variant: "default" },
    { label: "Cancel", target: "cancelled", icon: XCircle, variant: "destructive" },
  ],
  paused: [
    { label: "Resume", target: "active", icon: Play, variant: "default" },
    { label: "Complete", target: "completed", icon: CheckCircle2, variant: "default" },
    { label: "Cancel", target: "cancelled", icon: XCircle, variant: "destructive" },
  ],
};

export function CampaignHeader({ campaign, advertiserName, packageName, onStatusChange }: CampaignHeaderProps) {
  const [confirmAction, setConfirmAction] = useState<{ label: string; target: AdCampaignStatus } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const sCfg = getCampaignStatusConfig(campaign.status);
  const pCfg = getPaymentStatusConfig(campaign.payment_status);
  const actions = STATUS_ACTIONS[campaign.status] ?? [];

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      await onStatusChange(confirmAction.target);
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <h2 className="text-xl font-bold">{campaign.campaign_name}</h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                <span>{advertiserName}</span>
                <span>{packageName}</span>
                <span>{formatCents(campaign.total_price_cents)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {campaign.starts_at ? new Date(campaign.starts_at).toLocaleDateString() : "No start"}
                {" – "}
                {campaign.ends_at ? new Date(campaign.ends_at).toLocaleDateString() : "No end"}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={sCfg.color}>{sCfg.label}</Badge>
              <Badge className={pCfg.color}>{pCfg.label}</Badge>
            </div>
          </div>
          {actions.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {actions.map((action) => (
                <Button
                  key={action.target}
                  variant={action.variant}
                  size="sm"
                  onClick={() => setConfirmAction(action)}
                >
                  <action.icon className="w-4 h-4 mr-1" />
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={`${confirmAction?.label} Campaign`}
        description={`Are you sure you want to ${confirmAction?.label.toLowerCase()} this campaign? This will change the status to "${confirmAction?.target}".`}
        confirmText={confirmAction?.label ?? "Confirm"}
        variant={confirmAction?.target === "cancelled" ? "destructive" : "default"}
        loading={actionLoading}
      />
    </>
  );
}
