"use client";

import { cn } from "@/lib/utils";

interface YesNoToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
  disabled?: boolean;
}

export function YesNoToggle({
  value,
  onValueChange,
  yesLabel = "Yes",
  noLabel = "No",
  disabled = false,
}: YesNoToggleProps) {
  return (
    <div className="flex rounded-lg border border-input overflow-hidden shrink-0">
      <button
        type="button"
        onClick={() => onValueChange(true)}
        disabled={disabled}
        className={cn(
          "flex-1 px-4 py-2 text-sm font-medium transition-colors",
          value
            ? "bg-primary text-primary-foreground"
            : "bg-background text-muted-foreground hover:bg-muted",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        onClick={() => onValueChange(false)}
        disabled={disabled}
        className={cn(
          "flex-1 px-4 py-2 text-sm font-medium transition-colors border-l",
          !value
            ? "bg-primary text-primary-foreground"
            : "bg-background text-muted-foreground hover:bg-muted",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {noLabel}
      </button>
    </div>
  );
}
