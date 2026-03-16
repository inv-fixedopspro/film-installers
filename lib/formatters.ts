import { US_STATES, SERVICE_TYPES, EXPERIENCE_YEARS, EMPLOYEE_COUNTS, EXPERIENCE_LEVELS } from "@/lib/constants";
import type { ServiceType, ExperienceYears, ProfileType } from "@/lib/types/database";

type OptionWithLabel = { value: string; label: string };

export function getLabelFromOptions(value: string, options: readonly OptionWithLabel[]): string {
  const option = options.find((o) => o.value === value);
  return option?.label || value;
}

export function getStateName(code: string): string {
  return getLabelFromOptions(code, US_STATES);
}

export function getServiceLabel(value: string): string {
  return getLabelFromOptions(value, SERVICE_TYPES);
}

export function getYearsLabel(value: string): string {
  return getLabelFromOptions(value, EXPERIENCE_YEARS);
}

export function getEmployeeCountLabel(value: string): string {
  return getLabelFromOptions(value, EMPLOYEE_COUNTS);
}

export function getExperienceLevelLabel(value: string): string {
  const level = EXPERIENCE_LEVELS.find((l) => l.value === value);
  return level?.label || value;
}

export function formatServiceType(value: ServiceType): string {
  return getServiceLabel(value);
}

export function formatExperienceYears(value: ExperienceYears): string {
  return getYearsLabel(value);
}

export function formatDate(date: string | Date, style: "short" | "long" | "relative" = "short"): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (style === "relative") {
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  if (style === "long") {
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export function formatAddress(city: string, state: string): string {
  const stateName = getStateName(state);
  return `${city}, ${stateName}`;
}

export function formatProfileDisplayName(
  profile: { first_name?: string; last_name?: string; company_name?: string } | null,
  type: ProfileType
): string {
  if (!profile) return "";

  if (type === "installer" && profile.first_name && profile.last_name) {
    return `${profile.first_name} ${profile.last_name}`;
  }

  if (type === "employer" && profile.company_name) {
    return profile.company_name;
  }

  return "";
}

export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural || `${singular}s`;
}
