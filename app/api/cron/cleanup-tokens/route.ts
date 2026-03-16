import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanupExpiredTokens } from "@/lib/db/tokens";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET environment variable not configured");
    return NextResponse.json(
      { success: false, error: "Cron endpoint not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await cleanupExpiredTokens(supabase, 30);

    if (error) {
      console.error("Token cleanup failed:", error);
      return NextResponse.json(
        { success: false, error: "Cleanup operation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        verificationsDeleted: data?.verifications_deleted ?? 0,
        invitationsDeleted: data?.invitations_deleted ?? 0,
      },
    });
  } catch (error) {
    console.error("Token cleanup error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
