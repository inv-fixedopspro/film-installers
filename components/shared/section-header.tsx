import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function SectionHeader({ title, description, className }: SectionHeaderProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <h3 className="font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
