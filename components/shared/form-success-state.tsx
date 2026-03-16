"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { IconBox } from "./icon-box";
import { CheckCircle2, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FormSuccessStateProps {
  icon?: LucideIcon;
  iconVariant?: "primary" | "secondary" | "muted" | "success" | "highlight";
  title: string;
  description?: string | ReactNode;
  primaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function FormSuccessState({
  icon = CheckCircle2,
  iconVariant = "success",
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: FormSuccessStateProps) {
  return (
    <div className={cn("flex flex-col items-center text-center space-y-6 py-4", className)}>
      <IconBox icon={icon} size="xl" variant={iconVariant} shape="circle" />
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">{title}</h3>
        {description && (
          <div className="text-muted-foreground max-w-sm">{description}</div>
        )}
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          {primaryAction && (
            primaryAction.href ? (
              <Button asChild className="flex-1 bg-gradient-primary hover:opacity-90">
                <Link href={primaryAction.href}>{primaryAction.label}</Link>
              </Button>
            ) : (
              <Button
                onClick={primaryAction.onClick}
                className="flex-1 bg-gradient-primary hover:opacity-90"
              >
                {primaryAction.label}
              </Button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Button asChild variant="outline" className="flex-1">
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={secondaryAction.onClick}
                className="flex-1"
              >
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
