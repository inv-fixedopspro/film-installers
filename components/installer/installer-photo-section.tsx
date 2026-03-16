"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/shared";
import { toast } from "@/hooks/use-toast";
import { CircleUser as UserCircle } from "lucide-react";

interface InstallerPhotoSectionProps {
  installerProfileId: string;
  photoStoragePath: string | null;
  onRefresh: () => Promise<void>;
}

async function fetchSignedUrl(storagePath: string): Promise<string | null> {
  const res = await fetch(`/api/upload/signed-url?storage_path=${encodeURIComponent(storagePath)}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data?.signed_url ?? null;
}

export function InstallerPhotoSection({
  installerProfileId,
  photoStoragePath,
  onRefresh,
}: InstallerPhotoSectionProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  const resolvePhotoUrl = useCallback(async () => {
    if (resolved) return;
    setResolved(true);
    if (photoStoragePath) {
      const url = await fetchSignedUrl(photoStoragePath);
      setPhotoUrl(url);
    }
  }, [photoStoragePath, resolved]);

  if (!resolved) resolvePhotoUrl();

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("installer_profile_id", installerProfileId);
    const res = await fetch("/api/upload/installer-photo", { method: "POST", body: formData });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Upload failed");
    const newUrl = await fetchSignedUrl(result.data.storage_path);
    setPhotoUrl(newUrl);
    setResolved(true);
    await onRefresh();
    toast({ title: "Profile photo updated" });
  };

  const handleRemove = async () => {
    const res = await fetch("/api/upload/installer-photo", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ installer_profile_id: installerProfileId }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Delete failed");
    setPhotoUrl(null);
    await onRefresh();
    toast({ title: "Profile photo removed" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserCircle className="h-4 w-4" />
          Profile Photo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ImageUpload
          label="Profile Photo"
          currentImageUrl={photoUrl}
          onUpload={handleUpload}
          onRemove={photoUrl ? handleRemove : undefined}
          aspectRatio="square"
          hint="Square image recommended · JPEG, PNG, or WebP · max 5MB"
        />
      </CardContent>
    </Card>
  );
}
