import type {
  ServiceType,
  ExperienceYears,
  ExperienceLevel,
  EmployeeCount,
  UserRole,
  InstallerResume,
  CompanyLocation,
  TeamMemberRole,
  TeamInvitationStatus,
} from "@/lib/types/database";

export type { Profile } from "@/lib/types/database";

export interface VerifyEmailResult {
  user_id: string;
  email: string;
  verified_at: string;
}

export interface EmployerProfileData {
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string;
  company_name: string;
  company_email: string;
  company_phone: string;
  hq_city: string;
  hq_state: string;
  employee_count: EmployeeCount;
  location_count?: string | null;
  is_actively_hiring?: boolean;
  company_description?: string | null;
  website_url?: string | null;
  logo_storage_path?: string | null;
  banner_storage_path?: string | null;
  social_links?: Record<string, string> | null;
  is_vendor?: boolean;
  is_distributor?: boolean;
}

export interface InstallerProfileData {
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  state: string;
  is_actively_interviewing?: boolean;
  experience_level?: ExperienceLevel;
}

export interface InstallerExperienceInput {
  service_type: ServiceType;
  years_experience: ExperienceYears;
}

export interface EmployerProfileResult {
  id: string;
  user_id: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string;
  company_name: string;
  company_email: string;
  company_phone: string;
  hq_city: string;
  hq_state: string;
  employee_count: EmployeeCount;
  location_count: string | null;
  is_actively_hiring: boolean;
  company_slug: string | null;
  company_description: string | null;
  website_url: string | null;
  logo_storage_path: string | null;
  banner_storage_path: string | null;
  social_links: Record<string, string> | null;
  is_vendor: boolean;
  is_distributor: boolean;
  created_at: string;
  updated_at: string;
  services: Array<{ service_type: ServiceType }>;
  active_team_member_count?: number;
  locations?: CompanyLocation[];
}

export interface InviteTeamMemberResult {
  invitation_id: string;
  token: string;
  email: string;
  expires_at: string;
}

export interface AcceptTeamInvitationResult {
  team_member_id: string;
  employer_profile_id: string;
  accepted_at: string;
}

export interface LeaveTeamResult {
  success: boolean;
  employer_profile_id: string;
  fallback_profile_type: string | null;
}

export interface RemoveTeamMemberResult {
  success: boolean;
  removed_user_id: string;
  employer_profile_id: string;
}

export interface RevokeTeamInvitationResult {
  success: boolean;
  invitation_id: string;
}

export interface CompanyLocationResult {
  id: string;
  employer_profile_id: string;
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeactivateLocationResult {
  success: boolean;
  location_id: string;
}

export interface CompanyLocationData {
  name: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state: string;
  zip_code?: string | null;
  phone?: string | null;
  is_active?: boolean;
}

export type { TeamMemberRole, TeamInvitationStatus };

export interface InstallerProfileResult {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  state: string;
  is_actively_interviewing: boolean;
  experience_level: ExperienceLevel;
  photo_storage_path: string | null;
  resume_id: string | null;
  created_at: string;
  updated_at: string;
  experience: Array<{
    service_type: ServiceType;
    years_experience: ExperienceYears;
  }>;
  resume: InstallerResume | null;
}

export interface AcceptInvitationResult {
  user_id: string;
  email: string;
  role: UserRole;
  accepted_at: string;
}

export interface CleanupTokensResult {
  verifications_deleted: number;
  invitations_deleted: number;
  cleaned_at: string;
}

export type RpcError = {
  code: string;
  message: string;
  hint?: string;
};

export function isRpcError(error: unknown): error is RpcError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

export { extractRpcErrorCode } from "@/lib/errors";
