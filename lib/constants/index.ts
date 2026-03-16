import type { ServiceType, ExperienceYears, EmployeeCount, ExperienceLevel } from "@/lib/types/database";

export const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
] as const;

export const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: "automotive_tint", label: "Automotive Window Tint" },
  { value: "architectural_glass", label: "Architectural Film (Flat Glass)" },
  { value: "ppf", label: "Paint Protection Film (PPF)" },
  { value: "vinyl_wrap", label: "Vinyl Wrap & Graphics" },
];

export const EXPERIENCE_YEARS: { value: ExperienceYears; label: string }[] = [
  { value: "less_than_1", label: "Less than 1 year" },
  { value: "1_to_3", label: "1-3 years" },
  { value: "3_to_5", label: "3-5 years" },
  { value: "5_to_10", label: "5-10 years" },
  { value: "10_plus", label: "10+ years" },
];

export const EMPLOYEE_COUNTS: { value: EmployeeCount; label: string }[] = [
  { value: "1_to_5", label: "1-5 employees" },
  { value: "5_to_10", label: "5-10 employees" },
  { value: "10_to_20", label: "10-20 employees" },
  { value: "25_plus", label: "25+ employees" },
];

export const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string; description: string }[] = [
  {
    value: "new_to_industry",
    label: "New to the Industry",
    description: "I'm just getting started or looking to enter the field"
  },
  {
    value: "experienced",
    label: "Have Experience",
    description: "I have hands-on experience in film installation"
  },
];

export const APP_NAME = "Film Installers";
export const APP_DOMAIN = "filminstallers.com";

export const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
export const INVITATION_TOKEN_EXPIRY_DAYS = 7;
