import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getResumeByInstallerId } from "@/lib/db/resume";
import { getSignedUrl } from "@/lib/storage/company-assets";
import { ResumeForm } from "@/components/resume";
import { BackLink, PageHeader } from "@/components/shared";
import type { ExperienceLevel, ServiceType, ExperienceYears } from "@/lib/types/database";

export const metadata = { title: "Resume Builder" };

export interface InstallerExperienceEntry {
  service_type: ServiceType;
  years_experience: ExperienceYears;
}

export interface InstallerContactInfo {
  email: string;
  phone: string;
  city: string;
  state: string;
  experience_level: ExperienceLevel;
  photoUrl: string | null;
  hasPhoto: boolean;
  installerExperience: InstallerExperienceEntry[];
}

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
    .select("id, first_name, last_name, phone, city, state, experience_level, photo_storage_path")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!installerProfile) {
    redirect("/dashboard");
  }

  const { data: resume } = await getResumeByInstallerId(supabase, installerProfile.id);

  const { data: experienceRows } = await supabase
    .from("installer_experience")
    .select("service_type, years_experience")
    .eq("installer_profile_id", installerProfile.id);

  const installerName = `${installerProfile.first_name} ${installerProfile.last_name}`;

  let photoUrl: string | null = null;
  if (installerProfile.photo_storage_path) {
    const { signedUrl } = await getSignedUrl(installerProfile.photo_storage_path, 3600);
    photoUrl = signedUrl;
  }

  const contactInfo: InstallerContactInfo = {
    email: user.email ?? "",
    phone: installerProfile.phone,
    city: installerProfile.city,
    state: installerProfile.state,
    experience_level: installerProfile.experience_level as ExperienceLevel,
    photoUrl,
    hasPhoto: !!installerProfile.photo_storage_path,
    installerExperience: (experienceRows ?? []) as InstallerExperienceEntry[],
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <BackLink href="/dashboard/installer" label="Back to Dashboard" className="mb-4" />
        <PageHeader
          title="Resume Builder"
          description="Build your professional resume and share it with potential employers"
        />
      </div>

      <ResumeForm
        installerProfileId={installerProfile.id}
        installerName={installerName}
        existingResume={resume}
        contactInfo={contactInfo}
      />
    </div>
  );
}
