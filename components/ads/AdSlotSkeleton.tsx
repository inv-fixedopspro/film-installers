"use client";

import { AD_SLOT_DIMENSIONS } from "@/lib/constants/ad-system";
import type { AdSlotType } from "@/lib/types/database";

interface AdSlotSkeletonProps {
  slotType: AdSlotType;
  className?: string;
}

export function AdSlotSkeleton({ slotType, className }: AdSlotSkeletonProps) {
  const dims = AD_SLOT_DIMENSIONS[slotType];
  if (!dims) return null;

  const hasMobile = !!(dims.mobileWidth && dims.mobileHeight);

  return (
    <div
      className={`flex items-center justify-center ${className ?? ""}`}
      role="complementary"
      aria-label="Ad loading"
    >
      {/* Desktop skeleton */}
      <div
        className={`${hasMobile ? "hidden sm:block" : "block"} rounded-sm bg-muted/40 animate-pulse`}
        style={{
          width: `${dims.width}px`,
          maxWidth: "100%",
          aspectRatio: `${dims.width}/${dims.height}`,
        }}
      />

      {/* Mobile skeleton */}
      {hasMobile && (
        <div
          className="block sm:hidden rounded-sm bg-muted/40 animate-pulse"
          style={{
            width: `${dims.mobileWidth}px`,
            maxWidth: "100%",
            aspectRatio: `${dims.mobileWidth}/${dims.mobileHeight}`,
          }}
        />
      )}
    </div>
  );
}
