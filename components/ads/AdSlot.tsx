"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AD_SLOT_DIMENSIONS, AD_ROTATION_INTERVAL_MS } from "@/lib/constants/ad-system";
import { recordImpression, buildClickUrl, isAdTrackingAllowed } from "@/lib/utils/ad-session";
import type { AdSlotType, AdTargetAudience } from "@/lib/types/database";

interface ServedAd {
  creative_id: string;
  campaign_id: string;
  image_url: string | null;
  destination_url: string;
  alt_text: string;
  slot_type: AdSlotType;
  width_px: number;
  height_px: number;
  priority_weight: number;
  rotation_interval_seconds: number;
}

interface AdSlotProps {
  slotKey: string;
  pageContext: string;
  targetAudience?: AdTargetAudience;
  className?: string;
}

export function AdSlot({ slotKey, pageContext, targetAudience = "all", className }: AdSlotProps) {
  const [ads, setAds] = useState<ServedAd[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchAds = useCallback(async () => {
    try {
      const params = new URLSearchParams({ slot: slotKey, page: pageContext, audience: targetAudience });
      const res = await fetch(`/api/ads/serve?${params.toString()}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data?.ads?.length > 0 && mountedRef.current) {
        setAds(json.data.ads);
      }
    } catch {
      // silently fail
    } finally {
      if (mountedRef.current) setLoaded(true);
    }
  }, [slotKey, pageContext, targetAudience]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAds();
    return () => { mountedRef.current = false; };
  }, [fetchAds]);

  useEffect(() => {
    if (ads.length === 0) return;

    const currentAd = ads[currentIndex];
    if (currentAd && imageReady) {
      recordImpression({
        creative_id: currentAd.creative_id,
        campaign_id: currentAd.campaign_id,
        page_context: pageContext,
        ad_slot: slotKey,
      });
    }
  }, [currentIndex, ads, imageReady, pageContext, slotKey]);

  useEffect(() => {
    if (ads.length <= 1) return;

    const intervalMs = (ads[currentIndex]?.rotation_interval_seconds ?? AD_ROTATION_INTERVAL_MS / 1000) * 1000;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
      setImageReady(false);
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ads, currentIndex]);

  if (!loaded || ads.length === 0) return null;

  const ad = ads[currentIndex];
  if (!ad || !ad.image_url) return null;

  const slotType = ad.slot_type as AdSlotType;
  const dims = AD_SLOT_DIMENSIONS[slotType];
  const desktopW = dims?.width ?? ad.width_px;
  const desktopH = dims?.height ?? ad.height_px;
  const mobileW = dims?.mobileWidth ?? Math.min(desktopW, 320);
  const mobileH = dims?.mobileHeight ?? Math.round(desktopH * (mobileW / desktopW));
  const hasMobileDims = !!(dims?.mobileWidth && dims?.mobileHeight);

  const trackingAllowed = isAdTrackingAllowed();
  const clickHref = trackingAllowed
    ? buildClickUrl(ad.creative_id, pageContext)
    : ad.destination_url;
  const linkTarget = trackingAllowed ? "_self" : "_blank";
  const linkRel = trackingAllowed ? undefined : "noopener noreferrer sponsored";

  return (
    <div
      className={`relative flex items-center justify-center ${className ?? ""}`}
      role="complementary"
      aria-label="Advertisement"
    >
      <a
        href={clickHref}
        target={linkTarget}
        rel={linkRel}
        className="relative block overflow-hidden rounded-sm group"
      >
        {/* Desktop image */}
        <img
          src={ad.image_url}
          alt={ad.alt_text || "Advertisement"}
          width={desktopW}
          height={desktopH}
          className={`${hasMobileDims ? "hidden sm:block" : "block"} max-w-full h-auto transition-opacity duration-300 ${imageReady ? "opacity-100" : "opacity-0"}`}
          style={{ aspectRatio: `${desktopW}/${desktopH}` }}
          onLoad={() => setImageReady(true)}
          loading="lazy"
        />

        {/* Mobile image (same src, different dimensions) */}
        {hasMobileDims && (
          <img
            src={ad.image_url}
            alt={ad.alt_text || "Advertisement"}
            width={mobileW}
            height={mobileH}
            className={`block sm:hidden max-w-full h-auto transition-opacity duration-300 ${imageReady ? "opacity-100" : "opacity-0"}`}
            style={{ aspectRatio: `${mobileW}/${mobileH}` }}
            onLoad={() => setImageReady(true)}
            loading="lazy"
          />
        )}

        <span className="absolute top-1 left-1 px-1.5 py-0.5 text-[10px] font-medium leading-none tracking-wide uppercase bg-black/60 text-white/80 rounded-sm pointer-events-none select-none">
          Ad
        </span>

        <span className="absolute inset-0 rounded-sm ring-1 ring-inset ring-black/5 group-hover:ring-black/10 transition-all pointer-events-none" />
      </a>
    </div>
  );
}
