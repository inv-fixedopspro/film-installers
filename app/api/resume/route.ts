import { z } from "zod";
import { createAuthRoute, successResponse, errorResponse, ERROR_CODES } from "@/lib/api";
import { resumeSchema } from "@/lib/validations/resume";
import {
  getResumeByInstallerId,
  upsertResume,
  deleteResume,
} from "@/lib/db/resume";

const putResumeSchema = resumeSchema.extend({
  id: z.string().uuid("Invalid resume ID").optional(),
});

type PutResumeData = z.infer<typeof putResumeSchema>;

export const GET = createAuthRoute(async ({ supabase, userId }) => {
  const { data: installerProfile, error: profileError } = await supabase
    .from("installer_profiles")
    .select("id")
    .eq("user_id", userId!)
    .maybeSingle();

  if (profileError) {
    console.error("Fetch installer profile error:", profileError);
    return errorResponse("Failed to fetch installer profile", 500, ERROR_CODES.SERVER_ERROR);
  }

  if (!installerProfile) {
    return successResponse({ resume: null });
  }

  const { data: resume, error } = await getResumeByInstallerId(supabase, installerProfile.id);

  if (error) {
    console.error("Fetch resume error:", error);
    return errorResponse("Failed to fetch resume", 500, ERROR_CODES.SERVER_ERROR);
  }

  return successResponse({ resume });
});

export const PUT = createAuthRoute<PutResumeData>(
  async ({ data, supabase, userId }) => {
    const { data: resume, error } = await upsertResume(supabase, userId!, data);

    if (error) {
      console.error("Upsert resume error:", error);
      return errorResponse("Failed to save resume", 500, ERROR_CODES.SERVER_ERROR);
    }

    return successResponse({ resume });
  },
  putResumeSchema
);

export const DELETE = createAuthRoute(async ({ request, supabase, userId }) => {
  const { searchParams } = new URL(request.url);
  const resumeId = searchParams.get("id");

  if (!resumeId) {
    return errorResponse("Resume ID is required", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const { data: existing, error: fetchError } = await supabase
    .from("installer_resumes")
    .select("id")
    .eq("id", resumeId)
    .eq("user_id", userId!)
    .maybeSingle();

  if (fetchError) {
    console.error("Fetch resume for delete error:", fetchError);
    return errorResponse("Failed to fetch resume", 500, ERROR_CODES.SERVER_ERROR);
  }

  if (!existing) {
    return errorResponse("Resume not found", 404, ERROR_CODES.NOT_FOUND);
  }

  const { error } = await deleteResume(supabase, resumeId, userId!);

  if (error) {
    console.error("Delete resume error:", error);
    return errorResponse("Failed to delete resume", 500, ERROR_CODES.SERVER_ERROR);
  }

  return successResponse({ deleted: true });
});
