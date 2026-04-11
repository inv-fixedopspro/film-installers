"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingButton } from "@/components/shared";
import { AD_PAYMENT_STATUSES, formatCents } from "@/lib/constants/ad-system";
import type { AdCampaign, AdPaymentStatus } from "@/lib/types/database";

interface CampaignBillingProps {
  campaignId: string;
  campaign: AdCampaign;
  onRefresh: () => void;
}

export function CampaignBilling({ campaignId, campaign, onRefresh }: CampaignBillingProps) {
  const [paymentStatus, setPaymentStatus] = useState<AdPaymentStatus>(campaign.payment_status);
  const [invoiceRef, setInvoiceRef] = useState(campaign.invoice_reference ?? "");
  const [paidAt, setPaidAt] = useState(campaign.paid_at ? campaign.paid_at.split("T")[0] : "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/advertising/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_status: paymentStatus,
          invoice_reference: invoiceRef || null,
          paid_at: paidAt ? new Date(paidAt).toISOString() : null,
        }),
      });
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Billing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <span className="text-sm text-muted-foreground">Total Price</span>
          <span className="text-lg font-bold">{formatCents(campaign.total_price_cents)}</span>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">Payment Status</Label>
          <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as AdPaymentStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {AD_PAYMENT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">Invoice Reference</Label>
          <Input value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)} placeholder="INV-001" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">Paid At</Label>
          <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
        </div>

        <LoadingButton loading={saving} onClick={handleSave} size="sm" className="w-full">
          Save Billing
        </LoadingButton>
      </CardContent>
    </Card>
  );
}
