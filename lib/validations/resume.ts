import { z } from "zod";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const yearSchema = z
  .string()
  .regex(/^\d{4}$/, "Must be a 4-digit year")
  .refine((y) => {
    const n = parseInt(y, 10);
    return n >= 1950 && n <= new Date().getFullYear() + 5;
  }, "Year is out of range");

const pastYearSchema = z
  .string()
  .regex(/^\d{4}$/, "Must be a 4-digit year")
  .refine((y) => {
    const n = parseInt(y, 10);
    return n >= 1950 && n <= new Date().getFullYear();
  }, "Year must not be in the future");

export const resumeWorkHistorySchema = z
  .object({
    id: z.string().uuid("Invalid entry ID"),
    company_name: z
      .string()
      .min(1, "Company name is required")
      .max(100, "Company name is too long"),
    job_title: z
      .string()
      .min(1, "Job title is required")
      .max(100, "Job title is too long"),
    city: z.string().min(1, "City is required").max(100, "City is too long"),
    state: z.string().length(2, "Please select a state"),
    start_month: z.enum(MONTHS, { errorMap: () => ({ message: "Please select a month" }) }),
    start_year: pastYearSchema,
    end_month: z.enum(MONTHS).nullable().optional(),
    end_year: pastYearSchema.nullable().optional(),
    is_current: z.boolean(),
    is_self_employed: z.boolean(),
    description: z.string().max(1000, "Description must be 1000 characters or less"),
  })
  .refine(
    (data) => {
      if (data.is_current) return true;
      return data.end_month != null && data.end_year != null;
    },
    { message: "End date is required for past positions", path: ["end_month"] }
  )
  .refine(
    (data) => {
      if (data.is_current || !data.end_year) return true;
      if (data.end_year < data.start_year) return false;
      if (data.end_year === data.start_year) {
        const monthIndex = (m: string) => MONTHS.indexOf(m as (typeof MONTHS)[number]);
        return monthIndex(data.end_month ?? "") >= monthIndex(data.start_month);
      }
      return true;
    },
    { message: "End date must be after start date", path: ["end_year"] }
  );

export const resumeCertificationSchema = z.object({
  id: z.string().uuid("Invalid entry ID"),
  name: z
    .string()
    .min(1, "Certification name is required")
    .max(100, "Certification name is too long"),
  issuing_org: z
    .string()
    .min(1, "Issuing organization is required")
    .max(100, "Issuing organization name is too long"),
  issue_year: pastYearSchema,
  expiry_year: yearSchema.nullable().optional(),
  no_expiry: z.boolean(),
});

export const resumeEducationSchema = z.object({
  id: z.string().uuid("Invalid entry ID"),
  institution: z
    .string()
    .min(1, "Institution name is required")
    .max(100, "Institution name is too long"),
  degree: z.string().min(1, "Degree or program is required").max(100, "Too long"),
  field_of_study: z.string().max(100, "Field of study is too long"),
  graduation_year: pastYearSchema.nullable().optional(),
  in_progress: z.boolean(),
});

export const resumeSchema = z.object({
  installer_profile_id: z.string().uuid("Invalid installer profile ID"),
  selected_template: z.enum(["standard", "modern", "minimal"], {
    errorMap: () => ({ message: "Invalid template selection" }),
  }),
  accent_color: z.enum(["charcoal", "navy", "forest"], {
    errorMap: () => ({ message: "Invalid accent color" }),
  }),
  headline: z.string().max(120, "Headline must be 120 characters or less"),
  summary: z.string().max(2000, "Summary must be 2000 characters or less"),
  skills: z
    .array(z.string().min(1).max(50, "Each skill must be 50 characters or less"))
    .max(30, "You can add up to 30 skills"),
  work_history: z
    .array(resumeWorkHistorySchema)
    .max(20, "You can add up to 20 work history entries"),
  certifications: z
    .array(resumeCertificationSchema)
    .max(20, "You can add up to 20 certifications"),
  education: z
    .array(resumeEducationSchema)
    .max(10, "You can add up to 10 education entries"),
});

export type ResumeFormData = z.infer<typeof resumeSchema>;
export type ResumeWorkHistoryFormData = z.infer<typeof resumeWorkHistorySchema>;
export type ResumeCertificationFormData = z.infer<typeof resumeCertificationSchema>;
export type ResumeEducationFormData = z.infer<typeof resumeEducationSchema>;
