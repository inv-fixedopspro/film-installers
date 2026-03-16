"use client";

import { ReactNode } from "react";
import { SectionHeader } from "./section-header";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  variant?: "default" | "highlighted";
}

export function FormSection({
  title,
  description,
  children,
  className,
  variant = "default",
}: FormSectionProps) {
  const isHighlighted = variant === "highlighted";

  return (
    <div
      className={cn(
        "space-y-4",
        isHighlighted && "p-4 rounded-lg bg-muted border border-border",
        className
      )}
    >
      <SectionHeader title={title} description={description} />
      {children}
    </div>
  );
}
