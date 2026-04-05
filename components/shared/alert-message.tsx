import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CircleAlert as AlertCircle, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Info } from "lucide-react";

export type AlertVariant = "error" | "success" | "warning" | "info";

interface AlertMessageProps {
  variant: AlertVariant;
  message?: string;
  children?: ReactNode;
  className?: string;
  showIcon?: boolean;
}

const variantStyles: Record<AlertVariant, { container: string; icon: string }> = {
  error: {
    container: "bg-destructive/10 text-destructive",
    icon: "text-destructive",
  },
  success: {
    container: "bg-success/10 text-success",
    icon: "text-success",
  },
  warning: {
    container: "bg-warning/10 text-warning",
    icon: "text-warning",
  },
  info: {
    container: "bg-primary/10 text-primary",
    icon: "text-primary",
  },
};

const variantIcons: Record<AlertVariant, typeof AlertCircle> = {
  error: AlertCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
};

export function AlertMessage({ variant, message, children, className, showIcon = false }: AlertMessageProps) {
  const styles = variantStyles[variant];
  const Icon = variantIcons[variant];
  const content = children ?? message;

  return (
    <div className={cn("p-3 rounded-lg text-sm", styles.container, className)}>
      {showIcon ? (
        <div className="flex items-start gap-2">
          <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", styles.icon)} />
          <div>{content}</div>
        </div>
      ) : (
        content
      )}
    </div>
  );
}
