import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoadingProps {
  message?: string;
  variant?: "fullscreen" | "content";
  className?: string;
}

export function PageLoading({
  message = "Loading...",
  variant = "fullscreen",
  className,
}: PageLoadingProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        variant === "fullscreen" && "min-h-screen bg-secondary",
        variant === "content" && "min-h-[60vh]",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
