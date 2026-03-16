"use client";

import { FormSelect } from "./form-select";
import { EXPERIENCE_YEARS } from "@/lib/constants";
import type { ExperienceYears } from "@/lib/types/database";

interface YearsExperienceSelectProps {
  value: ExperienceYears | "";
  onValueChange: (value: ExperienceYears) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function YearsExperienceSelect({
  value,
  onValueChange,
  placeholder = "Select years",
  disabled = false,
}: YearsExperienceSelectProps) {
  return (
    <FormSelect<ExperienceYears>
      options={EXPERIENCE_YEARS}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      disabled={disabled}
      triggerClassName="w-[140px]"
    />
  );
}
