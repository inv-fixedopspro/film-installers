"use client";

import { Badge } from "@/components/ui/badge";
import { formatServiceType, formatExperienceYears } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { ServiceType, ExperienceYears } from "@/lib/types/database";

interface ExperienceItem {
  service_type: ServiceType;
  years_experience: ExperienceYears;
}

interface ExperienceListProps {
  items: ExperienceItem[];
  emptyText?: string;
  className?: string;
}

export function ExperienceList({
  items,
  emptyText = "No experience listed",
  className,
}: ExperienceListProps) {
  if (!items || items.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">{emptyText}</span>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
        >
          <span className="text-sm font-medium">
            {formatServiceType(item.service_type)}
          </span>
          <Badge variant="outline">
            {formatExperienceYears(item.years_experience)}
          </Badge>
        </div>
      ))}
    </div>
  );
}
