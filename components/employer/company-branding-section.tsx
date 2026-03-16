"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/shared";
import { SectionHeader } from "@/components/shared";
import { toast } from "@/hooks/use-toast";
import { Image as ImageIcon } from "lucide-react";

interface CompanyBrandingSectionProps {
  employerProfileId: string;
  logoStoragePath: string | null;
  bannerStoragePath: string | null;
  onRefresh: () => Promise<void>;
}

async function getSignedUrl(path: string): Promise<string | null> {
  const res = await fetch(`/api/upload/signed-url?storage_path=${encodeURIComponent(path)}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data?.signed_url ?? null;
}

export function CompanyBrandingSection({
  employerProfileId,
  logoStoragePath,
  bannerStoragePath,
  onRefresh,
}: CompanyBrandingSectionProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [logoResolved, setLogoResolved] = useState(false);
  const [bannerResolved, setBannerResolved] = useState(false);

  const resolveLogoUrl = useCallback(async () => {
    if (logoResolved) return;
    setLogoResolved(true);
    if (logoStoragePath) {
      const url = await getSignedUrl(logoStoragePath);
      setLogoUrl(url);
    }
  }, [logoStoragePath, logoResolved]);

  const resolveBannerUrl = useCallback(async () => {
    if (bannerResolved) return;
    setBannerResolved(true);
    if (bannerStoragePath) {
      const url = await getSignedUrl(bannerStoragePath);
      setBannerUrl(url);
    }
  }, [bannerStoragePath, bannerResolved]);

  if (!logoResolved) resolveLogoUrl();
  if (!bannerResolved) resolveBannerUrl();

  const handleLogoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("employer_profile_id", employerProfileId);
    const res = await fetch("/api/upload/company-logo", { method: "POST", body: formData });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Upload failed");
    const newUrl = await getSignedUrl(result.data.storage_path);
    setLogoUrl(newUrl);
    setLogoResolved(true);
    await onRefresh();
    toast({ title: "Logo updated" });
  };

  const handleLogoRemove = async () => {
    const res = await fetch("/api/upload/company-logo", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employer_profile_id: employerProfileId }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Delete failed");
    setLogoUrl(null);
    await onRefresh();
    toast({ title: "Logo removed" });
  };

  const handleBannerUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("employer_profile_id", employerProfileId);
    const res = await fetch("/api/upload/company-banner", { method: "POST", body: formData });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Upload failed");
    const newUrl = await getSignedUrl(result.data.storage_path);
    setBannerUrl(newUrl);
    setBannerResolved(true);
    await onRefresh();
    toast({ title: "Banner updated" });
  };

  const handleBannerRemove = async () => {
    const res = await fetch("/api/upload/company-banner", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employer_profile_id: employerProfileId }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Delete failed");
    setBannerUrl(null);
    await onRefresh();
    toast({ title: "Banner removed" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ImageIcon className="h-4 w-4" />
          Company Branding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <ImageUpload
          label="Company Logo"
          currentImageUrl={logoUrl}
          onUpload={handleLogoUpload}
          onRemove={logoUrl ? handleLogoRemove : undefined}
          aspectRatio="square"
          hint="Square image recommended · JPEG, PNG, or WebP · max 5MB"
        />
        <ImageUpload
          label="Company Banner"
          currentImageUrl={bannerUrl}
          onUpload={handleBannerUpload}
          onRemove={bannerUrl ? handleBannerRemove : undefined}
          aspectRatio="wide"
          hint="Wide image recommended (3:1) · JPEG, PNG, or WebP · max 5MB"
        />
      </CardContent>
    </Card>
  );
}
