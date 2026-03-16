import { z } from "zod";

const FLAG_CONTENT_TYPES = [
  "installer_profile",
  "employer_profile",
  "user_account",
  "resume",
] as const;

const FLAG_CATEGORIES = [
  "spam",
  "fake_profile",
  "inappropriate_content",
  "harassment",
  "misleading_information",
  "other",
] as const;

export const submitFlagSchema = z.object({
  flagged_user_id: z
    .string()
    .uuid("flagged_user_id must be a valid UUID"),
  content_type: z.enum(FLAG_CONTENT_TYPES, {
    errorMap: () => ({
      message: `content_type must be one of: ${FLAG_CONTENT_TYPES.join(", ")}`,
    }),
  }),
  content_id: z
    .string()
    .uuid("content_id must be a valid UUID"),
  category: z.enum(FLAG_CATEGORIES, {
    errorMap: () => ({
      message: `category must be one of: ${FLAG_CATEGORIES.join(", ")}`,
    }),
  }),
  reason: z
    .string()
    .max(500, "Reason must be 500 characters or fewer")
    .optional()
    .nullable(),
  content_url: z
    .string()
    .url("content_url must be a valid URL")
    .optional()
    .nullable(),
});

export type SubmitFlagFormData = z.infer<typeof submitFlagSchema>;
