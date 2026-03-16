import { z } from "zod";

export const companyLogoUploadSchema = z.object({
  employer_profile_id: z.string().uuid("Invalid employer profile ID"),
  filename: z.string().min(1, "Filename is required").max(255, "Filename too long"),
  content_type: z.enum(
    ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    { errorMap: () => ({ message: "Unsupported file type. Use JPEG, PNG, or WebP." }) }
  ),
  file_size: z
    .number()
    .positive("File size must be positive")
    .max(5 * 1024 * 1024, "File too large. Maximum size is 5MB."),
});

export const companyBannerUploadSchema = z.object({
  employer_profile_id: z.string().uuid("Invalid employer profile ID"),
  filename: z.string().min(1, "Filename is required").max(255, "Filename too long"),
  content_type: z.enum(
    ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    { errorMap: () => ({ message: "Unsupported file type. Use JPEG, PNG, or WebP." }) }
  ),
  file_size: z
    .number()
    .positive("File size must be positive")
    .max(5 * 1024 * 1024, "File too large. Maximum size is 5MB."),
});

export const companyLogoDeleteSchema = z.object({
  employer_profile_id: z.string().uuid("Invalid employer profile ID"),
});

export const companyBannerDeleteSchema = z.object({
  employer_profile_id: z.string().uuid("Invalid employer profile ID"),
});

export const signedUrlSchema = z.object({
  storage_path: z
    .string()
    .min(1, "Storage path is required")
    .max(500, "Storage path too long")
    .refine(
      (p) => p.startsWith("") && !p.includes(".."),
      "Invalid storage path"
    ),
  ttl_seconds: z.number().int().min(60).max(86400).optional(),
});

export type CompanyLogoUploadData = z.infer<typeof companyLogoUploadSchema>;
export type CompanyBannerUploadData = z.infer<typeof companyBannerUploadSchema>;
export type CompanyLogoDeleteData = z.infer<typeof companyLogoDeleteSchema>;
export type CompanyBannerDeleteData = z.infer<typeof companyBannerDeleteSchema>;
export type SignedUrlData = z.infer<typeof signedUrlSchema>;
