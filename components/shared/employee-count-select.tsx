"use client";

import { FormSelect } from "./form-select";
import { EMPLOYEE_COUNTS } from "@/lib/constants";
import type { EmployeeCount } from "@/lib/types/database";

interface EmployeeCountSelectProps {
  value: EmployeeCount | "";
  onValueChange: (value: EmployeeCount) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function EmployeeCountSelect({
  value,
  onValueChange,
  placeholder = "Select size",
  disabled = false,
}: EmployeeCountSelectProps) {
  return (
    <FormSelect<EmployeeCount>
      options={EMPLOYEE_COUNTS}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
