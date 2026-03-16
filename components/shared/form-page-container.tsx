"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBox } from "./icon-box";
import { BackLink } from "./back-link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl";
type Variant = "default" | "auth";

interface FormPageContainerProps {
  icon: LucideIcon;
  iconVariant?: "primary" | "secondary" | "muted" | "success" | "highlight";
  title: string;
  description?: string;
  backLink?: string;
  backLinkText?: string;
  maxWidth?: MaxWidth;
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

const maxWidthStyles: Record<MaxWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function FormPageContainer({
  icon,
  iconVariant = "secondary",
  title,
  description,
  backLink,
  backLinkText,
  maxWidth = "md",
  variant = "default",
  children,
  className,
}: FormPageContainerProps) {
  const isAuthVariant = variant === "auth";

  return (
    <Card className={cn("w-full shadow-xl border-0", maxWidthStyles[maxWidth], className)}>
      <CardHeader className={isAuthVariant ? "space-y-1 text-center" : undefined}>
        {backLink && <BackLink href={backLink} label={backLinkText} className="mb-4" />}
        {isAuthVariant ? (
          <>
            <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </>
        ) : (
          <div className="flex items-center gap-4">
            <IconBox icon={icon} size="lg" variant={iconVariant} />
            <div>
              <CardTitle className="text-2xl">{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
