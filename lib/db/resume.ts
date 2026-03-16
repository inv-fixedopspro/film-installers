import { SupabaseClient } from "@supabase/supabase-js";
import type { InstallerResume } from "@/lib/types/database";
import type { ResumeFormData } from "@/lib/validations/resume";
import type { QueryResult } from "./utils";

export async function upsertResume(
  supabase: SupabaseClient,
  userId: string,
  data: ResumeFormData & { id?: string }
): Promise<QueryResult<InstallerResume>> {
  const payload: Record<string, unknown> = {
    user_id: userId,
    installer_profile_id: data.installer_profile_id,
    selected_template: data.selected_template,
    accent_color: data.accent_color,
    headline: data.headline,
    summary: data.summary,
    skills: data.skills,
    work_history: data.work_history,
    certifications: data.certifications,
    education: data.education,
    updated_at: new Date().toISOString(),
  };

  if (data.id) {
    const { data: updated, error } = await supabase
      .from("installer_resumes")
      .update(payload)
      .eq("id", data.id)
      .eq("user_id", userId)
      .select()
      .maybeSingle();

    return { data: updated as InstallerResume | null, error: error?.message || null };
  }

  const { data: inserted, error } = await supabase
    .from("installer_resumes")
    .insert({ ...payload, created_at: new Date().toISOString() })
    .select()
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (inserted) {
    await supabase
      .from("installer_profiles")
      .update({ resume_id: (inserted as InstallerResume).id })
      .eq("user_id", userId)
      .eq("id", data.installer_profile_id);
  }

  return { data: inserted as InstallerResume | null, error: null };
}

export async function getResumeByInstallerId(
  supabase: SupabaseClient,
  installerProfileId: string
): Promise<QueryResult<InstallerResume>> {
  const { data, error } = await supabase
    .from("installer_resumes")
    .select("*")
    .eq("installer_profile_id", installerProfileId)
    .maybeSingle();

  return { data: data as InstallerResume | null, error: error?.message || null };
}

export async function getResumeById(
  supabase: SupabaseClient,
  resumeId: string
): Promise<QueryResult<InstallerResume>> {
  const { data, error } = await supabase
    .from("installer_resumes")
    .select("*")
    .eq("id", resumeId)
    .maybeSingle();

  return { data: data as InstallerResume | null, error: error?.message || null };
}

export async function deleteResume(
  supabase: SupabaseClient,
  resumeId: string,
  userId: string
): Promise<{ error: string | null }> {
  const { error: profileError } = await supabase
    .from("installer_profiles")
    .update({ resume_id: null })
    .eq("resume_id", resumeId)
    .eq("user_id", userId);

  if (profileError) {
    return { error: profileError.message };
  }

  const { error } = await supabase
    .from("installer_resumes")
    .delete()
    .eq("id", resumeId)
    .eq("user_id", userId);

  return { error: error?.message || null };
}
