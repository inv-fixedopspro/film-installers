"use client";

import { Input } from "@/components/ui/input";
import { ChangeEvent } from "react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "(555) 555-5555",
  disabled = false,
  className,
}: PhoneInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange(formatted);
  };

  return (
    <Input
      type="tel"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      maxLength={14}
    />
  );
}
