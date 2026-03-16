"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SkillsInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  maxSkills?: number;
  error?: string;
}

export function SkillsInput({ value, onChange, maxSkills = 30, error }: SkillsInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addSkill = (raw: string) => {
    const skill = raw.trim();
    if (!skill || skill.length > 50) return;
    if (value.includes(skill)) return;
    if (value.length >= maxSkills) return;
    onChange([...value, skill]);
    setInputValue("");
  };

  const removeSkill = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(inputValue);
    }
    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeSkill(value.length - 1);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "min-h-[44px] flex flex-wrap gap-1.5 p-2 rounded-md border bg-background transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent",
          error ? "border-destructive" : "border-border"
        )}
      >
        {value.map((skill, i) => (
          <Badge key={i} variant="secondary" className="gap-1 pr-1 text-xs">
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(i)}
              className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
        {value.length < maxSkills && (
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => addSkill(inputValue)}
            placeholder={value.length === 0 ? "Type a skill and press Enter…" : "Add another…"}
            className="border-0 shadow-none p-0 h-7 min-w-[120px] flex-1 focus-visible:ring-0 text-sm"
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {value.length}/{maxSkills} skills — press Enter or comma to add
      </p>
    </div>
  );
}
