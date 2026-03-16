import { SupabaseClient } from "@supabase/supabase-js";
import type { ServiceType } from "@/lib/types/database";
import type {
  EmployerProfileData,
  EmployerProfileResult,
  InstallerProfileData,
  InstallerExperienceInput,
  InstallerProfileResult,
} from "./types";
import { callRpc, checkExists, type RpcResult } from "./utils";
import { normalizeEmail } from "@/lib/utils/string";

export async function createEmployerProfileWithServices(
  supabase: SupabaseClient,
  userId: string,
  profileData: EmployerProfileData,
  services: ServiceType[]
): Promise<RpcResult<EmployerProfileResult>> {
  return callRpc<EmployerProfileResult>(supabase, "create_employer_profile_with_services", {
    p_user_id: userId,
    p_profile_data: profileData,
    p_services: services,
  });
}

export async function createInstallerProfileWithExperience(
  supabase: SupabaseClient,
  userId: string,
  profileData: InstallerProfileData,
  experience: InstallerExperienceInput[]
): Promise<RpcResult<InstallerProfileResult>> {
  return callRpc<InstallerProfileResult>(supabase, "create_installer_profile_with_experience", {
    p_user_id: userId,
    p_profile_data: profileData,
    p_experience: experience,
  });
}

export async function updateEmployerProfileWithServices(
  supabase: SupabaseClient,
  userId: string,
  profileData: Partial<EmployerProfileData>,
  services: ServiceType[]
): Promise<RpcResult<EmployerProfileResult>> {
  return callRpc<EmployerProfileResult>(supabase, "update_employer_profile_with_services", {
    p_user_id: userId,
    p_profile_data: profileData,
    p_services: services,
  });
}

export async function updateInstallerProfileWithExperience(
  supabase: SupabaseClient,
  userId: string,
  profileData: Partial<InstallerProfileData>,
  experience: InstallerExperienceInput[]
): Promise<RpcResult<InstallerProfileResult>> {
  return callRpc<InstallerProfileResult>(supabase, "update_installer_profile_with_experience", {
    p_user_id: userId,
    p_profile_data: profileData,
    p_experience: experience,
  });
}

export async function getEmployerProfileWithServices(
  supabase: SupabaseClient,
  userId: string
): Promise<{ data: EmployerProfileResult | null; error: string | null }> {
  const result = await callRpc<EmployerProfileResult>(supabase, "get_employer_profile_with_services", {
    p_user_id: userId,
  });
  return { data: result.data, error: result.error };
}

export async function getInstallerProfileWithExperience(
  supabase: SupabaseClient,
  userId: string
): Promise<{ data: InstallerProfileResult | null; error: string | null }> {
  const result = await callRpc<InstallerProfileResult>(supabase, "get_installer_profile_with_experience", {
    p_user_id: userId,
  });
  return { data: result.data, error: result.error };
}

export function checkEmployerProfileExists(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  return checkExists(supabase, "employer_profiles", "user_id", userId);
}

export function checkInstallerProfileExists(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  return checkExists(supabase, "installer_profiles", "user_id", userId);
}

export async function checkEmailExists(
  supabase: SupabaseClient,
  email: string
): Promise<boolean> {
  return checkExists(supabase, "profiles", "email", normalizeEmail(email));
}
