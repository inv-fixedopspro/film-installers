import { z } from "zod";
import { createAuthRoute, successResponse, errorResponse, ERROR_CODES } from "@/lib/api";
import { checkInstallerProfileExists, checkEmployerProfileExists } from "@/lib/db";

const switchProfileSchema = z.object({
  profileType: z.enum(["installer", "employer", "team"]),
});

type SwitchProfileData = z.infer<typeof switchProfileSchema>;

export const PUT = createAuthRoute<SwitchProfileData>(
  async ({ data, supabase, userId }) => {
    const { profileType } = data;

    if (profileType === "installer") {
      const hasProfile = await checkInstallerProfileExists(supabase, userId!);
      if (!hasProfile) {
        return errorResponse("You don't have an installer profile yet", 400, ERROR_CODES.PROFILE_NOT_FOUND);
      }
    } else if (profileType === "employer") {
      const hasProfile = await checkEmployerProfileExists(supabase, userId!);
      if (!hasProfile) {
        return errorResponse("You don't have an employer profile yet", 400, ERROR_CODES.PROFILE_NOT_FOUND);
      }
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("team_member_id")
        .eq("id", userId!)
        .maybeSingle();

      if (!profile?.team_member_id) {
        return errorResponse("You are not a member of any team", 400, ERROR_CODES.NOT_A_MEMBER);
      }
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ active_profile_type: profileType })
      .eq("id", userId);

    if (updateError) {
      console.error("Switch profile error:", updateError);

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_profile_type")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.active_profile_type === profileType) {
        return successResponse({
          message: "Profile switched successfully",
          activeProfileType: profileType,
        });
      }

      return errorResponse("Failed to switch profile", 500, ERROR_CODES.SERVER_ERROR);
    }

    return successResponse({
      message: "Profile switched successfully",
      activeProfileType: profileType,
    });
  },
  switchProfileSchema
);
