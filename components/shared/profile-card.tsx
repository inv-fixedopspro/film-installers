"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBox } from "./icon-box";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  icon: LucideIcon;
  iconVariant?: "primary" | "secondary" | "muted" | "success" | "highlight";
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ProfileCard({
  icon,
  iconVariant = "primary",
  title,
  subtitle,
  actions,
  children,
  className,
}: ProfileCardProps) {
  return (
    <Card className={cn("shadow-lg border-0", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <IconBox icon={icon} size="lg" variant={iconVariant} />
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
