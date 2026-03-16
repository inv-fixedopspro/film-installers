"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ProfileInfoSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function ProfileInfoSection({ title, children, className }: ProfileInfoSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {title && (
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </h4>
      )}
      <div className="space-y-2 divide-y divide-border/50">{children}</div>
    </div>
  );
}
