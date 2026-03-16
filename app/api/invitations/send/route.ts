import { z } from "zod";
import { createAuthRoute, successResponse, errorResponse, ERROR_CODES } from "@/lib/api";
import { requireAdmin, isAuthError } from "@/lib/api/auth-helpers";
import { createInvitation } from "@/lib/db/invitations";
import { sendInvitationEmail } from "@/lib/services/email";

const invitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "user"]).optional(),
});

type InvitationData = z.infer<typeof invitationSchema>;

export const POST = createAuthRoute<InvitationData>(
  async ({ data, supabase, userId }) => {
    const { email, role = "user" } = data;

    const adminCheck = await requireAdmin(supabase);
    if (isAuthError(adminCheck)) {
      return errorResponse("Only administrators can send invitations", 403, ERROR_CODES.FORBIDDEN);
    }

    const { token, error } = await createInvitation(supabase, userId!, email, role);

    if (error || !token) {
      const isEmailExists = error?.includes("already exists");
      const isAlreadyInvited = error?.includes("already been sent");
      return errorResponse(
        error || "Failed to create invitation",
        400,
        isEmailExists ? ERROR_CODES.EMAIL_ALREADY_EXISTS :
        isAlreadyInvited ? ERROR_CODES.VALIDATION_ERROR :
        ERROR_CODES.SERVER_ERROR
      );
    }

    const emailResult = await sendInvitationEmail(email, token, undefined, role);

    if (!emailResult.success) {
      console.error("Failed to send invitation email:", emailResult.error);
    }

    return successResponse({
      message: "Invitation sent successfully",
    }, 201);
  },
  invitationSchema
);
