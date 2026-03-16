"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

interface BadgeListProps<T> {
  items: T[];
  getLabel: (item: T) => string;
  variant?: BadgeVariant;
  emptyText?: string;
  className?: string;
}

export function BadgeList<T>({
  items,
  getLabel,
  variant = "secondary",
  emptyText = "None selected",
  className,
}: BadgeListProps<T>) {
  if (!items || items.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">{emptyText}</span>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item, index) => (
        <Badge key={index} variant={variant}>
          {getLabel(item)}
        </Badge>
      ))}
    </div>
  );
}
