"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SERVICE_TYPES } from "@/lib/constants";
import type { ServiceType } from "@/lib/types/database";

interface ServiceCheckboxesProps {
  value: ServiceType[];
  onValueChange: (value: ServiceType[]) => void;
  disabled?: boolean;
}

export function ServiceCheckboxes({
  value,
  onValueChange,
  disabled = false,
}: ServiceCheckboxesProps) {
  const handleToggle = (serviceType: ServiceType) => {
    if (value.includes(serviceType)) {
      onValueChange(value.filter((v) => v !== serviceType));
    } else {
      onValueChange([...value, serviceType]);
    }
  };

  return (
    <div className="space-y-3">
      {SERVICE_TYPES.map((service) => (
        <div key={service.value} className="flex items-center space-x-3">
          <Checkbox
            id={service.value}
            checked={value.includes(service.value)}
            onCheckedChange={() => handleToggle(service.value)}
            disabled={disabled}
          />
          <Label
            htmlFor={service.value}
            className="text-sm font-normal cursor-pointer"
          >
            {service.label}
          </Label>
        </div>
      ))}
    </div>
  );
}
