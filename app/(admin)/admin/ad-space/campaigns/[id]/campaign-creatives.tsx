"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingButton, ConfirmationDialog } from "@/components/shared";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { AD_SLOT_TYPES, AD_SLOT_DIMENSIONS, AD_ALLOWED_FORMATS, AD_MAX_FILE_SIZE_BYTES } from "@/lib/constants/ad-system";
import type { AdCreative, AdSlotType } from "@/lib/types/database";

interface CreativeWithUrl extends AdCreative {
  image_url?: string | null;
}

interface CampaignCreativesProps {
  campaignId: string;
  creatives: CreativeWithUrl[];
  onRefresh: () => void;
}

export function CampaignCreatives({ campaignId, creatives, onRefresh }: CampaignCreativesProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [slotType, setSlotType] = useState<AdSlotType>("banner");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [label, setLabel] = useState("");
  const [altText, setAltText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dims = AD_SLOT_DIMENSIONS[slotType];

  const handleUpload = useCallback(async (file: File) => {
    if (!AD_ALLOWED_FORMATS.includes(file.type as typeof AD_ALLOWED_FORMATS[number])) {
      alert("Unsupported file type. Use JPEG, PNG, WebP, or GIF.");
      return;
    }
    if (file.size > AD_MAX_FILE_SIZE_BYTES) {
      alert("File too large. Maximum size is 2MB.");
      return;
    }
    if (!destinationUrl) {
      alert("Destination URL is required.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("slot_type", slotType);
      formData.append("destination_url", destinationUrl);
      formData.append("label", label);
      formData.append("alt_text", altText);

      await fetch(`/api/admin/advertising/campaigns/${campaignId}/creatives`, {
        method: "POST", body: formData,
      });
      setDestinationUrl("");
      setLabel("");
      setAltText("");
      onRefresh();
    } finally {
      setUploading(false);
    }
  }, [campaignId, slotType, destinationUrl, label, altText, onRefresh]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleToggle = async (creativeId: string, isActive: boolean) => {
    await fetch(`/api/admin/advertising/campaigns/${campaignId}/creatives/${creativeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: isActive }),
    });
    onRefresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/admin/advertising/campaigns/${campaignId}/creatives/${deleteTarget}`, { method: "DELETE" });
    setDeleteTarget(null);
    onRefresh();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Creatives ({creatives.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Slot Type</Label>
                <Select value={slotType} onValueChange={(v) => setSlotType(v as AdSlotType)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AD_SLOT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Required: {dims.width}x{dims.height}px</Label>
                <Input className="h-8 text-xs" placeholder="Destination URL *" value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input className="h-8 text-xs" placeholder="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} />
              <Input className="h-8 text-xs" placeholder="Alt text (optional)" value={altText} onChange={(e) => setAltText(e.target.value)} />
            </div>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-muted-foreground/50"}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                {uploading ? "Uploading..." : "Drag & drop or click to upload"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP, GIF (max 2MB)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
          </div>

          {creatives.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No creatives uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {creatives.map((creative) => {
                const scale = Math.min(1, 120 / creative.width_px);
                return (
                  <div key={creative.id} className="flex items-center gap-3 p-2 border rounded-lg">
                    <div className="flex-shrink-0 bg-muted rounded overflow-hidden flex items-center justify-center" style={{ width: creative.width_px * scale, height: creative.height_px * scale }}>
                      {creative.image_url ? (
                        <img src={creative.image_url} alt={creative.alt_text} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{creative.label || "Untitled"}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{creative.slot_type}</Badge>
                        <span className="text-xs text-muted-foreground">{creative.width_px}x{creative.height_px}</span>
                      </div>
                    </div>
                    <Switch checked={creative.is_active} onCheckedChange={(v) => handleToggle(creative.id, v)} />
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(creative.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Creative"
        description="This will permanently remove the creative and its uploaded image. This cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </>
  );
}
