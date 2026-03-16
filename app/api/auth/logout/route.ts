import { createRoute, successResponse } from "@/lib/api";

export const POST = createRoute(
  async ({ supabase }) => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error (non-blocking):", error);
    }

    return successResponse({ message: "Logged out successfully" });
  }
);
