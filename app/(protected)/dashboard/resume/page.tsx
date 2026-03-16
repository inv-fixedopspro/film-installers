import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getResumeByInstallerId } from "@/lib/db/resume";
import { ResumeForm } from "@/components/resume";
import { BackLink } from "@/components/shared";

export const metadata = { title: "Resume Builder" };

export default async function ResumePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: installerProfile } = await supabase
    .from("installer_profiles")
    .select("id, first_name, last_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!installerProfile) {
    redirect("/dashboard");
  }

  const { data: resume } = await getResumeByInstallerId(supabase, installerProfile.id);

  const installerName = `${installerProfile.first_name} ${installerProfile.last_name}`;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <BackLink href="/dashboard/installer" label="Back to Dashboard" className="mb-4" />
        <div>
          <h1 className="text-2xl font-bold">Resume Builder</h1>
          <p className="text-muted-foreground mt-1">
            Build your professional resume and share it with potential employers
          </p>
        </div>
      </div>

      <ResumeForm
        installerProfileId={installerProfile.id}
        installerName={installerName}
        existingResume={resume}
      />
    </div>
  );
}
