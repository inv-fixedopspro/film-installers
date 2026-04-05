"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ResumeFormData } from "@/lib/validations/resume";
import type { ResumeTemplate, ResumeAccentColor } from "@/lib/types/database";
import type { InstallerContactInfo } from "@/app/(protected)/dashboard/resume/page";
import { StandardPreview, ModernPreview, MinimalPreview } from "./previews";

const PAGE_WIDTH_PX = 816;
const PAGE_HEIGHT_PX = 1056;

interface ResumePreviewProps {
  data: ResumeFormData;
  template: ResumeTemplate;
  accentColor: ResumeAccentColor;
  installerName?: string;
  contactInfo?: InstallerContactInfo;
  className?: string;
}

export function ResumePreview({ data, template, accentColor, installerName, contactInfo, className }: ResumePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) {
        setScale(width / PAGE_WIDTH_PX);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("w-full relative overflow-hidden bg-white rounded-md shadow-sm border border-border", className)}
      style={{ height: `${PAGE_HEIGHT_PX * scale}px` }}
    >
      <div
        style={{
          width: `${PAGE_WIDTH_PX}px`,
          height: `${PAGE_HEIGHT_PX}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
          overflow: "hidden",
        }}
      >
        {template === "standard" && (
          <StandardPreview data={data} installerName={installerName} contactInfo={contactInfo} />
        )}
        {template === "modern" && (
          <ModernPreview data={data} installerName={installerName} accentColor={accentColor} contactInfo={contactInfo} />
        )}
        {template === "minimal" && (
          <MinimalPreview data={data} installerName={installerName} contactInfo={contactInfo} />
        )}
      </div>
    </div>
  );
}
