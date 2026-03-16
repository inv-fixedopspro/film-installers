"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBox } from "./icon-box";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type HeaderLayout = "centered" | "horizontal";
type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "full";
type IconVariant = "primary" | "secondary" | "muted" | "success" | "highlight" | "destructive";

interface BaseCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  iconVariant?: IconVariant;
  iconSize?: "sm" | "md" | "lg" | "xl";
  iconShape?: "circle" | "rounded";
  headerLayout?: HeaderLayout;
  headerActions?: ReactNode;
  maxWidth?: MaxWidth;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  showHeader?: boolean;
}

const maxWidthStyles: Record<MaxWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "w-full",
};

export function BaseCard({
  title,
  description,
  icon: Icon,
  iconVariant = "primary",
  iconSize = "lg",
  iconShape = "rounded",
  headerLayout = "horizontal",
  headerActions,
  maxWidth = "full",
  children,
  className,
  headerClassName,
  contentClassName,
  showHeader = true,
}: BaseCardProps) {
  const isCentered = headerLayout === "centered";
  const hasHeader = showHeader && (title || Icon);

  const renderIconBox = () => {
    if (!Icon) return null;

    if (iconVariant === "destructive") {
      return (
        <div className={cn(
          "flex items-center justify-center bg-destructive/10",
          iconSize === "xl" ? "w-16 h-16" : iconSize === "lg" ? "w-14 h-14" : "w-12 h-12",
          iconShape === "circle" ? "rounded-full" : "rounded-xl",
          isCentered && "mx-auto mb-4"
        )}>
          <Icon className={cn(
            "text-destructive",
            iconSize === "xl" ? "h-8 w-8" : iconSize === "lg" ? "h-7 w-7" : "h-6 w-6"
          )} />
        </div>
      );
    }

    return (
      <IconBox
        icon={Icon}
        size={iconSize}
        variant={iconVariant}
        shape={iconShape}
        className={isCentered ? "mx-auto mb-4" : undefined}
      />
    );
  };

  return (
    <Card className={cn("w-full shadow-xl border-0", maxWidthStyles[maxWidth], className)}>
      {hasHeader && (
        <CardHeader className={cn(
          isCentered && "space-y-1 text-center",
          headerClassName
        )}>
          {isCentered ? (
            <>
              {renderIconBox()}
              {title && (
                <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
              )}
              {description && <CardDescription>{description}</CardDescription>}
            </>
          ) : (
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {renderIconBox()}
                <div>
                  {title && <CardTitle className="text-xl">{title}</CardTitle>}
                  {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
              </div>
              {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
            </div>
          )}
        </CardHeader>
      )}
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
