import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClientWithCookies } from "@/lib/supabase/route-handler";
import { successResponse, errorResponse, ERROR_CODES } from "@/lib/api/response";
import { getSignedUrl } from "@/lib/storage/company-assets";
import { signedUrlSchema } from "@/lib/validations/upload";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const { supabase } = createRouteHandlerClientWithCookies(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse("Unauthorized", 401, ERROR_CODES.UNAUTHORIZED);
    }

    const { searchParams } = new URL(request.url);
    const parsed = signedUrlSchema.safeParse({
      storage_path: searchParams.get("storage_path") ?? "",
      ttl_seconds: searchParams.get("ttl_seconds")
        ? parseInt(searchParams.get("ttl_seconds")!, 10)
        : undefined,
    });

    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors[0]?.message ?? "Invalid parameters",
        400,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const { storage_path, ttl_seconds } = parsed.data;

    const pathParts = storage_path.split("/");
    if (pathParts.length < 2) {
      return errorResponse("Invalid storage path", 400, ERROR_CODES.VALIDATION_ERROR);
    }

    const { signedUrl, error } = await getSignedUrl(storage_path, ttl_seconds);
    if (error || !signedUrl) {
      return errorResponse("Failed to generate signed URL", 500, ERROR_CODES.SERVER_ERROR);
    }

    return successResponse({ signed_url: signedUrl });
  } catch (err) {
    console.error("Signed URL error:", err);
    return errorResponse("An unexpected error occurred", 500, ERROR_CODES.SERVER_ERROR);
  }
}
