import { z } from "zod";
import { createAdminRoute, successResponse, rpcErrorResponse } from "@/lib/api";
import { verifyEmailToken } from "@/lib/db/auth";

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

type VerifyEmailData = z.infer<typeof verifyEmailSchema>;

export const POST = createAdminRoute<VerifyEmailData>(
  async ({ data, supabase }) => {
    const { data: result, error, errorCode } = await verifyEmailToken(supabase, data.token);

    if (error) {
      return rpcErrorResponse(errorCode, error);
    }

    return successResponse({
      message: "Email verified successfully",
      userId: result?.user_id,
    });
  },
  verifyEmailSchema
);
