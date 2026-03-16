"use client";

import { FormSelect } from "./form-select";
import { US_STATES } from "@/lib/constants";

interface StateSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function StateSelector({
  value,
  onValueChange,
  placeholder = "Select a state",
  disabled = false,
}: StateSelectorProps) {
  return (
    <FormSelect
      options={US_STATES}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
