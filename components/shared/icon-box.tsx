import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type IconBoxSize = "sm" | "md" | "lg" | "xl";
type IconBoxVariant = "primary" | "secondary" | "muted" | "success" | "highlight" | "brand" | "none";
type IconBoxShape = "circle" | "rounded";

interface IconBoxProps {
  icon: LucideIcon;
  size?: IconBoxSize;
  variant?: IconBoxVariant;
  shape?: IconBoxShape;
  className?: string;
}

const sizeStyles: Record<IconBoxSize, { container: string; icon: string }> = {
  sm: { container: "w-10 h-10", icon: "h-5 w-5" },
  md: { container: "w-12 h-12", icon: "h-6 w-6" },
  lg: { container: "w-14 h-14", icon: "h-7 w-7" },
  xl: { container: "w-16 h-16", icon: "h-8 w-8" },
};

const variantStyles: Record<IconBoxVariant, { container: string; icon: string }> = {
  primary: { container: "bg-gradient-icon-primary", icon: "text-primary" },
  secondary: { container: "bg-gradient-icon-secondary", icon: "text-muted-foreground" },
  muted: { container: "bg-muted", icon: "text-muted-foreground" },
  success: { container: "bg-success/10", icon: "text-success" },
  highlight: { container: "bg-highlight", icon: "text-primary" },
  brand: { container: "bg-gradient-icon-brand", icon: "text-brand" },
  none: { container: "", icon: "text-brand" },
};

const shapeStyles: Record<IconBoxShape, string> = {
  circle: "rounded-full",
  rounded: "rounded-xl",
};

export function IconBox({
  icon: Icon,
  size = "md",
  variant = "primary",
  shape = "rounded",
  className,
}: IconBoxProps) {
  const sizeStyle = sizeStyles[size];
  const variantStyle = variantStyles[variant];
  const shapeStyle = shapeStyles[shape];

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        sizeStyle.container,
        variantStyle.container,
        shapeStyle,
        className
      )}
    >
      <Icon className={cn(sizeStyle.icon, variantStyle.icon)} />
    </div>
  );
}
