"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { PageHeader, ComingSoonCard } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import {
  CompanyBrandingSection,
  CompanyInfoSection,
  TeamManagementSection,
  LocationsSection,
} from "@/components/employer";

export default function EmployerDashboardPage() {
  const { userData, refreshUser } = useAuth();
  const profile = userData?.employerProfile;

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No employer profile found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Employer Dashboard"
        description="Manage your company profile and team"
        badge={
          <Badge
            variant={profile.is_actively_hiring ? "default" : "secondary"}
            className={profile.is_actively_hiring ? "bg-success" : ""}
          >
            {profile.is_actively_hiring ? "Actively Hiring" : "Not Hiring"}
          </Badge>
        }
      />

      <CompanyBrandingSection
        employerProfileId={profile.id}
        logoStoragePath={profile.logo_storage_path}
        bannerStoragePath={profile.banner_storage_path}
        onRefresh={refreshUser}
      />

      <CompanyInfoSection
        profile={profile}
        onRefresh={refreshUser}
      />

      <TeamManagementSection employerProfileId={profile.id} />

      <LocationsSection employerProfileId={profile.id} />

      <ComingSoonCard
        description="More features are on the way to help you build your team"
        features={[
          { title: "Candidate Search", description: "Find qualified installers" },
          { title: "Job Postings", description: "Post open positions" },
          { title: "Messages", description: "Connect with candidates" },
        ]}
      />
    </div>
  );
}
