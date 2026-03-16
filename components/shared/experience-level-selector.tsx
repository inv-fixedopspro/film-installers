"use client";

import { cn } from "@/lib/utils";
import { EXPERIENCE_LEVELS } from "@/lib/constants";
import type { ExperienceLevel } from "@/lib/types/database";

interface ExperienceLevelSelectorProps {
  value: ExperienceLevel;
  onValueChange: (value: ExperienceLevel) => void;
  disabled?: boolean;
}

export function ExperienceLevelSelector({
  value,
  onValueChange,
  disabled = false,
}: ExperienceLevelSelectorProps) {
  return (
    <div className="grid gap-3">
      {EXPERIENCE_LEVELS.map((level) => (
        <button
          key={level.value}
          type="button"
          onClick={() => onValueChange(level.value)}
          disabled={disabled}
          className={cn(
            "flex flex-col items-start p-4 rounded-lg border-2 transition-all text-left",
            value === level.value
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className="font-medium">{level.label}</span>
          <span className="text-sm text-muted-foreground mt-1">
            {level.description}
          </span>
        </button>
      ))}
    </div>
  );
}
