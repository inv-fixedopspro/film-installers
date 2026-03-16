import { cn } from "@/lib/utils";
import { LucideIcon, Sparkles } from "lucide-react";

interface FeatureListItemProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function FeatureListItem({
  children,
  icon: Icon = Sparkles,
  iconColor = "text-accent-foreground",
  className,
}: FeatureListItemProps) {
  return (
    <div className={cn("flex items-start gap-2", className)}>
      <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", iconColor)} />
      <span>{children}</span>
    </div>
  );
}
