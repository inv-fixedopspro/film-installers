import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ProfileInfoRowProps {
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function ProfileInfoRow({ icon: Icon, children, className }: ProfileInfoRowProps) {
  return (
    <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </div>
  );
}
