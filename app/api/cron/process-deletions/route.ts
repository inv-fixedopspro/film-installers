import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const now = new Date().toISOString();

    const { data: overdueRequests, error: fetchError } = await supabase
      .from("deletion_requests")
      .select("id, user_id")
      .eq("status", "pending")
      .lt("scheduled_delete_at", now);

    if (fetchError) {
      console.error("Failed to fetch overdue deletion requests:", fetchError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch deletion requests" },
        { status: 500 }
      );
    }

    if (!overdueRequests || overdueRequests.length === 0) {
      return NextResponse.json({ success: true, data: { processed: 0 } });
    }

    let processed = 0;
    const errors: string[] = [];

    for (const dr of overdueRequests) {
      try {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(dr.user_id);

        if (deleteError) {
          errors.push(`Failed to delete user ${dr.user_id}: ${deleteError.message}`);
          continue;
        }

        await supabase
          .from("deletion_requests")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", dr.id);

        processed++;
      } catch (err) {
        errors.push(`Unexpected error processing deletion for user ${dr.user_id}: ${String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed,
        total: overdueRequests.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("Process deletions cron error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
