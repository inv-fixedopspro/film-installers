import { createAuthRoute } from "@/lib/api/route-wrapper";
import { successResponse, errorResponse, rpcErrorResponse, ERROR_CODES } from "@/lib/api/response";
import { submitFlagSchema, type SubmitFlagFormData } from "@/lib/validations/flags";
import { submitFlag } from "@/lib/db/moderation";
import { getFlagCountLast24h, getDailyFlagLimit } from "@/lib/db/utils";
import { getUserFriendlyError } from "@/lib/errors";

export const POST = createAuthRoute<SubmitFlagFormData>(
  async ({ data, supabase, userId }) => {
    const [flagCount, dailyLimit] = await Promise.all([
      getFlagCountLast24h(supabase, userId!),
      getDailyFlagLimit(supabase),
    ]);

    if (flagCount >= dailyLimit) {
      return errorResponse(
        getUserFriendlyError(ERROR_CODES.FLAG_LIMIT_REACHED),
        429,
        ERROR_CODES.FLAG_LIMIT_REACHED
      );
    }

    const { data: result, error, errorCode } = await submitFlag(supabase, {
      flaggerUserId:   userId!,
      flaggedUserId:   data.flagged_user_id,
      contentType:     data.content_type,
      contentId:       data.content_id,
      category:        data.category,
      reason:          data.reason ?? null,
      contentUrl:      data.content_url ?? null,
    });

    if (error || !result) {
      return rpcErrorResponse(errorCode, "Failed to submit flag");
    }

    if (!result.success) {
      return rpcErrorResponse(result.error_code, "Failed to submit flag");
    }

    const isDuplicate = result.error_code === ERROR_CODES.FLAG_DUPLICATE;

    return successResponse(
      {
        flag_id:      result.flag_id,
        review_id:    result.review_id,
        is_duplicate: isDuplicate,
      },
      201
    );
  },
  submitFlagSchema
);
