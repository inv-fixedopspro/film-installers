import { z } from "zod";
import { createAdminRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse, ERROR_CODES } from "@/lib/api";

const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("cancel_deletion"),
    reason: z.string().min(1),
  }),
  z.object({
    type: z.literal("fulfill_export"),
    reason: z.string().min(1),
  }),
]);

type ActionData = z.infer<typeof actionSchema>;

export const POST = createAdminRoute<ActionData>(async ({ request, data, supabase, userId }) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("data-requests") + 1;
  const requestId = idIndex > 0 ? segments[idIndex] : null;

  if (!requestId) {
    return errorResponse("Request ID is required", 400, ERROR_CODES.SERVER_ERROR);
  }

  if (data.type === "cancel_deletion") {
    const { data: dr } = await supabase
      .from("deletion_requests")
      .select("id, user_id, status")
      .eq("id", requestId)
      .eq("status", "pending")
      .maybeSingle();

    if (!dr) {
      return errorResponse("Deletion request not found or not in pending state", 404, ERROR_CODES.SERVER_ERROR);
    }

    const { error: updateError } = await supabase
      .from("deletion_requests")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", requestId);

    if (updateError) {
      return errorResponse("Failed to cancel deletion request", 500, ERROR_CODES.SERVER_ERROR);
    }

    await supabase.from("moderation_actions").insert({
      target_user_id: dr.user_id,
      admin_user_id: userId!,
      action_type: "unban",
      reason: `Admin cancelled account deletion request: ${data.reason}`,
      notes: `Deletion request ID: ${requestId}`,
      metadata: { data_request_type: "deletion_cancellation", data_request_id: requestId },
    });

    return successResponse({ message: "Deletion request cancelled and audit log created." });
  }

  if (data.type === "fulfill_export") {
    const { data: er } = await supabase
      .from("data_export_requests")
      .select("id, user_id, status")
      .eq("id", requestId)
      .in("status", ["pending", "processing"])
      .maybeSingle();

    if (!er) {
      return errorResponse("Export request not found or already fulfilled", 404, ERROR_CODES.SERVER_ERROR);
    }

    const [
      { data: profile },
      { data: installerProfile },
      { data: employerProfile },
      { data: resume },
      { data: consentHistory },
      { data: flagsSubmitted },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, role, account_status, content_visibility, active_profile_type, onboarding_completed, created_at")
        .eq("id", er.user_id)
        .maybeSingle(),
      supabase
        .from("installer_profiles")
        .select("id, first_name, last_name, phone, city, state, experience_level, is_actively_interviewing, created_at, updated_at")
        .eq("user_id", er.user_id)
        .maybeSingle(),
      supabase
        .from("employer_profiles")
        .select("id, company_name, contact_first_name, contact_last_name, contact_phone, company_email, hq_city, hq_state, employee_count, is_actively_hiring, created_at, updated_at")
        .eq("user_id", er.user_id)
        .maybeSingle(),
      supabase
        .from("installer_resumes")
        .select("id, selected_template, accent_color, headline, summary, skills, work_history, certifications, education, created_at, updated_at")
        .eq("user_id", er.user_id)
        .maybeSingle(),
      supabase
        .from("consent_log")
        .select("event_type, terms_version, privacy_version, created_at")
        .eq("user_id", er.user_id)
        .order("created_at", { ascending: true }),
      supabase
        .from("content_flags")
        .select("id, flag_category, content_type, created_at")
        .eq("flagger_user_id", er.user_id)
        .order("created_at", { ascending: false }),
    ]);

    const exportBundle = {
      exported_at: new Date().toISOString(),
      account: profile ?? null,
      installer_profile: installerProfile ?? null,
      employer_profile: employerProfile ?? null,
      resume: resume
        ? {
            id: resume.id,
            selected_template: resume.selected_template,
            accent_color: resume.accent_color,
            headline: resume.headline,
            summary: resume.summary,
            skills: resume.skills,
            work_history: resume.work_history,
            certifications: resume.certifications,
            education: resume.education,
            created_at: resume.created_at,
            updated_at: resume.updated_at,
          }
        : null,
      consent_history: consentHistory ?? [],
      flags_submitted: flagsSubmitted ?? [],
    };

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from("data_export_requests")
      .update({
        status: "ready",
        completed_at: new Date().toISOString(),
        download_expires_at: expiresAt,
        download_url: null,
        export_payload: exportBundle,
      })
      .eq("id", requestId);

    if (updateError) {
      return errorResponse("Failed to fulfill export request", 500, ERROR_CODES.SERVER_ERROR);
    }

    await supabase.from("moderation_actions").insert({
      target_user_id: er.user_id,
      admin_user_id: userId!,
      action_type: "restore",
      reason: `Admin manually fulfilled data export request: ${data.reason}`,
      notes: `Export request ID: ${requestId}`,
      metadata: { data_request_type: "export_fulfillment", data_request_id: requestId },
    });

    return successResponse({ message: "Export request marked as fulfilled and audit log created." });
  }

  return errorResponse("Unknown action type", 400, ERROR_CODES.SERVER_ERROR);
}, actionSchema);
