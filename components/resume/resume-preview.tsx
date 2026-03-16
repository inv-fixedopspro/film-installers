"use client";

import { cn } from "@/lib/utils";
import type { ResumeFormData } from "@/lib/validations/resume";
import type { ResumeTemplate, ResumeAccentColor } from "@/lib/types/database";
import { StandardPreview, ModernPreview, MinimalPreview } from "./previews";

interface ResumePreviewProps {
  data: ResumeFormData;
  template: ResumeTemplate;
  accentColor: ResumeAccentColor;
  installerName?: string;
  className?: string;
}

export function ResumePreview({ data, template, accentColor, installerName, className }: ResumePreviewProps) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-md shadow-sm border border-border bg-white min-h-[500px]",
        className
      )}
    >
      {template === "standard" && <StandardPreview data={data} installerName={installerName} />}
      {template === "modern" && (
        <ModernPreview data={data} installerName={installerName} accentColor={accentColor} />
      )}
      {template === "minimal" && <MinimalPreview data={data} installerName={installerName} />}
    </div>
  );
}
