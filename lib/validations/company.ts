import { z } from "zod";

const stateSchema = z.string().length(2, "Please select a state");

const phoneOptional = z
  .string()
  .regex(/^[\d\s\-\(\)]+$/, "Please enter a valid phone number")
  .optional()
  .nullable();

export const inviteTeamMemberSchema = z.object({
  employer_profile_id: z.string().uuid("Invalid employer profile ID"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
});

export const removeTeamMemberSchema = z.object({
  employer_profile_id: z.string().uuid("Invalid employer profile ID"),
  target_user_id: z.string().uuid("Invalid user ID"),
});

export const leaveTeamSchema = z.object({
  employer_profile_id: z.string().uuid("Invalid employer profile ID"),
});

export const revokeInvitationSchema = z.object({
  invitation_id: z.string().uuid("Invalid invitation ID"),
});

export const companyLocationSchema = z.object({
  employer_profile_id: z.string().uuid("Invalid employer profile ID"),
  name: z.string().min(1, "Location name is required").max(100, "Name too long"),
  address_line1: z.string().min(1, "Address is required").max(200, "Address too long"),
  address_line2: z.string().max(200, "Address too long").optional().nullable(),
  city: z.string().min(1, "City is required").max(100, "City name too long"),
  state: stateSchema,
  zip_code: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code")
    .optional()
    .nullable(),
  phone: phoneOptional,
  is_active: z.boolean().optional(),
});

export const updateCompanyLocationSchema = z.object({
  location_id: z.string().uuid("Invalid location ID"),
  name: z.string().min(1, "Location name is required").max(100, "Name too long").optional(),
  address_line1: z.string().min(1, "Address is required").max(200, "Address too long").optional(),
  address_line2: z.string().max(200, "Address too long").optional().nullable(),
  city: z.string().min(1, "City is required").max(100, "City name too long").optional(),
  state: stateSchema.optional(),
  zip_code: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code")
    .optional()
    .nullable(),
  phone: phoneOptional,
  is_active: z.boolean().optional(),
});

export const deactivateLocationSchema = z.object({
  location_id: z.string().uuid("Invalid location ID"),
});

export const getCompanyLocationsSchema = z.object({
  employer_profile_id: z.string().uuid("Invalid employer profile ID"),
});

export type InviteTeamMemberData = z.infer<typeof inviteTeamMemberSchema>;
export type RemoveTeamMemberData = z.infer<typeof removeTeamMemberSchema>;
export type LeaveTeamData = z.infer<typeof leaveTeamSchema>;
export type RevokeInvitationData = z.infer<typeof revokeInvitationSchema>;
export type CompanyLocationData = z.infer<typeof companyLocationSchema>;
export type UpdateCompanyLocationData = z.infer<typeof updateCompanyLocationSchema>;
export type DeactivateLocationData = z.infer<typeof deactivateLocationSchema>;
export type GetCompanyLocationsData = z.infer<typeof getCompanyLocationsSchema>;
