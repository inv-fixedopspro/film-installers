"use client";

import { useState, useEffect } from "react";

export function useAvatarUrl(storagePath: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!storagePath) {
      setUrl(null);
      return;
    }

    let cancelled = false;

    fetch(`/api/upload/signed-url?storage_path=${encodeURIComponent(storagePath)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.data?.signed_url) {
          setUrl(data.data.signed_url);
        }
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  return url;
}
