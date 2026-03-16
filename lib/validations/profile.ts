import { z } from "zod";

const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .regex(/^[\d\s\-\(\)]+$/, "Please enter a valid phone number");

const stateSchema = z
  .string()
  .length(2, "Please select a state");

export const installerExperienceSchema = z.object({
  service_type: z.enum(["automotive_tint", "architectural_glass", "ppf", "vinyl_wrap"]),
  years_experience: z.enum(["less_than_1", "1_to_3", "3_to_5", "5_to_10", "10_plus"]),
});

export const installerProfileSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(50, "First name is too long"),
  last_name: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
  phone: phoneSchema,
  city: z.string().min(1, "City is required").max(100, "City name is too long"),
  state: stateSchema,
  is_actively_interviewing: z.boolean(),
  experience_level: z.enum(["new_to_industry", "experienced"]),
  experience: z.array(installerExperienceSchema).optional(),
});

export const employerProfileSchema = z.object({
  contact_first_name: z.string().min(1, "First name is required").max(50, "First name is too long"),
  contact_last_name: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
  contact_phone: phoneSchema,
  company_name: z.string().min(1, "Company name is required").max(100, "Company name is too long"),
  company_email: z.string().min(1, "Company email is required").email("Please enter a valid email"),
  company_phone: phoneSchema,
  hq_city: z.string().min(1, "City is required").max(100, "City name is too long"),
  hq_state: stateSchema,
  employee_count: z.enum(["1_to_5", "5_to_10", "10_to_20", "25_plus"]),
  location_count: z.string().optional(),
  is_actively_hiring: z.boolean(),
  is_vendor: z.boolean(),
  is_distributor: z.boolean(),
  services: z.array(z.enum(["automotive_tint", "architectural_glass", "ppf", "vinyl_wrap"]))
    .min(1, "Please select at least one service"),
});

export type InstallerExperienceFormData = z.infer<typeof installerExperienceSchema>;
export type InstallerProfileFormData = z.infer<typeof installerProfileSchema>;
export type EmployerProfileFormData = z.infer<typeof employerProfileSchema>;
